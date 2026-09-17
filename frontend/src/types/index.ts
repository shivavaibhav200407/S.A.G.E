export interface User {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface Course {
  code: string;
  title: string;
  branch: string;
  year: number;
  semester: number;
  category: string;
  description: string;
  credits: number;
  prerequisites: string[];
  topics: string[];
}

export interface StudentProfile {
  username: string;
  email: string;
  skill_level: number;
  current_topic: string;
  target_topic: string;
  state: string;
  weak_topics: string[];
  mastered_topics: string[];
  learning_streak: number;
  total_sessions?: number;
  created_at?: string;
}

export interface ChatMessage {
  id?: number | string;
  role: 'user' | 'assistant' | 'sage' | 'system';
  content: string;
  timestamp?: string;
}

export interface QuizQuestion {
  id?: number | string;
  question: string;
  options: string[];
  userAnswer?: number | string;
  concept?: string;
}

export interface EvaluationResult {
  score: number;
  total_questions: number;
  passed: boolean;
  skill_level: number;
  next_topic?: string;
  weak_topics: string[];
  feedback?: string;
  quiz_type?: 'diagnostic' | 'mastery';
}

export interface RAGDocument {
  name: string;
  chunks: number;
  upload_date?: string;
  size_bytes?: number;
}

export interface SearchResult {
  content?: string;
  text?: string;
  metadata?: {
    source?: string;
    page?: number;
  };
  score?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
