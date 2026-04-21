"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0c10",
          color: "#e0e4ec",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <h1 style={{ color: "#ff1744", marginBottom: 8 }}>Trend Compass failed to load</h1>
          <p style={{ color: "#cbd5e1", marginBottom: 16, fontSize: 14 }}>
            A fatal error occurred before the app could render. Try reloading.
          </p>
          {error.digest && (
            <p style={{ color: "#475569", fontSize: 12, fontFamily: "monospace", marginBottom: 12 }}>
              digest: {error.digest}
            </p>
          )}
          <pre
            style={{
              color: "#94a3b8",
              fontSize: 11,
              background: "rgba(0,0,0,0.4)",
              border: "1px solid #1e293b",
              borderRadius: 6,
              padding: 12,
              overflow: "auto",
              maxHeight: 160,
              whiteSpace: "pre-wrap",
              marginBottom: 16,
            }}
          >
            {error.message}
          </pre>
          <button
            onClick={reset}
            style={{
              background: "#00e5ff",
              color: "#0a0c10",
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
