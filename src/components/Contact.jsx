import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Mail, MapPin, Check } from "lucide-react";

const WEB3FORMS_KEY = "9ea96619-8b93-45f2-8e5f-1d9c855852b9";
const CONTACT_EMAIL = "FeldmanDevelopers@Outlook.com";
// Cloudflare Turnstile public site key — safe to commit. The matching SECRET key
// lives only in the Web3Forms dashboard. Set to "" to disable the check.
const TURNSTILE_SITE_KEY = "0x4AAAAAADkHHmUrHTpCeVj8";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", botcheck: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const boxRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Render the Turnstile widget while the form is visible; clean it up after.
  useEffect(() => {
    if (sent || !TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !boxRef.current || widgetIdRef.current !== null || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(boxRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (t) => setToken(t),
        "error-callback": () => setToken(""),
        "expired-callback": () => setToken(""),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let s = document.querySelector(`script[src="${TURNSTILE_SRC}"]`);
      if (!s) {
        s = document.createElement("script");
        s.src = TURNSTILE_SRC;
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", render, { once: true });
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* already removed */ }
        widgetIdRef.current = null;
      }
      setToken("");
    };
  }, [sent]);

  const resetTurnstile = () => {
    if (widgetIdRef.current !== null && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    setToken("");
  };

  const submit = async () => {
    setError("");
    if (form.botcheck) return;
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in your name, email, and a message.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setError("Please complete the verification below.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "New message from feldmandevelopers.com",
          from_name: form.name,
          name: form.name,
          email: form.email,
          message: form.message,
          botcheck: false,
          "cf-turnstile-response": token,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSent(true);
      } else {
        setError(`Something went wrong. You can email ${CONTACT_EMAIL} directly.`);
        resetTurnstile(); // tokens are single-use
      }
    } catch {
      setError(`Couldn't send right now. You can email ${CONTACT_EMAIL} directly.`);
      resetTurnstile();
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="fd-sec" id="contact">
      <div className="fd-sec-eyebrow">// Contact</div>
      <div className="fd-contact-grid">
        <div>
          <h2 className="fd-h2">Tell me what your operation is up against.</h2>
          <p className="fd-contact-lead">
            Manufacturing, analytics, planning, or a custom tool &mdash; if it's an
            operations problem, I'm interested.
          </p>
          <div className="fd-contact-alt">
            <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={15} /> {CONTACT_EMAIL}</a>
            <a href="#/" onClick={(e) => e.preventDefault()}><MapPin size={15} /> Redlands, California</a>
          </div>
        </div>
        <div>
          {sent ? (
            <div className="fd-sent"><Check size={16} /> Message sent &mdash; I'll be in touch.</div>
          ) : (
            <div>
              <input className="fd-hp" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={form.botcheck} onChange={(e) => setForm({ ...form, botcheck: e.target.value })} />
              <div className="fd-field"><label htmlFor="f-name">Name</label>
                <input id="f-name" className="fd-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></div>
              <div className="fd-field"><label htmlFor="f-email">Email</label>
                <input id="f-email" className="fd-input" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></div>
              <div className="fd-field"><label htmlFor="f-msg">What are you working on?</label>
                <textarea id="f-msg" className="fd-textarea" value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="A few sentences about the problem." /></div>
              {TURNSTILE_SITE_KEY && <div className="fd-turnstile" ref={boxRef} />}
              <button className="fd-btn fd-btn-primary" onClick={submit}
                disabled={sending || (!!TURNSTILE_SITE_KEY && !token)}>
                {sending ? "Sending\u2026" : "Send message"} <ArrowUpRight size={15} />
              </button>
              {error && <div className="fd-err">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
