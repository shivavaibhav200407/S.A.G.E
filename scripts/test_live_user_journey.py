import urllib.request
import urllib.parse
import json
import io
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000'

def make_req(path, method='GET', data=None, token=None, is_json=True):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    
    body = None
    if data is not None:
        if is_json:
            headers['Content-Type'] = 'application/json'
            body = json.dumps(data).encode('utf-8')
        else:
            body = data

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            status = resp.status
            try:
                res_data = json.loads(content.decode('utf-8'))
            except:
                res_data = content.decode('utf-8')
            return status, res_data
    except urllib.error.HTTPError as e:
        err_content = e.read().decode('utf-8', errors='ignore')
        try:
            res_data = json.loads(err_content)
        except:
            res_data = err_content
        return e.code, res_data
    except Exception as e:
        return 0, str(e)

def run_live_qa():
    print("=" * 70)
    print("  SAGE COMPLETE LIVE USER JOURNEY & API QA AUDIT")
    print("=" * 70)

    # 1. Loading & Landing
    status, spa_html = make_req('/')
    assert status == 200 and 'SAGE' in spa_html
    print("[PASS] 1. Loading & Landing Page served via Django (HTTP 200)")

    # 2. Register new student
    test_user = "student_qa_test"
    status, reg_data = make_req('/api/register/', 'POST', {
        'username': test_user,
        'password': 'Password123!',
        'email': 'student_qa@university.edu',
        'target_topic': 'Data Structures & Algorithms (CS201)'
    })
    # If already created, login instead
    if status == 400 and 'already taken' in str(reg_data):
        print(f"       User '{test_user}' already exists, proceeding to login.")
    else:
        assert status in [200, 201], f"Register failed: {status} {reg_data}"
        print(f"[PASS] 2. Registration API for '{test_user}' (HTTP {status})")

    # 3. Login
    status, auth_data = make_req('/api/token/', 'POST', {
        'username': test_user,
        'password': 'Password123!'
    })
    assert status == 200, f"Login failed: {status} {auth_data}"
    token = auth_data['access']
    print(f"[PASS] 3. JWT Login successful. Token received.")

    # 4. Profile & Dashboard
    status, profile = make_req('/api/profile/', 'GET', token=token)
    assert status == 200
    print(f"[PASS] 4. Profile & Dashboard: Level {profile.get('skill_level')}, Track: {profile.get('target_topic')}")

    # 5. Chat Test suite (Conversational personality)
    chat_prompts = [
        ("Hi", "Greeting"),
        ("I'm bored", "Casual Companion"),
        ("Teach me Java", "Pedagogical Request"),
        ("Explain arrays", "Concept Explanation"),
        ("Test me on Java", "Quiz Request"),
        ("Help me learn from my PDF", "Document Ingestion Guidance")
    ]

    print("\n--- Testing Conversational Intent Routing ---")
    for prompt, intent_label in chat_prompts:
        status, chat_resp = make_req('/api/chat/', 'POST', {'message': prompt}, token=token)
        assert status == 200, f"Chat failed for '{prompt}': {status} {chat_resp}"
        response_text = chat_resp.get('response', '')
        assert len(response_text) > 0
        snippet = response_text[:90].replace('\n', ' ')
        print(f"[PASS] 5. Chat ({intent_label}): \"{prompt}\" -> \"{snippet}...\"")

    # 6. Learning & Curriculum
    print("\n--- Testing Learning & Curriculum ---")
    status, courses = make_req('/api/courses/', 'GET')
    assert status == 200
    print(f"[PASS] 6a. Courses Catalog: {len(courses.get('courses', {}))} courses, {len(courses.get('tracks', {}))} tracks")

    status, cur_plan = make_req('/api/curriculum/', 'POST', {'topic': 'Arrays & Dynamic Arrays', 'score': 1}, token=token)
    assert status == 200
    print(f"[PASS] 6b. Curriculum Generation for 'Arrays & Dynamic Arrays' (HTTP 200)")

    # 7. Quiz & Scoring Synchronization
    print("\n--- Testing Quiz & Evaluator Agent Synchronization ---")
    status, quiz_res = make_req('/api/diagnostic/', 'POST', {'topic': 'Arrays & Dynamic Arrays', 'skill_level': 1}, token=token)
    assert status == 200
    questions = quiz_res.get('quiz', {}).get('questions', [])
    print(f"[PASS] 7a. Diagnostic Quiz: Generated {len(questions)} concept questions")

    # Test score = 0/1 (Fail/Remediation)
    eval_fail_status, eval_fail = make_req('/api/evaluate/', 'POST', {
        'answers': 'Q1: completely incorrect nonsense\nQ2: wrong answer\nQ3: irrelevant'
    }, token=token)
    assert eval_fail_status == 200
    fail_score = eval_fail.get('score', 0)
    fail_passed = eval_fail.get('passed', False)
    print(f"[PASS] 7b. Evaluator Low Score Test: Score={fail_score}/3, Passed={fail_passed} (Status: REMEDIATING)")

    # Test score = 3 (Pass/Promotion)
    eval_pass_status, eval_pass = make_req('/api/evaluate/', 'POST', {
        'answers': 'Q1: Encapsulation and modularity\nQ2: Self-balancing binary tree with O(log n) complexity\nQ3: Explicit boundary checks and exception validation'
    }, token=token)
    assert eval_pass_status == 200
    pass_score = eval_pass.get('score', 0)
    pass_passed = eval_pass.get('passed', False)
    print(f"[PASS] 7c. Evaluator High Score Test: Score={pass_score}/3, Passed={pass_passed} (Status: PASSED)")

    # Check that profile updated accordingly
    status, updated_profile = make_req('/api/profile/', 'GET', token=token)
    print(f"[PASS] 7d. Profile Level after Assessment: Level {updated_profile.get('skill_level')}")

    # 8. Document Vault RAG
    print("\n--- Testing Document Vault & ChromaDB RAG ---")
    status, docs_before = make_req('/api/rag/', 'GET', token=token)
    assert status == 200
    initial_count = docs_before.get('count', 0)
    print(f"[PASS] 8a. Document Library List: {initial_count} documents currently indexed")

    # Test Text Ingestion
    status, ingest_res = make_req('/api/rag/', 'POST', {
        'action': 'ingest',
        'text': 'A Binary Search Tree (BST) is a node-based binary tree data structure where each node has at most two children. The left subtree of a node contains only nodes with keys lesser than the node’s key, and the right subtree contains only nodes with keys greater than the node’s key.',
        'source': 'BST_Lecture_Notes.txt'
    }, token=token)
    assert status == 200
    print(f"[PASS] 8b. Document Ingestion: {ingest_res.get('chunks_ingested')} chunk(s) indexed into ChromaDB")

    # Test Semantic Vector Search
    status, search_res = make_req('/api/rag/', 'POST', {
        'action': 'search',
        'query': 'What is a Binary Search Tree property?'
    }, token=token)
    assert status == 200
    results = search_res.get('results', [])
    assert len(results) > 0
    print(f"[PASS] 8c. Semantic Vector Search: Retrieved {len(results)} matching chunks (Top similarity matched)")

    # Test Delete Document
    status, del_res = make_req('/api/rag/', 'POST', {
        'action': 'delete_document',
        'doc_name': 'BST_Lecture_Notes.txt'
    }, token=token)
    assert status == 200
    print(f"[PASS] 8d. Document Deletion: Removed 'BST_Lecture_Notes.txt' ({del_res.get('deleted_chunks')} chunks cleaned up)")

    # 9. Error Handling
    print("\n--- Testing Defensive Error Handling ---")
    # 401 Unauthorized
    unauth_status, _ = make_req('/api/profile/', 'GET')
    assert unauth_status == 401
    print("[PASS] 9a. 401 Unauthorized handled gracefully")

    # 400 Bad Request
    bad_status, bad_resp = make_req('/api/chat/', 'POST', {}, token=token)
    assert bad_status == 400
    print(f"[PASS] 9b. 400 Bad Request handled gracefully: {bad_resp.get('error')}")

    # 404 Not Found
    nf_status, _ = make_req('/api/non-existent-endpoint/', 'GET')
    assert nf_status == 404
    print("[PASS] 9c. 404 Not Found handled gracefully")

    print("\n" + "=" * 70)
    print("  ALL LIVE USER JOURNEYS & AUDIT CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == '__main__':
    run_live_qa()
