import io
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import StudentProfile, ChatMessage


class SageBackendTestSuite(APITestCase):

    def setUp(self):
        """Set up test user and initial profile before each test."""
        self.username = "test_vaibhav"
        self.password = "testpass123"
        
        # 1. Create test user
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password
        )
        
        # 2. Endpoints
        self.token_url = reverse('token_obtain_pair')
        self.chat_url = reverse('sage_chat')
        self.profile_url = reverse('sage_profile')
        self.rag_url = reverse('sage_rag')
        self.trace_url = reverse('sage_trace')
        self.loop_url = reverse('sage_loop')

    def test_01_full_backend_workflow(self):
        """Tests login -> profile retrieval -> LLM agent response -> DB storage."""
        
        # --- PHASE 1: Authentication ---
        token_response = self.client.post(self.token_url, {
            'username': self.username,
            'password': self.password
        }, format='json')
        
        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', token_response.data)
        access_token = token_response.data['access']
        
        # Attach Bearer JWT Header for subsequent requests
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # --- PHASE 2: Check & Update Profile ---
        profile_get = self.client.get(self.profile_url)
        self.assertEqual(profile_get.status_code, status.HTTP_200_OK)
        
        profile_update = self.client.put(self.profile_url, {
            'target_topic': 'Java Basics & Primitive Types',
            'skill_level': '2'
        }, format='json')
        self.assertEqual(profile_update.status_code, status.HTTP_200_OK)

        # --- PHASE 3: Chat with SAGE Agent (Greeting Intent) ---
        chat_payload = {'message': 'Hello SAGE!'}
        chat_response = self.client.post(self.chat_url, chat_payload, format='json')
        
        self.assertEqual(chat_response.status_code, status.HTTP_200_OK)
        self.assertIn('ai_response', chat_response.data)
        
        ai_reply = chat_response.data['ai_response']
        self.assertTrue(len(ai_reply) > 0, "AI response should not be empty.")

        # --- PHASE 4: Database Persistence Verification ---
        chat_history = ChatMessage.objects.filter(user=self.user)
        self.assertEqual(chat_history.count(), 1)
        self.assertEqual(chat_history.first().user_message, 'Hello SAGE!')
        self.assertEqual(chat_history.first().ai_response, ai_reply)

    def test_02_unauthenticated_chat_rejected(self):
        """Ensures non-logged-in users cannot access SAGE chat."""
        self.client.credentials()  # Clear auth token
        response = self.client.post(self.chat_url, {'message': 'Hello'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_03_rag_file_upload_and_search(self):
        """Tests file upload, document listing, and semantic search in RAG vault."""
        token_response = self.client.post(self.token_url, {
            'username': self.username,
            'password': self.password
        }, format='json')
        access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Test uploading a document
        dummy_file = SimpleUploadedFile(
            "test_guide.txt",
            b"Java garbage collection uses generational memory management with Eden and Tenured spaces.",
            content_type="text/plain"
        )
        upload_res = self.client.post(self.rag_url, {'file': dummy_file}, format='multipart')
        self.assertEqual(upload_res.status_code, status.HTTP_200_OK)
        self.assertIn('chunks_ingested', upload_res.data)

        # Test listing documents
        list_res = self.client.get(self.rag_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertIn('documents', list_res.data)

        # Test semantic search
        search_res = self.client.post(self.rag_url, {'action': 'search', 'query': 'garbage collection spaces'}, format='json')
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertIn('results', search_res.data)

    def test_04_multi_agent_trace_view(self):
        """Tests multi-agent trace endpoint returns structured supervisor and verifier steps."""
        token_response = self.client.post(self.token_url, {
            'username': self.username,
            'password': self.password
        }, format='json')
        access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        trace_res = self.client.post(self.trace_url, {'query': 'Explain Java Memory Model'}, format='json')
        self.assertEqual(trace_res.status_code, status.HTTP_200_OK)
        self.assertIn('supervisor_plan', trace_res.data)
        self.assertIn('verifier_result', trace_res.data)
        self.assertIn('final_response', trace_res.data)