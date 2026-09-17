import { request } from './api';
import type { StudentProfile } from '../types';

export async function fetchProfile(): Promise<StudentProfile> {
  const data = await request<any>('/api/profile/');
  return {
    username: data.username || localStorage.getItem('sage_username') || 'Student',
    email: data.email || '',
    skill_level: parseInt(data.skill_level, 10) || 1,
    current_topic: data.current_topic || data.target_topic || 'Introduction',
    target_topic: data.target_topic || 'Java Basics & Primitive Types',
    state: data.current_state || data.state || 'EXPLORING',
    weak_topics: Array.isArray(data.weak_topics) ? data.weak_topics : [],
    mastered_topics: Array.isArray(data.completed_modules) ? data.completed_modules : (Array.isArray(data.mastered_topics) ? data.mastered_topics : []),
    learning_streak: data.learning_streak ?? 3,
    total_sessions: data.total_sessions ?? 1,
    created_at: data.created_at,
  };
}

export async function updateProfile(partial: Partial<StudentProfile>): Promise<StudentProfile> {
  const data = await request<any>('/api/profile/', {
    method: 'PUT',
    body: JSON.stringify(partial),
  });
  return {
    username: data.username || localStorage.getItem('sage_username') || 'Student',
    email: data.email || '',
    skill_level: parseInt(data.skill_level, 10) || 1,
    current_topic: data.current_topic || data.target_topic || 'Introduction',
    target_topic: data.target_topic || 'Java Basics & Primitive Types',
    state: data.current_state || data.state || 'EXPLORING',
    weak_topics: Array.isArray(data.weak_topics) ? data.weak_topics : [],
    mastered_topics: Array.isArray(data.completed_modules) ? data.completed_modules : [],
    learning_streak: data.learning_streak ?? 3,
    total_sessions: data.total_sessions ?? 1,
  };
}
