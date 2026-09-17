import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { Header } from './components/layout/Header';
import { SidebarDrawer } from './components/layout/SidebarDrawer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { LearnPage } from './pages/LearnPage';
import { QuizPage } from './pages/QuizPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ProgressPage } from './pages/ProgressPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const [quizInitialTopic, setQuizInitialTopic] = useState<string | undefined>(undefined);
  const [quizInitialType, setQuizInitialType] = useState<'diagnostic' | 'mastery'>('diagnostic');
  const [quizDocName, setQuizDocName] = useState<string | undefined>(undefined);

  const handleNavigate = (
    page: string,
    promptOrTopic?: string,
    extraType?: 'diagnostic' | 'mastery',
    docName?: string
  ) => {
    setCurrentPage(page);
    if (page === 'chat') {
      setChatInitialPrompt(promptOrTopic);
    } else if (page === 'quiz') {
      setQuizInitialTopic(promptOrTopic);
      setQuizInitialType(extraType || 'diagnostic');
      setQuizDocName(docName);
    }
  };

  // If initial auth check is running
  if (loading) {
    return null; // Handled by LoadingScreen overlay
  }

  // Not logged in: Show either Landing Page or Auth Page
  if (!isAuthenticated) {
    if (authMode) {
      return (
        <AuthPage
          initialMode={authMode}
          onBackToLanding={() => setAuthMode(null)}
        />
      );
    }
    return (
      <LandingPage
        onStart={() => setAuthMode('register')}
        onSignIn={() => setAuthMode('login')}
      />
    );
  }

  // Authenticated workspace
  return (
    <div className="h-screen w-screen flex flex-col bg-[#090d16] text-white overflow-hidden select-none">
      {/* Top Header with Hamburger Button */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={handleNavigate}
      />

      {/* Main Workspace Layout (Sidebar + Page) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible/Drawer Sidebar */}
        <SidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        {/* Page Content Container with ErrorBoundary Protection */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#090d16] overflow-hidden">
          <ErrorBoundary fallbackTitle="Application View Error">
            {currentPage === 'dashboard' && (
              <DashboardPage onNavigate={handleNavigate} />
            )}

            {currentPage === 'chat' && (
              <ChatPage
                initialPrompt={chatInitialPrompt}
                onNavigateToDocuments={() => handleNavigate('documents')}
              />
            )}

            {currentPage === 'learn' && (
              <LearnPage
                onNavigateToQuiz={(t, qType) => handleNavigate('quiz', t, qType)}
                onNavigateToChat={(p) => handleNavigate('chat', p)}
              />
            )}

            {currentPage === 'quiz' && (
              <QuizPage
                initialTopic={quizInitialTopic}
                initialQuizType={quizInitialType}
                initialDocName={quizDocName}
                onNavigateToLearn={() => handleNavigate('learn')}
                onNavigateToChat={(p) => handleNavigate('chat', p)}
              />
            )}

            {currentPage === 'documents' && (
              <DocumentsPage
                onNavigateToChat={(p) => handleNavigate('chat', p)}
                onNavigateToQuiz={(t, qType, dName) => handleNavigate('quiz', t, qType, dName)}
              />
            )}

            {currentPage === 'progress' && (
              <ProgressPage
                onNavigateToLearn={() => handleNavigate('learn')}
                onNavigateToQuiz={(t) => handleNavigate('quiz', t)}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [showStartupLoading, setShowStartupLoading] = useState(true);

  return (
    <ToastProvider>
      <AuthProvider>
        {showStartupLoading && (
          <LoadingScreen onComplete={() => setShowStartupLoading(false)} />
        )}
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
