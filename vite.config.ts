import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

// Shared singletons. react/react-dom dedupe between shell and the React catalog
// (so the catalog renders as a real React child). lit + bion must be singletons
// across all three apps — including the Vue cart — or a second
// `customElements.define('bion-…')` throws. Trailing-slash keys cover subpaths.
const bion = {
  lit: { singleton: true },
  "lit/": { singleton: true },
  "@bion-mfe-ui/core": { singleton: true },
  "@bion-mfe-ui/core/": { singleton: true },
  "@bion-mfe-ui/icons": { singleton: true },
  "@bion-mfe-ui/tokens": { singleton: true },
};

export default defineConfig(({ mode }) => {
  // Reads VITE_* from .env files and from the platform's process.env on deploy.
  const env = loadEnv(mode, process.cwd());
  const port = Number(env.VITE_PORT) || 3000;
  const publicUrl = env.VITE_PUBLIC_URL || `http://localhost:${port}`;
  const catalogUrl = env.VITE_CATALOG_URL || "http://localhost:3001";
  const cartUrl = env.VITE_CART_URL || "http://localhost:3002";

  return {
    base: publicUrl,
    server: { port, strictPort: true, origin: publicUrl, cors: true },
    preview: { port, strictPort: true, cors: true },
    plugins: [
      react(),
      federation({
        name: "shell",
        remotes: {
          catalog: {
            type: "module",
            name: "catalog",
            entry: `${catalogUrl}/remoteEntry.js`,
          },
          cart: {
            type: "module",
            name: "cart",
            entry: `${cartUrl}/remoteEntry.js`,
          },
        },
        shared: {
          react: { singleton: true },
          "react-dom": { singleton: true },
          "react-dom/": { singleton: true },
          ...bion,
        },
      }),
    ],
    // Keep esbuild from pre-bundling (and inlining a private copy of)
    // @bion-mfe-ui/core + lit in dev — let the federation shared scope own them
    // so the bion-* web components register exactly once.
    optimizeDeps: {
      exclude: [
        "@bion-mfe-ui/react",
        "@bion-mfe-ui/core",
        "@bion-mfe-ui/icons",
        "@bion-mfe-ui/tokens",
        "lit",
      ],
    },
    build: { target: "chrome89" },
  };
});
