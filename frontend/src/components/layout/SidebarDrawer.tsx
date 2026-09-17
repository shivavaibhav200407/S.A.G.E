import React from 'react';
import { Home, MessageSquare, BookOpen, CheckCircle, FileText, TrendingUp, X } from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
}) => {
  // Navigation items strictly limited to the user-approved list:
  // Home, Chat, Learn, Quiz, Documents, Progress (NO Profile, NO Settings)
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'quiz', label: 'Quiz', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:top-0 lg:h-[calc(100vh-4rem)] ${
          isOpen ? 'lg:translate-x-0 lg:w-64' : 'lg:-translate-x-full lg:w-0 lg:p-0 lg:border-none'
        } overflow-hidden`}
      >
        <div className="flex flex-col gap-1 w-full">
          {/* Header row in drawer for mobile close */}
          <div className="flex items-center justify-between px-2 pb-4 mb-2 border-b border-slate-800/60 lg:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-left ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                <div
                  className={`transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 ml-auto shadow-glow-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* System Intelligence Footer Note */}
        <div className="pt-4 border-t border-slate-800/60 px-2">
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-medium text-slate-300">SAGE Engine Online</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Adaptive tutoring active
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
