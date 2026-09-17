import { request } from './api';

export interface CoursesResponse {
  courses: Record<string, {
    name: string;
    branch?: string;
    description?: string;
    prerequisites?: string[];
    topics?: any;
    [key: string]: any;
  }>;
  tracks: Record<string, any>;
  branches: Record<string, any>;
  available_topics?: string[];
  topics?: string[];
}

export interface CurriculumPlanResponse {
  plan?: {
    topic: string;
    modules?: Array<{ title: string; objective: string }>;
    learning_steps?: string[];
    summary?: string;
  };
  curriculum_plan?: any;
}

export interface LearningLoopStepResponse {
  status: string;
  stage: string;
  lesson?: string;
  quiz?: any;
  score?: number;
  passed?: boolean;
  next_topic?: string;
  skill_level?: number;
  feedback?: string;
  weak_topics?: string[];
  message?: string;
}

export async function fetchCourses(): Promise<CoursesResponse> {
  return await request<CoursesResponse>('/api/courses/');
}

export async function generateCurriculum(topic: string, score: number = 0): Promise<CurriculumPlanResponse> {
  return await request<CurriculumPlanResponse>('/api/curriculum/', {
    method: 'POST',
    body: JSON.stringify({ topic, score }),
  });
}

export async function getLearningLoopStatus(): Promise<LearningLoopStepResponse> {
  return await request<LearningLoopStepResponse>('/api/loop/');
}

export async function stepLearningLoop(action: string, input?: string, topic?: string, skillLevel?: number): Promise<LearningLoopStepResponse> {
  return await request<LearningLoopStepResponse>('/api/loop/', {
    method: 'POST',
    body: JSON.stringify({ action, input, topic, skill_level: skillLevel }),
  });
}
