/**
 * The craft section's focal object.
 *
 * It used to be the logo, sitting inside three concentric rings — which
 * says nothing except "here is our logo again", on a page whose heading
 * is *engineered like infrastructure*. A brand mark is not evidence of
 * engineering.
 *
 * This is the actual request path, drawn to scale and labelled: one
 * hostname arrives at the edge, the router classifies it, and it becomes
 * exactly one surface. It is the most technically distinctive thing about
 * the platform and the diagram is legible in about two seconds — which is
 * the whole job of a focal image.
 *
 * Pure inline SVG: no image request, crisp at any density, and it inherits
 * the theme's colours so it is correct in both light and dark.
 */
export function CraftDiagram() {
  return (
    <svg
      viewBox="0 0 440 380"
      role="img"
      aria-label="A request arrives at the edge, is classified by hostname, and is served as exactly one surface"
      className="w-full max-w-lg"
    >
      <defs>
        <linearGradient id="craft-flow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.15" />
          <stop offset="55%" stopColor="var(--gold)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="craft-core" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* measurement grid — the "engineered" texture */}
      <g stroke="currentColor" strokeOpacity="0.07" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={20 + i * 42} x2="440" y2={20 + i * 42} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={i * 44} y1="0" x2={i * 44} y2="380" />
        ))}
      </g>

      {/* incoming hostname */}
      <text
        x="8"
        y="60"
        className="fill-current font-mono"
        fontSize="11"
        opacity="0.55"
      >
        ameyaheights.ordence.com
      </text>
      <path
        d="M8 74 H150"
        stroke="url(#craft-flow)"
        strokeWidth="2"
        fill="none"
      />

      {/* the edge router */}
      <circle cx="220" cy="190" r="96" fill="url(#craft-core)" />
      <circle
        cx="220"
        cy="190"
        r="52"
        fill="none"
        stroke="var(--gold)"
        strokeOpacity="0.55"
        strokeWidth="1.25"
      />
      <circle
        cx="220"
        cy="190"
        r="34"
        fill="none"
        stroke="var(--accent)"
        strokeOpacity="0.7"
        strokeWidth="1.25"
      />
      <circle cx="220" cy="190" r="5" fill="var(--gold)" />
      <text
        x="220"
        y="262"
        textAnchor="middle"
        className="fill-current font-mono"
        fontSize="10"
        letterSpacing="1.6"
        opacity="0.6"
      >
        EDGE ROUTER
      </text>
      <text
        x="220"
        y="278"
        textAnchor="middle"
        className="fill-current font-mono"
        fontSize="9"
        opacity="0.35"
      >
        ~1ms · no origin
      </text>

      {/* request path into the core */}
      <path
        d="M150 74 C 190 74, 200 130, 216 184"
        stroke="url(#craft-flow)"
        strokeWidth="2"
        fill="none"
      />

      {/* the four possible surfaces */}
      {[
        { y: 78, label: "marketing", live: false },
        { y: 138, label: "tenant workspace", live: true },
        { y: 198, label: "admin (gated)", live: false },
        { y: 258, label: "app → external CRM", live: false },
      ].map((s) => (
        <g key={s.label}>
          <path
            d={`M272 190 C 310 190, 320 ${s.y + 10}, 356 ${s.y + 10}`}
            stroke={s.live ? "var(--accent)" : "currentColor"}
            strokeOpacity={s.live ? 0.85 : 0.16}
            strokeWidth={s.live ? 2 : 1}
            strokeDasharray={s.live ? undefined : "3 4"}
            fill="none"
          />
          <circle
            cx="358"
            cy={s.y + 10}
            r={s.live ? 4 : 2.5}
            fill={s.live ? "var(--accent)" : "currentColor"}
            fillOpacity={s.live ? 1 : 0.28}
          />
          <text
            x="370"
            y={s.y + 14}
            className="fill-current font-mono"
            fontSize="10"
            opacity={s.live ? 0.85 : 0.32}
          >
            {s.label}
          </text>
        </g>
      ))}

      <text
        x="8"
        y="366"
        className="fill-current font-mono"
        fontSize="9"
        opacity="0.35"
      >
        one hostname · one lookup · exactly one surface
      </text>
    </svg>
  );
}
