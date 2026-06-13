import { ArrowLeft, ArrowUpRight } from "lucide-react";

export default function Campbells() {
  return (
    <article className="fd-page">
      <a className="fd-back" href="#/"><ArrowLeft size={14} /> Back to home</a>
      <div className="fd-kicker">Experience</div>
      <h1>Campbell's &mdash; Goldfish Plant</h1>
      <p className="fd-page-lead">
        High-volume food manufacturing at the Goldfish plant in Richmond, Utah.
        Snack production at scale is a continuous, fast-moving operation, and it's
        an excellent place to learn what industrial engineering actually means once
        it leaves the textbook.
      </p>

      <div className="fd-meta">
        <div><b>Site</b><span>Richmond, Utah</span></div>
        <div><b>Domain</b><span>Food manufacturing</span></div>
        <div><b>Role</b><span>Industrial engineering</span></div>
      </div>

      <h2>The environment</h2>
      <p>
        A baked-snack line runs nearly around the clock, and small inefficiencies
        compound quickly: a few minutes lost per changeover, a fraction of a percent
        of yield, a recurring micro-stoppage. The work is about seeing those losses
        clearly and removing them without disrupting a line that can't simply stop.
      </p>

      <h2>What industrial engineering looks like here</h2>
      <ul>
        <li>Throughput and line balancing &mdash; finding and relieving the real bottleneck, not the obvious one.</li>
        <li>Changeover and downtime analysis &mdash; turning lost minutes into recovered output.</li>
        <li>Yield and waste &mdash; tightening the gap between what goes in and what ships.</li>
        <li>Measurement &mdash; making the floor legible so decisions rest on data, not anecdote.</li>
      </ul>

      <p className="fd-note">
        Specifics of the projects and results here can be shared on request &mdash;
        get in touch and I'll walk through them.
      </p>

      <div className="fd-linkrow">
        <a className="fd-link-btn" href="#/"
           onClick={(e) => { e.preventDefault(); window.location.hash = "/"; setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 70); }}>
          Get in touch <ArrowUpRight size={13} />
        </a>
      </div>
    </article>
  );
}
