# SAGE — Self-Adaptive Agentic Educational Engine

SAGE is an enterprise-grade, multi-agent AI educational engine designed to teach engineering curricula across all major B.Tech disciplines. It combines autonomous pedagogical closed loops, RAG grounding (ChromaDB), multi-agent verification, and a responsive web application accessible over local and Wi-Fi networks.

---

## 🌔 Key Architecture & Capabilities

1. **Complete B.Tech Engineering Catalog (25+ Courses)**:
   - **Computer Science & IT (CSE/IT)**: DSA, Operating Systems, DBMS, Computer Networks, Java Enterprise, Python Mastery, Web Technologies, TOC & Compiler Design, Cybersecurity.
   - **AI & Data Science (AI/DS)**: Machine Learning, Deep Learning & Neural Networks, RAG & Generative AI Systems.
   - **Electronics & Electrical (ECE/EEE)**: Digital Logic Design (LD), Signals & Systems, Microprocessors (8086/ARM), Electric Circuits.
   - **Mechanical & Civil (ME/CE)**: Strength of Materials (SOM), Thermodynamics, Fluid Mechanics, Structural Analysis.
   - **1st Year Core Foundation**: C Programming, Engineering Mathematics, Engineering Physics, Basic Electrical & Electronics (BEEE).

2. **Conversational AI Tutor**:
   - Natural conversational greeting fast-path (replies warmly to greetings without premature gap lecturing).
   - Pedagogical explanations with Markdown formatting, code snippets, and real-world analogies for technical doubts.

3. **Multi-Agent Coordination & Supervision**:
   - **Supervisor Agent**: Manages student learning state and orchestrates worker agents.
   - **Diagnostic Agent**: Generates concept-tagged baseline diagnostic assessments.
   - **Curriculum Agent**: Synthesizes personalized multi-stage learning trajectories.
   - **Evaluator Agent**: Evaluates student responses and attributes weaknesses to specific syllabus concepts.
   - **Verifier Agent**: Guards against hallucinations and checks code syntax and factual grounding.
   - **Research Agent**: Conducts live web research via DuckDuckGo for cutting-edge specs.
   - **RAG Engine**: Vector store powered by ChromaDB for reference document retrieval.

4. **Network & Local Host Support**:
   - Automatically detects LAN/Wi-Fi IPv4 address and binds to `0.0.0.0:8000`.
   - Access from PC, phone, or tablet on the same Wi-Fi.

---

## 🎟 Repository Directory Structure

```
sage-engine/
☐— .env                       # API keys and environment configuration
☐— .gitignore                 # Standard Python/Django/ChromaDB ignore rules
☐— requirements.txt           # Python project dependencies
☐— README.md                  # Project overview & architecture guide
☐— manage.py                  # Django administrative CLI
☐— run_server.py              # Dual localhost/network host launcher
☐— start.bat                  # 1-Click Windows server launcher
☐— test_sage_v1.py            # Complete SAGE unit architecture test suite
│  
☐— api/                       # Django REST API application
│   ☐— models.py              # StudentProfile & ChatMessage persistence
│  ☐— views.py              # REST API endpoints (Chat, Profile, Loop, Courses, RAG)
│  ☐— urls.py               # API route definitions
│  ☐— serializers.py        # Model serialization
│   ☐— tests.py               # API integration test suite
│  
☐— sage_config/               # Django project settings & ASGI/WSGI configuration
☐— templates/                 # Frontend Single-Page App (index.html with Tailwind & Lucide)
☐— chroma_db/                 # Persistent ChromaDB vector database
┈  
☐— docs/                      # Documentation & API specifications
│  ☐— API_DOCUMENTATION.md   # Comprehensive REST API reference
│  ☐— sage_postman_collection.json # Postman testing collection
┈
☐— scripts/                   # Standalone helper & client scripts
│  ☐— chat_client.py         # Terminal interactive client for /api/chat/
│   ☐— check_models.py        # Groq API model listing diagnostic
│  ☐— run_sage.py            # Terminal 8-step pipeline simulator
│  ☐— main.py                # Standalone CLI chat loop
│   ☐— app.py                 # Streamlit UI prototype
┈
☑ +Core SAGE AI Engine]      # Core pedagogical intelligence modules
    ☐— supervisor.py          # Multi-agent orchestrator & routing
    ☐— lmm_client.py          # Groq cascading client & reasoning filter
    ☐— btech_courses.py       # Comprehensive 25+ course B.Tech catalog
    ☐— knowledge_graph.py     # Curricula DAG & domain detection
    ☐— rag.py                 # ChromaDB semantic search & retrieval
    ☐— tools.py               # Live web search & Python code execution
    ☐— memory_manager.py      # Conversation turn memory
    ☐— profile_manager.py     # Local JSON profile fallback
    ☐— diagnostic_agent.py   # Concept-tagged diagnostic assessments
    ☐— curriculum_agent.py   # Multi-stage learning trajectory planner
    ☐— evaluator_agent.py    # Student answer evaluator & concept scoring
    ☐— verifier_agent.py     # Factual grounding & syntax guardrail
    ☐— research_agent.py     # Live DuckDuckGo research agent
```

---

## 😀 Quickstart Guide

### 1. Launch Server (Local & Network Host)
Double-click `start.bat`& or run:
```powershell
.\.venv\Scripts\python.exe run_server.py
```

Console output will display:
``text
=====================================================================
  😨 SAGE Self-Adaptive Educational Platform
====================================================================
  👸 Local Host Access:     http://localhost:8000/
                             http://127.0.0.1:8000/
  📑 Network Host Access:   http://<YOUR-WIFI-IP>:8000/
====================================================================
```

### 2. Run Test Suites
```powershell
# Django REST API tests
.\.venv\Scripts\python.exe manage.py test api

# SAGE Core Architecture tests
.\.venv\Scripts\python.exe -m unittest test_sage_v1.py
```

### 3. Run Standalone Scripts
```powershell
# Interactive CLI Tutor
.\.venv\Scripts\python.exe scripts/main.py

# Check Available Groq Models
.%\.venv\Scripts\python.exe scripts/check_models.py

# Full 8-Step Pipeline Terminal Simulation
.%\.venv\Scripts\python.exe scripts/run_sage.py
```
