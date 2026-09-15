import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from llm_client import call_llm
from profile_manager import load_profile
from knowledge_graph import detect_domain, DOMAIN_TRACKS, find_topic_key

def run_diagnostic_agent(topic: str = None, skill_level: int = None) -> str:
    """
    Generates a structured, concept-tagged diagnostic quiz.
    Every question is explicitly labeled with [Concept: <Exact Concept Name>].
    """
    profile = load_profile()
    target_topic = topic if topic else profile.target_topic
    level = skill_level if skill_level is not None else profile.skill_level
    dom = detect_domain(target_topic)
    track_info = DOMAIN_TRACKS.get(dom, {})

    available_subconcepts = [data["title"] for data in track_info.values()]
    subconcept_list_str = ", ".join(available_subconcepts[:6]) if available_subconcepts else target_topic

    system_prompt = (
        "You are the Diagnostic Assessment Agent for SAGE.\n"
        "Your mission is to generate 3 diagnostic questions strictly targeting the topic's domain.\n"
        "CRITICAL GROUNDING RULES:\n"
        f"1. Target Topic: '{target_topic}' (Domain: {dom.upper()})\n"
        f"2. Calibrated Level: Level {level} out of 5.\n"
        f"3. Each question MUST begin with '[Concept: <Specific Subconcept Name>]'.\n"
        f"   Relevant subconcepts to draw from: {subconcept_list_str}\n"
        "4. Do NOT include solutions, answer keys, or explanations. Only output the numbered questions."
    )

    prompt = (
        f"Generate 3 diagnostic questions on '{target_topic}'.\n"
        "Format each question exactly like this:\n"
        "1. [Concept: Subconcept Name]\n"
        "   Question text here?\n\n"
        "2. [Concept: Subconcept Name]\n"
        "   Question text here?\n\n"
        "3. [Concept: Subconcept Name]\n"
        "   Question text here?"
    )

    return call_llm(prompt, system_prompt)

# Backwards compatibility alias
generate_diagnostic_quiz = run_diagnostic_agent