/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built site works when served from any subpath
// (e.g. apps.charliekrug.com/typematch), not just the domain root.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // Built into site/ and committed: this app *is* its own landing page, and
    // the published directory should be the thing that was reviewed, not a
    // rebuild of it. Re-run `npm run build` and commit site/ when src changes.
    outDir: "site",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // The core logic the score and the sharing depend on. The React entry
      // point and type-only files carry no branches worth a percentage.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/test/**", "src/**/*.test.{ts,tsx}"],
    },
  },
});
