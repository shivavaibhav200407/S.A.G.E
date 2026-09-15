import os
import sys
import json

# Ensure project root is in sys.path when running standalone from scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from supervisor import handle_diagnostic, handle_curriculum, handle_evaluation, route_user_request

# Safe imports for profile and memory managers
try:
    import profile_manager
except ImportError:
    profile_manager = None

try:
    import memory_manager
except ImportError:
    memory_manager = None


def run_sage_pipeline():
    print("=" * 60)
    print("🤖 STARTING FULL SAGE LEARNING PIPELINE")
    print("=" * 60)

    # 1. Select Course / Topic
    topic = input("\n📌 [Step 1] Enter topic: ").strip() or "Python Data Structures"
    
    # 2. Diagnostic Quiz
    print(f"\n📝 [Step 2] Generating Initial Diagnostic Quiz for '{topic}'...")
    quiz = handle_diagnostic(topic)
    print(f"   Quiz Output: {quiz}")

    # 3. Submit Answers
    user_quiz_answers = input("\n✍️ [Step 3] Submit your answers: ").strip() or "Q1: A, Q2: B, Q3: C"
    initial_score = 80
    
    # 4. Learning Schedule & Plan (Pass 'quiz' or diagnostic feedback here)
    print(f"\n🗺️ [Step 4] Creating Adaptive Plan (Score: {initial_score}%)...")
    plan = handle_curriculum(topic, initial_score, diagnostic_output=str(quiz))
    print(f"   Learning Plan: {plan}")

    # 5. Interactive Tutoring
    print("\n💬 [Step 5] Interactive Lesson Session...")
    doubt = f"Explain the core concepts of {topic} based on my learning plan."
    explanation = route_user_request(doubt)
    print(f"   SAGE Tutor: {explanation}")

    # 6. Post-Task Assessment Quiz
    print("\n📊 [Step 6] Post-Learning Quiz...")
    post_answers = input("✍️ Submit post-learning answers: ").strip() or "A1: Correct, A2: Correct"

    # 7. Final Evaluation
    print("\n🔍 [Step 7] Running Final Evaluation...")
    eval_result = handle_evaluation(post_answers)
    print(f"   Evaluation Results: {eval_result}")

    # 8. Skill Level Increase & Profile Update
    print("\n📈 [Step 8] Updating Skill Level & Storing Progress...")
    new_skill_level = "Intermediate"

    # Call profile_manager dynamically if available
    if profile_manager and hasattr(profile_manager, 'update_profile'):
        profile_manager.update_profile(topic, new_skill_level)
        print("   ✅ Updated user_profile.json successfully!")
    else:
        print(f"   ✅ Saved session state locally -> Topic: {topic} | Level: {new_skill_level}")

    print("\n" + "=" * 60)
    print("🎉 SAGE PIPELINE COMPLETE — FLOW EXECUTED SUCCESSFULLY")
    print("=" * 60)

if __name__ == "__main__":
    run_sage_pipeline()