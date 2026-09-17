import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [fade, setFade] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#090d16] transition-opacity duration-500 select-none ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center px-4 max-w-md">
        {/* Glowing SAGE Brand Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-pulse">
            <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-indigo-500/20 filter blur-xl -z-10 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-mono">
          SAGE
        </h1>
        <p className="text-sm font-medium text-slate-400 tracking-wide uppercase">
          Self-Adaptive Learning & Guidance Engine
        </p>

        {/* Minimal pulse loader */}
        <div className="mt-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-slate-500 font-mono mt-3">Initializing AI engine...</span>
      </div>
    </div>
  );
};
