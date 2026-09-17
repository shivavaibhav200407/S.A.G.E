import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  Award,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as learningService from '../services/learning';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SubjectAnimation } from '../components/animations/SubjectAnimation';

interface LearnPageProps {
  onNavigateToQuiz: (topic?: string, quizType?: 'diagnostic' | 'mastery') => void;
  onNavigateToChat: (prompt?: string) => void;
}

/**
 * Safely extracts an array of topic title strings from any response shape:
 * - Direct array of string titles or topic objects
 * - Object with available_topics or topics array
 * - SAGE backend structure: tracks dictionary where each track is an object mapping topic_key -> { title, order, ... }
 * - Always returns a guaranteed string[] so .map() can never throw a TypeError
 */
function extractTopicsList(
  data: learningService.CoursesResponse | any,
  activeCourseName?: string,
  currentTarget?: string
): string[] {
  if (!data) return [];

  // 1. If data itself is an array
  if (Array.isArray(data)) {
    return data
      .map((item) => (typeof item === 'string' ? item : item?.title || item?.name || ''))
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
  }

  // 2. If data has direct 'available_topics' or 'topics' array
  if (Array.isArray(data.available_topics)) {
    return data.available_topics
      .map((item: any) => (typeof item === 'string' ? item : item?.title || item?.name || ''))
      .filter((t: string) => typeof t === 'string' && t.trim().length > 0);
  }
  if (Array.isArray(data.topics)) {
    return data.topics
      .map((item: any) => (typeof item === 'string' ? item : item?.title || item?.name || ''))
      .filter((t: string) => typeof t === 'string' && t.trim().length > 0);
  }

  // 3. If data has 'tracks' dictionary (standard SAGE backend structure)
  if (data.tracks && typeof data.tracks === 'object' && !Array.isArray(data.tracks)) {
    const searchTerms = [
      activeCourseName?.toLowerCase(),
      currentTarget?.toLowerCase(),
    ].filter(Boolean) as string[];

    let matchedTrackData: any = null;

    // A. Match track via courses metadata (supports both object dict and array of courses)
    if (data.courses) {
      const courseEntries: Array<[string, any]> = Array.isArray(data.courses)
        ? (data.courses as any[]).map((c, idx) => [c?.id || c?.key || c?.slug || c?.track || String(idx), c])
        : Object.entries(data.courses);

      for (const [cKey, cMeta] of courseEntries) {
        const cName = (cMeta?.name || cMeta?.title || '').toLowerCase();
        for (const term of searchTerms) {
          if (term && (cName.includes(term) || term.includes(cName) || cKey.toLowerCase() === term)) {
            if (data.tracks && data.tracks[cKey]) {
              matchedTrackData = data.tracks[cKey];
              break;
            }
          }
        }
        if (matchedTrackData) break;
      }
    }

    // B. Match track key directly
    if (!matchedTrackData) {
      for (const tKey of Object.keys(data.tracks)) {
        const tKeyLower = tKey.toLowerCase();
        for (const term of searchTerms) {
          if (term && (term.includes(tKeyLower) || tKeyLower.includes(term))) {
            matchedTrackData = data.tracks[tKey];
            break;
          }
        }
        if (matchedTrackData) break;
      }
    }

    // C. Fallback: Check for common tracks
    if (!matchedTrackData) {
      const preferred = ['dsa', 'java', 'python', 'rag_ai', 'javascript', 'cpp'];
      for (const pref of preferred) {
        if (data.tracks[pref]) {
          matchedTrackData = data.tracks[pref];
          break;
        }
      }
    }

    // D. Fallback: First track in tracks dictionary
    if (!matchedTrackData && Object.values(data.tracks).length > 0) {
      matchedTrackData = Object.values(data.tracks)[0];
    }

    if (matchedTrackData) {
      // If the matched track is an array
      if (Array.isArray(matchedTrackData)) {
        return matchedTrackData
          .map((item: any) => (typeof item === 'string' ? item : item?.title || item?.name || ''))
          .filter((t: string) => typeof t === 'string' && t.trim().length > 0);
      }
      // If the matched track is a dictionary of topic nodes (e.g. { java_basics: { title: '...', order: 1 } })
      if (typeof matchedTrackData === 'object') {
        const entries = Object.entries(matchedTrackData) as [string, any][];
        entries.sort((a, b) => {
          const orderA = typeof a[1]?.order === 'number' ? a[1].order : 999;
          const orderB = typeof b[1]?.order === 'number' ? b[1].order : 999;
          return orderA - orderB;
        });
        const extracted = entries
          .map(([key, val]) => {
            if (typeof val === 'string') return val;
            return val?.title || val?.name || key;
          })
          .filter((t: string) => typeof t === 'string' && t.trim().length > 0);

        if (extracted.length > 0) {
          return extracted;
        }
      }
    }
  }

  // 4. If data has 'courses' dictionary with 'topics'
  if (data.courses) {
    const courseList = Array.isArray(data.courses) ? data.courses : Object.values(data.courses);
    for (const cMeta of courseList as any[]) {
      if (Array.isArray(cMeta?.topics)) {
        return cMeta.topics
          .map((item: any) => (typeof item === 'string' ? item : item?.title || item?.name || ''))
          .filter((t: string) => typeof t === 'string' && t.trim().length > 0);
      }
    }
  }

  return [];
}

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigateToQuiz, onNavigateToChat }) => {
  const { profile, activeCourse } = useAuth();
  const { showToast } = useToast();

  const [coursesData, setCoursesData] = useState<learningService.CoursesResponse | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [lessonContent, setLessonContent] = useState<string>('');
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Safely extract topics list - guaranteed to always be an array
  const availableTopics = React.useMemo(() => {
    return extractTopicsList(coursesData, activeCourse, profile?.current_topic || profile?.target_topic);
  }, [coursesData, activeCourse, profile]);

  // Load available courses and topics from backend with clean handling for all HTTP statuses
  const loadCourses = React.useCallback(async () => {
    setLoadError(null);
    try {
      const data = await learningService.fetchCourses();

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response structure received from /api/courses/');
      }

      // Check if course list is empty
      const hasCourses = data.courses && (Array.isArray(data.courses) ? data.courses.length > 0 : Object.keys(data.courses).length > 0);
      const hasTracks = data.tracks && (Array.isArray(data.tracks) ? data.tracks.length > 0 : Object.keys(data.tracks).length > 0);
      const hasDirectTopics = Array.isArray(data.available_topics) && data.available_topics.length > 0;

      if (!hasCourses && !hasTracks && !hasDirectTopics) {
        setLoadError('Course catalog is currently empty on the backend.');
        setCoursesData(data);
        return;
      }

      setCoursesData(data);
    } catch (err: any) {
      let msg = err.message || 'Failed to load courses from backend.';
      if (err.status === 401) {
        msg = 'Session expired or unauthorized. Please log in again to view courses.';
      } else if (err.status === 403) {
        msg = 'Access denied. You do not have permission to view course materials.';
      } else if (err.status === 404) {
        msg = 'Courses catalog API endpoint was not found (/api/courses/).';
      } else if (err.status >= 500) {
        msg = 'Backend server error (HTTP 500) occurred while fetching courses.';
      } else if (err.status === 0) {
        msg = 'Cannot connect to SAGE backend. Verify Django is running on port 8000.';
      }

      console.error('[LearnPage loadCourses error]:', { status: err.status, message: msg, error: err });
      setLoadError(msg);
      showToast(msg, 'error');
    }
  }, [showToast]);

  const hasLoadedCoursesRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedCoursesRef.current) {
      hasLoadedCoursesRef.current = true;
      loadCourses();
    }
  }, [loadCourses]);

  // Synchronize selected topic when availableTopics changes
  useEffect(() => {
    if (availableTopics.length > 0) {
      const currentTarget = profile?.current_topic || profile?.target_topic;
      if (currentTarget && availableTopics.includes(currentTarget)) {
        setSelectedTopic((prev) => (prev === currentTarget ? prev : currentTarget));
      } else if (!selectedTopic || !availableTopics.includes(selectedTopic)) {
        setSelectedTopic(availableTopics[0]);
      }
    }
  }, [availableTopics, profile, selectedTopic]);

  const skillLevel = profile?.skill_level ?? 1;

  // When selected topic changes, fetch dynamic curriculum & lesson from SAGE backend
  const handleGenerateLesson = React.useCallback(async (topicToLoad?: string) => {
    const topic = topicToLoad || selectedTopic;
    if (!topic) return;

    setGeneratingLesson(true);
    try {
      // Single optimized call to learning cycle step (returns lesson in markdown)
      const loopRes = await learningService.stepLearningLoop('teach', undefined, topic, profile?.skill_level || 1);
      if (loopRes.lesson) {
        setLessonContent(loopRes.lesson);
      } else {
        // Fallback to curriculum plan
        const planRes = await learningService.generateCurriculum(topic, profile?.skill_level || 1);
        if (planRes.plan?.summary) {
          setLessonContent(planRes.plan.summary);
        } else {
          setLessonContent(`### Lesson: ${topic}\n\nAdaptive lesson generated by SAGE curriculum agent for level ${profile?.skill_level || 1}.`);
        }
      }
      showToast(`Loaded lesson for ${topic}`, 'success');
    } catch (err: any) {
      const isTimeout = err.status === 504 || err.message?.includes('timed out');
      const msg = isTimeout 
        ? 'AI generation timed out. Please try again.' 
        : (err.message || 'Failed to load lesson from SAGE engine.');
      showToast(msg, 'error');
      setLessonContent(`### ${topic}\n\n⚠️ **${msg}**\n\nClick **Retry Lesson Generation** below to request again.`);
    } finally {
      setGeneratingLesson(false);
    }
  }, [selectedTopic, profile?.skill_level, showToast]);

  // Calculate track progress metrics
  const masteredCount = availableTopics.filter((t) => profile?.mastered_topics?.includes(t)).length;
  const masteryPercentage = availableTopics.length > 0 ? Math.round((masteredCount / availableTopics.length) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Header with Progress Ring & Dual Quiz Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          {/* Radial Progress Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-400 transition-all duration-700 ease-out"
                strokeDasharray={`${masteryPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-bold font-mono text-white">
              {masteryPercentage}%
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pedagogical Curriculum & Knowledge Graph</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              Adaptive Learning Path
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Track: <strong className="text-slate-200">{activeCourse}</strong> • Mastery: <strong className="text-emerald-400">{masteredCount}/{availableTopics.length} Modules</strong> • Student Tier: <strong className="text-indigo-400">Level {skillLevel}</strong>
            </p>
          </div>
        </div>

        {/* Dual Quiz Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNavigateToQuiz(selectedTopic, 'diagnostic')}
            icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
          >
            ⚡ Pre-Assessment
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigateToQuiz(selectedTopic, 'mastery')}
            icon={<Award className="w-4 h-4 text-emerald-300" />}
          >
            🏆 Take Mastery Quiz
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleGenerateLesson()}
            loading={generatingLesson}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Animated Roadmap, Right Simulation & Lesson */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Animated Knowledge Graph Roadmap */}
        <Card className="p-4 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white px-1 flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Knowledge Graph Roadmap
              </span>
              <Badge variant="accent" size="sm">{availableTopics.length} Milestones</Badge>
            </h2>

            {availableTopics.length === 0 ? (
              <div className="p-4 text-center space-y-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400">
                  {loadError || 'No curriculum modules currently loaded for this course.'}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => loadCourses()}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Loading
                </Button>
              </div>
            ) : (
              <div className="space-y-2 relative">
                {availableTopics.map((topic, idx) => {
                  const isCurrent = topic === selectedTopic;
                  const isMastered = profile?.mastered_topics?.includes(topic);
                  const isWeak = profile?.weak_topics?.includes(topic);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedTopic(topic);
                        handleGenerateLesson(topic);
                      }}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer space-y-2 group relative ${
                        isCurrent
                          ? 'bg-indigo-950/80 border-indigo-500/60 text-white font-medium shadow-lg shadow-indigo-600/15 ring-1 ring-indigo-500/40'
                          : isMastered
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200 hover:bg-emerald-950/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          {/* Order / Status Pill */}
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                              isMastered
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : isCurrent
                                ? 'bg-indigo-600 text-white animate-pulse'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isMastered ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>

                          <span className="truncate font-medium">{topic}</span>
                        </div>

                        {/* Status Tag */}
                        {isWeak ? (
                          <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/30 shrink-0">
                            Weak
                          </span>
                        ) : isMastered ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono shrink-0">
                            Mastered
                          </span>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                        )}
                      </div>

                      {/* Dual-Quiz Quick Action Launcher */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToQuiz(topic, 'diagnostic');
                          }}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                        >
                          <Zap className="w-2.5 h-2.5" /> Pre-Quiz
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToQuiz(topic, 'mastery');
                          }}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
                        >
                          <Award className="w-2.5 h-2.5" /> Mastery Quiz
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right: Subject Animation & Lesson Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Embedded Subject-Specific Animation Simulator */}
          <SubjectAnimation
            topic={selectedTopic}
            domain={coursesData?.courses?.[activeCourse]?.branch || activeCourse}
          />

          {/* Dynamic Pedagogical Lesson Card */}
          <Card className="p-6 space-y-6">
            {generatingLesson ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-sm font-medium">Generating adaptive pedagogical lesson...</span>
                <span className="text-xs text-slate-500">Aligning with Knowledge Graph & Bloom's Taxonomy</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                      Current Milestone Lesson
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                      {selectedTopic || 'Introduction'}
                    </h2>
                  </div>
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => onNavigateToChat(`Explain ${selectedTopic} in detail with practical examples`)}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Ask Tutor About This
                  </Button>
                </div>

                {/* Lesson Markdown Content with Safe DOM Nesting */}
                <div className="prose-sage text-sm leading-relaxed overflow-x-hidden">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre({ children }) {
                        return <>{children}</>;
                      },
                      p({ children, ...props }) {
                        return <div className="mb-3 leading-relaxed last:mb-0" {...props}>{children}</div>;
                      },
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !className && !String(children).includes('\n');
                        return !isInline ? (
                          <div className="relative my-2 rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
                            {match && (
                              <div className="px-3 py-1 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                                {match[1]}
                              </div>
                            )}
                            <pre className="p-3 text-xs overflow-x-auto text-slate-200 font-mono">
                              <code {...props}>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {lessonContent}
                  </ReactMarkdown>
                </div>

                {lessonContent.includes('⚠️') && (
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateLesson(selectedTopic)}
                      icon={<RefreshCw className="w-3.5 h-3.5 text-indigo-400" />}
                    >
                      Retry Lesson Generation
                    </Button>
                  </div>
                )}

                {/* Dual-Quiz Action Completion Gates */}
                <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Step 1: Pre-Assessment Card */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Step 1: Baseline Check
                      </span>
                      <h4 className="text-xs font-semibold text-white">Prerequisite Diagnostic</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Identify prior misconceptions and prerequisite weak areas before studying.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onNavigateToQuiz(selectedTopic, 'diagnostic')}
                      icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
                    >
                      Take Pre-Assessment
                    </Button>
                  </div>

                  {/* Step 2: Post-Lesson Mastery Card */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Step 2: Comprehension Check
                      </span>
                      <h4 className="text-xs font-semibold text-white">Mastery Verification</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Score ≥ 2/3 to verify mastery, unlock the next topic, and advance your skill level.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onNavigateToQuiz(selectedTopic, 'mastery')}
                      icon={<ArrowRight className="w-4 h-4 text-emerald-300" />}
                    >
                      Start Mastery Quiz
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

