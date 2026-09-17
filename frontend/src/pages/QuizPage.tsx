import React, { useState, useEffect, useRef } from 'react';
import { Award, AlertCircle, ArrowRight, ArrowLeft, RefreshCw, Sparkles, Check, CheckCircle, Loader2, Edit3 } from 'lucide-react';
import type { QuizQuestion, EvaluationResult } from '../types';
import * as quizService from '../services/quiz';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

interface QuizPageProps {
  initialTopic?: string;
  initialQuizType?: 'diagnostic' | 'mastery';
  initialDocName?: string;
  onNavigateToLearn: () => void;
  onNavigateToChat: (prompt?: string) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  initialTopic,
  initialQuizType = 'diagnostic',
  initialDocName,
  onNavigateToLearn,
  onNavigateToChat,
}) => {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [topic, setTopic] = useState<string>(initialTopic || profile?.target_topic || 'Java Basics & Primitive Types');
  const [quizType, setQuizType] = useState<'diagnostic' | 'mastery'>(initialQuizType);
  const [docName, setDocName] = useState<string | undefined>(initialDocName);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [metaInfo, setMetaInfo] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const lastLoadKeyRef = useRef<string>('');

  const loadQuiz = React.useCallback(async (targetTopic?: string, type?: 'diagnostic' | 'mastery', dName?: string) => {
    const target = targetTopic || topic;
    const activeType = type || quizType;
    const activeDoc = dName !== undefined ? dName : docName;

    setLoadingQuiz(true);
    setQuizError(null);
    setEvaluation(null);
    setSelectedAnswers({});
    setTextAnswers({});
    setCurrentIndex(0);

    try {
      const res = await quizService.generateQuiz(target, profile?.skill_level || 1, activeType, activeDoc);
      setMetaInfo(res.meta);
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
      } else {
        setQuestions([
          {
            id: 1,
            question: `What is the fundamental architectural principle of ${target}?`,
            options: ['Encapsulation & modularity', 'Global variable mutability', 'Unbounded recursion', 'Linear scan without caching'],
            concept: target,
          },
          {
            id: 2,
            question: `Which data representation yields optimal worst-case search complexity?`,
            options: ['Unsorted linked array', 'Self-balancing binary tree (O(log n))', 'Linear probe table without rehash', 'FIFO Queue'],
            concept: target,
          },
          {
            id: 3,
            question: `How are edge cases handled safely in ${target}?`,
            options: ['Ignoring boundary errors', 'Explicit validation & exception catching', 'Silent process termination', 'Random state allocation'],
            concept: target,
          },
        ]);
      }
      showToast(`Loaded ${activeType === 'mastery' ? 'mastery' : 'diagnostic'} assessment for ${target}`, 'info');
    } catch (err: any) {
      const isTimeout = err.status === 504 || err.message?.includes('timed out');
      const msg = isTimeout ? 'AI generation timed out. Please try again.' : (err.message || 'Failed to generate quiz from backend.');
      showToast(msg, 'error');
      setQuizError(msg);
    } finally {
      setLoadingQuiz(false);
    }
  }, [topic, quizType, docName, profile?.skill_level, showToast]);

  useEffect(() => {
    const target = initialTopic || profile?.target_topic || 'Java Basics & Primitive Types';
    const type = initialQuizType || 'diagnostic';
    const dName = initialDocName;
    const loadKey = `${target}_${type}_${dName || ''}`;

    if (lastLoadKeyRef.current !== loadKey) {
      lastLoadKeyRef.current = loadKey;
      setTopic(target);
      setQuizType(type);
      setDocName(dName);
      loadQuiz(target, type, dName);
    }
  }, [initialTopic, initialQuizType, initialDocName, profile?.target_topic, loadQuiz]);

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    setTextAnswers((prev) => ({
      ...prev,
      [currentIndex]: val,
    }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const answersPayload = questions
        .map((q, idx) => {
          let chosenText = '';
          if (textAnswers[idx] && textAnswers[idx].trim()) {
            chosenText = textAnswers[idx].trim();
          } else {
            const chosenIdx = selectedAnswers[idx] ?? -1;
            chosenText = chosenIdx >= 0 && q.options && q.options[chosenIdx]
              ? q.options[chosenIdx]
              : 'No answer selected';
          }
          return `Q${idx + 1} [${q.concept || topic}]: ${q.question}\nAnswer: ${chosenText}`;
        })
        .join('\n\n');

      const result = await quizService.evaluateQuiz(answersPayload, quizType, topic);
      setEvaluation(result);
      await refreshProfile();

      if (quizType === 'mastery') {
        if (result.passed) {
          showToast(`🏆 Mastery Verified! You scored ${result.score}/${result.total_questions} and advanced!`, 'success');
        } else {
          showToast(`Score: ${result.score}/${result.total_questions}. Review the lesson and animation before retrying.`, 'warning');
        }
      } else {
        showToast(`Baseline Diagnostic complete (${result.score}/${result.total_questions}). Ready for lesson!`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Evaluation submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = questions.filter((_, idx) => 
    (selectedAnswers[idx] !== undefined) || (textAnswers[idx] && textAnswers[idx].trim().length > 0)
  ).length;

  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const currentQ = questions[currentIndex];
  const hasOptions = currentQ?.options && currentQ.options.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Navigation & Type Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Two-Quiz Knowledge Verification Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {quizType === 'mastery' ? 'Module Mastery Verification' : 'Prerequisite Diagnostic Pre-Assessment'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Topic: <strong className="text-slate-200">{topic}</strong> • Level: <strong className="text-indigo-400">Level {profile?.skill_level || 1}</strong>
          </p>
        </div>

        {/* Dual-Quiz Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => {
                if (quizType !== 'diagnostic') {
                  setQuizType('diagnostic');
                  loadQuiz(topic, 'diagnostic', docName);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                quizType === 'diagnostic'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Pre-Quiz
            </button>
            <button
              onClick={() => {
                if (quizType !== 'mastery') {
                  setQuizType('mastery');
                  loadQuiz(topic, 'mastery', undefined);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                quizType === 'mastery'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏆 Mastery
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadQuiz()}
            loading={loadingQuiz}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* PDF Grounding Notification Banner if docName is present */}
      {docName && (
        <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-center justify-between gap-3 text-xs text-cyan-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📄</span>
            <div>
              <span className="font-bold text-white">Document-Grounded Assessment:</span>
              <span className="font-mono text-cyan-300 ml-1.5">"{docName}"</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Aligned with {metaInfo?.domain_title || 'Knowledge Graph'} track: {metaInfo?.aligned_topics?.slice(0, 3).join(', ') || 'semantic vector chunks in ChromaDB'}.
              </span>
            </div>
          </div>
          <Badge variant="cyan" size="sm">RAG Grounded</Badge>
        </div>
      )}

      {loadingQuiz ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-sm font-medium">Generating concept-grounded assessment questions...</span>
          <span className="text-xs text-slate-500">Querying SAGE Groq LLM Diagnostic Engine</span>
        </div>
      ) : quizError && questions.length === 0 ? (
        <Card className="p-8 text-center space-y-4 max-w-md mx-auto border-rose-500/30">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-rose-950/80 border border-rose-500/40 text-rose-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-mono">Assessment Unavailable</h2>
          <p className="text-sm text-slate-400">{quizError}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              size="md"
              variant="primary"
              onClick={() => loadQuiz()}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Retry Assessment
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={onNavigateToLearn}
            >
              Back to Learn
            </Button>
          </div>
        </Card>
      ) : evaluation ? (
        /* Evaluation Results Card — STRICTLY REAL BACKEND SCORING */
        <Card glow={evaluation.passed ? 'accent' : 'none'} className="p-6 md:p-8 space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                evaluation.passed
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-500/20'
                  : quizType === 'diagnostic'
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-500/20'
                  : 'bg-amber-950/80 border border-amber-500/40 text-amber-400 shadow-xl shadow-amber-500/20'
              }`}
            >
              {evaluation.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
              {quizType === 'diagnostic'
                ? 'Pre-Assessment Diagnostic Complete'
                : evaluation.passed
                ? 'Module Mastery Verified!'
                : 'Mastery Review Recommended'}
            </h2>
            <p className="text-xs text-slate-400">
              {quizType === 'diagnostic'
                ? 'Your baseline prerequisite knowledge has been analyzed. SAGE has calibrated the upcoming lesson and flagged priority areas.'
                : evaluation.passed
                ? `Outstanding! You verified mastery for "${topic}". Your student profile has advanced to Level ${evaluation.skill_level}!`
                : 'You scored below the passing threshold (2/3). Study the pedagogical lesson and interactive visual simulation before retrying.'}
            </p>

            {evaluation.next_topic && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  <span>Next Unlocked Module:</span>
                  <strong>{evaluation.next_topic}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-slate-800">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Raw Score</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {evaluation.score} / {evaluation.total_questions}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Mode</span>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-2">
                {quizType === 'diagnostic' ? 'PRE-ASSESS' : 'MASTERY'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Current Level</span>
              <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
                Level {evaluation.skill_level}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Status</span>
              <div className="text-sm font-bold font-mono mt-2">
                {quizType === 'diagnostic' ? (
                  <span className="text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
                    DIAGNOSED
                  </span>
                ) : evaluation.passed ? (
                  <span className="text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    MASTERED
                  </span>
                ) : (
                  <span className="text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30">
                    REMEDIATING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tutor Feedback */}
          {evaluation.feedback && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <h3 className="text-xs font-semibold uppercase text-indigo-300">
                SAGE Pedagogical Feedback
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{evaluation.feedback}</p>
            </div>
          )}

          {/* Detected Weaknesses */}
          {evaluation.weak_topics && evaluation.weak_topics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Detected Weak Concepts Requiring Remediation:</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {evaluation.weak_topics.map((wt, i) => (
                  <Badge key={i} variant="error" size="sm">
                    {wt}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="md"
              variant="primary"
              onClick={onNavigateToLearn}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Continue Learning Path
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => onNavigateToChat(`Explain the concepts I missed in the quiz on ${topic}`)}
              icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
            >
              Review with SAGE Tutor
            </Button>
            <Button
              size="md"
              variant="ghost"
              onClick={() => loadQuiz()}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Retake Assessment
            </Button>
          </div>
        </Card>
      ) : (
        /* Interactive Question Renderer */
        <Card className="p-6 md:p-8 space-y-6">
          {/* Progress Bar & Question Counter */}
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>{answeredCount} Answered</span>
            </div>
            <ProgressBar value={progress} color="accent" size="sm" showPercent={false} />
          </div>

          {/* Question Text & Concept Tag */}
          <div className="py-2 space-y-2">
            {currentQ?.concept && (
              <Badge variant="cyan" size="sm" className="font-mono">
                Concept: {currentQ.concept}
              </Badge>
            )}
            <h2 className="text-lg md:text-xl font-semibold text-white leading-relaxed">
              {currentQ?.question}
            </h2>
          </div>

          {/* Multiple Choice Options if available */}
          {hasOptions ? (
            <div className="space-y-3">
              {currentQ?.options?.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-150 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-md shadow-indigo-600/15'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Open-Ended Conceptual Answer Input */
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Write your conceptual explanation below:</span>
              </label>
              <textarea
                rows={4}
                value={textAnswers[currentIndex] || ''}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                placeholder="Type your explanation here. The SAGE Evaluator Agent will assess your reasoning..."
                className="w-full bg-slate-900/90 text-white placeholder-slate-500 text-sm rounded-xl border border-slate-700/80 p-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
              />
            </div>
          )}

          {/* Navigation & Submit Row */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="md"
                  variant="accent"
                  onClick={handleSubmitQuiz}
                  loading={submitting}
                  disabled={answeredCount === 0}
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Submit Assessment
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
