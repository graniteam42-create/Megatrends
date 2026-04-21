"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional label shown in the error UI (e.g. "Analysis tab"). */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere inside `children` and shows a recoverable
 * panel instead of crashing the whole React tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="animate-fadeIn p-6 max-w-xl mx-auto mt-10">
        <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#ff1744]/40 rounded-xl p-6">
          <h2 className="text-[#ff1744] text-lg font-semibold mb-2">
            Something broke{this.props.label ? ` in ${this.props.label}` : ""}
          </h2>
          <p className="text-[#cbd5e1] text-sm mb-4">
            The rest of the app is still working. You can retry this panel, reload the page, or
            clear local data if the error persists.
          </p>
          <pre className="text-[11px] text-[#94a3b8] bg-black/40 border border-[#1e293b] rounded p-3 overflow-auto max-h-40 mb-4 whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={this.reset}
              className="px-3 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[12px] font-semibold font-mono"
            >
              Retry
            </button>
            <button
              onClick={() => (typeof window !== "undefined" ? window.location.reload() : null)}
              className="px-3 py-2 rounded-md border border-[#334155] text-[#cbd5e1] text-[12px] font-mono"
            >
              Reload page
            </button>
            <button
              onClick={() => {
                if (typeof window === "undefined") return;
                try {
                  window.localStorage.removeItem("tc_trends");
                  window.localStorage.removeItem("tc_scans");
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              className="px-3 py-2 rounded-md border border-[#ff174433] text-[#ff1744] text-[12px] font-mono"
            >
              Clear local data + reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
