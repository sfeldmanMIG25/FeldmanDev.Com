import { ArrowLeft, ExternalLink, FileText, Github } from "lucide-react";

// === Links (public under the GitHub user below) ===
// "Tour Length Estimation Guided Vehicle Routing" (RPI master's thesis) on ProQuest.
const THESIS_URL = "https://www.proquest.com/openview/d4a8aaeb70d19bb62af72359b5caf7f7/1?pq-origsite=gscholar&cbl=18750&diss=y";
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
      <p className="fd-page-lead">
        How long is the optimal route before you've solved for it? GART estimates
        the length of a near-optimal tour from the geometry of the stops alone &mdash;
        fast enough to guide a routing heuristic, without paying to solve the
        problem first.
      </p>

      <div className="fd-meta">
        <div><b>Field</b><span>Operations Research</span></div>
        <div><b>Problem</b><span>TSP tour-length estimation</span></div>
        <div><b>Output</b><span>Thesis · 2 repos</span></div>
      </div>

      <h2>The idea</h2>
      <p>
        Vehicle-routing and TSP heuristics constantly ask "roughly how good would
        this set of stops be as a route?" Solving each candidate exactly is far too
        expensive. GART learns a <strong>distribution-independent estimator</strong> of
        tour length &mdash; one that holds up regardless of how the points are
        distributed &mdash; so a heuristic can rank options in microseconds instead of
        solving them.
      </p>

      <h2>Why it matters</h2>
      <p>
        A good, cheap length estimate is leverage: it lets a solver prune,
        prioritize, and decompose far more aggressively. The work extends classic
        distribution-independent estimators to higher dimensions and pins down where
        they hold and where they break.
      </p>

      <h2>The work</h2>
      <ul>
        <li><strong>Master's thesis</strong> &mdash; <em>Tour Length Estimation Guided Vehicle Routing</em> (Rensselaer Polytechnic Institute).</li>
        <li><strong>Two open-source repositories</strong> with the estimators and experiments, public on GitHub.</li>
        <li>Ongoing follow-up extending the estimators and benchmarking against strong exact solvers.</li>
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
