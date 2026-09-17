import time
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from llm_client import call_llm
from profile_manager import load_profile
from knowledge_graph import detect_domain, DOMAIN_TRACKS, find_topic_key

_QUIZ_CACHE = {}
_CACHE_TTL_SECONDS = 900  # 15 minutes

def run_diagnostic_agent(
    topic: str = None,
    skill_level: int = None,
    quiz_type: str = "diagnostic",
    doc_name: Optional[str] = None
) -> str:
    """
    Generates a structured, concept-tagged quiz with in-memory caching.
    Supports:
    - quiz_type: 'diagnostic' (baseline prerequisite/intuition check before lesson)
                 'mastery' (rigorous post-lesson comprehension verification)
    - doc_name: grounded assessment generated directly from uploaded PDF/document chunks.
    """
    # If doc_name provided, delegate to PDF diagnostic pipeline
    if doc_name:
        from pdf_diagnostic import generate_pdf_diagnostic_assessment
        assessment = generate_pdf_diagnostic_assessment(doc_name, topic)
        return assessment.get("raw_text", "")

    profile = load_profile()
    target_topic = topic if topic else profile.target_topic
    level = skill_level if skill_level is not None else profile.skill_level
    cache_key = (str(target_topic).strip().lower(), str(level).strip(), quiz_type.lower().strip())
    now = time.time()

    if cache_key in _QUIZ_CACHE:
        cached_time, cached_result = _QUIZ_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL_SECONDS:
            print(f"[PERF] Serving cached {quiz_type} quiz for '{target_topic}' (Level {level})")
            return cached_result

    dom = detect_domain(target_topic)
    track_info = DOMAIN_TRACKS.get(dom, {})

    available_subconcepts = [data["title"] for data in track_info.values()]
    subconcept_list_str = ", ".join(available_subconcepts[:6]) if available_subconcepts else target_topic

    is_mastery = (quiz_type.lower() == "mastery")
    role_description = (
        "Mastery Verification Agent" if is_mastery else "Diagnostic Assessment Agent"
    )
    pedagogical_focus = (
        "3 comprehensive mastery verification questions targeting applied implementation, edge cases, and post-lesson understanding"
        if is_mastery else
        "3 baseline diagnostic questions strictly targeting prerequisites, conceptual intuition, and foundational readiness"
    )

    system_prompt = (
        f"You are the {role_description} for SAGE.\n"
        f"Your mission is to generate {pedagogical_focus} targeting the topic's domain.\n"
        "CRITICAL GROUNDING RULES:\n"
        f"1. Target Topic: '{target_topic}' (Domain: {dom.upper()})\n"
        f"2. Calibrated Level: Level {level} out of 5.\n"
        f"3. Mode: {'POST-LESSON MASTERY VERIFICATION' if is_mastery else 'PRE-ASSESSMENT DIAGNOSTIC'}\n"
        f"4. Each question MUST begin with a number and '[Concept: <Specific Subconcept Name>]'.\n"
        f"   Relevant subconcepts to draw from: {subconcept_list_str}\n"
        "5. For each question, provide exactly 4 options: A), B), C), D).\n"
        "6. Do NOT include answer keys or explanations. Only output the 3 numbered questions with their 4 options."
    )

    prompt = (
        f"Generate 3 {quiz_type} multiple-choice questions on '{target_topic}'.\n"
        "Format each question exactly like this:\n\n"
        "1. [Concept: Subconcept Name]\n"
        "Question text here?\n"
        "A) Option 1\n"
        "B) Option 2\n"
        "C) Option 3\n"
        "D) Option 4\n\n"
        "2. [Concept: Subconcept Name]\n"
        "Question text here?\n"
        "A) Option 1\n"
        "B) Option 2\n"
        "C) Option 3\n"
        "D) Option 4\n\n"
        "3. [Concept: Subconcept Name]\n"
        "Question text here?\n"
        "A) Option 1\n"
        "B) Option 2\n"
        "C) Option 3\n"
        "D) Option 4"
    )

    result = call_llm(prompt, system_prompt)
    if result and not result.startswith("SAGE Educational Engine Notice"):
        _QUIZ_CACHE[cache_key] = (now, result)
    return result

# Backwards compatibility alias
generate_diagnostic_quiz = run_diagnostic_agent