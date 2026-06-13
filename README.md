# Feldman Developers

Portfolio and landing page for Feldman Developers — built with React + Vite,
deployed free on GitHub Pages at **feldmandevelopers.com**.

The hero runs a live vehicle-route optimization over Esri World Imagery
satellite tiles of Redlands, CA: a depot plus ten stops, with a 2-opt solver
visibly shortening the tour from blue (tangled) to amber (optimized).

---

## Local development

Requires Node.js 18+ (20 recommended).

```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
```

All dependencies (React, Leaflet, fonts) are bundled at build time. The only
network calls the live site makes are:

- **Map tiles** from Esri World Imagery — read-only image requests.
- **Contact form** POST to Web3Forms — send-only.

There is no server and no database, so there is no server-side code for anyone
to compromise.

---

## Deploying to GitHub Pages

1. Push this repo to GitHub (branch `main`).
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds and
   publishes `dist/`.

### Custom domain (feldmandevelopers.com)

`public/CNAME` already contains `feldmandevelopers.com`, so it's copied to the
published site automatically. Then:

**At your DNS registrar**, point the apex domain at GitHub Pages:

| Type  | Host | Value                                   |
|-------|------|-----------------------------------------|
| A     | @    | 185.199.108.153                         |
| A     | @    | 185.199.109.153                         |
| A     | @    | 185.199.110.153                         |
| A     | @    | 185.199.111.153                         |
| CNAME | www  | `sfeldmanmig25.github.io`                |

(Optional IPv6 AAAA records: `2606:50c0:8000::153`, `8001::153`, `8002::153`,
`8003::153`.)

Then in **Settings → Pages**, set the custom domain to `feldmandevelopers.com`
and, once DNS resolves, tick **Enforce HTTPS**.

---

## Contact form

The form posts to [Web3Forms](https://web3forms.com) using the access key in
`src/App.jsx` (`WEB3FORMS_KEY`). Submissions are delivered to the inbox tied to
that key (`FeldmanDevelopers@Outlook.com`).

The access key is **public by design** — it can only trigger an email to the
configured inbox; it can't read anything. Anti-spam already wired in:

- A hidden honeypot field (`botcheck`) that real users never fill.

For stronger protection, enable **Cloudflare Turnstile** in the Web3Forms
dashboard and add its widget + site key to the form (a small addition — ask and
I'll wire it). If the key is ever abused, rotate it from the Web3Forms
dashboard and update `WEB3FORMS_KEY`.

---

## Security checklist ("can it be hijacked?")

A static site has a tiny attack surface, but these close the realistic gaps:

- **GitHub account:** enable 2FA / a passkey. Account compromise is the main way
  someone could push malicious content.
- **Branch protection:** protect `main` (require PR review, block force-pushes).
  Don't auto-deploy from untrusted pull requests.
- **Dependencies:** lockfile is committed and `npm ci` is used in CI; enable
  **Dependabot** alerts so supply-chain issues surface fast. Keep deps minimal.
- **No runtime CDN:** all libraries are bundled, so there's no third-party
  script that could be swapped under you.
- **HTTPS:** enforce it in Pages settings once DNS resolves.
- **Domain registrar:** secure that account with 2FA, enable registrar/transfer
  lock, and consider DNSSEC — DNS hijack is the other realistic vector.
- **Form key:** public and send-only; rotate if abused (see above).

---

## Pages & routing

Client-side hash routing (no dependency, no server config — works on GitHub
Pages out of the box). Routes:

- `/` — home: hero + What I Build + About Me + Contact (`src/pages/Home.jsx`)
- `#/cardwizard` — `src/pages/CardWizard.jsx`
- `#/gart` — `src/pages/Gart.jsx`
- `#/campbells` — `src/pages/Campbells.jsx`
- `#/hypertherm` — `src/pages/Hypertherm.jsx`

## Editing content

- **Home copy / project cards / about timeline:** `src/pages/Home.jsx`
  (`PROJECTS` array and the section JSX).
- **GART links:** top of `src/pages/Gart.jsx` — set `THESIS_URL`, `GITHUB_USER`,
  and `REPO_1` / `REPO_2`. The links section renders automatically once any are
  set; until then it shows a placeholder note.
- **CardWizard links:** top of `src/pages/CardWizard.jsx` — set `PLAY_STORE_URL`
  and `REPO_URL`.
- **Campbell's / Hypertherm specifics:** `src/pages/Campbells.jsx` and
  `src/pages/Hypertherm.jsx` — currently general context; drop in the concrete
  projects and results when ready.
- **Hero optimizer (network / TSP):** `src/components/RouteOptimizer.jsx`
  (`buildNetwork()` for the street grid; instance size in `runInstance`).
- **Contact form key/email:** `src/components/Contact.jsx`.
- **Styles / colors / fonts:** `src/index.css` (design tokens at the top of the
  `.fd` block).
