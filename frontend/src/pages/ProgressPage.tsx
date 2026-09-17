import React, { useEffect } from 'react';
import { TrendingUp, Award, Flame, CheckCircle, AlertTriangle, BookOpen, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

interface ProgressPageProps {
  onNavigateToLearn: () => void;
  onNavigateToQuiz: (topic?: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigateToLearn, onNavigateToQuiz }) => {
  const { profile, activeCourse, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const skillLevel = profile?.skill_level ?? 1;
  const streak = profile?.learning_streak ?? 3;
  const currentTopic = profile?.current_topic || activeCourse;
  const masteredTopics = profile?.mastered_topics || [];
  const weakTopics = profile?.weak_topics || [];

  // 1-5 scale mapped to percentage
  const levelProgress = Math.min(100, Math.round((skillLevel / 5) * 100));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-Time Mastery Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          Student Progress Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Synchronized directly with your SAGE student model and evaluator agent assessments.
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card glow="accent" className="space-y-3 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Proficiency Level</span>
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">Level {skillLevel}</div>
          <ProgressBar value={levelProgress} label="Advancement to Level 5" color="accent" />
        </Card>

        <Card glow="none" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Streak</span>
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{streak} Days</div>
          <p className="text-xs text-slate-400">Keep daily momentum to accelerate adaptive recommendations.</p>
        </Card>

        <Card glow="none" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Mastery State</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono uppercase">
            {profile?.state || 'EXPLORING'}
          </div>
          <p className="text-xs text-slate-400">Current active course: {activeCourse}</p>
        </Card>
      </div>

      {/* Remediation & Mastered Concepts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Concepts Card */}
        <Card className="space-y-4 border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-white">Targeted Remediation Areas</h2>
            </div>
            <Badge variant="error" size="sm">{weakTopics.length} Concepts</Badge>
          </div>

          {weakTopics.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs">No conceptual weaknesses detected in your active track!</p>
              <p className="text-[11px] text-slate-500">Take a new milestone quiz to continue testing your depth.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                SAGE has identified these topics as needing reinforcement based on your quiz answers:
              </p>
              <div className="space-y-2">
                {weakTopics.map((topic, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-medium">{topic}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onNavigateToLearn}
                      className="text-xs text-rose-300 hover:text-white"
                      icon={<BookOpen className="w-3.5 h-3.5" />}
                    >
                      Study Topic
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Mastered Concepts Card */}
        <Card className="space-y-4 border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Verified Mastered Milestones</h2>
            </div>
            <Badge variant="success" size="sm">{masteredTopics.length} Passed</Badge>
          </div>

          {masteredTopics.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs">Your learning journey is just beginning!</p>
              <p className="text-[11px] text-slate-500">
                Complete your first milestone quiz to add verified mastered modules to your profile.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigateToQuiz(currentTopic)}
                className="mt-2"
              >
                Take First Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {masteredTopics.map((topic, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200 font-medium">{topic}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">VERIFIED</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
