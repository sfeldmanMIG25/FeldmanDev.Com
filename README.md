# Feldman Developers

Portfolio and landing page for **Feldman Developers** — operations × operations research.
Built with React + Vite; deployed as a static site.

The hero runs a live vehicle-route optimization (a 2-opt solver) over satellite
imagery, visibly shortening a tour from tangled to optimized.

## Local development

Requires Node.js 18+ (20 recommended).

```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
```

All dependencies (React, Leaflet, fonts) are bundled at build time.
