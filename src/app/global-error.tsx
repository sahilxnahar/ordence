"use client";

/**
 * Last-resort boundary — replaces the root layout when it crashes.
 * Must render its own <html>/<body>; styled inline because globals.css
 * may not have loaded.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#faf9f6",
          color: "#111827",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
          Ordence hit a critical error.
        </h1>
        <button
          onClick={reset}
          style={{
            borderRadius: "9999px",
            background: "#111827",
            color: "#faf9f6",
            padding: "0.75rem 1.75rem",
            fontSize: "0.95rem",
            cursor: "pointer",
            border: "none",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
