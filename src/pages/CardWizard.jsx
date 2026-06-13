import { ArrowLeft, ExternalLink } from "lucide-react";

// Fill these in when ready (leave as "" to hide the button).
const PLAY_STORE_URL = ""; // set once the app is live on Google Play
// The cardwizard repo is PRIVATE — a link would 404 for visitors.
// Make it public on GitHub, then set this to enable the Source button.
const REPO_URL = "";

export default function CardWizard() {
  return (
    <article className="fd-page">
      <a className="fd-back" href="#/"><ArrowLeft size={14} /> Back to home</a>
      <div className="fd-kicker">Android App</div>
      <h1>CardWizard</h1>
      <p className="fd-page-lead">
        Most people leave money on the table every time they pay, because the
        best card for a purchase depends on the category, the merchant, and the
        rotating rules each issuer sets. CardWizard answers one question fast:
        which card should I pull out right now?
      </p>

      <div className="fd-meta">
        <div><b>Platform</b><span>Android</span></div>
        <div><b>Stack</b><span>Kotlin · Jetpack Compose</span></div>
        <div><b>Data</b><span>On-device</span></div>
        <div><b>Status</b><span>Heading to Play Store</span></div>
      </div>

      <h2>What it does</h2>
      <p>
        You tell it what you're buying &mdash; or where &mdash; and it ranks your
        wallet by the rewards you'd actually earn, accounting for category
        multipliers, caps, and quarterly rotations. The answer is a single,
        confident recommendation, with the runners-up a tap away.
      </p>

      <h2>Privacy-first, by design</h2>
      <p>
        Your cards are some of the most sensitive things you own, so CardWizard
        keeps them where they belong: <strong>on your phone</strong>. The
        recommendation engine runs entirely on-device, and your card list never
        leaves it. There's no account to make and no server holding your wallet.
      </p>

      <h2>How it stays current</h2>
      <p>
        Card reward structures change constantly. Rather than hand-maintaining
        them, the app ships with a reward dataset kept fresh by an automated
        pipeline running on GitHub Actions, so the recommendations reflect
        current terms without you doing anything.
      </p>

      <h2>Under the hood</h2>
      <ul>
        <li><strong>Kotlin + Jetpack Compose</strong> for a modern, native Android UI.</li>
        <li><strong>On-device logic</strong> &mdash; the matching and ranking run locally, fast, and offline.</li>
        <li><strong>Automated data pipeline</strong> on GitHub Actions to keep card rules up to date.</li>
        <li><strong>CI signing</strong> configured end-to-end (keystore + GitHub Actions) for clean release builds.</li>
      </ul>

      {(PLAY_STORE_URL || REPO_URL) ? (
        <div className="fd-linkrow">
          {PLAY_STORE_URL && (
            <a className="fd-link-btn primary" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              Google Play <ExternalLink size={13} />
            </a>
          )}
          {REPO_URL && (
            <a className="fd-link-btn" href={REPO_URL} target="_blank" rel="noopener noreferrer">
              Source <ExternalLink size={13} />
            </a>
          )}
        </div>
      ) : (
        <p className="fd-note">Play Store and repository links go here once they're live.</p>
      )}
    </article>
  );
}
