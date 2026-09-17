import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#090d16] text-white min-h-[300px]">
          <Card className="max-w-md w-full p-6 text-center space-y-4 border-amber-500/30 bg-slate-900/90 shadow-xl shadow-amber-950/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={this.handleReset}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Try Again
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={this.handleReload}
                icon={<Home className="w-3.5 h-3.5" />}
              >
                Reload App
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error?.stack && (
              <details className="text-left mt-4 text-[10px] text-slate-500 bg-slate-950/80 p-2 rounded-lg border border-slate-800 overflow-x-auto max-h-32">
                <summary className="cursor-pointer font-mono text-slate-400">Error Details</summary>
                <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
