import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, Copy, Check, Paperclip, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types';
import * as chatService from '../services/chat';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ChatPageProps {
  initialPrompt?: string;
  onNavigateToDocuments?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ initialPrompt, onNavigateToDocuments }) => {
  const { user, activeCourse } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const historyLoadedRef = useRef(false);

  // Load persistent chat history from Django API
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatService.fetchChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Default initial friendly greeting if no history yet
          setMessages([
            {
              id: 'init-1',
              role: 'assistant',
              content: `Hey ${user?.username || 'there'}! I'm SAGE, your autonomous adaptive learning companion for **${activeCourse}**.\n\nAsk me anything, say hi, or tell me what concept you want to master today!`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err: any) {
        console.error('Failed to load chat history:', err);
      } finally {
        setFetchingHistory(false);
      }
    };

    if (!historyLoadedRef.current) {
      historyLoadedRef.current = true;
      loadHistory();
    }
  }, [user?.username, activeCourse]);

  const handleSendMessage = React.useCallback(async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || loading) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const reply = await chatService.sendMessage(messageText, activeCourse);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const isTimeout = err.status === 504 || err.message?.includes('timed out');
      const errMsg = isTimeout ? 'AI generation timed out. Please try again.' : (err.message || 'Failed to get response from SAGE');
      showToast(errMsg, 'error');
      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **${errMsg}**`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, activeCourse, showToast]);

  // Handle initialPrompt if passed from Dashboard
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt, handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-adjust textarea height up to 160px
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const copyToClipboard = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestionChips = [
    'What should I learn today?',
    'Give me a 3-question quiz on recursion',
    'Explain time complexity with code examples',
    'Create a 3-day study plan',
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full bg-[#090d16] relative overflow-hidden">
      {/* Messages Scroll Area (Flex-1, independent scroll) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
        {fetchingHistory ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Loading persistent conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Start a conversation with SAGE</h2>
            <p className="text-xs text-slate-400 max-w-md mb-8 leading-relaxed">
              Ask a question, start a lesson, request a quiz, or ask about your uploaded course documents.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Bubble Container */}
                <div
                  className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl p-4 transition-all ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-br-sm'
                      : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 shadow-md rounded-bl-sm backdrop-blur-sm'
                  }`}
                >
                  {/* Sender title & copy button */}
                  <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/10 text-[11px] text-slate-400">
                    <span className="font-semibold text-xs text-indigo-300">
                      {isUser ? 'You' : 'SAGE Tutor'}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id || idx)}
                        className="opacity-60 hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white"
                        title="Copy message"
                      >
                        {copiedId === (msg.id || idx) ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Message Content Rendered with Markdown */}
                  <div className="prose-sage text-sm break-words overflow-hidden">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre({ children }) {
                          return <>{children}</>;
                        },
                        p({ children, ...props }) {
                          return <div className="mb-2 leading-relaxed last:mb-0" {...props}>{children}</div>;
                        },
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          const isInline = !className && !String(children).includes('\n');
                          return !isInline ? (
                            <div className="relative my-2 rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
                                <span>{match ? match[1] : 'code'}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(codeString, `code-${Math.random()}`)}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </button>
                              </div>
                              <pre className="p-3 text-xs overflow-x-auto text-slate-200 font-mono">
                                <code {...props}>{children}</code>
                              </pre>
                            </div>
                          ) : (
                            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300 text-xs font-bold uppercase">
                    {(user?.username || 'U').substring(0, 2)}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl rounded-bl-sm p-4 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>SAGE is preparing a response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Banner when few messages */}
      {!loading && messages.length > 0 && messages.length < 5 && (
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-2 overflow-x-auto flex gap-2 shrink-0 scrollbar-none">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Sticky Bottom Input Bar — ALWAYS VISIBLE, NEVER SCROLLS OFF */}
      <div className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl p-4 md:p-5 shrink-0 z-30">
        <div className="max-w-4xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-end gap-2 bg-slate-900/90 rounded-2xl border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 p-2 shadow-xl shadow-black/50"
          >
            {/* Attach PDF shortcut */}
            {onNavigateToDocuments && (
              <button
                type="button"
                onClick={onNavigateToDocuments}
                className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl transition-colors shrink-0"
                title="Upload or query PDF in Knowledge Vault"
                aria-label="Upload PDF"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            )}

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask SAGE anything... (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none py-2.5 px-2 max-h-40 overflow-y-auto leading-relaxed"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shrink-0 shadow-md shadow-indigo-600/30 focus:outline-none"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>Adaptive Topic: <strong className="text-slate-400 font-normal">{activeCourse}</strong></span>
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">Enter</kbd> to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
