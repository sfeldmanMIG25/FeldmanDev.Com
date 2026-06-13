export default function Nav({ route }) {
  const goSection = (id) => {
    if (route === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = "/";
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 70);
    }
  };

  return (
    <nav className="fd-nav">
      <a className="fd-mark" href="#/">
        <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true">
          <line x1="4" y1="16" x2="13" y2="5" stroke="#4DA3FF" strokeWidth="1.5" />
          <line x1="13" y1="5" x2="22" y2="14" stroke="#FF9D3D" strokeWidth="1.5" />
          <circle cx="4" cy="16" r="3" fill="#0A0E16" stroke="#4DA3FF" strokeWidth="1.5" />
          <circle cx="13" cy="5" r="3" fill="#0A0E16" stroke="#4DA3FF" strokeWidth="1.5" />
          <circle cx="22" cy="14" r="3" fill="#0A0E16" stroke="#FF9D3D" strokeWidth="1.5" />
        </svg>
        <span className="fd-mark-name">Feldman <span>Developers</span></span>
      </a>
      <div className="fd-nav-links">
        <a onClick={() => goSection("build")}>Work</a>
        <a onClick={() => goSection("about")}>About</a>
        <a onClick={() => goSection("contact")}>Contact</a>
      </div>
    </nav>
  );
}
