import React from 'react';
import { Box } from 'lucide-react';

interface State {
  hasError: boolean;
}

interface Props {
  title?: string;
  heightClass?: string;
  children: React.ReactNode;
}

export class SceneErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[SafetyLink 3D] Fallback activated:', error?.message || error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={`w-full ${this.props.heightClass || 'h-[420px]'} rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center`}
        >
          <Box className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            {this.props.title || '3D Tactical Viewport'} Unavailable
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            WebGL hardware acceleration is unavailable on this browser. All 2D maps and emergency dispatch systems remain fully operational.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
