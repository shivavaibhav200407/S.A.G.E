# 📖 SAGE REST API Specification (v1.0)

This document provides the complete technical contract for connecting any web or mobile frontend (React, Next.js, Vue, Flutter, iOS/Android) to the SAGE Backend.

Base URL: `http://127.0.0.1:8000/api/` (Local) or `https://<your-deployed-domain>/api/` (Production)

---

## 🔐 1. Authentication & User Management

### 1.1 Student Signup
* **Endpoint:** `POST /api/signup/` (or `POST /api/register/`)
* **Auth Required:** No
* **Request Body:**
```json
{
  "username": "alex_dev",
  "password": "SecurePassword123!",
  "email": "alex@example.com",
  "target_topic": "Java Collections & ArrayList"
}
```
* **Response:** `201 Created`
```json
{
  "message": "Account created successfully for alex_dev!",
  "username": "alex_dev",
  "target_topic": "Java Collections & ArrayList"
}
```

---

### 1.2 Student Login (Obtain JWT)
* **Endpoint:** `POST /api/token/`
* **Auth Required:** No
* **Request Body:**
```json
{
  "username": "alex_dev",
  "password": "SecurePassword123!"
}
```
* **Response:** `200 OK`
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
> **Note:** Include `Authorization: Bearer <access_token>` in headers for all subsequent requests.

---

### 1.3 Refresh Token
* **Endpoint:** `POST /api/token/refresh/`
* **Request Body:** `{"refresh": "<refresh_token>"}`
* **Response:** `200 OK` -> `{"access": "<new_access_token>"}`

---

## 👤 2. Student Profile & Preferences

### 2.1 Get Student Profile
* **Endpoint:** `GET /api/profile/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response:** `200 OK`
```json
{
  "id": 1,
  "user": "alex_dev",
  "target_topic": "Java Collections & ArrayList",
  "skill_level": "1",
  "current_state": "TEACHING",
  "completed_modules": [],
  "weak_topics": [],
  "username": "alex_dev"
}
```

---

### 2.2 Update Profile / Switch Track
* **Endpoint:** `PUT /api/profile/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "target_topic": "AsyncIO & Event Loop",
  "skill_level": "2"
}
```
* **Response:** `200 OK` with updated profile object.

---

## 🔄 3. Autonomous Learning Loop (`/api/loop/`)

This is the primary state machine for closed-loop learning.

### 3.1 Get Current Learning State & Progress
* **Endpoint:** `GET /api/loop/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response:** `200 OK`
```json
{
  "status": "success",
  "current_state": "TEACHING",
  "target_topic": "Java Collections & ArrayList",
  "domain": "java",
  "skill_level": 1,
  "completed_modules": [],
  "weak_topics": [],
  "prerequisite_gaps": [],
  "roadmap_order": 3,
  "total_roadmap_topics": 18
}
```

---

### 3.2 Step 1: Generate Adaptive Lesson
* **Endpoint:** `POST /api/loop/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "action": "teach",
  "input": "Can you focus especially on resizing mechanics?"
}
```
* **Response:** `200 OK`
```json
{
  "status": "success",
  "phase": "TEACHING",
  "current_state": "QUIZZING",
  "topic": "Java Collections & ArrayList",
  "domain": "java",
  "lesson": "# Java Collections Framework: ArrayList Internals\n\n...",
  "prerequisite_gaps": [],
  "next_action": "take_quiz",
  "message": "Lesson for 'Java Collections & ArrayList' completed. Ready to test your understanding."
}
```

---

### 3.3 Step 2: Generate Concept-Tagged Quiz
* **Endpoint:** `POST /api/loop/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "action": "quiz"
}
```
* **Response:** `200 OK`
```json
{
  "status": "success",
  "phase": "QUIZZING",
  "current_state": "EVALUATING",
  "topic": "Java Collections & ArrayList",
  "quiz": "1. [Concept: Collections Framework (ArrayList)]\nHow does ArrayList resize internally?\n\n2. ...",
  "next_action": "submit_answers",
  "message": "Quiz generated. Please submit your answers."
}
```

---

### 3.4 Step 3: Submit Answers & Advance Topic
* **Endpoint:** `POST /api/loop/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "action": "evaluate",
  "input": "Q1: It expands by 50% using bitwise shift. Q2: It uses equals() for equality."
}
```
* **Response:** `200 OK`
```json
{
  "status": "success",
  "phase": "EVALUATING",
  "current_state": "TEACHING",
  "score": 3,
  "passed": true,
  "skill_level": 2,
  "previous_topic": "Java Collections & ArrayList",
  "next_topic": "Generics & Type Erasure",
  "completed_modules": ["Java Collections & ArrayList"],
  "weak_topics": [],
  "next_action": "teach",
  "message": "Evaluation complete. Next topic: 'Generics & Type Erasure'."
}
```

---

## 💬 4. Interactive Chat Tutor (`/api/chat/`)

### 4.1 Send Doubt / Chat Question
* **Endpoint:** `POST /api/chat/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "message": "Explain Java String Pool with a simple diagram or analogy."
}
```
* **Response:** `200 OK`
```json
{
  "response": "The Java String Pool is like a library with unique books...",
  "ai_response": "The Java String Pool is like a library with unique books..."
}
```

---

### 4.2 Retrieve Persistent Chat History
* **Endpoint:** `GET /api/chat/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": 1,
      "user_message": "Explain Java String Pool...",
      "ai_response": "The Java String Pool is...",
      "timestamp": "2026-09-04T19:53:14.238491Z"
    }
  ]
}
```

---

## 📚 5. Knowledge Vault (ChromaDB RAG) (`/api/rag/`)

### 5.1 Ingest Document or Notes
* **Endpoint:** `POST /api/rag/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "action": "ingest",
  "text": "Java ArrayList resizing formula: newCapacity = oldCapacity + (oldCapacity >> 1)",
  "source": "Java_Advanced_Notes.pdf"
}
```
* **Response:** `200 OK`
```json
{
  "status": "success",
  "chunks_ingested": 1
}
```

---

### 5.2 Semantic Vector Search
* **Endpoint:** `POST /api/rag/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "action": "search",
  "query": "How does ArrayList expand?",
  "top_k": 3
}
```
* **Response:** `200 OK`
```json
{
  "results": [
    {
      "text": "Java ArrayList resizing formula: newCapacity = oldCapacity + (oldCapacity >> 1)",
      "source": "Java_Advanced_Notes.pdf",
      "distance": 0.28
    }
  ]
}
```

---

## 🤖 6. Multi-Agent Execution Trace (`/api/trace/`)

* **Endpoint:** `POST /api/trace/`
* **Headers:** `Authorization: Bearer <access_token>`
* **Request Body:**
```json
{
  "message": "What is Python asyncio event loop? Search official docs."
}
```
* **Response:** `200 OK`
```json
{
  "response": "The asyncio event loop is...",
  "domain": "python",
  "verification": {
    "is_grounded": true,
    "confidence_score": 0.95,
    "grounded_claims": ["Event loop is the core of asyncio"],
    "unsupported_claims": [],
    "citations": ["https://docs.python.org/3/library/asyncio-eventloop.html"],
    "feedback": "Factual and aligned with Python official specification."
  },
  "research": {
    "query": "Python asyncio event loop",
    "citations": [{"title": "Event loop - Python docs", "url": "https://docs.python.org/..."}]
  },
  "agent_trace": [
    {"agent": "Supervisor", "action": "Analyzing student intent and profile"},
    {"agent": "Research Agent", "action": "Searching web for official documentation"},
    {"agent": "RAG Agent", "action": "Querying ChromaDB vector store"},
    {"agent": "Tutor Agent", "action": "Generating grounded, adaptive explanation"},
    {"agent": "Verifier Agent", "action": "Checking factual groundedness and syntax"}
  ]
}
```
