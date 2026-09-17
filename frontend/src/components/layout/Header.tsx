import React, { useState } from 'react';
import { Menu, Sparkles, BookOpen, Flame, LogOut, ChevronDown, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { CourseSelectModal } from '../courses/CourseSelectModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const { user, profile, activeCourse, logout } = useAuth();
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  const streak = profile?.learning_streak ?? 3;
  const level = profile?.skill_level ?? 1;

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between">
        {/* Left: 3-Dash Hamburger Menu + SAGE Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle Navigation Menu"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5 text-slate-200" />
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white font-mono leading-none">
                SAGE
              </span>
              <span className="text-[10px] text-indigo-400 tracking-wider font-medium hidden sm:inline">
                AI LEARNING
              </span>
            </div>
          </button>
        </div>

        {/* Center: Active Course Pill (Desktop full, Mobile compact) */}
        <div className="flex items-center">
          <button
            onClick={() => setCourseModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm group"
            title="Click to Switch Engineering Track"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="max-w-[120px] sm:max-w-[220px] truncate">{activeCourse}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
          </button>
        </div>

        {/* Right: Learning Stats + User Info + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Level Pill */}
          <Badge variant="accent" size="sm" icon={<Award className="w-3 h-3 text-indigo-400" />}>
            <span className="hidden sm:inline">Level </span>{level}
          </Badge>

          {/* Streak Badge */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{streak}d</span>
          </div>

          {/* User Initials Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
            <div
              className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono uppercase"
              title={user?.username || 'Student'}
            >
              {(user?.username || 'S').substring(0, 2)}
            </div>

            {/* Logout Action */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Select Course Modal (All 29 B.Tech courses with branch tabs & search) */}
      <CourseSelectModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
      />
    </>
  );
};
