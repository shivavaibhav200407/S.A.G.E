import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from api.models import StudentProfile, ChatMessage
from api.serializers import StudentProfileSerializer
from supervisor import (
    handle_diagnostic,
    handle_curriculum,
    handle_evaluation,
    route_user_request
)
from django.http import JsonResponse
from rag import search_knowledge_base, rag_db


# 0. Registration / Signup View
class SageRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            username = request.data.get('username', '').strip()
            password = request.data.get('password', '').strip()
            email = request.data.get('email', '').strip()
            target_topic = request.data.get('target_topic', 'Java Basics & Primitive Types')

            if not username or not password:
                return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=username).exists():
                return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(username=username, password=password, email=email)
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            if target_topic:
                profile.target_topic = target_topic
                profile.save()

            return Response({
                'message': f"Account created successfully for {username}!",
                'username': username,
                'target_topic': profile.target_topic
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 0.1 Demo Auto-Login View
class SageDemoLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            username = request.data.get('username', 'demo_student') or 'demo_student'
            user, created = User.objects.get_or_create(username=username)
            user.set_password('demopass123')
            user.is_active = True
            user.save()

            profile, _ = StudentProfile.objects.get_or_create(user=user)
            if not profile.target_topic:
                profile.target_topic = "Java Basics & Primitive Types"
                profile.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username,
                'target_topic': profile.target_topic,
                'message': 'Demo login successful!'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 1. Chat View
class SageChatView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve student's persistent chat history."""
        try:
            messages = ChatMessage.objects.filter(user=request.user).order_by('timestamp')
            data = [
                {
                    'id': m.id,
                    'user_message': m.user_message,
                    'ai_response': m.ai_response,
                    'timestamp': m.timestamp.isoformat()
                }
                for m in messages
            ]
            return Response({'messages': data}, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            msg = request.data.get('message', '')
            if not msg:
                return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            
            # Allow frontend to pass active target_topic / domain if updated
            topic_override = request.data.get('topic') or request.data.get('target_topic')
            if topic_override and topic_override != profile.target_topic:
                profile.target_topic = topic_override
                profile.save()

            profile_data = {
                'target_topic': profile.target_topic or "Java Basics & Primitive Types",
                'skill_level': int(profile.skill_level) if str(profile.skill_level).isdigit() else 1,
                'weak_topics': profile.get_weak_topics(),
                'completed_modules': profile.get_completed_modules(),
            }

            response = route_user_request(msg, profile_data=profile_data)

            # Save conversation to SQLite
            ChatMessage.objects.create(
                user=request.user,
                user_message=msg,
                ai_response=response
            )

            return Response({
                'response': response,
                'ai_response': response
            }, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 2. Profile View
class SageProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            serializer = StudentProfileSerializer(profile)
            data = dict(serializer.data)
            data['username'] = request.user.username
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                data = dict(serializer.data)
                data['username'] = request.user.username
                return Response(data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 3. Diagnostic Quiz View
class DiagnosticView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            topic = request.data.get('topic', 'Java Basics & Primitive Types')
            skill_level = request.data.get('skill_level')
            if skill_level is not None:
                try:
                    skill_level = int(skill_level)
                except Exception:
                    skill_level = None
            quiz = handle_diagnostic(topic, skill_level=skill_level)
            if hasattr(quiz, 'model_dump'):
                quiz = quiz.model_dump()
            elif hasattr(quiz, 'dict'):
                quiz = quiz.dict()
            elif hasattr(quiz, '__dict__'):
                quiz = quiz.__dict__
            return Response({'quiz': quiz}, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 4. Curriculum View
class CurriculumView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            topic = request.data.get('topic', 'Java Basics & Primitive Types')
            score = request.data.get('score', 0)
            plan = handle_curriculum(topic, int(score))
            if hasattr(plan, 'model_dump'):
                plan = plan.model_dump()
            elif hasattr(plan, 'dict'):
                plan = plan.dict()
            elif hasattr(plan, '__dict__'):
                plan = plan.__dict__
            return Response({'plan': plan, 'curriculum_plan': plan}, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 5. Evaluation View
class EvaluationView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            answers = request.data.get('answers', '')
            results = handle_evaluation(answers)
            if hasattr(results, 'model_dump'):
                results = results.model_dump()
            elif hasattr(results, 'dict'):
                results = results.dict()
            elif hasattr(results, '__dict__'):
                results = results.__dict__

            # Format normalized response
            score_val = results.get('score_out_of_3', results.get('score', 0))
            passed_val = results.get('passed', score_val >= 2)
            
            # Sync to student profile
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            if passed_val:
                current_lvl = int(profile.skill_level) if str(profile.skill_level).isdigit() else 1
                profile.skill_level = str(min(current_lvl + 1, 5))
            
            if 'detected_weak_topics' in results and results['detected_weak_topics']:
                profile.set_weak_topics(results['detected_weak_topics'])
            profile.save()

            response_payload = {
                'score': score_val,
                'score_out_of_3': score_val,
                'total_questions': 3,
                'passed': passed_val,
                'tutor_feedback': results.get('feedback', ''),
                'feedback': results.get('feedback', ''),
                'detected_weaknesses': results.get('detected_weak_topics', []),
                'detected_weak_topics': results.get('detected_weak_topics', []),
                'recommended_skill_level': int(profile.skill_level),
                'results': results
            }
            return Response(response_payload, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 6. Autonomous Learning Loop View
class LearningLoopView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from supervisor import step_learning_cycle
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            profile_data = {
                'target_topic': profile.target_topic or "Java Basics & Primitive Types",
                'skill_level': int(profile.skill_level) if str(profile.skill_level).isdigit() else 1,
                'completed_modules': profile.get_completed_modules(),
                'weak_topics': profile.get_weak_topics(),
            }
            res = step_learning_cycle(action="status", profile_data=profile_data)
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            from supervisor import step_learning_cycle
            action = request.data.get('action', 'next')
            user_input = request.data.get('input', '') or request.data.get('answers', '')
            requested_topic = request.data.get('topic') or request.data.get('target_topic')
            requested_level = request.data.get('skill_level')
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)

            if requested_topic:
                profile.target_topic = requested_topic
            if requested_level:
                profile.skill_level = str(requested_level)
            profile.save()

            profile_data = {
                'target_topic': profile.target_topic or requested_topic or "Java Basics & Primitive Types",
                'skill_level': int(profile.skill_level) if str(profile.skill_level).isdigit() else 1,
                'completed_modules': profile.get_completed_modules(),
                'weak_topics': profile.get_weak_topics(),
            }

            res = step_learning_cycle(action=action, user_input=user_input, profile_data=profile_data)

            # Sync updates back to SQLite database
            if res.get('status') == 'success':
                if 'next_topic' in res:
                    profile.target_topic = res['next_topic']
                if 'skill_level' in res:
                    profile.skill_level = str(res['skill_level'])
                if 'current_state' in res:
                    profile.current_state = res['current_state']
                if 'completed_modules' in res:
                    profile.set_completed_modules(res['completed_modules'])
                if 'weak_topics' in res:
                    profile.set_weak_topics(res['weak_topics'])
                profile.save()

            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 7. Courses & Catalog View
class SageCoursesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            from knowledge_graph import DOMAIN_META, DOMAIN_TRACKS
            from btech_courses import BTECH_BRANCHES
            return Response({
                'courses': DOMAIN_META,
                'tracks': DOMAIN_TRACKS,
                'branches': BTECH_BRANCHES
            }, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 8. RAG Knowledge Base View (Enhanced with PDF upload, listing & deletion)
class SageRAGView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all ingested documents in the Knowledge Base."""
        try:
            documents = rag_db.list_documents()
            return Response({'documents': documents, 'count': len(documents)}, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            # Handle multipart PDF file upload
            if 'file' in request.FILES:
                uploaded_file = request.FILES['file']
                filename = uploaded_file.name
                if not filename.lower().endswith('.pdf') and not filename.lower().endswith('.txt') and not filename.lower().endswith('.md'):
                    return Response({'error': 'Only PDF, TXT, and MD files are supported.'}, status=status.HTTP_400_BAD_REQUEST)
                
                if filename.lower().endswith('.pdf'):
                    chunks_count = rag_db.ingest_pdf(uploaded_file.read(), filename=filename)
                else:
                    content = uploaded_file.read().decode('utf-8', errors='ignore')
                    chunks_count = rag_db.ingest_text(content, source_name=filename)

                return Response({
                    'status': 'success',
                    'filename': filename,
                    'chunks_ingested': chunks_count,
                    'message': f"Successfully indexed {chunks_count} semantic chunk(s) from '{filename}' into ChromaDB!"
                }, status=status.HTTP_200_OK)

            action = request.data.get('action', 'search')
            
            if action == 'search':
                query = request.data.get('query', '')
                top_k = int(request.data.get('top_k', 3))
                hits = search_knowledge_base(query, top_k=top_k)
                return Response({'results': hits}, status=status.HTTP_200_OK)
            
            elif action == 'ingest':
                text = request.data.get('text', '')
                source = request.data.get('source', 'User Notes')
                if not text:
                    return Response({'error': 'No text provided for ingestion'}, status=status.HTTP_400_BAD_REQUEST)
                count = rag_db.ingest_text(text, source_name=source)
                return Response({
                    'status': 'success',
                    'source': source,
                    'chunks_ingested': count,
                    'message': f"Successfully indexed {count} chunk(s) from '{source}' into ChromaDB!"
                }, status=status.HTTP_200_OK)

            elif action == 'list_documents':
                docs = rag_db.list_documents()
                return Response({'documents': docs, 'count': len(docs)}, status=status.HTTP_200_OK)

            elif action == 'delete_document':
                doc_name = request.data.get('doc_name', '')
                if not doc_name:
                    return Response({'error': 'doc_name is required for deletion'}, status=status.HTTP_400_BAD_REQUEST)
                deleted_count = rag_db.delete_document(doc_name)
                return Response({
                    'status': 'success',
                    'doc_name': doc_name,
                    'deleted_chunks': deleted_count,
                    'message': f"Removed '{doc_name}' ({deleted_count} chunks) from knowledge base."
                }, status=status.HTTP_200_OK)
            
            return Response({'error': f"Unknown action '{action}'"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 9. Multi-Agent Trace View
class SageAgentTraceView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from supervisor import supervise_learning_session
            msg = request.data.get('message', '') or request.data.get('query', '')
            if not msg:
                return Response({'error': 'Message/query is required'}, status=status.HTTP_400_BAD_REQUEST)

            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            profile_data = {
                'target_topic': profile.target_topic or "Java Basics & Primitive Types",
                'skill_level': int(profile.skill_level) if str(profile.skill_level).isdigit() else 1,
                'completed_modules': profile.get_completed_modules(),
                'weak_topics': profile.get_weak_topics(),
            }

            trace_res = supervise_learning_session(msg, profile_data=profile_data)
            
            # Format clean response matching frontend inspector needs
            formatted = {
                'supervisor_plan': f"Orchestrate pedagogical response for '{profile_data['target_topic']}' (Domain: {trace_res.get('domain', 'general')})",
                'retrieved_context': trace_res.get('rag_context', 'Standard curriculum knowledge'),
                'verifier_result': trace_res.get('verification', {'is_grounded': True, 'confidence_score': 0.95}),
                'final_response': trace_res.get('response', ''),
                'response': trace_res.get('response', ''),
                'agent_trace': trace_res.get('agent_trace', []),
                'domain': trace_res.get('domain', 'general'),
            }
            return Response(formatted, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)