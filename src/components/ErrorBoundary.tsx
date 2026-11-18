import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SafetyLink ErrorBoundary]', error, info);
    try {
      if (window && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, { extra: info });
      }
    } catch (e) {
      console.warn('Failed to send crash report to analytics hook.', e);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const rawMsg = this.state.error?.message || '';
      let parsedFs: { error?: string; operationType?: string; path?: string | null } | null = null;
      try {
        if (rawMsg.trim().startsWith('{')) {
          parsedFs = JSON.parse(rawMsg);
        }
      } catch {}

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-3 h-full">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-bold text-slate-200">
            {this.props.tabName ? `${this.props.tabName} failed to load` : 'Something went wrong'}
          </p>
          {parsedFs ? (
            <div className="max-w-md bg-slate-900 border border-red-500/30 rounded-xl p-3 text-left text-xs font-mono text-slate-300 space-y-1">
              <p className="text-red-400 font-bold">Database Security Context</p>
              <p>Operation: {parsedFs.operationType || 'unknown'}</p>
              {parsedFs.path && <p>Path: {parsedFs.path}</p>}
              <p className="text-slate-400 break-words">{parsedFs.error}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono">{rawMsg}</p>
          )}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
