import os
import sys
import re
from typing import Dict, Any, Optional, List, Union
from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from llm_client import call_llm
from profile_manager import load_profile, save_profile
from memory_manager import get_formatted_context, append_to_memory
from rag import retrieve_context, search_knowledge_base
from diagnostic_agent import generate_diagnostic_quiz
from curriculum_agent import generate_curriculum_lesson
from evaluator_agent import run_evaluator_agent
from research_agent import run_research_agent
from verifier_agent import verify_explanation

from knowledge_graph import (
    TOPIC_ROADMAP,
    detect_domain,
    detect_prerequisite_gaps,
    get_next_topic,
    advance_student_model,
    find_topic_key,
    DOMAIN_TRACKS,
    DOMAIN_META
)

def build_adaptive_system_prompt(profile_data: Optional[Dict[str, Any]] = None) -> str:
    """Constructs an adaptive system prompt reflecting student knowledge, style, and prerequisite gaps."""
    if profile_data:
        topic = profile_data.get("target_topic", "Java Basics & Primitive Types")
        skill_level = profile_data.get("skill_level", 1)
        weak_topics = profile_data.get("weak_topics", [])
        completed_modules = profile_data.get("completed_modules", [])
        preferred_style = profile_data.get("preferred_style", "Practical & Code-First")
    else:
        profile = load_profile()
        topic = getattr(profile, "target_topic", "Java Basics & Primitive Types")
        skill_level = getattr(profile, "skill_level", 1)
        weak_topics = getattr(profile, "weak_topics", [])
        completed_modules = getattr(profile, "completed_modules", [])
        preferred_style = getattr(profile, "preferred_style", "Practical & Code-First")

    weak_str = ", ".join(weak_topics) if weak_topics else "None detected"
    completed_str = ", ".join(completed_modules) if completed_modules else "None yet"

    # Detect domain and prerequisite gaps
    domain = detect_domain(topic)
    gaps = detect_prerequisite_gaps(topic, weak_topics, completed_modules)
    gap_directive = ""
    if gaps:
        gap_titles = ", ".join([f"'{g['title']}' ({g['reason']})" for g in gaps])
        gap_directive = (
            f"\n🚨 PREREQUISITE GAP ANALYSIS:\n"
            f"The student's knowledge model shows prerequisite gaps for '{topic}':\n"
            f"{gap_titles}\n"
            f"PRIMARY FOUNDATION TO BRIDGE FIRST: '{gaps[0]['title']}'.\n"
            f"SAGE PEDAGOGICAL RULE: Ground your explanation starting from '{gaps[0]['title']}' "
            f"rather than assuming advanced mastery. Bridge this gap clearly before moving forward.\n"
        )

    system_prompt = (
        "You are SAGE (Self-Adaptive Guidance & Learning Engine), an intelligent, conversational AI tutor and academic mentor.\n"
        f"Active Course Track: {domain.upper()} (Current Milestone: '{topic}')\n"
        f"Current Skill Level: Level {skill_level}/5 | Preferred Style: {preferred_style}\n"
        f"Mastered Topics: {completed_str} | Weak Concept Areas: {weak_str}\n"
        f"{gap_directive}\n"
        "CONVERSATIONAL & PEDAGOGICAL GUIDELINES:\n"
        "1. Natural Conversational Flow: Greet friendly, converse naturally, and acknowledge student tone.\n"
        "2. Technical & Academic Depth: When explaining concepts, use clean Markdown, intuitive engineering analogies, and syntax-highlighted code snippets.\n"
        "3. Interactive & Engaging: Offer follow-up questions or practice challenges to reinforce learning.\n"
        "4. Factual Grounding: Stay accurate to language specs, official docs, and core principles."
    )
    return system_prompt

def extract_context_topic(user_msg: str, memory_context: str, fallback_topic: str) -> str:
    """Extracts target topic from user prompt or recent conversation history."""
    clean = user_msg.lower()
    m = re.search(r'(?:quiz|test|questions?|challenge|about|on)\s+(?:on|about|for|in|regarding)?\s*([a-zA-Z0-9_\s\+\#\-]+)', clean)
    if m:
        candidate = m.group(1).strip().rstrip('?.!')
        # Filter out trivial pronouns/filler words
        if len(candidate) > 2 and candidate not in ["me", "this", "it", "today", "here", "now", "something", "a quiz"]:
            return candidate.title()

    # Search recent turns in memory_context for the most recently discussed concept
    if memory_context:
        lines = [line.strip() for line in memory_context.split('\n') if line.strip()]
        for line in reversed(lines):
            match = re.search(r'(?:explain|teach me|what is|how does|learn|about|understand|concept)\s+([a-zA-Z0-9_\s\+\#\-]+)', line, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip().rstrip('?.!')
                if len(candidate) > 2 and candidate.lower() not in ["it", "this", "that", "something", "me"]:
                    return candidate.title()

    return fallback_topic

def classify_user_intent(user_msg: str) -> str:
    """Classifies user intent into: greeting, capabilities, casual, study_plan, progress_query, quiz_request, pdf_query, technical."""
    clean = user_msg.strip().lower()
    clean_stripped = re.sub(r'[^\w\s]', '', clean)

    # 1. Capabilities & About SAGE
    cap_keywords = [
        "what can you do", "what are you", "who are you", "what can you help me with",
        "how do you work", "what are your features", "help me understand what you do"
    ]
    if any(kw in clean for kw in cap_keywords):
        return "capabilities"

    # 2. Greetings & Pleasantries
    greetings = {
        "hi", "hello", "hey", "heya", "good morning", "good afternoon", "good evening",
        "how are you", "how are you doing", "hows it going", "how is it going", "whats up",
        "what is up", "help"
    }
    if clean_stripped in greetings or (len(clean_stripped.split()) <= 2 and any(w in ["hi", "hello", "hey"] for w in clean_stripped.split())):
        return "greeting"

    # 3. Casual / Boredom / Chit-Chat
    casual_keywords = [
        "i'm bored", "im bored", "bored", "tell me a joke", "i feel lazy", "im tired",
        "thanks", "thank you", "bye", "goodbye", "see you", "see ya"
    ]
    if any(clean == kw or clean.startswith(kw) for kw in casual_keywords):
        return "casual"

    # 4. Progress & Analytics Queries
    progress_keywords = [
        "how is my progress", "what are my weak", "my stats", "what have i mastered",
        "check my progress", "show my progress", "my performance", "my level", "my score"
    ]
    if any(kw in clean for kw in progress_keywords):
        return "progress_query"

    # 5. Study Planning & Daily Recommendations
    plan_keywords = [
        "what should i learn", "what should i study", "recommend", "study plan",
        "next step", "what next", "where should i start", "my learning path", "roadmap recommendation"
    ]
    if any(kw in clean for kw in plan_keywords):
        return "study_plan"

    # 6. Quiz / Practice Request
    quiz_keywords = [
        "give me a quiz", "test me", "take a quiz", "practice questions", "ask me questions",
        "quiz me", "give me questions", "practice challenge", "solve a problem", "quiz"
    ]
    if any(kw in clean for kw in quiz_keywords):
        return "quiz_request"

    # 7. PDF / Document Queries
    pdf_keywords = [
        "pdf", "uploaded document", "my notes", "document says", "according to the doc",
        "in the file", "knowledge vault", "in my document", "from my pdf", "ask about my pdf"
    ]
    if any(kw in clean for kw in pdf_keywords):
        return "pdf_query"

    return "technical"

def route_user_request(
    user_msg: str,
    profile_data: Optional[Dict[str, Any]] = None,
    return_metadata: bool = False,
    **kwargs
) -> Union[str, Dict[str, Any]]:
    """
    Main entry point for SAGE agentic interaction:
    1. Detects conversational greetings vs study planning vs quiz vs technical inquiries.
    2. Queries local RAG vector store and Web Research when appropriate.
    3. Formulates pedagogical response matching student level.
    4. Runs Verifier Agent guardrails and records to conversation memory.
    """
    if profile_data is None:
        profile_data = {}
    else:
        profile_data = dict(profile_data)

    if "active_topic" in kwargs and "target_topic" not in profile_data:
        profile_data["target_topic"] = kwargs["active_topic"]
    elif "topic" in kwargs and "target_topic" not in profile_data:
        profile_data["target_topic"] = kwargs["topic"]
    if "domain" in kwargs and "domain" not in profile_data:
        profile_data["domain"] = kwargs["domain"]

    if not user_msg or not user_msg.strip():
        msg = "Hello! I am SAGE, your AI Tutor. Please feel free to ask a question, explore a topic, or request a practice challenge."
        return {"response": msg, "agent_trace": []} if return_metadata else msg

    agent_trace = []
    agent_trace.append({"agent": "Supervisor", "action": "Analyzing student intent and profile"})

    topic = profile_data.get("target_topic", "Java Basics & Primitive Types") if profile_data else load_profile().target_topic
    domain = detect_domain(topic) if topic else "java"
    skill_level = profile_data.get("skill_level", 1)
    weak_topics = profile_data.get("weak_topics", [])
    completed_modules = profile_data.get("completed_modules", [])

    # Retrieve recent conversation context for topic tracking
    memory_context = get_formatted_context(max_turns=4)
    intent = classify_user_intent(user_msg)

    # -------------------------------------------------------------
    # 1. INTENT: GREETINGS
    # -------------------------------------------------------------
    if intent == "greeting":
        agent_trace.append({"agent": "Supervisor", "action": "Handled conversational greeting"})
        response = f"Hey! 👋 Welcome to SAGE. What would you like to work on today in **{domain.upper()}** (Milestone: *{topic}*)?"
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 2. INTENT: CAPABILITIES QUERY
    # -------------------------------------------------------------
    if intent == "capabilities":
        agent_trace.append({"agent": "Supervisor", "action": "Explained platform capabilities"})
        response = (
            "I can teach you, quiz you, help plan your studies, explain difficult concepts, "
            "analyze your progress, and answer questions from your uploaded materials in the Knowledge Vault! 🚀\n\n"
            "Here are a few quick ways to get started:\n"
            "- Ask a technical question (e.g. *\"Explain recursion step by step\"*)\n"
            "- Request a practice challenge (e.g. *\"Give me a quiz\"*)\n"
            "- Ask for recommendations (e.g. *\"What should I learn today?\"*)\n"
            "- Upload a PDF or technical notes in the Knowledge Vault and ask me about it!\n\n"
            "What sounds good to you?"
        )
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 3. INTENT: CASUAL CHAT / BOREDOM
    # -------------------------------------------------------------
    if intent == "casual":
        agent_trace.append({"agent": "Supervisor", "action": "Friendly conversational response"})
        clean_lower = user_msg.lower()
        if "bore" in clean_lower:
            response = "Haha 😄 Want a quick challenge, learn something interesting, take a quiz, or just chat?"
        elif "thank" in clean_lower:
            response = "You're very welcome! Keep up the great learning momentum. Feel free to ask anytime!"
        elif "bye" in clean_lower:
            response = "See you next time! Great job studying today. Keep your learning streak going! 🔥"
        else:
            prompt = (
                f"The student made a casual friendly comment: '{user_msg}'.\n"
                "Reply warmly, concisely, and supportively as SAGE AI learning companion."
            )
            response = call_llm(prompt=prompt, system_prompt="You are SAGE, a friendly learning companion.", max_tokens=150)
        
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 4. INTENT: PROGRESS QUERY
    # -------------------------------------------------------------
    if intent == "progress_query":
        agent_trace.append({"agent": "Supervisor", "action": "Retrieved student progress analytics"})
        completed_str = ", ".join(completed_modules) if completed_modules else "None yet"
        weak_str = ", ".join(weak_topics) if weak_topics else "None flagged! You are doing great"
        response = (
            f"### 📊 Your Learning Progress in **{domain.upper()}**\n\n"
            f"- **Active Goal / Milestone**: {topic}\n"
            f"- **Proficiency Calibration**: Level {skill_level} / 5\n"
            f"- **Mastered Milestones**: {completed_str}\n"
            f"- **Concepts to Review**: {weak_str}\n\n"
            "Would you like to review your weak concepts, dive deeper into your active milestone, or take a quiz to advance?"
        )
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 5. INTENT: STUDY PLANNING & RECOMMENDATIONS
    # -------------------------------------------------------------
    if intent == "study_plan":
        agent_trace.append({"agent": "Curriculum Agent", "action": "Synthesizing personalized daily study plan"})
        next_topic_info = get_next_topic(completed_modules, topic, domain=domain)
        weak_str = ", ".join(weak_topics) if weak_topics else "None detected"
        prompt = (
            f"The student asked for study planning or recommendations: '{user_msg}'.\n"
            f"Active Course Track: {domain.upper()}\n"
            f"Current Milestone: '{topic}' (Skill Level: {skill_level}/5)\n"
            f"Mastered Milestones: {', '.join(completed_modules) if completed_modules else 'None yet'}\n"
            f"Weak Areas Flagged: {weak_str}\n"
            f"Recommended Next Milestone: '{next_topic_info.get('title', topic)}'\n\n"
            "Provide a crisp, motivating, actionable daily recommendation. Format with clear Markdown bullet points, a 1-2 step focus, and invite them to start a lesson or quiz."
        )
        system_p = "You are SAGE Academic Advisor. Provide clear, structured, actionable study guidance."
        response = call_llm(prompt=prompt, system_prompt=system_p, max_tokens=400)
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 6. INTENT: IN-CHAT QUIZ REQUEST (Context-Aware)
    # -------------------------------------------------------------
    if intent == "quiz_request":
        # Extract specific topic from user message or recent conversation context
        quiz_topic = extract_context_topic(user_msg, memory_context, fallback_topic=topic)
        agent_trace.append({"agent": "Diagnostic Agent", "action": f"Generating concept-grounded quiz for '{quiz_topic}'"})
        quiz = generate_diagnostic_quiz(topic=quiz_topic, skill_level=skill_level)
        response = (
            f"### 🎯 Practice Quiz: {quiz_topic} (Level {skill_level}/5)\n\n"
            f"{quiz}\n\n"
            f"💡 *Reply with your answers (e.g., `1. ... 2. ... 3. ...`) and I'll evaluate them and update your skill level!*"
        )
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 7. INTENT: PDF / KNOWLEDGE VAULT QUERY
    # -------------------------------------------------------------
    if intent == "pdf_query":
        agent_trace.append({"agent": "RAG Agent", "action": "Querying ChromaDB vector store for uploaded document notes"})
        rag_context = retrieve_context(user_msg, course_track=domain, top_k=3)
        prompt = (
            f"--- RELEVANT EXTRACTED NOTES FROM UPLOADED DOCUMENTS (RAG) ---\n{rag_context}\n\n"
            f"--- STUDENT QUESTION ABOUT UPLOADED NOTES ---\n{user_msg}\n\n"
            "Answer the student's question based on the retrieved study notes above. "
            "Cite the source document where relevant. If the notes do not contain the answer, "
            "clarify what was found in the vault and supplement with accurate engineering fundamentals."
        )
        system_p = "You are SAGE Knowledge Vault Assistant. Provide accurate explanations with clear source citations."
        response = call_llm(prompt=prompt, system_prompt=system_p, max_tokens=650)
        append_to_memory("student", user_msg)
        append_to_memory("sage", response)
        return {
            "response": response,
            "ai_response": response,
            "domain": domain,
            "rag_context": rag_context,
            "agent_trace": agent_trace
        } if return_metadata else response

    # -------------------------------------------------------------
    # 4. INTENT: TECHNICAL / PDF / ENGINEERING INQUIRIES
    # -------------------------------------------------------------
    user_msg_domain = detect_domain(user_msg)
    explicit_signals = ["java", "jvm", "spring", "python", "dsa", "leetcode", "c++", "cpp", "docker", "kubernetes", "sql", "database", "security", "machine learning", "rag", "vector", "thermodynamics", "circuit", "mechanics"]
    if any(sig in user_msg.lower() for sig in explicit_signals):
        domain = user_msg_domain
    else:
        domain = detect_domain(topic) if topic else user_msg_domain

    system_prompt = build_adaptive_system_prompt(profile_data)

    # Check if Research Agent is needed
    msg_lower = user_msg.lower()
    needs_research = any(kw in msg_lower for kw in [
        "search", "web", "latest", "version", "spec", "documentation",
        "official", "library", "framework", "release", "news"
    ])

    research_info = None
    research_citations = []
    if needs_research:
        agent_trace.append({"agent": "Research Agent", "action": f"Searching web for '{user_msg}'"})
        research_info = run_research_agent(user_msg, domain=domain)
        research_citations = [c["url"] for c in research_info.get("citations", [])]

    # Query RAG vector store
    agent_trace.append({"agent": "RAG Agent", "action": f"Querying ChromaDB vector store for '{user_msg}'"})
    rag_context = retrieve_context(user_msg, course_track=domain, top_k=2)

    # Conversation memory context
    memory_context = get_formatted_context(max_turns=4)

    # Synthesize prompt
    research_block = ""
    if research_info and research_info.get("synthesized_summary"):
        research_block = f"--- LIVE EXTERNAL RESEARCH (WEB) ---\n{research_info['synthesized_summary']}\n\n"

    full_prompt = (
        f"--- CONVERSATION HISTORY ---\n{memory_context}\n\n"
        f"--- RELEVANT STUDY MATERIALS (RAG) ---\n{rag_context}\n\n"
        f"{research_block}"
        f"--- STUDENT QUERY ---\n{user_msg}"
    )

    agent_trace.append({"agent": "Tutor Agent", "action": "Generating grounded, adaptive explanation"})
    response = call_llm(prompt=full_prompt, system_prompt=system_prompt, max_tokens=650)

    # Verification with Verifier Agent
    combined_context = f"{rag_context}\n\n{research_block}"
    agent_trace.append({"agent": "Verifier Agent", "action": "Checking factual groundedness and syntax"})
    verification = verify_explanation(
        explanation=response,
        context=combined_context,
        domain=domain,
        external_citations=research_citations
    )

    # Record to conversation memory
    append_to_memory("student", user_msg)
    append_to_memory("sage", response)

    if return_metadata:
        return {
            "response": response,
            "ai_response": response,
            "verification": verification,
            "rag_context": rag_context,
            "research": research_info,
            "domain": domain,
            "agent_trace": agent_trace
        }

    return response

def supervise_learning_session(user_msg: str, profile_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
    """Provides complete multi-agent traceability for a learning interaction."""
    return route_user_request(user_msg, profile_data=profile_data, return_metadata=True, **kwargs)

def handle_diagnostic(topic: str = "", skill_level: Optional[int] = None) -> str:
    """Generates a domain-grounded diagnostic assessment for the specified topic."""
    return generate_diagnostic_quiz(topic=topic, skill_level=skill_level)

def handle_curriculum(topic: str, score: int, diagnostic_output: str = ""):
    """Generates an adaptive curriculum lesson reflecting diagnostic score."""
    return generate_curriculum_lesson(topic, score, diagnostic_output)

def handle_evaluation(answers: Any) -> Dict[str, Any]:
    """Evaluates student answers with deterministic concept-level attribution."""
    result = run_evaluator_agent(str(answers))
    if hasattr(result, "model_dump"):
        return result.model_dump()
    return dict(result)

def step_learning_cycle(
    action: str = "next",
    user_input: str = "",
    profile_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Autonomous closed-loop controller:
    STATUS -> TEACH -> QUIZ -> EVALUATE & ADVANCE TOPIC
    """
    profile = load_profile()
    current_topic = (profile_data.get("target_topic") if profile_data and profile_data.get("target_topic") else None) or profile.target_topic
    weak_topics = (profile_data.get("weak_topics") if profile_data and "weak_topics" in profile_data else None) or profile.weak_topics
    completed = (profile_data.get("completed_modules") if profile_data and "completed_modules" in profile_data else None) or profile.completed_modules
    skill_level = (profile_data.get("skill_level") if profile_data and "skill_level" in profile_data else None) or getattr(profile, "skill_level", 1)

    domain = detect_domain(current_topic)
    gaps = detect_prerequisite_gaps(current_topic, weak_topics, completed)

    # 1. Action: STATUS
    if action == "status":
        topic_key = find_topic_key(current_topic, domain) or ""
        order_val = TOPIC_ROADMAP.get(topic_key, {}).get("order", 1)
        return {
            "status": "success",
            "current_state": getattr(profile, "current_state", "TEACHING"),
            "target_topic": current_topic,
            "active_topic": current_topic,
            "domain": domain,
            "skill_level": skill_level,
            "completed_modules": completed,
            "weak_topics": weak_topics,
            "prerequisite_gaps": gaps,
            "roadmap_order": order_val,
            "total_roadmap_topics": len(TOPIC_ROADMAP),
        }

    # 2. Action: TEACH
    if action == "teach" or (action == "next" and getattr(profile, "current_state", "TEACHING") in ["TEACHING", "DIAGNOSING", "REMEDIATING"]):
        lesson = generate_curriculum_lesson(topic=current_topic, user_query=user_input)
        profile.current_state = "QUIZZING"
        save_profile(profile)
        return {
            "status": "success",
            "phase": "TEACHING",
            "current_state": "QUIZZING",
            "topic": current_topic,
            "domain": domain,
            "lesson": lesson,
            "prerequisite_gaps": gaps,
            "next_action": "take_quiz",
            "message": f"Lesson for '{current_topic}' completed. Ready to test your understanding."
        }

    # 3. Action: QUIZ
    if action in ["quiz", "take_quiz"] or (action == "next" and getattr(profile, "current_state", "") == "QUIZZING"):
        quiz = generate_diagnostic_quiz(topic=current_topic, skill_level=skill_level)
        profile.current_state = "EVALUATING"
        save_profile(profile)
        return {
            "status": "success",
            "phase": "QUIZZING",
            "current_state": "EVALUATING",
            "topic": current_topic,
            "domain": domain,
            "quiz": quiz,
            "next_action": "submit_answers",
            "message": f"Quiz for '{current_topic}' generated. Answer the questions to verify mastery."
        }

    # 4. Action: EVALUATE & ADVANCE TOPIC
    if action in ["evaluate", "submit_answers"] or (action == "next" and getattr(profile, "current_state", "") == "EVALUATING"):
        if not user_input:
            return {
                "status": "waiting_for_input",
                "phase": "EVALUATING",
                "current_state": "EVALUATING",
                "message": "Please provide your answers to the quiz questions."
            }

        eval_res = run_evaluator_agent(user_input)
        eval_dict = eval_res.model_dump() if hasattr(eval_res, "model_dump") else dict(eval_res)

        # Student model was advanced automatically in evaluator_agent.py
        updated_profile = load_profile()
        return {
            "status": "success",
            "phase": "EVALUATING",
            "current_state": updated_profile.current_state,
            "evaluation": eval_dict,
            "score": eval_res.score_out_of_3,
            "score_out_of_3": eval_res.score_out_of_3,
            "total_questions": 3,
            "passed": eval_res.passed,
            "previous_topic": current_topic,
            "next_topic": updated_profile.target_topic,
            "completed_modules": updated_profile.completed_modules,
            "weak_topics": updated_profile.weak_topics,
            "skill_level": updated_profile.skill_level,
            "domain": domain,
            "next_action": "teach",
            "message": f"Evaluation complete. Next topic: '{updated_profile.target_topic}'."
        }

    return {
        "status": "unknown_action",
        "message": f"Action '{action}' is not recognized. Use 'status', 'teach', 'take_quiz', 'submit_answers', or 'next'."
    }