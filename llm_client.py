import os
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
        _client = Groq(api_key=api_key)
    return _client

import re

CANDIDATE_MODELS = [
    "qwen/qwen3.8-27b",
    "groq/compound-mini",
    "groq/compound",
    "qwen/qwen3.6-27b"
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

def call_llm(prompt: str, system_prompt: str = "", max_tokens: int = 700) -> str:
    """Safely calls Groq cascading across verified production chat models."""
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
    for model_name in CANDIDATE_MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.6
            )
            raw = response.choices[0].message.content or ""
            cleaned = _clean_output(raw)
            if cleaned and len(cleaned) > 5:
                return cleaned
        except Exception as e:
            last_error = e
            continue

    return f"SAGE Educational Engine Notice: Temporary AI service latency ({str(last_error)}). Please retry in a few seconds."