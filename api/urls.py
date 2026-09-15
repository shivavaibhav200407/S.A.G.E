from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SageChatView, 
    SageProfileView, 
    DiagnosticView, 
    CurriculumView, 
    EvaluationView,
    LearningLoopView,
    SageRAGView,
    SageAgentTraceView,
    SageRegisterView,
    SageDemoLoginView,
    SageCoursesView
)

urlpatterns = [
    path('demo-login/', SageDemoLoginView.as_view(), name='sage_demo_login'),
    path('courses/', SageCoursesView.as_view(), name='sage_courses'),
    path('signup/', SageRegisterView.as_view(), name='sage_signup'),
    path('register/', SageRegisterView.as_view(), name='sage_register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('chat/', SageChatView.as_view(), name='sage_chat'),
    path('profile/', SageProfileView.as_view(), name='sage_profile'),
    path('diagnostic/', DiagnosticView.as_view(), name='sage_diagnostic'),
    path('curriculum/', CurriculumView.as_view(), name='sage_curriculum'),
    path('evaluate/', EvaluationView.as_view(), name='sage_evaluate'),
    path('loop/', LearningLoopView.as_view(), name='sage_loop'),
    path('rag/', SageRAGView.as_view(), name='sage_rag'),
    path('trace/', SageAgentTraceView.as_view(), name='sage_trace'),
]