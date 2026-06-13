import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base is "/" because the site is served from a custom apex domain
// (feldmandevelopers.us), not from a /repo-name/ subpath.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
