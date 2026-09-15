import re
import json
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from llm_client import call_llm
from profile_manager import load_profile, save_profile

class EvaluationResult(BaseModel):
    feedback: str = ""
    score_out_of_3: int = 0
    score: int = 0
    total_questions: int = 3
    passed: bool = False
    detected_weak_topics: List[str] = []
    recommended_skill_level: int = 1

def parse_score_from_text(raw_text: str, data_dict: Optional[Dict[str, Any]] = None) -> int:
    """Extracts a reliable integer score between 0 and 3 from LLM outputs."""
    if data_dict:
        for key in ["score_out_of_3", "score", "score_out_of_2", "marks", "points"]:
            if key in data_dict:
                val = data_dict[key]
                if isinstance(val, (int, float)):
                    return max(0, min(3, int(round(val))))
                if isinstance(val, str):
                    # Check for patterns like "2/3" or "2"
                    m = re.search(r'(\d+)', val)
                    if m:
                        return max(0, min(3, int(m.group(1))))

    # Regex search in raw text
    patterns = [
        r'"score_out_of_3"\s*:\s*(\d+)',
        r'"score"\s*:\s*(\d+)',
        r'score\s*(?:is|:)?\s*(\d+)\s*/\s*3',
        r'(\d+)\s*out of\s*3',
        r'score\s*:\s*(\d+)',
    ]
    for p in patterns:
        m = re.search(p, raw_text, re.IGNORECASE)
        if m:
            return max(0, min(3, int(m.group(1))))

    # Fallback to counting positive feedback cues
    lower = raw_text.lower()
    if "all correct" in lower or "3/3" in lower or "perfect" in lower:
        return 3
    if "good understanding" in lower or "2/3" in lower:
        return 2
    if "partial" in lower or "1/3" in lower:
        return 1
    return 1

def run_evaluator_agent(user_answers: str) -> EvaluationResult:
    """Grades user input, filters weak topics to domain, and updates student profile."""
    profile = load_profile()
    
    system_prompt = (
        "You are the Evaluator Agent for SAGE. Analyze the student's answers and respond ONLY with "
        "a valid JSON object matching this exact structure:\n"
        '{"feedback": "...", "score_out_of_3": 2, "detected_weak_topics": ["topic_name"], "recommended_skill_level": 3}'
    )
    
    prompt = (
        f"Target Topic: {profile.target_topic}\n"
        f"Current Skill Level: {profile.skill_level}\n"
        f"Student Answers:\n{user_answers}\n\n"
        "Evaluate correctness (score out of 3), identify any weak topics, and suggest their updated skill level."
    )
    
    raw_response = call_llm(prompt, system_prompt)
    
    data_dict = {}
    feedback_text = ""
    weak_topics = []
    rec_level = profile.skill_level

    try:
        json_start = raw_response.find("{")
        json_end = raw_response.rfind("}") + 1
        if json_start != -1 and json_end > json_start:
            data_dict = json.loads(raw_response[json_start:json_end])
            feedback_text = data_dict.get("feedback", raw_response)
            weak_topics = data_dict.get("detected_weak_topics", [])
            rec_level = int(data_dict.get("recommended_skill_level", profile.skill_level))
        else:
            feedback_text = raw_response
    except Exception:
        feedback_text = raw_response

    score = parse_score_from_text(raw_response, data_dict)

    result = EvaluationResult(
        feedback=feedback_text,
        score_out_of_3=score,
        score=score,
        total_questions=3,
        passed=(score >= 2),
        detected_weak_topics=weak_topics,
        recommended_skill_level=rec_level
    )

    from knowledge_graph import advance_student_model, detect_domain, DOMAIN_TRACKS, find_topic_key
    dom = detect_domain(profile.target_topic)
    track = DOMAIN_TRACKS.get(dom, {})

    # Grounding filter: Only accept weak topics that belong to the active domain track!
    sanitized_weak_topics = []
    for topic in result.detected_weak_topics:
        k = find_topic_key(topic, dom)
        if k and k in track:
            sanitized_weak_topics.append(track[k]["title"])
        elif detect_domain(topic) == dom:
            sanitized_weak_topics.append(topic)
    result.detected_weak_topics = sanitized_weak_topics

    advancement = advance_student_model(
        profile,
        score=result.score_out_of_3,
        detected_weak_topics=result.detected_weak_topics
    )
            
    save_profile(profile)
    result.recommended_skill_level = advancement.get("skill_level", profile.skill_level)
    return result

# Compatibility alias for callers
evaluate_answers = run_evaluator_agent