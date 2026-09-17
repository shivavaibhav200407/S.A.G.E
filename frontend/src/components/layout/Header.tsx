import React, { useState } from 'react';
import { Menu, Sparkles, BookOpen, Flame, LogOut, ChevronDown, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const { user, profile, activeCourse, setActiveCourse, logout } = useAuth();
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  const availableCourses = [
    'Data Structures & Algorithms (CS201)',
    'Object Oriented Programming in Java (CS202)',
    'Database Management Systems (CS203)',
    'Operating Systems (CS301)',
    'Computer Networks (CS302)',
    'Machine Learning Foundations (AI301)',
    'Full Stack Web Development (CS304)',
    'Digital Electronics (EC201)',
    'Thermodynamics & Heat Transfer (ME201)',
  ];

  const handleSelectCourse = (course: string) => {
    setActiveCourse(course);
    setCourseModalOpen(false);
  };

  const streak = profile?.learning_streak ?? 3;
  const level = profile?.skill_level ?? 1;

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Left: 3-Dash Hamburger Menu + SAGE Brand */}
        <div className="flex items-center gap-3">
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
              <span className="text-[10px] text-indigo-400 tracking-wider font-medium">
                AI LEARNING
              </span>
            </div>
          </button>
        </div>

        {/* Center: Active Course Pill */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCourseModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm group"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="max-w-[200px] truncate">{activeCourse}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
          </button>
        </div>

        {/* Right: Learning Stats + User Info + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Level Pill */}
          <Badge variant="accent" size="sm" icon={<Award className="w-3 h-3 text-indigo-400" />}>
            Level {level}
          </Badge>

          {/* Streak Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{streak}d Streak</span>
          </div>

          {/* User Initials Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
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

      {/* Select Course Modal */}
      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title="Select Engineering Course Track"
      >
        <div className="space-y-2 py-2">
          <p className="text-xs text-slate-400 mb-3">
            Choose your active engineering topic. SAGE adapts all tutoring, quizzes, and curriculum modules to your selected domain.
          </p>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {availableCourses.map((c) => (
              <button
                key={c}
                onClick={() => handleSelectCourse(c)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                  activeCourse === c
                    ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200 font-medium'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span>{c}</span>
                {activeCourse === c && <Badge variant="accent" size="sm">Active</Badge>}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};
