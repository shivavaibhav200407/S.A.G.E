import { request } from './api';
import type { QuizQuestion, EvaluationResult } from '../types';

export interface DiagnosticResponse {
  quiz: {
    topic?: string;
    quiz_type?: 'diagnostic' | 'mastery';
    doc_name?: string;
    domain?: string;
    aligned_topics?: string[];
    prerequisites?: string[];
    questions?: Array<{
      id?: number | string;
      question: string;
      options: string[];
      concept?: string;
      correct_answer?: number | string;
    }>;
  };
}

export interface EvaluationResponse {
  score: number;
  score_out_of_3: number;
  total_questions: number;
  passed: boolean;
  quiz_type?: 'diagnostic' | 'mastery';
  feedback?: string;
  tutor_feedback?: string;
  detected_weak_topics?: string[];
  recommended_skill_level?: number;
  next_topic?: string;
  completed_modules?: string[];
  results?: any;
}

export async function generateQuiz(
  topic: string,
  skillLevel?: number,
  quizType: 'diagnostic' | 'mastery' = 'diagnostic',
  docName?: string
): Promise<{ questions: QuizQuestion[]; meta?: any }> {
  const data = await request<DiagnosticResponse>('/api/diagnostic/', {
    method: 'POST',
    body: JSON.stringify({
      topic,
      skill_level: skillLevel,
      quiz_type: quizType,
      doc_name: docName,
    }),
  });

  const rawQuestions = data?.quiz?.questions || [];
  const questions = rawQuestions.map((q, idx) => ({
    id: q.id || idx + 1,
    question: q.question,
    options: q.options || [],
    concept: q.concept,
  }));

  return { questions, meta: data?.quiz };
}

export async function evaluateQuiz(
  answersText: string,
  quizType: 'diagnostic' | 'mastery' = 'diagnostic',
  topic?: string
): Promise<EvaluationResult> {
  const data = await request<EvaluationResponse>('/api/evaluate/', {
    method: 'POST',
    body: JSON.stringify({
      answers: answersText,
      quiz_type: quizType,
      topic,
    }),
  });

  return {
    score: data.score_out_of_3 ?? data.score ?? 0,
    total_questions: data.total_questions || 3,
    passed: data.passed ?? (data.score >= 2),
    skill_level: data.recommended_skill_level || 1,
    next_topic: data.next_topic,
    weak_topics: data.detected_weak_topics || [],
    feedback: data.feedback || data.tutor_feedback || '',
    quiz_type: data.quiz_type || quizType,
  };
}

