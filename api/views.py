import time
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

            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': f"Account created successfully for {username}!",
                'username': username,
                'target_topic': profile.target_topic,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
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
        t0 = time.time()
        print("[PERF] POST /api/chat/ started")
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

            elapsed = time.time() - t0
            print(f"[PERF] POST /api/chat/ completed in {elapsed:.2f}s")
            return Response({
                'response': response,
                'ai_response': response
            }, status=status.HTTP_200_OK)
        except TimeoutError as te:
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/chat/ timed out after {elapsed:.2f}s: {te}")
            return Response({'error': 'AI generation timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 2. Profile View
class SageProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        t0 = time.time()
        print("[PERF] GET /api/profile/ started")
        try:
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            serializer = StudentProfileSerializer(profile)
            data = dict(serializer.data)
            data['username'] = request.user.username
            try:
                numeric_level = int(profile.skill_level) if profile.skill_level else 1
            except (ValueError, TypeError):
                numeric_level = 1
            data['level'] = numeric_level
            data['skill_level'] = numeric_level
            data['current_topic'] = profile.target_topic or 'Python Basics & Syntax'
            data['target_topic'] = profile.target_topic or 'Python Basics & Syntax'
            elapsed = time.time() - t0
            print(f"[PERF] GET /api/profile/ completed in {elapsed:.3f}s")
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
        t0 = time.time()
        print("[PERF] POST /api/diagnostic/ started")
        try:
            raw_topic = request.data.get('topic')
            skill_level = request.data.get('skill_level')
            quiz_type = request.data.get('quiz_type', 'diagnostic')
            doc_name = request.data.get('doc_name')
            
            # If doc_name is supplied and topic is not provided or is generic default, pass topic=None so PDF alignment chooses
            generic_topics = {'java basics & primitive types', 'general engineering', ''}
            if doc_name and (not raw_topic or raw_topic.strip().lower() in generic_topics):
                topic = None
            else:
                topic = raw_topic or 'Java Basics & Primitive Types'

            if skill_level is not None:
                try:
                    skill_level = int(skill_level)
                except Exception:
                    skill_level = None

            quiz = handle_diagnostic(topic, skill_level=skill_level, quiz_type=quiz_type, doc_name=doc_name)
            quiz_dict = {}
            if isinstance(quiz, dict):
                quiz_dict = quiz
            elif hasattr(quiz, 'model_dump'):
                quiz_dict = quiz.model_dump()
            elif hasattr(quiz, 'dict'):
                quiz_dict = quiz.dict()
            elif isinstance(quiz, str):
                import re
                parsed_questions = []
                blocks = re.split(r'\n(?=(?:\d+[\.\)]|\[Concept:))', quiz.strip())
                for idx, b in enumerate(blocks):
                    b = b.strip()
                    if not b:
                        continue
                    lines = b.split('\n')
                    q_lines = []
                    options = []
                    concept_tag = ""
                    for line in lines:
                        line_s = line.strip()
                        c_match = re.search(r'\[Concept:\s*([^\]]+)\]', line_s, re.IGNORECASE)
                        if c_match:
                            concept_tag = c_match.group(1).strip()
                            continue
                        opt_match = re.match(r'^[A-Da-d][\)\.\:]\s*(.+)$', line_s)
                        if opt_match:
                            options.append(opt_match.group(1).strip())
                        else:
                            q_lines.append(line)

                    q_text = '\n'.join(q_lines).strip()
                    q_text = re.sub(r'^\d+[\.\)]\s*', '', q_text).strip()

                    parsed_questions.append({
                        'id': idx + 1,
                        'question': q_text,
                        'options': options,
                        'concept': concept_tag or (topic or 'Diagnostic')
                    })
                quiz_dict = {
                    'topic': topic or 'Diagnostic Assessment',
                    'raw_text': quiz,
                    'questions': parsed_questions,
                    'quiz_type': quiz_type,
                    'doc_name': doc_name
                }
            else:
                quiz_dict = {'topic': topic or 'Diagnostic Assessment', 'raw_text': str(quiz), 'questions': [], 'quiz_type': quiz_type}

            quiz_dict['quiz_type'] = quiz_dict.get('quiz_type', quiz_type)
            if doc_name:
                quiz_dict['doc_name'] = doc_name
            if 'primary_topic' in quiz_dict:
                quiz_dict['topic'] = quiz_dict['primary_topic']

            elapsed = time.time() - t0
            print(f"[PERF] POST /api/diagnostic/ completed in {elapsed:.2f}s")
            return Response({'quiz': quiz_dict}, status=status.HTTP_200_OK)
        except TimeoutError as te:
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/diagnostic/ timed out after {elapsed:.2f}s: {te}")
            return Response({'error': 'AI generation timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 4. Curriculum View
class CurriculumView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        t0 = time.time()
        print("[PERF] POST /api/curriculum/ started")
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
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/curriculum/ completed in {elapsed:.2f}s")
            return Response({'plan': plan, 'curriculum_plan': plan}, status=status.HTTP_200_OK)
        except TimeoutError as te:
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/curriculum/ timed out after {elapsed:.2f}s: {te}")
            return Response({'error': 'AI generation timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 5. Evaluation View
class EvaluationView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        t0 = time.time()
        print("[PERF] POST /api/evaluate/ started")
        try:
            answers = request.data.get('answers', '')
            quiz_type = request.data.get('quiz_type', 'diagnostic')
            topic = request.data.get('topic') or request.data.get('target_topic')
            results = handle_evaluation(answers, quiz_type=quiz_type, topic=topic)
            if hasattr(results, 'model_dump'):
                results = results.model_dump()
            elif hasattr(results, 'dict'):
                results = results.dict()
            elif hasattr(results, '__dict__'):
                results = results.__dict__

            score_val = results.get('score_out_of_3', results.get('score', 0))
            passed_val = results.get('passed', score_val >= 2)
            
            # Sync to student profile with progression gating
            profile, _ = StudentProfile.objects.get_or_create(user=request.user)
            try:
                current_lvl = int(profile.skill_level) if profile.skill_level else 1
            except (ValueError, TypeError):
                current_lvl = 1

            completed_list = profile.get_completed_modules()
            weak_list = profile.get_weak_topics()
            active_topic_name = topic or profile.target_topic

            next_topic_recommendation = None
            if quiz_type.lower() == 'mastery':
                if passed_val:
                    # Mark module as completed
                    if active_topic_name and active_topic_name not in completed_list:
                        completed_list.append(active_topic_name)
                        profile.set_completed_modules(completed_list)
                    # Clear from weak topics
                    if active_topic_name in weak_list:
                        weak_list = [w for w in weak_list if w != active_topic_name]
                        profile.set_weak_topics(weak_list)
                    # Advance skill level
                    current_lvl = min(current_lvl + 1, 5)
                    profile.skill_level = str(current_lvl)

                    # Calculate next topic in Knowledge Graph
                    from knowledge_graph import get_next_topic, detect_domain
                    dom = detect_domain(active_topic_name)
                    next_node = get_next_topic(completed_list, current_topic=active_topic_name, domain=dom)
                    if next_node and 'title' in next_node:
                        next_topic_recommendation = next_node['title']
                else:
                    # Record newly detected weak topics
                    new_weak = results.get('detected_weak_topics', [])
                    for nw in new_weak:
                        if nw not in weak_list:
                            weak_list.append(nw)
                    profile.set_weak_topics(weak_list)
            else:
                # Pre-assessment Diagnostic: record weak spots without modifying skill level
                new_weak = results.get('detected_weak_topics', [])
                for nw in new_weak:
                    if nw not in weak_list:
                        weak_list.append(nw)
                profile.set_weak_topics(weak_list)

            profile.save()

            response_payload = {
                'score': score_val,
                'score_out_of_3': score_val,
                'total_questions': 3,
                'passed': passed_val,
                'quiz_type': quiz_type,
                'tutor_feedback': results.get('feedback', ''),
                'feedback': results.get('feedback', ''),
                'detected_weaknesses': results.get('detected_weak_topics', []),
                'detected_weak_topics': results.get('detected_weak_topics', []),
                'recommended_skill_level': current_lvl,
                'next_level': current_lvl,
                'next_topic': next_topic_recommendation,
                'completed_modules': profile.get_completed_modules(),
                'results': results
            }
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/evaluate/ completed in {elapsed:.2f}s")
            return Response(response_payload, status=status.HTTP_200_OK)
        except TimeoutError as te:
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/evaluate/ timed out after {elapsed:.2f}s: {te}")
            return Response({'error': 'AI generation timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 6. Autonomous Learning Loop View
class LearningLoopView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        t0 = time.time()
        print("[PERF] GET /api/loop/ started")
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
            elapsed = time.time() - t0
            print(f"[PERF] GET /api/loop/ completed in {elapsed:.3f}s")
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        t0 = time.time()
        print("[PERF] POST /api/loop/ started")
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

            elapsed = time.time() - t0
            print(f"[PERF] POST /api/loop/ completed in {elapsed:.2f}s")
            return Response(res, status=status.HTTP_200_OK)
        except TimeoutError as te:
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/loop/ timed out after {elapsed:.2f}s: {te}")
            return Response({'error': 'AI generation timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 7. Courses & Catalog View (Cached in-memory for instant <5ms responses)
_COURSES_CACHE = None

class SageCoursesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        t0 = time.time()
        print("[PERF] GET /api/courses/ started")
        try:
            global _COURSES_CACHE
            if _COURSES_CACHE is None:
                from knowledge_graph import DOMAIN_META, DOMAIN_TRACKS
                from btech_courses import BTECH_BRANCHES
                courses_list = [
                    {"id": k, **v} for k, v in DOMAIN_META.items()
                ]
                _COURSES_CACHE = {
                    'courses': DOMAIN_META,
                    'courses_list': courses_list,
                    'tracks': DOMAIN_TRACKS,
                    'branches': BTECH_BRANCHES
                }
            elapsed = time.time() - t0
            print(f"[PERF] GET /api/courses/ completed in {elapsed:.3f}s")
            return Response(_COURSES_CACHE, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 8. RAG Knowledge Base View (Enhanced with PDF upload, listing & deletion)
class SageRAGView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all ingested documents in the Knowledge Base."""
        t0 = time.time()
        print("[PERF] GET /api/rag/ started")
        try:
            documents = rag_db.list_documents()
            elapsed = time.time() - t0
            print(f"[PERF] GET /api/rag/ completed in {elapsed:.3f}s")
            return Response({'documents': documents, 'count': len(documents)}, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        t0 = time.time()
        print("[PERF] POST /api/rag/ started")
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

                if chunks_count == 0:
                    return Response({
                        'error': f"Could not extract readable text from '{filename}'. The file may be empty or contain scanned images without digital text. Please upload a PDF with selectable text, or notes in TXT/MD format.",
                        'chunks_ingested': 0
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Pre-calculate Knowledge Graph alignment for immediate rich frontend feedback
                from pdf_diagnostic import align_document_with_knowledge_graph
                alignment = align_document_with_knowledge_graph(filename)

                elapsed = time.time() - t0
                print(f"[PERF] POST /api/rag/ (upload '{filename}') completed in {elapsed:.2f}s")
                return Response({
                    'status': 'success',
                    'filename': filename,
                    'chunks_ingested': chunks_count,
                    'alignment': alignment,
                    'message': f"Successfully indexed {chunks_count} semantic chunk(s) from '{filename}' into ChromaDB!"
                }, status=status.HTTP_200_OK)

            action = request.data.get('action', 'search')
            
            if action == 'search':
                query = request.data.get('query', '')
                top_k = int(request.data.get('top_k', 3))
                hits = search_knowledge_base(query, top_k=top_k)
                elapsed = time.time() - t0
                print(f"[PERF] POST /api/rag/ (search) completed in {elapsed:.3f}s")
                return Response({'results': hits}, status=status.HTTP_200_OK)
            
            elif action == 'ingest':
                text = request.data.get('text', '')
                source = request.data.get('source', 'User Notes')
                if not text:
                    return Response({'error': 'No text provided for ingestion'}, status=status.HTTP_400_BAD_REQUEST)
                count = rag_db.ingest_text(text, source_name=source)
                elapsed = time.time() - t0
                print(f"[PERF] POST /api/rag/ (ingest) completed in {elapsed:.3f}s")
                return Response({
                    'status': 'success',
                    'source': source,
                    'chunks_ingested': count,
                    'message': f"Successfully indexed {count} chunk(s) from '{source}' into ChromaDB!"
                }, status=status.HTTP_200_OK)

            elif action == 'list_documents':
                docs = rag_db.list_documents()
                elapsed = time.time() - t0
                print(f"[PERF] POST /api/rag/ (list_documents) completed in {elapsed:.3f}s")
                return Response({'documents': docs, 'count': len(docs)}, status=status.HTTP_200_OK)

            elif action == 'delete_document':
                doc_name = request.data.get('doc_name', '')
                if not doc_name:
                    return Response({'error': 'doc_name is required for deletion'}, status=status.HTTP_400_BAD_REQUEST)
                deleted_count = rag_db.delete_document(doc_name)
                elapsed = time.time() - t0
                print(f"[PERF] POST /api/rag/ (delete_document) completed in {elapsed:.3f}s")
                return Response({
                    'status': 'success',
                    'doc_name': doc_name,
                    'deleted_chunks': deleted_count,
                    'message': f"Removed '{doc_name}' ({deleted_count} chunks) from knowledge base."
                }, status=status.HTTP_200_OK)

            elif action == 'align_diagnostic':
                doc_name = request.data.get('doc_name', '')
                if not doc_name:
                    return Response({'error': 'doc_name is required for alignment'}, status=status.HTTP_400_BAD_REQUEST)
                from pdf_diagnostic import align_document_with_knowledge_graph
                alignment = align_document_with_knowledge_graph(doc_name)
                elapsed = time.time() - t0
                print(f"[PERF] POST /api/rag/ (align_diagnostic) completed in {elapsed:.3f}s")
                return Response({'alignment': alignment}, status=status.HTTP_200_OK)
            
            return Response({'error': f"Unknown action '{action}'"}, status=status.HTTP_400_BAD_REQUEST)
        except TimeoutError as te:
            elapsed = time.time() - t0
            print(f"[PERF] POST /api/rag/ timed out after {elapsed:.2f}s: {te}")
            return Response({'error': 'Operation timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
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