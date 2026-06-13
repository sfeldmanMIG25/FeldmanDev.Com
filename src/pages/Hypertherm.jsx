import { ArrowLeft, ArrowUpRight } from "lucide-react";

export default function Hypertherm() {
  return (
    <article className="fd-page">
      <a className="fd-back" href="#/"><ArrowLeft size={14} /> Back to home</a>
      <div className="fd-kicker">Experience</div>
      <h1>Hypertherm Associates</h1>
      <p className="fd-page-lead">
        Industrial cutting systems &mdash; the plasma equipment that cuts metal in
        fabrication shops and on factory floors worldwide. Building precision
        hardware is its own kind of operations problem, where tolerances are tight
        and the cost of a defect is high.
      </p>

      <div className="fd-meta">
        <div><b>Domain</b><span>Plasma cutting systems</span></div>
        <div><b>Sector</b><span>Industrial equipment</span></div>
        <div><b>Role</b><span>Manufacturing / IE</span></div>
      </div>

      <h2>The environment</h2>
      <p>
        Cutting systems are precision products: consumables and torch components
        have to perform identically, unit after unit. That puts the emphasis on
        process control, repeatability, and catching variation before it reaches a
        customer &mdash; a different rhythm from high-volume consumer goods, but the
        same core discipline.
      </p>

      <h2>What I built</h2>
      <p>
        The centerpiece was an <strong>automated production scheduler</strong> &mdash; an
        integer-programming solver built on <strong>Google OR-Tools CP-SAT</strong> that
        coordinates the schedule across interdependent manufacturing cells rather than
        planning each one in isolation.
      </p>
      <p>
        The status quo was a simple pool system: jobs were pulled as cells freed up, which
        keeps things moving but leaves profit on the floor. It can't see far enough ahead to
        batch compatible work into <strong>longer production runs</strong>, so the line eats
        avoidable changeovers and setup time. Modeling the cells' dependencies explicitly and
        solving the schedule as a constraint program lets the plan favor those longer runs
        wherever the downstream commitments still allow it.
      </p>
      <ul>
        <li><strong>CP-SAT model</strong> &mdash; cells, jobs, and their interdependencies expressed as constraints, solved to a coordinated plant-wide schedule.</li>
        <li><strong>Longer-run optimization</strong> &mdash; the objective rewards batching compatible work, trading short-horizon greediness for fewer changeovers overall.</li>
        <li><strong>Automated pipeline</strong> &mdash; the solver runs on live job data, so scheduling is a repeatable step rather than a manual, spreadsheet-driven one.</li>
      </ul>

      <p className="fd-note">
        Happy to walk through the model and the results in more detail &mdash; reach out.
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
