import React from 'react';
import { Sparkles, Brain, Compass, BookOpen, FileCheck, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LandingPageProps {
  onStart: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onSignIn }) => {
  const features = [
    {
      icon: <Brain className="w-6 h-6 text-indigo-400" />,
      title: 'Adaptive Learning Path',
      desc: 'Dynamic curriculum derived from live knowledge graphs that automatically adapts to your personal strengths and weaknesses.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      title: 'Conversational AI Tutor',
      desc: 'Talk naturally with SAGE. Whether asking technical questions, greeting, or requesting study plans, SAGE responds with context.',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-emerald-400" />,
      title: 'Grounded Diagnostic Quizzes',
      desc: 'Generate concept-grounded assessments with deterministic evaluation and synchronized student model level advancement.',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-amber-400" />,
      title: 'Knowledge Vault RAG',
      desc: 'Upload engineering textbooks, lecture notes, or syllabus PDFs to create your own instant semantic search and Q&A engine.',
    },
    {
      icon: <Compass className="w-6 h-6 text-purple-400" />,
      title: 'Automated Remediation',
      desc: 'Pinpoints conceptual weak areas automatically and generates targeted review plans before advancing to higher levels.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-rose-400" />,
      title: 'Strictly Real Analytics',
      desc: 'No fake statistics or fabricated scores. Every metric is backed by actual backend grading and session history.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight font-mono">SAGE</span>
            <span className="text-[10px] text-indigo-400 tracking-widest font-medium">
              ENGINE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onSignIn}>
            Sign In
          </Button>
          <Button variant="primary" onClick={onStart}>
            Start Learning
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Glow effect in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 filter blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Self-Adaptive Learning & Guidance Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 font-mono">
          Learn smarter.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Adapt faster.
          </span><br />
          Grow continuously.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Your autonomous, adaptive AI learning and guidance companion. Personalized engineering curriculums, intelligent tutoring, document RAG, and verified mastery tracking.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Button
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full sm:w-auto text-base font-semibold px-8 shadow-xl shadow-indigo-600/30"
            icon={<ArrowRight className="w-4 h-4 ml-1" />}
          >
            Start Learning Now
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={onSignIn}
            className="w-full sm:w-auto text-base font-medium px-8"
          >
            Sign In to Account
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Mock Data
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real Groq LLM Intelligence
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 25+ B.Tech Engineering Tracks
          </span>
        </div>
      </header>

      {/* Feature Grid */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Engineered for Academic Mastery
          </h2>
          <p className="text-sm text-slate-400">
            SAGE goes far beyond basic chatbots by executing a closed 4-stage pedagogical loop: teach, quiz, evaluate, and adapt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 SAGE — Self-Adaptive Learning & Guidance Engine. All rights reserved.</p>
      </footer>
    </div>
  );
};
