import { ArrowLeft, ArrowRight, ExternalLink, FileText, Github } from "lucide-react";

// === Links (public under the GitHub user below) ===
// "Tour Length Estimation Guided Vehicle Routing" (RPI master's thesis) on ProQuest.
const THESIS_URL = "https://search.proquest.com/openview/d4a8aaeb70d19bb62af72359b5caf7f7/1?pq-origsite=gscholar&cbl=18750&diss=y";
const GITHUB_USER = "sfeldmanMIG25";
const REPO_1 = {
  name: "Tour-length estimators",
  url: "https://github.com/sfeldmanMIG25/Feldman-Investigating_Tour_Length_Estimators_to_Solve_Vehicle_Routing_Problem",
};
const REPO_2 = {
  name: "Area & distribution-free estimator",
  url: "https://github.com/sfeldmanMIG25/Area-and-Distribution-Free-Estimator-for-TSP",
};
// ==================================================

export default function Gart() {
  const repos = [REPO_1, REPO_2].filter((r) => r.url);
  const hasLinks = THESIS_URL || repos.length > 0;

  return (
    <article className="fd-page">
      <a className="fd-back" href="#/"><ArrowLeft size={14} /> Back to home</a>
      <div className="fd-kicker">Research</div>
      <h1>GART</h1>
      <p className="fd-page-sub"><strong>G</strong>eometrically <strong>A</strong>ssisted <strong>R</strong>egression <strong>T</strong>ree &mdash; a tour-length estimator for the TSP.</p>
      <p className="fd-page-lead">
        How long is the optimal route before you've solved for it? GART estimates
        the length of a near-optimal tour from the geometry of the stops alone &mdash;
        fast enough to guide a routing heuristic, without paying to solve the
        problem first.
      </p>

      <div className="fd-meta">
        <div><b>Field</b><span>Operations Research</span></div>
        <div><b>Model</b><span>LightGBM · predicts α</span></div>
        <div><b>Output</b><span>2 papers · thesis · 2 repos</span></div>
      </div>

      <h2>The idea</h2>
      <p>
        Vehicle-routing and TSP heuristics constantly ask "roughly how good would
        this set of stops be as a route?" Solving each candidate exactly is far too
        expensive. GART sidesteps it: a cheap <strong>minimum spanning tree</strong> is always
        within a bounded factor of the optimal tour, so GART learns that factor &mdash; the
        ratio <span className="fd-mono">α = L_TSP / L_MST ∈ [1, 2]</span> &mdash; with a gradient-boosted
        <strong> regression tree</strong> over the instance's geometry. Multiply it back by the MST
        length and you get a <strong>distribution-independent</strong> tour-length estimate in
        <span className="fd-mono"> O(n log n)</span>, no solver required.
      </p>

      <div className="fd-linkrow">
        <a className="fd-link-btn primary" href="#/gart-production">
          How GART works in production <ArrowRight size={14} />
        </a>
      </div>

      <h2>Why it matters</h2>
      <p>
        A good, cheap length estimate is leverage: it lets a solver prune, prioritize, and
        decompose far more aggressively. Because GART's features scale with dimension, it holds up
        where classical estimators break &mdash; high-dimensional and even non-Euclidean instances &mdash;
        reaching <strong>0.88% MAPE</strong> on multi-dimensional data and near-perfect ranking
        (Spearman ρ = 0.9993) for ordering candidate routes.
      </p>

      <h2>The papers</h2>
      <ul>
        <li><strong>GART 1.0</strong> &mdash; the original Geometrically Assisted Regression Tree: a 2D feature set with gradient-boosted regression on the MST-to-TSP ratio.</li>
        <li><strong>GART 2.0</strong> &mdash; a 30-feature LightGBM model that scales to high dimensions and uses <strong>multidimensional scaling</strong> for realistic, non-Euclidean TSP tour-length prediction.</li>
        <li><strong>Master's thesis</strong> &mdash; <em>Tour Length Estimation Guided Vehicle Routing</em> (Rensselaer Polytechnic Institute), applying the estimator inside a VRP heuristic.</li>
      </ul>

      {hasLinks ? (
        <div className="fd-linkrow">
          {THESIS_URL && (
            <a className="fd-link-btn primary" href={THESIS_URL} target="_blank" rel="noopener noreferrer">
              <FileText size={14} /> Read the thesis
            </a>
          )}
          {repos.map((r) => (
            <a className="fd-link-btn" key={r.url} href={r.url} target="_blank" rel="noopener noreferrer">
              <Github size={14} /> {r.name || "Repository"} <ExternalLink size={12} />
            </a>
          ))}
          {GITHUB_USER && (
            <a className="fd-link-btn" href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer">
              <Github size={14} /> All repos
            </a>
          )}
        </div>
      ) : (
        <p className="fd-note">
          Thesis and the two GitHub repo links go here &mdash; add your GitHub username,
          the thesis URL, and the two repo URLs at the top of this page's file.
        </p>
      )}
    </article>
  );
}
