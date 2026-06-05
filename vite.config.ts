import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

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
      // federation({
      //   name: "shell",
      //   remotes: {
      //     catalog: {
      //       type: "module",
      //       name: "catalog",
      //       entry: `${catalogUrl}/remoteEntry.js`,
      //     },
      //     cart: {
      //       type: "module",
      //       name: "cart",
      //       entry: `${cartUrl}/remoteEntry.js`,
      //     },
      //   },
      //   shared: {
      //     react: { singleton: true },
      //     "react-dom": { singleton: true },
      //     "react-dom/": { singleton: true },
      //   },
      // }),
    ],
    build: { target: "chrome89" },
  };
});
