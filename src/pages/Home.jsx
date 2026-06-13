import { ArrowUpRight } from "lucide-react";
import RouteOptimizer from "../components/RouteOptimizer.jsx";
import Contact from "../components/Contact.jsx";

const PROJECTS = [
  {
    href: "#/cardwizard", tag: "Android App",
    name: "CardWizard",
    desc: "An on-device Android app that tells you which credit card to use for each purchase. Privacy-first \u2014 nothing leaves your phone.",
    stack: ["Kotlin", "Jetpack Compose", "On-device"],
  },
  {
    href: "#/gart", tag: "Research",
    name: "GART",
    desc: "My thesis work: fast, distribution-independent tour-length estimators for the TSP. Published, with two open-source repos.",
    stack: ["Operations research", "ML", "Estimation"],
  },
];

export default function Home() {
  return (
    <>
      <header className="fd-hero">
        <div>
          <div className="fd-eyebrow">Operations &times; Operations Research</div>
          <h1 className="fd-h1">I bring Operations to <span className="opt">Operations Research</span>.</h1>
          <p className="fd-lead">
            Industrial engineer at Esri. On the side I build things that come straight
            out of real operations &mdash; an on-device Android app, optimization research,
            and tools shaped by time spent on factory floors.
          </p>
          <div className="fd-cta-row">
            <a className="fd-btn fd-btn-primary" href="#/cardwizard">
              See the work <ArrowUpRight size={15} />
            </a>
            <a className="fd-btn fd-btn-ghost" href="#contact"
               onClick={(e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }}>
              Get in touch
            </a>
          </div>
        </div>
        <RouteOptimizer />
      </header>

      <section className="fd-sec" id="build">
        <div className="fd-sec-eyebrow">// What I Build</div>
        <h2 className="fd-h2">A couple of things worth showing.</h2>
        <div className="fd-proj-grid">
          {PROJECTS.map((p) => (
            <a className="fd-proj" key={p.name} href={p.href}>
              <span className="tag">{p.tag}</span>
              <h3>{p.name} <ArrowUpRight className="arr" size={17} /></h3>
              <p>{p.desc}</p>
              <div className="stack">{p.stack.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="fd-sec" id="about">
        <div className="fd-sec-eyebrow">// About Me</div>
        <div className="fd-about-grid">
          <div>
            <h2 className="fd-h2">Industrial engineer who's spent time on the floor.</h2>
            <p>
              My background is industrial engineering, and a lot of it was spent close
              to the work &mdash; in manufacturing before I was ever in front of a solver.
              That's where I learned what the problem actually looks like, not just the
              model of it.
            </p>
            <p>
              Today I'm at Esri working on vehicle routing, so my side projects stay in
              other lanes: an Android app, my TSP-estimation research, and the kind of
              tooling I wished I'd had on the line.
            </p>
          </div>
          <div className="fd-cv">
            <div className="fd-cv-row"><span className="fd-cv-when">Now</span>
              <span className="fd-cv-what"><b>Esri</b><span>Vehicle routing</span></span></div>
            <a className="fd-cv-row" href="#/hypertherm"><span className="fd-cv-when">Prior</span>
              <span className="fd-cv-what"><b>Hypertherm Associates <ArrowUpRight className="arr" size={13} /></b><span>Plasma cutting systems</span></span></a>
            <a className="fd-cv-row" href="#/campbells"><span className="fd-cv-when">Prior</span>
              <span className="fd-cv-what"><b>Campbell's <ArrowUpRight className="arr" size={13} /></b><span>Goldfish plant &mdash; Richmond, Utah</span></span></a>
            <div className="fd-cv-row"><span className="fd-cv-when">Base</span>
              <span className="fd-cv-what"><b>Industrial Engineering</b><span>The foundation under all of it</span></span></div>
          </div>
        </div>
      </section>

      <Contact />
    </>
  );
}
