# fe-shell — Marqet host (React)

The **host / shell** of the *Marqet* polyglot micro-frontend demo. It renders the
page chrome (header, search, footer), **integrates the two remotes** at runtime
with [Module Federation](https://module-federation.io/), and acts as the **bridge**
between the React catalog and the Vue cart.

> Part of a 3-repo system. See also: **[fe-catalog](https://github.com/GDGoC-BiOn/fe-catalog)** (product grid, React) · **[fe-cart](https://github.com/GDGoC-BiOn/fe-cart)** (cart drawer, Vue).
> Live: https://gdgoc-bion.github.io/fe-shell/

---

## The system at a glance

| Repo | Stack | Port | Role | Exposes |
|------|-------|------|------|---------|
| **fe-shell** (this) | React 18 | 3000 | Host — chrome + integrates remotes | — |
| fe-catalog | React 18 | 3001 | Remote — hero, product grid, filters | `./App` (React component) |
| fe-cart | Vue 3 | 3002 | Remote — cart drawer + state | `./mount` (mount/unmount) |

All three are **separate, independently deployable repos** — no monorepo, no
shared root `package.json`. They are wired together **at runtime** over HTTP via
each remote's `remoteEntry.js`. UI comes from the published
[`@bion-mfe-ui`](https://gdgoc-bion.github.io/bion-mfe-ui) component library
(Lit web components + React/Vue adapters).

```
                         ┌──────────────────────────── fe-shell (host, React) ───────────────────────────┐
  Browser ──▶ index.html │  header · search · footer                                                      │
                         │                                                                                │
                         │   <Catalog/>  ◀─ React.lazy(import('catalog/App'))      props/callbacks (React) │
                         │      │  onAddToCart(product)                                                    │
                         │      ▼                                                                          │
                         │   window CustomEvent bus  ──"cart:add-item"──▶  <div> mount('cart/mount')       │
                         │      ▲                          "cart:open"──▶       (Vue app)                   │
                         │      └────────"cart:count"───────────────────────────────┘                     │
                         └────────────────────────────────────────────────────────────────────────────────┘
                                    ▲ http://localhost:3001/remoteEntry.js   ▲ http://localhost:3002/remoteEntry.js
```

---

## What the shell does

1. **Renders the chrome** — header (logo, search box, account badge, cart button
   with a live item count), sub-nav, recommendation strip, and footer, all built
   with `@bion-mfe-ui/react` components.
2. **Mounts the catalog remote** as a *real React child*: `React.lazy(() => import('catalog/App'))`.
   Because shell and catalog share one React instance (see *Sharing* below), the
   catalog integrates like any local component — the shell passes it props
   (`onAddToCart`, `query`).
3. **Mounts the cart remote** into a plain DOM node via `VueSlot` → `cart/mount`.
   A React host can't render a Vue tree as a child, so the cart is handed a
   `<div>` and owns everything inside it.
4. **Bridges the two frameworks** over a `window` CustomEvent bus.

### Communication contract

| Direction | Mechanism | Event / API |
|-----------|-----------|-------------|
| shell ↔ catalog (React ↔ React) | **direct props/callbacks** | `onAddToCart(product)`, `query` |
| shell → cart (React → Vue) | window event | `cart:add-item` `{ detail: { product } }` |
| shell → cart | window event | `cart:open` |
| cart → shell (Vue → React) | window event | `cart:count` `{ detail: { count } }` → header badge |

> Rule of thumb: **same framework → pass data directly; cross-framework → use the event bus.**

---

## Quick start

> Requires **Node ≥ 18** and **pnpm** (`npm i -g pnpm`). The repo uses pnpm, but
> npm/yarn work too.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

⚠️ The shell loads the catalog and cart **at runtime**, so for the *full* app you
must also run those two remotes (in their own clones), **start the remotes first**:

```bash
# terminal 1 — clone of fe-catalog
pnpm install && pnpm dev      # http://localhost:3001

# terminal 2 — clone of fe-cart
pnpm install && pnpm dev      # http://localhost:3002

# terminal 3 — this repo
pnpm install && pnpm dev      # http://localhost:3000  ← open this
```

If you open the shell before the remotes are up, just refresh once they are.

### Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Vite dev server on `:3000` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the production build on `:3000` |

---

## Configuration (`.env`)

Ports and remote URLs are **env-driven** so the same code works locally and in
production. Copy `.env.example` → `.env` and adjust. On a deploy platform, set
these as environment variables instead.

| Variable | Meaning | Local default |
|----------|---------|---------------|
| `VITE_PUBLIC_URL` | Public origin the shell is served from (Vite `base`) | `http://localhost:3000` |
| `VITE_PORT` | Dev/preview server port | `3000` |
| `VITE_CATALOG_URL` | Origin of the deployed **catalog** remote (must serve `/remoteEntry.js`) | `http://localhost:3001` |
| `VITE_CART_URL` | Origin of the deployed **cart** remote | `http://localhost:3002` |

The config has localhost fallbacks, so it still runs without a `.env`.

---

## How it's built (vite.config.ts)

```ts
federation({
  name: "shell",
  remotes: {
    catalog: { type: "module", name: "catalog", entry: `${VITE_CATALOG_URL}/remoteEntry.js` },
    cart:    { type: "module", name: "cart",    entry: `${VITE_CART_URL}/remoteEntry.js` },
  },
  shared: {            // ONLY React is shared (see note)
    react: { singleton: true },
    "react-dom": { singleton: true },
    "react-dom/": { singleton: true },
  },
})
```

- **`react`/`react-dom` are shared singletons** so the shell and the catalog use
  the *same* React instance — that's what lets the catalog render as a real
  React child (hooks/context work across the boundary).
- **`lit` and `@bion-mfe-ui/*` are intentionally NOT shared** — they're bundled
  into each app. Sharing them created a deep `loadShare → prebuild` request
  waterfall that made first load slow on high-latency networks. Bundling is safe
  because `@bion-mfe-ui/core@^0.1.2` makes `customElements.define` idempotent, so
  multiple copies registering the same `<bion-*>` element no longer crash.
- `build.target: "chrome89"` — the MF runtime emits top-level `await`.

---

## Performance notes (first-load)

Module Federation loads remotes over HTTP, so a cold first load is a chain of
requests. This shell does a few things to keep it fast / feel fast:

1. **Instant skeleton** in `index.html` — a header + hero + product-grid skeleton
   renders *before any JS evaluates*, so the first paint is the app's shape, not
   a blank screen. React replaces it once mounted.
2. **`modulepreload`** of both remote `remoteEntry.js` files — starts fetching the
   remotes in parallel with the shell bundle.
3. **Eager remote imports** — `App.tsx` kicks off `import('catalog/App')` and
   `import('cart/mount')` at module-eval, so the remotes load in parallel with
   the host instead of only after the shell first renders.
4. **Suspense skeleton** — while the catalog remote is fetched, a product-grid
   skeleton shows instead of a bare "loading" line.

---

## Project structure

```
shell/
├─ index.html            # instant skeleton + modulepreload of remotes
├─ vite.config.ts        # federation host config (remotes + shared) — env-driven
├─ .env / .env.example   # ports + remote URLs
└─ src/
   ├─ main.tsx           # dynamic-imports bootstrap (avoids MF eager-consumption)
   ├─ bootstrap.tsx      # createRoot + render <App/>; loads @bion-mfe-ui/tokens/css
   ├─ App.tsx            # chrome, lazy <Catalog/>, <VueSlot/>, event-bus bridge
   ├─ VueSlot.tsx        # mounts a framework-agnostic remote (cart) into a <div>
   ├─ shell.css          # layout + responsive header + loading skeleton styles
   ├─ types.ts           # MarqetProduct + window event-bus type augmentation
   └─ remotes.d.ts       # ambient types for `catalog/App` and `cart/mount`
```

---

## Deployment (GitHub Pages)

`/.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push
to `main`. **Enable it once per repo:** *Settings → Pages → Build and deployment →
Source = GitHub Actions.*

The workflow injects production env at build time:

```yaml
env:
  VITE_PUBLIC_URL: https://gdgoc-bion.github.io/fe-shell/
  VITE_CATALOG_URL: https://gdgoc-bion.github.io/fe-catalog
  VITE_CART_URL: https://gdgoc-bion.github.io/fe-cart
```

All three sites live under the same `gdgoc-bion.github.io` origin, so they're
**same-origin → no CORS** needed. **Deploy order for the first time:** catalog &
cart first (so their `remoteEntry.js` is live), then shell.

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Blank page, console says remote failed to load | A remote (`:3001`/`:3002`) isn't running or its URL is wrong. Start remotes first, check `VITE_CATALOG_URL`/`VITE_CART_URL`. |
| Catalog area stuck on skeleton | catalog remote down or `remoteEntry.js` 404. |
| Cart never opens / badge stays 0 | cart remote down, or another tab is blocking the event bus. Cart talks only via `window` events. |
| `"bion-… already used"` | Should not happen on `@bion-mfe-ui/core@^0.1.2`+ (idempotent define). Bump core. |
| "Multiple versions of Lit" warning | Expected & harmless — `lit` is bundled per app (not shared) on purpose. |
