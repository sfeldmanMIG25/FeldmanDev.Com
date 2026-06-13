import { ArrowLeft, ExternalLink, Github, FileText } from "lucide-react";

const THESIS_URL = "https://search.proquest.com/openview/d4a8aaeb70d19bb62af72359b5caf7f7/1?pq-origsite=gscholar&cbl=18750&diss=y";
const REPO_URL = "https://github.com/sfeldmanMIG25/Area-and-Distribution-Free-Estimator-for-TSP";

export default function GartProduction() {
  return (
    <article className="fd-page">
      <a className="fd-back" href="#/gart"><ArrowLeft size={14} /> Back to GART</a>
      <div className="fd-kicker">GART · In Production</div>
      <h1>Putting GART to work</h1>
      <p className="fd-page-lead">
        GART estimates the length of an optimal TSP tour <em>without solving the tour</em> &mdash;
        in roughly the time it takes to build a minimum spanning tree. This page is the practical
        version: what it gives you, how it works, and how to drop it into a routing pipeline.
      </p>

      <div className="fd-meta">
        <div><b>Model</b><span>LightGBM regressor</span></div>
        <div><b>Predicts</b><span>α = L_TSP / L_MST</span></div>
        <div><b>Cost</b><span>O(n log n)</span></div>
        <div><b>Accuracy</b><span>0.88% MAPE</span></div>
      </div>

      <h2>The one idea it rests on</h2>
      <p>
        Solving a TSP exactly is NP-hard. Building a <strong>minimum spanning tree</strong> (MST)
        over the same points is cheap &mdash; <code>O(n log n)</code>. The two are tied together by a
        single ratio:
      </p>
      <pre className="fd-code">{`α  =  L_TSP / L_MST       with   α ∈ [1, 2]

L_TSP  ≈  α̂ · L_MST`}</pre>
      <p>
        Every tour is a spanning structure, so the optimum can't be shorter than the MST (α ≥ 1); a
        classic doubling argument bounds it above by twice the MST (α ≤ 2). GART learns to
        <strong> predict α</strong> from cheap geometry, then multiplies it back by the MST length you
        already computed. You get a tour-length estimate without ever building a tour.
      </p>

      <h2>How it works</h2>
      <ol>
        <li><strong>Build the MST</strong> over the instance &mdash; this dominates the runtime and gives you L_MST for free.</li>
        <li><strong>Extract 30 features</strong>: geometric and centroid descriptors (spread, density) plus MST edge-distribution and topological statistics. The MST-dominance ratio alone carries ~26% of the model's predictive weight.</li>
        <li><strong>Predict α̂</strong> with a gradient-boosted LightGBM ensemble (leaf-wise growth), clamped to [1, 2].</li>
        <li><strong>Return L_TSP ≈ α̂ · L_MST.</strong> Inference is ~2,000 tree traversals &mdash; negligible next to the MST build.</li>
      </ol>

      <h2>What it's good for</h2>
      <p>
        Pointwise it's accurate &mdash; <strong>0.88% MAPE</strong> on multi-dimensional synthetic data,
        far ahead of fixed-formula estimators. But the bigger lever for routing is its
        <strong> ranking</strong> quality: Spearman ρ = 0.9993. That means GART orders candidate
        assignments almost exactly as an exact solver would, so a heuristic can:
      </p>
      <ul>
        <li><strong>Prune</strong> hopeless candidates before paying to solve them.</li>
        <li><strong>Rank and prioritize</strong> neighborhoods in a metaheuristic search.</li>
        <li><strong>Act as a surrogate objective</strong> &mdash; e.g. a 2-stage assignment-then-route VRP that scores partitions by estimated tour cost instead of solving a TSP per candidate.</li>
      </ul>

      <h2>Beyond the plane: non-Euclidean data</h2>
      <p>
        Most classical estimators assume low-dimensional Euclidean points. GART's features scale with
        dimension, so it doesn't. For genuinely non-Euclidean instances &mdash; distance matrices from
        genome overlap, scheduling, abstract metrics &mdash; <strong>GART 2.0</strong> applies
        <strong> multidimensional scaling (MDS)</strong> to embed them into a high-dimensional Euclidean
        space, then estimates there. It produces high-quality estimates on real TSPLIB95 instances up
        to ~18,500 nodes.
      </p>

      <h2>Two generations</h2>
      <ul>
        <li><strong>GART 1.0</strong> &mdash; the original Geometrically Assisted Regression Tree; a 2D-only feature set with GBDT regression on α.</li>
        <li><strong>GART 2.0</strong> &mdash; a 30-feature, dimension-scaling LightGBM model that adds MDS for non-Euclidean transfer and outperforms its predecessor across every benchmark.</li>
      </ul>

      <h2>Wiring it in</h2>
      <pre className="fd-code">{`# inside a VRP / TSP heuristic's inner loop
mst        = minimum_spanning_tree(points)      # O(n log n)
features   = extract_features(points, mst)      # 30 geometric + MST stats
alpha_hat  = gart.predict(features)             # LightGBM, clamped to [1, 2]
tour_len   = alpha_hat * mst.total_weight       # estimate — no TSP solved

# use tour_len to rank / prune candidate assignments`}</pre>

      <div className="fd-linkrow">
        <a className="fd-link-btn primary" href={THESIS_URL} target="_blank" rel="noopener noreferrer">
          <FileText size={14} /> Read the thesis
        </a>
        <a className="fd-link-btn" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <Github size={14} /> Estimator repo <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}
