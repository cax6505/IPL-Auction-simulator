"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuctionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Auction Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
          <div className="glass-card max-w-md w-full p-8 rounded-[24px] text-center border border-white/[0.08] shadow-2xl">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Something went wrong</h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              An unexpected error occurred in the auction room. This is usually temporary.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-zinc-500 bg-black/40 border border-white/[0.04] p-3 rounded-lg mb-6 text-left overflow-x-auto max-h-24 overflow-y-auto font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> Reload
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/10 transition-colors"
              >
                <Home className="h-4 w-4" /> Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
