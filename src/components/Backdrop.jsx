// Decorative operations-research / linear-algebra backdrop.
// Pure SVG, behind all content, pointer-events: none, masked to fade at edges.
// Real OR + GART math, a faint matrix, and a small TSP tour motif.

const EQUATIONS = [
  { x: 60, y: 120, s: 22, t: "minimize ∑ᵢ ∑ⱼ cᵢⱼ xᵢⱼ", cls: "dim" },
  { x: 720, y: 90, s: 26, t: "α = L_TSP / L_MST", cls: "blue" },
  { x: 880, y: 250, s: 18, t: "L_MST ≤ L_TSP ≤ 2·L_MST", cls: "dim" },
  { x: 90, y: 300, s: 18, t: "s.t. ∑ⱼ xᵢⱼ = 1  ∀ i ∈ V", cls: "dim" },
  { x: 520, y: 360, s: 16, t: "α ∈ [1, 2]", cls: "amber" },
  { x: 250, y: 470, s: 20, t: "â = GART(φ_MST)", cls: "blue" },
  { x: 800, y: 470, s: 16, t: "O(n log n)", cls: "dim" },
  { x: 70, y: 620, s: 17, t: "argminπ ∑ d(πᵢ, πᵢ₊₁)", cls: "dim" },
  { x: 560, y: 640, s: 16, t: "xᵢⱼ ∈ {0, 1}", cls: "dim" },
  { x: 930, y: 600, s: 18, t: "∇L(θ)", cls: "amber" },
  { x: 360, y: 760, s: 15, t: "MAPE 0.88%  ρ 0.9993", cls: "blue" },
];

// A faint 3x2 matrix bracket with sample values (the "matrix" motif).
function Matrix({ x, y }) {
  const rows = [
    ["1.21", "0.94", "n"],
    ["σ", "κ", "1.0"],
  ];
  const w = 150, h = 70;
  return (
    <g transform={`translate(${x} ${y})`} className="fd-bd-dim">
      <path d={`M8 0 H0 V${h} H8`} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d={`M${w - 8} 0 H${w} V${h} H${w - 8}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
      {rows.map((r, ri) =>
        r.map((c, ci) => (
          <text key={`${ri}-${ci}`} x={20 + ci * 46} y={26 + ri * 30} fontSize="15">{c}</text>
        ))
      )}
    </g>
  );
}

// Small TSP tour: nodes + a closed path, depot in amber.
function Tour() {
  const pts = [[1010, 110], [1090, 150], [1130, 230], [1060, 300], [970, 270], [1000, 190]];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + " Z";
  return (
    <g className="fd-bd-tour">
      <path d={d} fill="none" stroke="var(--blue)" strokeWidth="1.5" opacity="0.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 5 : 3}
          fill="var(--ink)" stroke={i === 0 ? "var(--amber)" : "var(--blue)"} strokeWidth="1.5" />
      ))}
    </g>
  );
}

export default function Backdrop() {
  return (
    <div className="fd-math-bg" aria-hidden="true">
      <svg viewBox="0 0 1200 820" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <g className="fd-bd-drift">
          {EQUATIONS.map((e, i) => (
            <text key={i} x={e.x} y={e.y} fontSize={e.s} className={`fd-bd-${e.cls}`}>{e.t}</text>
          ))}
          <Matrix x={620} y={500} />
          <Tour />
        </g>
      </svg>
    </div>
  );
}
