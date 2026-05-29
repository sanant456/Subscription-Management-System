import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
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
    console.error('Uncaught error in boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050515] text-gray-300 flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Floating glowing background elements */}
          <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

          <div className="max-w-md w-full glass-panel border border-white/10 rounded-2xl p-6 shadow-2xl bg-[#0a0a20] relative z-10 text-center space-y-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                The application encountered an unexpected runtime error. Our diagnostics telemetry has logged this incident.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/40 border border-white/5 rounded-xl p-3.5 max-h-[140px] overflow-auto font-mono text-[10px] text-rose-300">
                <div className="font-bold text-white mb-1">Error Message:</div>
                <div className="break-all">{this.state.error.toString()}</div>
                {this.state.errorInfo && (
                  <div className="mt-2 text-gray-500 leading-normal whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                variant="primary" 
                className="flex-1 py-2.5 flex items-center justify-center gap-2"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4" /> Reload Portal
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 py-2.5 flex items-center justify-center gap-2"
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4" /> Go Landing
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
