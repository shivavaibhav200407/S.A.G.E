import os
import time
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

_client = None

def get_groq_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment or .env file.")
        _client = Groq(api_key=api_key, timeout=30.0)
    return _client

CANDIDATE_MODELS = [
    "groq/compound-mini",
    "qwen/qwen3.8-27b",
    "groq/compound"
]

def _clean_output(text: str) -> str:
    if not text:
        return ""
    # Strip closed <think>...</think> tags
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Strip unclosed <think>... tags
    if '<think>' in cleaned:
        cleaned = re.sub(r'<think>.*', '', cleaned, flags=re.DOTALL)
    # Strip common thinking process prefixes
    cleaned = re.sub(r'^(?:Here(?:\'s| is) a thinking process:?|Thinking Process:?)\s*', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def call_llm(prompt: str, system_prompt: str = "", max_tokens: int = 700, timeout_seconds: float = 20.0) -> str:
    """Safely calls Groq cascading across verified production chat models with strict timing limits."""
    t_start = time.time()
    client = get_groq_client()
    clean_prompt = str(prompt)[:4000]
    clean_system = str(system_prompt)[:1500] if system_prompt else (
        "You are SAGE, a Self-Adaptive Learning & Guidance Engine. "
        "Provide direct, high-quality pedagogical explanations and assessments in clean Markdown. "
        "Never output reasoning scratchpads or internal thinking tags."
    )

    messages = [
        {"role": "system", "content": clean_system},
        {"role": "user", "content": clean_prompt}
    ]

    last_error = None
    overall_hard_limit = 45.0  # Absolute max before raising TimeoutError to Django

    for model_name in CANDIDATE_MODELS:
        time_left = overall_hard_limit - (time.time() - t_start)
        if time_left <= 2.0:
            print(f"[PERF] LLM cascade exceeded overall limit ({time.time() - t_start:.2f}s). Aborting.")
            raise TimeoutError("AI generation timed out. Please try again.")

        try:
            req_timeout = min(timeout_seconds, time_left)
            print(f"[PERF] LLM call started with model '{model_name}' (timeout: {req_timeout:.1f}s)...")
            call_t0 = time.time()
            
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.6,
                timeout=req_timeout
            )
            elapsed = time.time() - call_t0
            raw = response.choices[0].message.content or ""
            cleaned = _clean_output(raw)
            if cleaned and len(cleaned) > 5:
                print(f"[PERF] LLM call completed in {elapsed:.2f}s (model: {model_name})")
                return cleaned
        except TimeoutError:
            print(f"[PERF] LLM call to '{model_name}' timed out after {time.time() - call_t0:.2f}s")
            last_error = TimeoutError("Groq request timed out")
            continue
        except Exception as e:
            elapsed = time.time() - call_t0
            print(f"[PERF] LLM call to '{model_name}' failed after {elapsed:.2f}s: {e}")
            if "timed out" in str(e).lower() or "timeout" in str(e).lower():
                last_error = TimeoutError("Groq request timed out")
            else:
                last_error = e
            continue

    total_time = time.time() - t_start
    if total_time >= overall_hard_limit or isinstance(last_error, TimeoutError) or (last_error and "timed out" in str(last_error).lower()):
        raise TimeoutError("AI generation timed out. Please try again.")

    return f"SAGE Educational Engine Notice: Temporary AI service latency ({str(last_error)}). Please retry in a few seconds."