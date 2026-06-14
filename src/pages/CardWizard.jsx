import { useState } from "react";
import { ArrowLeft, ExternalLink, Smartphone, Wallet, Plus, Check, Trash } from "lucide-react";

const PLAY_STORE_URL = "";
const REPO_URL = "";

const SAMPLE_CATALOG = [
  {
    id: "chase_freedom_unlimited",
    name: "Freedom Unlimited",
    fullName: "Chase Freedom Unlimited",
    issuer: "chase",
    network: "visa",
    base_multiplier: 1.5,
    rewards: [
      { category: "dining", multiplier: 3.0, kind: "cashback" },
      { category: "drugstore", multiplier: 3.0, kind: "cashback" },
      { category: "travel_other", multiplier: 5.0, kind: "cashback" },
    ],
    fees: { annual_fee_usd: 0 },
    color: "linear-gradient(135deg, #106EE8, #0C4D9F)"
  },
  {
    id: "chase_sapphire_preferred",
    name: "Sapphire Preferred",
    fullName: "Chase Sapphire Preferred",
    issuer: "chase",
    network: "visa",
    base_multiplier: 1.0,
    rewards: [
      { category: "dining", multiplier: 3.0, kind: "points" },
      { category: "travel_other", multiplier: 2.0, kind: "points" },
      { category: "streaming", multiplier: 3.0, kind: "points" },
      { category: "grocery", multiplier: 3.0, kind: "points" },
    ],
    fees: { annual_fee_usd: 95 },
    color: "linear-gradient(135deg, #0D2D5E, #051630)"
  },
  {
    id: "amex_gold",
    name: "Amex Gold",
    fullName: "American Express Gold",
    issuer: "amex",
    network: "amex",
    base_multiplier: 1.0,
    rewards: [
      { category: "dining", multiplier: 4.0, kind: "points" },
      { category: "grocery", multiplier: 4.0, kind: "points" },
      { category: "travel_airline", multiplier: 3.0, kind: "points" },
    ],
    fees: { annual_fee_usd: 250 },
    color: "linear-gradient(135deg, #DFB96C, #AA8336)"
  },
  {
    id: "amex_blue_cash_preferred",
    name: "Blue Cash Preferred",
    fullName: "Blue Cash Preferred",
    issuer: "amex",
    network: "amex",
    base_multiplier: 1.0,
    rewards: [
      { category: "grocery", multiplier: 6.0, kind: "cashback" },
      { category: "streaming", multiplier: 6.0, kind: "cashback" },
      { category: "transit", multiplier: 3.0, kind: "cashback" },
      { category: "gas", multiplier: 3.0, kind: "cashback" },
    ],
    fees: { annual_fee_usd: 95 },
    color: "linear-gradient(135deg, #2A4B7C, #0F1F3D)"
  },
  {
    id: "citi_double_cash",
    name: "Citi Double Cash",
    fullName: "Citi Double Cash",
    issuer: "citi",
    network: "mastercard",
    base_multiplier: 2.0,
    rewards: [],
    fees: { annual_fee_usd: 0 },
    color: "linear-gradient(135deg, #5A5A5A, #2F2F2F)"
  },
  {
    id: "capital_one_savor_one",
    name: "SavorOne",
    fullName: "Capital One SavorOne",
    issuer: "capital_one",
    network: "mastercard",
    base_multiplier: 1.0,
    rewards: [
      { category: "dining", multiplier: 3.0, kind: "cashback" },
      { category: "streaming", multiplier: 3.0, kind: "cashback" },
      { category: "grocery", multiplier: 3.0, kind: "cashback" },
    ],
    fees: { annual_fee_usd: 0 },
    color: "linear-gradient(135deg, #E65A28, #A33A12)"
  },
  {
    id: "wells_fargo_active_cash",
    name: "Active Cash",
    fullName: "Wells Fargo Active Cash",
    issuer: "wells_fargo",
    network: "visa",
    base_multiplier: 2.0,
    rewards: [],
    fees: { annual_fee_usd: 0 },
    color: "linear-gradient(135deg, #D62828, #7F0E0E)"
  }
];

const MERCHANT_CATEGORIES = [
  { id: "dining", label: "Restaurant / Dining" },
  { id: "grocery", label: "Grocery Store" },
  { id: "gas", label: "Gas Station" },
  { id: "streaming", label: "Streaming Service" },
  { id: "drugstore", label: "Drugstore" },
  { id: "everything_else", label: "Everything Else" }
];

function recommendCard(walletIds, category) {
  const owned = SAMPLE_CATALOG.filter(c => walletIds.includes(c.id));
  if (owned.length === 0) return null;

  const ranked = owned.map(card => {
    const reward = card.rewards.find(r => r.category === category);
    const multiplier = reward ? reward.multiplier : card.base_multiplier;
    const kind = reward ? reward.kind : "cashback";
    return { card, multiplier, kind };
  });

  ranked.sort((a, b) => {
    if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;
    const aFee = a.card.fees?.annual_fee_usd ?? 0;
    const bFee = b.card.fees?.annual_fee_usd ?? 0;
    if (aFee !== bFee) return aFee - bFee;
    return a.card.name.localeCompare(b.card.name);
  });

  return { winner: ranked[0], runnersUp: ranked.slice(1) };
}

function MobileSimulator() {
  const [walletIds, setWalletIds] = useState(["chase_freedom_unlimited", "amex_gold"]);
  const [activeTab, setActiveTab] = useState("recommend"); // recommend | wallet | picker | request
  const [category, setCategory] = useState("dining");
  const [requests, setRequests] = useState([]);
  const [reqName, setReqName] = useState("");
  const [reqIssuer, setReqIssuer] = useState("");
  const [search, setSearch] = useState("");

  const rec = recommendCard(walletIds, category);

  const toggleCard = (id) => {
    if (walletIds.includes(id)) {
      setWalletIds(walletIds.filter(x => x !== id));
    } else {
      setWalletIds([...walletIds, id]);
    }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!reqName.trim()) return;
    setRequests([...requests, { id: Date.now(), name: reqName, issuer: reqIssuer }]);
    setReqName("");
    setReqIssuer("");
  };

  const formatRate = (multiplier, kind) => {
    return kind === "cashback" ? `${multiplier.toFixed(1)}%` : `${multiplier.toFixed(1)}x`;
  };

  return (
    <div className="phone-mockup">
      <div className="phone-notch"></div>
      
      {activeTab === "recommend" && (
        <div className="phone-screen">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
            <Smartphone size={16} style={{ color: "var(--amber)" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggest Card</span>
          </div>
          
          <div className="phone-field" style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "4px", fontFamily: "var(--mono)" }}>Spending Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} 
              style={{ width: "100%", background: "var(--ink-3)", border: "1px solid var(--line-2)", color: "var(--text)", padding: "8px 10px", borderRadius: "4px", outline: "none", fontSize: "12px" }}>
              {MERCHANT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {rec ? (
            <div>
              <div className="phone-card-graphic" style={{ background: rec.winner.card.color }}>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>{rec.winner.card.name}</div>
                <div style={{ fontSize: "9px", opacity: 0.8, textTransform: "uppercase", marginTop: "2px" }}>{rec.winner.card.issuer}</div>
                <div style={{ fontSize: "28px", fontWeight: "600", marginTop: "26px", display: "flex", alignItems: "baseline", gap: "2px" }}>
                  {rec.winner.multiplier.toFixed(0)}
                  <span style={{ fontSize: "12px", fontWeight: "400" }}>{rec.winner.kind === "cashback" ? "% back" : "x pts"}</span>
                </div>
              </div>

              {rec.runnersUp.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px", fontFamily: "var(--mono)", borderBottom: "1px solid var(--line)", paddingBottom: "4px" }}>Runners-Up</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {rec.runnersUp.map(r => (
                      <div key={r.card.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ink-2)", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--line)" }}>
                        <span>{r.card.name}</span>
                        <span style={{ color: "var(--blue)", fontWeight: "500" }}>{formatRate(r.multiplier, r.kind)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
              Your wallet is empty.<br/>
              <button onClick={() => setActiveTab("wallet")} style={{ marginTop: "12px", background: "var(--amber)", color: "var(--ink)", border: "none", padding: "6px 14px", borderRadius: "3px", fontSize: "11px", fontWeight: "500", cursor: "pointer" }}>Manage Wallet</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="phone-screen">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Wallet size={16} style={{ color: "var(--amber)" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Wallet</span>
            </div>
            <button onClick={() => setActiveTab("picker")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "1px solid var(--line-2)", color: "var(--text)", padding: "4px 8px", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>
              <Plus size={10} /> Add
            </button>
          </div>

          {walletIds.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {SAMPLE_CATALOG.filter(c => walletIds.includes(c.id)).map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ink-2)", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "500" }}>{c.name}</div>
                    <div style={{ fontSize: "9px", color: "var(--muted)", textTransform: "uppercase" }}>{c.issuer}</div>
                  </div>
                  <button onClick={() => toggleCard(c.id)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", padding: "4px" }} aria-label="Remove card">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: "12px" }}>
              No cards added to your wallet yet.
            </div>
          )}
        </div>
      )}

      {activeTab === "picker" && (
        <div className="phone-screen">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <Wallet size={16} style={{ color: "var(--amber)" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Add Cards</span>
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search catalog..." 
            style={{ width: "100%", background: "var(--ink-2)", border: "1px solid var(--line-2)", color: "var(--text)", padding: "6px 10px", borderRadius: "4px", marginBottom: "12px", fontSize: "11px", outline: "none" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", flex: 1, maxHeight: "360px", paddingRight: "2px" }}>
            {SAMPLE_CATALOG.filter(c => c.fullName.toLowerCase().includes(search.toLowerCase())).map(c => {
              const inWallet = walletIds.includes(c.id);
              return (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ink-2)", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", opacity: inWallet ? 0.6 : 1 }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "500" }}>{c.name}</div>
                    <div style={{ fontSize: "8px", color: "var(--muted)", textTransform: "uppercase" }}>{c.issuer}</div>
                  </div>
                  <button onClick={() => toggleCard(c.id)} style={{ background: inWallet ? "var(--line-2)" : "var(--blue)", color: inWallet ? "var(--muted)" : "var(--ink)", border: "none", padding: "4px 8px", borderRadius: "3px", fontSize: "9px", fontWeight: "600", cursor: "pointer" }}>
                    {inWallet ? <Check size={10} /> : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
          
          <button onClick={() => setActiveTab("request")} style={{ width: "100%", background: "none", border: "none", color: "var(--blue)", fontSize: "10px", padding: "8px 0 0", cursor: "pointer", textAlign: "center", borderTop: "1px solid var(--line)", marginTop: "8px" }}>
            Don't see your card? Request it →
          </button>
        </div>
      )}

      {activeTab === "request" && (
        <div className="phone-screen">
          <button onClick={() => setActiveTab("picker")} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--muted)", fontSize: "10px", padding: "0 0 12px", cursor: "pointer" }}>
            ← Back to Catalog
          </button>

          <form onSubmit={handleRequestSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>Tell us what card we're missing and we will research and add it to the rewards index.</div>
            <input required value={reqName} onChange={e => setReqName(e.target.value)} placeholder="Card name (e.g. CSR)" 
              style={{ width: "100%", background: "var(--ink-2)", border: "1px solid var(--line-2)", color: "var(--text)", padding: "8px", borderRadius: "4px", fontSize: "11px", outline: "none" }} />
            <input value={reqIssuer} onChange={e => setReqIssuer(e.target.value)} placeholder="Issuer (e.g. Chase)" 
              style={{ width: "100%", background: "var(--ink-2)", border: "1px solid var(--line-2)", color: "var(--text)", padding: "8px", borderRadius: "4px", fontSize: "11px", outline: "none" }} />
            <button type="submit" style={{ width: "100%", background: "var(--amber)", color: "var(--ink)", border: "none", padding: "8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer", marginTop: "4px" }}>
              Submit Request
            </button>
          </form>

          {requests.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "9px", color: "var(--muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--mono)", borderBottom: "1px solid var(--line)", paddingBottom: "2px" }}>Your Requests</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {requests.map(r => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ink-2)", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "10px" }}>
                    <span>{r.name}</span>
                    <span style={{ color: "var(--blue)" }}>Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="phone-tab-bar">
        <button className={`phone-tab ${activeTab === "recommend" ? "active" : ""}`} onClick={() => { setActiveTab("recommend"); setSearch(""); }}>Suggest</button>
        <button className={`phone-tab ${activeTab === "wallet" || activeTab === "picker" || activeTab === "request" ? "active" : ""}`} onClick={() => { setActiveTab("wallet"); setSearch(""); }}>Wallet ({walletIds.length})</button>
      </div>
    </div>
  );
}

export default function CardWizard() {
  return (
    <article className="fd-page" style={{ maxWidth: "980px" }}>
      <a className="fd-back" href="#/"><ArrowLeft size={14} /> Back to home</a>
      
      <div className="fd-cw-layout">
        <div>
          <div className="fd-app-head">
            <img className="fd-app-icon" src="/cardwizard-icon.png" width="104" height="104"
              alt="CardWizard app icon" loading="eager" />
            <div>
              <div className="fd-kicker">Android App</div>
              <h1>CardWizard</h1>
              <p className="fd-app-tag">Which card should I pull out &mdash; right now?</p>
            </div>
          </div>
          
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

          <h2>It's an optimization, too</h2>
          <p>
            Picking the right card is a small operations-research problem in your pocket:
            maximize the expected reward across your wallet, subject to category multipliers,
            spending caps, and quarterly rotations. CardWizard solves that <span className="fd-mono">argmax</span> on
            every purchase &mdash; instantly, and entirely on your device.
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
        </div>

        <div style={{ position: "sticky", top: "80px", display: "flex", justifyContent: "center" }}>
          <MobileSimulator />
        </div>
      </div>
    </article>
  );
}
