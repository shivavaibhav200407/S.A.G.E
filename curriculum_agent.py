import time
from llm_client import call_llm
from rag import retrieve_context

_CURRICULUM_CACHE = {}
_CACHE_TTL_SECONDS = 1800  # 30 minutes

def generate_curriculum_lesson(topic: str, score: int = 80, diagnostic_feedback: str = "", user_query: str = "") -> str:
    """Generates an adaptive lesson plan using RAG and student diagnostic results with in-memory caching."""
    cache_key = (str(topic).strip().lower(), int(score), str(diagnostic_feedback).strip().lower(), str(user_query).strip().lower())
    now = time.time()
    
    if cache_key in _CURRICULUM_CACHE:
        cached_time, cached_result = _CURRICULUM_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL_SECONDS:
            print(f"[PERF] Serving cached curriculum for '{topic}' (score: {score})")
            return cached_result
    
    # 1. Fetch grounded study material from ChromaDB
    rag_context = retrieve_context(topic)

    extra_query_info = f"\n    Student Specific Question / Focus: {user_query}" if user_query else ""

    # 2. Construct adaptive prompt
    prompt = f"""
    You are SAGE, an AI Curriculum Planner.
    
    Target Topic: {topic}
    Student Diagnostic Score: {score}%
    Diagnostic Context/Feedback: {diagnostic_feedback}{extra_query_info}
    
    Retrieved Reference Material from Knowledge Base:
    {rag_context}
    
    Task: Create a targeted, step-by-step lesson plan focusing STRICTLY on the concepts 
    tested in the diagnostic and identified skill gaps. Do NOT introduce unrelated advanced 
    topics unless the score is above 90%.
    """
    
    result = call_llm(prompt=prompt)
    if result and not result.startswith("SAGE Educational Engine Notice"):
        _CURRICULUM_CACHE[cache_key] = (now, result)
    return result