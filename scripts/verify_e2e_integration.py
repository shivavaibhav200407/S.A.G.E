import os
import sys
import django

sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sage_config.settings')
django.setup()

from django.test import Client

def test_integration():
    c = Client()

    print("1. Testing Demo Login (/api/demo-login/)...")
    resp = c.post('/api/demo-login/', {}, content_type='application/json')
    assert resp.status_code == 200, f"Demo login failed: {resp.status_code} {resp.content}"
    data = resp.json()
    token = data['access']
    auth_header = {'HTTP_AUTHORIZATION': f"Bearer {token}"}
    print(f"   [OK] Logged in as: {data.get('username')}")

    print("2. Testing Profile (/api/profile/)...")
    resp = c.get('/api/profile/', **auth_header)
    assert resp.status_code == 200
    pdata = resp.json()
    print(f"   [OK] Skill level: {pdata.get('skill_level')}, Current Topic: {pdata.get('current_topic')}")

    print("3. Testing Courses Catalog (/api/courses/)...")
    resp = c.get('/api/courses/')
    assert resp.status_code == 200
    cdata = resp.json()
    print(f"   [OK] Branches found: {len(cdata.get('branches', {}))}, Tracks found: {len(cdata.get('tracks', {}))}")

    print("4. Testing Chat History (/api/chat/)...")
    resp = c.get('/api/chat/', **auth_header)
    assert resp.status_code == 200
    print(f"   [OK] Chat history count: {len(resp.json().get('messages', []))}")

    print("5. Testing Diagnostic Generation (/api/diagnostic/)...")
    resp = c.post('/api/diagnostic/', {'topic': 'Data Structures', 'skill_level': 1}, content_type='application/json', **auth_header)
    assert resp.status_code == 200
    print("   [OK] Diagnostic quiz generated successfully")

    print("6. Testing Evaluation Scoring (/api/evaluate/)...")
    resp = c.post('/api/evaluate/', {'answers': 'Q1: A\nQ2: B\nQ3: C'}, content_type='application/json', **auth_header)
    assert resp.status_code == 200
    edata = resp.json()
    print(f"   [OK] Evaluation score: {edata.get('score')}/{edata.get('total_questions')}, Passed: {edata.get('passed')}")

    print("7. Testing RAG Knowledge Base Listing (/api/rag/)...")
    resp = c.get('/api/rag/', **auth_header)
    assert resp.status_code == 200
    rdata = resp.json()
    print(f"   [OK] Documents count: {rdata.get('count', 0)}")

    print("8. Testing SPA frontend route (/)...")
    resp = c.get('/')
    assert resp.status_code == 200
    assert 'SAGE' in resp.content.decode('utf-8')
    print("   [OK] Modern React SPA index.html served cleanly by Django root route!")

    print("\n=======================================================")
    print("  ALL 8 API & SPA INTEGRATION CHECKS PASSED PERFECTLY! ")
    print("=======================================================")

if __name__ == '__main__':
    test_integration()
