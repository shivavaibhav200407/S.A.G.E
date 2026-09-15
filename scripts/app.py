import os
import sys

# Ensure project root is in sys.path when running standalone from scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import streamlit as st

# Configure Windows encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from profile_manager import load_profile, save_profile
from supervisor import (
    step_learning_cycle,
    supervise_learning_session,
    build_adaptive_system_prompt
)
from knowledge_graph import (
    DOMAIN_TRACKS,
    detect_domain,
    detect_prerequisite_gaps,
    find_topic_key
)
from rag import rag_db, search_knowledge_base
from tools import search_web

# Page Configuration
st.set_page_config(
    page_title="SAGE — Self-Adaptive Learning Engine",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.3rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.2rem;
    }
    .subtitle {
        font-size: 1.05rem;
        color: #64748B;
        margin-bottom: 1.5rem;
    }
    .badge-java {
        background-color: #FEF3C7;
        color: #92400E;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .badge-python {
        background-color: #E0F2FE;
        color: #0369A1;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .badge-rag {
        background-color: #EDE9FE;
        color: #6D28D9;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .status-card {
        padding: 1rem;
        border-radius: 10px;
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- SESSION STATE SETUP -----------------
if "learning_state" not in st.session_state:
    st.session_state.learning_state = step_learning_cycle(action="status")
if "last_lesson" not in st.session_state:
    st.session_state.last_lesson = None
if "last_quiz" not in st.session_state:
    st.session_state.last_quiz = None
if "last_eval" not in st.session_state:
    st.session_state.last_eval = None
if "agent_trace_data" not in st.session_state:
    st.session_state.agent_trace_data = None

profile = load_profile()

# ----------------- SIDEBAR -----------------
with st.sidebar:
    st.markdown("## 🧠 SAGE Profile")
    st.write(f"**Learner:** {profile.user_name}")

    # Track Selector
    domain_options = {
        "java": "☕ Java Core & Advanced",
        "python": "🐍 Python & Async Programming",
        "rag_ai": "🤖 RAG, Embeddings & Agents"
    }
    current_domain = detect_domain(profile.target_topic)
    selected_domain_key = st.selectbox(
        "Learning Domain Track",
        options=list(domain_options.keys()),
        index=list(domain_options.keys()).index(current_domain) if current_domain in domain_options else 0,
        format_func=lambda x: domain_options[x]
    )

    track_topics = [t["title"] for t in DOMAIN_TRACKS[selected_domain_key].values()]
    default_topic_idx = track_topics.index(profile.target_topic) if profile.target_topic in track_topics else 0

    selected_topic = st.selectbox("Target Topic", options=track_topics, index=default_topic_idx)

    if selected_topic != profile.target_topic:
        profile.target_topic = selected_topic
        save_profile(profile)
        st.session_state.learning_state = step_learning_cycle(action="status")
        st.session_state.last_lesson = None
        st.session_state.last_quiz = None
        st.session_state.last_eval = None
        st.rerun()

    st.markdown("---")
    st.metric(label="Skill Level", value=f"Level {profile.skill_level} / 5")
    st.write(f"**Style:** {getattr(profile, 'preferred_style', 'Practical & Code-First')}")
    st.write(f"**Completed Modules:** {len(getattr(profile, 'completed_modules', []))}")
    if getattr(profile, 'weak_topics', []):
        st.warning(f"**Identified Weaknesses:**\n- " + "\n- ".join(profile.weak_topics))

    st.markdown("---")
    if st.button("🔄 Reset Profile & Progress", use_container_width=True):
        profile.skill_level = 1
        profile.weak_topics = []
        profile.completed_modules = []
        profile.current_state = "TEACHING"
        save_profile(profile)
        st.session_state.learning_state = step_learning_cycle(action="status")
        st.session_state.last_lesson = None
        st.session_state.last_quiz = None
        st.session_state.last_eval = None
        st.rerun()

# ----------------- HEADER -----------------
col_title, col_badge = st.columns([3, 1])
with col_title:
    st.markdown('<div class="main-title">🧠 SAGE Engine v1.0</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Self-Adaptive Learning & Multi-Agent Guidance Engine</div>', unsafe_allow_html=True)
with col_badge:
    badge_class = f"badge-{selected_domain_key}"
    st.markdown(f'<div style="text-align: right; margin-top: 15px;"><span class="{badge_class}">{domain_options[selected_domain_key]}</span></div>', unsafe_allow_html=True)

# ----------------- 4 NAVIGATION TABS -----------------
tab_loop, tab_mastery, tab_rag, tab_inspector = st.tabs([
    "🎯 Autonomous Learning Loop",
    "📊 Student Mastery Matrix",
    "📚 Knowledge Vault (RAG)",
    "🤖 Multi-Agent Inspector"
])

# =======================================================
# TAB 1: AUTONOMOUS LEARNING LOOP
# =======================================================
with tab_loop:
    st.subheader("Autonomous Closed-Loop Learning Cycle")
    st.caption("Cycles autonomously through: Lesson Generation ➔ Concept-Tagged Quiz ➔ Deterministic Evaluation ➔ Adaptive Progression")

    l_state = st.session_state.learning_state
    current_phase = l_state.get("current_state", "TEACHING")

    # Status overview
    c1, c2, c3 = st.columns(3)
    with c1:
        st.info(f"**Current State:** `{current_phase}`")
    with c2:
        st.info(f"**Active Topic:** {profile.target_topic}")
    with c3:
        gaps = l_state.get("prerequisite_gaps", [])
        if gaps:
            st.warning(f"**Prerequisite Gap:** {gaps[0]['title']}")
        else:
            st.success("**Prerequisites:** All Satisfied ✅")

    st.markdown("---")

    # Action 1: Teach
    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("📖 1. Generate Adaptive Lesson", use_container_width=True, type="primary"):
            with st.spinner(f"SAGE Tutor is preparing lesson for '{profile.target_topic}'..."):
                res = step_learning_cycle(action="teach")
                st.session_state.last_lesson = res.get("lesson")
                st.session_state.learning_state = res
                st.rerun()

    with col_btn2:
        if st.button("📝 2. Generate Concept Quiz", use_container_width=True):
            with st.spinner(f"Generating concept-grounded quiz for '{profile.target_topic}'..."):
                res = step_learning_cycle(action="quiz")
                st.session_state.last_quiz = res.get("quiz")
                st.session_state.learning_state = res
                st.rerun()

    # Display Lesson if available
    if st.session_state.last_lesson:
        st.markdown("### 🎓 Tutor Lesson")
        if gaps:
            st.warning(f"🚨 **Pedagogical Gap Bridged:** Grounding explanation starting from '{gaps[0]['title']}' before proceeding to '{profile.target_topic}'.")
        st.markdown(st.session_state.last_lesson)
        st.markdown("---")

    # Display Quiz if available
    if st.session_state.last_quiz:
        st.markdown("### ✍️ Diagnostic Assessment")
        st.info(st.session_state.last_quiz)

        st.markdown("#### Submit Your Answers")
        student_answers = st.text_area(
            "Write your responses below (e.g., Q1: ..., Q2: ..., Q3: ...):",
            height=130,
            placeholder="1. The String Pool is located in the Java Heap memory...\n2. Strings are immutable because...\n3. It prints false because == checks reference equality..."
        )

        if st.button("🚀 Submit Answers for Evaluation", type="primary"):
            if not student_answers.strip():
                st.warning("Please type your answers before submitting.")
            else:
                with st.spinner("SAGE Evaluator Agent is scoring against concept rubric..."):
                    eval_res = step_learning_cycle(action="evaluate", user_input=student_answers)
                    st.session_state.last_eval = eval_res
                    st.session_state.learning_state = step_learning_cycle(action="status")
                    st.rerun()

    # Display Evaluation Results
    if st.session_state.last_eval:
        st.markdown("### 📊 Evaluation & Attribution")
        ev = st.session_state.last_eval
        e_data = ev.get("evaluation", {})

        m1, m2, m3 = st.columns(3)
        with m1:
            score = ev.get("score", e_data.get("score_out_of_3", 0))
            st.metric("Score", f"{score} / 3")
        with m2:
            st.metric("New Skill Level", f"Level {ev.get('skill_level', profile.skill_level)} / 5")
        with m3:
            passed = ev.get("passed", score >= 2)
            st.metric("Mastery Status", "PASSED ✅" if passed else "REMEDIATE 🔄")

        # Weakness attribution
        detected_weaks = ev.get("weak_topics", e_data.get("detected_weak_topics", []))
        if detected_weaks:
            st.error(f"🎯 **Grounded Weaknesses Attributed:** {', '.join(detected_weaks)}")
            st.caption("Note: SAGE assigns weaknesses strictly within the tested domain to eliminate hallucinations.")
        else:
            st.success("🎉 No conceptual gaps identified! Solid comprehension demonstrated.")

        if "feedback" in e_data:
            st.markdown(f"**Tutor Feedback:**\n\n{e_data['feedback']}")

        if ev.get("next_topic") and ev.get("next_topic") != profile.target_topic:
            st.info(f"💡 Recommended Next Topic: **{ev.get('next_topic')}**")
            if st.button(f"➡️ Advance to '{ev.get('next_topic')}'"):
                profile.target_topic = ev.get("next_topic")
                save_profile(profile)
                st.session_state.last_lesson = None
                st.session_state.last_quiz = None
                st.session_state.last_eval = None
                st.session_state.learning_state = step_learning_cycle(action="status")
                st.rerun()

# =======================================================
# TAB 2: STUDENT MASTERY MATRIX
# =======================================================
with tab_mastery:
    st.subheader(f"📊 Mastery Matrix: {domain_options[selected_domain_key]}")
    st.caption("Dynamic knowledge graph tracking student mastery, completed modules, and prerequisite linkages.")

    curr_track = DOMAIN_TRACKS[selected_domain_key]
    completed = getattr(profile, "completed_modules", [])
    total_topics = len(curr_track)
    completed_count = sum(1 for t in curr_track.values() if t["title"] in completed)
    progress_pct = int((completed_count / total_topics) * 100) if total_topics else 0

    st.progress(progress_pct / 100.0)
    st.write(f"**Curriculum Completion:** {completed_count} / {total_topics} Topics ({progress_pct}%)")

    st.markdown("### Curriculum Roadmap & Concept Status")
    for key, topic_data in curr_track.items():
        title = topic_data["title"]
        prereqs = topic_data.get("prerequisites", [])
        subconcepts = topic_data.get("subconcepts", [])

        is_completed = title in completed
        is_current = title == profile.target_topic

        if is_completed:
            status_icon = "✅ Completed"
        elif is_current:
            status_icon = "🔄 Active Focus"
        else:
            status_icon = "🔒 Upcoming"

        with st.expander(f"{status_icon} — {title}", expanded=is_current):
            col_a, col_b = st.columns([2, 1])
            with col_a:
                st.write(f"**Subconcepts Covered:**")
                st.write(", ".join([f"`{sc}`" for sc in subconcepts]))
                if prereqs:
                    prereq_titles = [curr_track[p]["title"] for p in prereqs if p in curr_track]
                    st.write(f"**Prerequisites:** {', '.join(prereq_titles)}")
            with col_b:
                if not is_current and st.button(f"Switch to this topic", key=f"btn_switch_{key}"):
                    profile.target_topic = title
                    save_profile(profile)
                    st.session_state.learning_state = step_learning_cycle(action="status")
                    st.session_state.last_lesson = None
                    st.session_state.last_quiz = None
                    st.session_state.last_eval = None
                    st.rerun()

    st.markdown("---")
    st.markdown("### 🧩 Prerequisite Dependency Graph Diagnostics")
    gaps = detect_prerequisite_gaps(profile.target_topic, profile.weak_topics, completed)
    if gaps:
        for g in gaps:
            st.warning(f"**Foundational Concept Needed:** {g['title']}\n\n*Reason:* {g['reason']}")
    else:
        st.success(f"All prerequisites for **{profile.target_topic}** are verified.")

# =======================================================
# TAB 3: KNOWLEDGE VAULT (CHROMA DB RAG)
# =======================================================
with tab_rag:
    st.subheader("📚 Knowledge Vault: ChromaDB Vector Store")
    st.caption("Local semantic embedding storage powered by sentence-transformers (`all-MiniLM-L6-v2`) and ChromaDB.")

    col_ingest1, col_ingest2 = st.columns(2)

    with col_ingest1:
        st.markdown("#### Ingest Course Document (PDF / Text)")
        uploaded_file = st.file_uploader("Upload course notes or slides", type=["pdf", "txt", "md", "java", "py"])
        if uploaded_file is not None:
            if st.button("Ingest into Vector DB"):
                temp_path = os.path.join(".", f"temp_{uploaded_file.name}")
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())

                with st.spinner("Chunking and generating semantic embeddings..."):
                    if uploaded_file.name.endswith(".pdf"):
                        chunks = rag_db.ingest_pdf(temp_path)
                    else:
                        with open(temp_path, "r", encoding="utf-8", errors="ignore") as f:
                            text_content = f.read()
                        chunks = rag_db.ingest_text(text_content, source_name=uploaded_file.name)

                    if os.path.exists(temp_path):
                        os.remove(temp_path)

                st.success(f"✅ Ingested {chunks} semantic chunks from '{uploaded_file.name}' into ChromaDB!")

    with col_ingest2:
        st.markdown("#### Quick Note Ingestion")
        quick_note = st.text_area("Paste code snippet or study note:", height=100, placeholder="In Java, String is immutable because...")
        note_title = st.text_input("Source Tag:", value="Manual Note")
        if st.button("Add Note to Knowledge Base"):
            if quick_note.strip():
                count = rag_db.ingest_text(quick_note, source_name=note_title)
                st.success(f"✅ Ingested {count} chunks into Knowledge Vault!")
            else:
                st.warning("Please enter text to ingest.")

    st.markdown("---")
    st.markdown("#### 🔍 Semantic Vector Search Explorer")
    search_query = st.text_input("Search knowledge base by meaning (e.g. 'How does HashMap handle collisions?' or 'What is chunk overlap?'):")
    if st.button("Search Vector DB", type="primary") and search_query.strip():
        with st.spinner("Querying ChromaDB collection..."):
            hits = search_knowledge_base(search_query, top_k=3)

        if hits:
            st.write(f"Found **{len(hits)}** semantically relevant chunks:")
            for idx, h in enumerate(hits, 1):
                dist = h.get("distance", 0.0)
                sim_score = max(0.0, 1.0 - (dist / 2.0))
                with st.expander(f"Match #{idx} — Source: {h.get('source')} (Similarity: {sim_score:.2%})", expanded=(idx==1)):
                    st.code(h.get("text"), language="text")
        else:
            st.info("No matching chunks found in the knowledge base.")

# =======================================================
# TAB 4: MULTI-AGENT INSPECTOR
# =======================================================
with tab_inspector:
    st.subheader("🤖 Multi-Agent Inspector & Trace Console")
    st.caption("Live orchestration: Supervisor ➔ RAG Agent ➔ Research Agent ➔ Tutor Agent ➔ Verifier Agent Guardrail")

    user_query = st.text_input(
        "Ask SAGE any question or test agent orchestration:",
        value="Explain Java String Pool and why String comparison with == can fail."
    )

    col_btn_test, col_web_check = st.columns([2, 2])
    with col_web_check:
        force_research = st.checkbox("Include Live Web Research (DuckDuckGo)", value=False)

    if col_btn_test.button("⚡ Run Multi-Agent Session", type="primary"):
        if not user_query.strip():
            st.warning("Please type a question.")
        else:
            with st.spinner("Orchestrating agents..."):
                query_to_run = f"{user_query} (please search the official documentation)" if force_research else user_query
                profile_data = {
                    "target_topic": profile.target_topic,
                    "skill_level": profile.skill_level,
                    "completed_modules": getattr(profile, "completed_modules", []),
                    "weak_topics": getattr(profile, "weak_topics", []),
                    "preferred_style": getattr(profile, "preferred_style", "Practical & Code-First"),
                }
                st.session_state.agent_trace_data = supervise_learning_session(query_to_run, profile_data=profile_data)

    if st.session_state.agent_trace_data:
        data = st.session_state.agent_trace_data

        st.markdown("### 🛡️ Final Tutor Response")
        st.markdown(data.get("response", ""))

        st.markdown("---")
        st.markdown("### 🔍 Multi-Agent Execution Breakdown")

        # Step 1: Supervisor
        with st.expander("1. 🧠 SAGE Supervisor & Intent Analysis", expanded=True):
            st.write(f"**Detected Domain Track:** `{data.get('domain', 'general').upper()}`")
            st.write(f"**Active Topic:** `{profile.target_topic}`")
            st.write(f"**Skill Level:** `Level {profile.skill_level} / 5`")
            st.json(data.get("agent_trace", []))

        # Step 2: RAG Agent
        with st.expander("2. 📚 RAG Agent (ChromaDB Retrieval)", expanded=False):
            rag_snippet = data.get("rag_context", "No context")
            st.text_area("Retrieved Semantic Chunks", value=rag_snippet, height=120)

        # Step 3: Research Agent
        with st.expander("3. 🌐 Research Agent (DuckDuckGo Live Docs)", expanded=False):
            research = data.get("research")
            if research:
                st.write(f"**Search Query:** `{research.get('query')}`")
                citations = research.get("citations", [])
                if citations:
                    st.write("**Extracted Source Citations:**")
                    for c in citations:
                        st.markdown(f"- [{c.get('title')}]({c.get('url')})")
                st.text_area("Synthesized Research Briefing", value=research.get("synthesized_summary", ""), height=150)
            else:
                st.info("Query was handled using local domain knowledge and RAG (no external web search required).")

        # Step 4: Verifier Agent Guardrail
        with st.expander("4. 🛡️ Verifier Agent Guardrail & Groundedness", expanded=True):
            ver = data.get("verification", {})
            v_grounded = ver.get("is_grounded", True)
            v_conf = ver.get("confidence_score", 0.9)

            c_v1, c_v2 = st.columns(2)
            with c_v1:
                if v_grounded:
                    st.success(f"**Verification Status:** GROUNDED & FACTUAL ✅")
                else:
                    st.warning(f"**Verification Status:** NUANCE / CORRECTION DETECTED ⚠️")
            with c_v2:
                st.metric("Confidence Score", f"{v_conf:.1%}")

            st.write(f"**Verifier Feedback:** {ver.get('feedback', 'Verified')}")
            if ver.get("grounded_claims"):
                st.write("**Verified Claims:**")
                for claim in ver.get("grounded_claims"):
                    st.markdown(f"- {claim}")
            if ver.get("unsupported_claims"):
                st.warning(f"**Flagged Nuances:** {', '.join(ver.get('unsupported_claims'))}")