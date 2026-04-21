"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#ff1744]/40 rounded-xl p-6">
        <h1 className="text-[#ff1744] text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-[#cbd5e1] text-sm mb-4">
          The page hit an unexpected error. Try again, or go back and retry.
        </p>
        {error.digest && (
          <p className="text-[#475569] text-[11px] font-mono mb-3">digest: {error.digest}</p>
        )}
        <pre className="text-[11px] text-[#94a3b8] bg-black/40 border border-[#1e293b] rounded p-3 overflow-auto max-h-40 mb-4 whitespace-pre-wrap">
          {error.message}
        </pre>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={reset}
            className="px-3 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[12px] font-semibold font-mono"
          >
            Try again
          </button>
          <button
            onClick={() => (typeof window !== "undefined" ? window.location.assign("/") : null)}
            className="px-3 py-2 rounded-md border border-[#334155] text-[#cbd5e1] text-[12px] font-mono"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
