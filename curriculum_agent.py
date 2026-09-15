from llm_client import call_llm
from rag import retrieve_context

def generate_curriculum_lesson(topic: str, score: int = 80, diagnostic_feedback: str = "", user_query: str = "") -> str:
    """Generates an adaptive lesson plan using RAG and student diagnostic results."""
    
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
    
    return call_llm(prompt=prompt)