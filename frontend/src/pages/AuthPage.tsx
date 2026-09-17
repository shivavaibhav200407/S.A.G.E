import React, { useState } from 'react';
import { Sparkles, User, Lock, Mail, BookOpen, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onBackToLanding }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [targetTopic, setTargetTopic] = useState('Data Structures & Algorithms');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, demoLogin, register } = useAuth();
  const { showToast } = useToast();

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await demoLogin();
      showToast('Logged in as demo student!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
      showToast('Could not complete demo login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'login') {
        await login(username.trim(), password);
        showToast(`Welcome back, ${username}!`, 'success');
      } else {
        await register({
          username: username.trim(),
          password,
          email: email.trim() || undefined,
          target_topic: targetTopic,
        });
        showToast(`Account created! Welcome to SAGE, ${username}.`, 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Check credentials.');
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 filter blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header / Brand */}
      <div className="flex flex-col items-center mb-8 text-center">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="text-xs text-slate-400 hover:text-white mb-6 flex items-center gap-1 transition-colors"
          >
            ← Back to Home
          </button>
        )}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
          {mode === 'login' ? 'Sign In to SAGE' : 'Create Student Account'}
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          {mode === 'login'
            ? 'Access your personalized learning paths and conversational tutor.'
            : 'Start your adaptive engineering journey with tailored AI guidance.'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl shadow-black/60">
        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800/80">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            placeholder="e.g. vaibhav_eng"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
          />

          {mode === 'register' && (
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
          )}

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'register' && (
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Primary Course Target
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <BookOpen className="w-4 h-4" />
                </div>
                <select
                  value={targetTopic}
                  onChange={(e) => setTargetTopic(e.target.value)}
                  className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl border border-slate-700/80 pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Data Structures & Algorithms (DSA)">Data Structures & Algorithms (DSA)</option>
                  <option value="Operating Systems (OS)">Operating Systems (OS)</option>
                  <option value="Database Management Systems (DBMS)">Database Management Systems (DBMS)</option>
                  <option value="Computer Networks (CN)">Computer Networks (CN)</option>
                  <option value="Java Enterprise & Core Internals">Java Enterprise & Core Internals</option>
                  <option value="Python Mastery & Advanced Patterns">Python Mastery & Advanced Patterns</option>
                  <option value="Machine Learning (ML)">Machine Learning (ML)</option>
                  <option value="Deep Learning & Neural Networks">Deep Learning & Neural Networks</option>
                  <option value="RAG & Generative AI Systems">RAG & Generative AI Systems</option>
                  <option value="Digital Logic Design (DLD)">Digital Logic Design (DLD)</option>
                  <option value="Full-Stack Web Technologies">Full-Stack Web Technologies</option>
                  <option value="Theory of Computation & Compiler Design">Theory of Computation & Compiler Design</option>
                  <option value="Thermodynamics & Heat Transfer">Thermodynamics & Heat Transfer</option>
                  <option value="Strength of Materials (SOM)">Strength of Materials (SOM)</option>
                  <option value="Basic Electrical & Electronics (BEEE)">Basic Electrical & Electronics (BEEE)</option>
                  <option value="Engineering Mathematics (Calculus & Linear Algebra)">Engineering Mathematics</option>
                  <option value="Engineering Physics & Semiconductors">Engineering Physics</option>
                </select>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full mt-2 font-medium"
          >
            {mode === 'login' ? 'Sign In to Account' : 'Create Free Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500">or 1-click test</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* 1-Click Demo Login */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleDemoLogin}
          loading={loading}
          icon={<PlayCircle className="w-4 h-4 text-emerald-400" />}
          className="w-full border-slate-700/80 bg-slate-800/60 hover:bg-slate-800"
        >
          Instant Demo Student Login
        </Button>
      </div>
    </div>
  );
};
