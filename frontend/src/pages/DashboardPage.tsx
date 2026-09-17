import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  TrendingUp,
  Flame,
  Award,
  Lightbulb,
  Play,
  Shuffle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CourseSelectModal } from '../components/courses/CourseSelectModal';

interface DashboardPageProps {
  onNavigate: (page: string, initialPrompt?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile, activeCourse } = useAuth();
  const [quickQuery, setQuickQuery] = useState('');
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onNavigate('chat', quickQuery.trim());
    }
  };

  const currentTopic = profile?.current_topic || activeCourse || 'Introduction to Data Structures';
  const skillLevel = profile?.skill_level ?? 1;
  const streak = profile?.learning_streak ?? 3;
  const masteredCount = profile?.mastered_topics?.length ?? 0;
  const weakCount = profile?.weak_topics?.length ?? 0;

  // Real progress calculation based on level (1-5 scale)
  const progressPercent = Math.min(100, Math.round((skillLevel / 5) * 100));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Top AI Companion Greeting & Quick Prompt */}
      <section className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Learning Companion Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {getGreeting()}, {user?.username || 'Student'}.
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            What would you like to work on today?
          </p>
        </div>

        {/* Quick Ask Box */}
        <form onSubmit={handleQuickAsk} className="relative w-full max-w-3xl">
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Ask SAGE anything, request a lesson, or take a quiz..."
            className="w-full bg-slate-900/90 text-white placeholder-slate-500 text-sm rounded-2xl border border-slate-700/80 px-5 py-4 pr-28 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xl shadow-black/40"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Button type="submit" size="sm" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
              Ask
            </Button>
          </div>
        </form>
      </section>

      {/* Continue Learning Banner */}
      <Card glow="accent" className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                Continue Active Track
              </span>
              <button
                onClick={() => setCourseModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-medium text-indigo-300 hover:text-white hover:bg-indigo-900 transition-colors shadow-sm"
                title="Switch Engineering Course"
              >
                <Shuffle className="w-2.5 h-2.5 text-indigo-400" />
                <span>Switch Course</span>
              </button>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {currentTopic}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track: <strong className="text-slate-200">{activeCourse}</strong> • Next milestone: Advanced implementations & algorithmic complexities.
            </p>
            <div className="pt-2 w-full max-w-md">
              <ProgressBar value={progressPercent} label="Milestone Progress" color="accent" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="md"
              variant="primary"
              onClick={() => onNavigate('learn')}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Continue Lesson
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => onNavigate('quiz')}
              icon={<CheckCircle className="w-4 h-4 text-cyan-400" />}
            >
              Take Quiz
            </Button>
          </div>
        </div>
      </Card>

      {/* Real Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Proficiency Level</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">Level {skillLevel}</div>
          <p className="text-[11px] text-slate-500">Scale 1–5 based on quiz pass rates</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Mastered Modules</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{masteredCount}</div>
          <p className="text-[11px] text-slate-500">Verified by evaluator agent</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{streak} Days</div>
          <p className="text-[11px] text-slate-500">Continuous active study days</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Weak Concepts</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{weakCount}</div>
          <p className="text-[11px] text-slate-500">
            {weakCount > 0 ? 'Targeted for review' : 'No weak topics detected'}
          </p>
        </Card>
      </section>

      {/* Adaptive Recommendation & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation */}
        <Card className="lg:col-span-2 space-y-4 border-slate-800/80">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">
              Recommended Next Step
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {weakCount > 0
              ? `SAGE detected weak areas in: ${profile?.weak_topics.join(', ')}. Review these concepts before testing for promotion to Level ${skillLevel + 1}.`
              : `Your mastery in ${currentTopic} is strong! Complete the practice assessment to advance to higher proficiency milestones.`}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {weakCount > 0 ? (
              <Button
                size="sm"
                variant="accent"
                onClick={() => onNavigate('learn')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                Review Weak Concepts
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate('quiz')}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Take Milestone Quiz
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigate('chat', `Tell me how to master ${currentTopic}`)}
            >
              Ask AI Companion
            </Button>
          </div>
        </Card>

        {/* Quick Launch Panel */}
        <Card className="space-y-3 border-slate-800/80">
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('chat')}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Interactive AI Tutor</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigate('documents')}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Upload PDF Notes</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigate('progress')}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>View Full Progress</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => setCourseModalOpen(true)}
              className="w-full text-left p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex items-center justify-between text-xs text-indigo-200"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Switch / Browse 25+ Tracks</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>
        </Card>
      </div>

      {/* Course Select Modal */}
      <CourseSelectModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
      />
    </div>
  );
};
