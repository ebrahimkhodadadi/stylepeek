# ◈ stylepeek

> Extract a complete design system from any website — colors, typography, spacing, shadows, components, and assets.

[![CI](https://github.com/ebrahimkhodadadi/stylepeek/actions/workflows/ci.yml/badge.svg)](https://github.com/ebrahimkhodadadi/stylepeek/actions)
[![npm](https://img.shields.io/npm/v/stylepeek)](https://www.npmjs.com/package/stylepeek)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Point stylepeek at any URL and get back a ready-to-use Tailwind config, CSS variables, Figma tokens, or a visual HTML style guide — in seconds.

![stylepeek demo](assets/demo.gif)

---

## Use It

Stylepeek comes in **three flavors** — pick whichever fits your workflow.

### 1. Command Line (CLI)

![stylepeek help](assets/help.gif)

```bash
# Install
npm i -g stylepeek          # or: pnpm add -g stylepeek

# Analyze a website
stylepeek crawl https://stripe.com

# Quick single-page scan
stylepeek preview https://stripe.com

# Compare two sites side-by-side
stylepeek diff https://site-a.com https://site-b.com
```

That's it. Output lands in `./stylepeek-output/` by default.

#### Common options

```
stylepeek crawl <url>
  -o, --output <dir>     Output directory (default: ./stylepeek-output)
  -f, --format <fmt...>  Formats: html, tailwind, css-vars, style-dict, figma, json
  -d, --depth <n>        Crawl depth (default: 3)
  -p, --pages <n>        Max pages (default: 20)
  --assets               Also download fonts, images, and icons
```

Run `stylepeek --help` for the full list.

### 2. Web App (no install needed)

Run the built-in web interface — no CLI required:

```bash
# Clone & start
git clone https://github.com/ebrahimkhodadadi/stylepeek.git
cd stylepeek && pnpm install && pnpm build
pnpm dev:web
# → open http://localhost:5173
```

Enter a URL, hit **Analyze**, and watch the real-time progress. The dashboard shows:

| Tab | What you get |
|-----|-------------|
| **Overview** | Page count, framework detection, crawl duration, total tokens |
| **Colors** | Palette strip, color groups, gradients, click-to-copy (hex/rgb/hsl) |
| **Typography** | Font families, size scale, weights, line heights, text styles |
| **Spacing** | Visual spacing scale, border radii, breakpoints, z-index |
| **Shadows & Components** | Shadow previews, auto-detected UI components |
| **Export** | Download Tailwind config, CSS vars, Style Dictionary, Figma tokens, JSON, HTML guide |
| **Tech Stack** | Detected framework, font sources, transitions, SVG icons |

### 3. Chrome Extension

Inspect any page you're already viewing — no crawling needed:

1. Build the project: `pnpm build`
2. Open `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** → select `packages/extension/dist/`
4. Navigate to any website and click the **Stylepeek** icon

The popup shows colors, fonts, and spacing. Open DevTools (F12) → **Stylepeek** panel for full inspection.

---

## Output Formats

Every analysis can be exported in six formats:

| Format | Output file | Use case |
|--------|------------|----------|
| **HTML** | `style-guide.html` | Visual reference with dark mode, search, click-to-copy |
| **Tailwind** | `tailwind.config.js` | Drop into any Tailwind project |
| **CSS Variables** | `variables.css` | `:root` stylesheet with custom properties |
| **Style Dictionary** | `tokens.style-dict.json` | Multi-platform design tokens (Amazon format) |
| **Figma Tokens** | `tokens.figma.json` | Sync with Figma via Token Studio |
| **JSON** | `design-system.json` | Raw data for custom tooling |

---

## What Gets Extracted

| Category | Details |
|----------|---------|
| **Colors** | Hex, RGB, HSL, named colors, CSS variables, gradients, semantic roles |
| **Typography** | Font families, sizes, weights, line heights, letter spacing, text styles |
| **Spacing** | Margins, paddings, gaps — normalized to a scale |
| **Border Radius** | All unique radius values |
| **Shadows** | Box shadows with parsed layers |
| **Breakpoints** | Media query min/max-width values |
| **Z-Index** | Stacking context values |
| **Transitions** | CSS transitions and animations |
| **Components** | Auto-detected UI patterns (buttons, cards, nav, etc.) |
| **Assets** | Fonts (Google/Adobe), images, inline SVG icons |

---

## Configuration (optional)

Create a config file for repeatable setups:

```bash
stylepeek init   # generates stylepeek.config.ts
```

```ts
import { defineConfig } from '@stylepeek/core';

export default defineConfig({
  crawl: {
    depth: 3,
    workers: 3,
    waitAfterLoad: 1000,
    headless: true,
  },
  extract: {
    minUsage: 2,
    groupSimilarColors: true,
    colorSimilarityThreshold: 5,
    detectComponents: true,
  },
  output: {
    formats: ['html', 'tailwind', 'css-vars', 'json'],
    dir: './stylepeek-output',
  },
  assets: {
    download: [], // ['fonts', 'images', 'icons']
  },
});
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Playwright browser not found** | Run `pnpm playwright:install` |
| **`pnpm dev` appears to hang** | Normal — it starts file watchers. Work in a separate terminal. |
| **CLI command not found after link** | Add `pnpm bin -g` output to your PATH |
| **Extension popup is blank** | Make sure you ran `pnpm build` first and are on a real website (not `chrome://`) |
| **Port 3001 access denied (Windows)** | Hyper-V reserves ports 2906–3005. Web app uses port 4201 instead. |

---

# For Developers

Everything below is for contributors and people building on top of stylepeek.

## Project Structure

```
stylepeek/
├── packages/
│   ├── core/           # Extraction engine — crawl, parse, analyze, export
│   ├── cli/            # Command-line tool (Commander + chalk + ora)
│   ├── extension/      # Chrome extension (MV3, React + Tailwind)
│   └── web/            # Web SPA (React + Vite frontend, Express SSE backend)
├── turbo.json          # Turborepo pipeline config
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Setup

```bash
git clone https://github.com/ebrahimkhodadadi/stylepeek.git
cd stylepeek
pnpm install
pnpm build
pnpm playwright:install   # required for crawling
```

## Scripts

| Command | What it does |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode — rebuilds core, CLI, and extension on changes |
| `pnpm dev:web` | Start web app (API on 4201 + Vite on 5173) |
| `pnpm test` | Run all tests (63 tests via Vitest) |
| `pnpm typecheck` | TypeScript type-check all packages |
| `pnpm clean` | Remove all dist folders and node_modules |
| `pnpm playwright:install` | Install Chromium for Playwright |

### Working on individual packages

```bash
pnpm --filter @stylepeek/core build    # Core only
pnpm --filter @stylepeek/core test     # Core tests only
pnpm --filter stylepeek build          # CLI only
pnpm --filter @stylepeek/extension build  # Extension only
pnpm --filter @stylepeek/web build     # Web app only
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict, ESM) |
| Crawler | Playwright |
| CSS Parsing | PostCSS + custom extractors |
| Color Analysis | chroma-js |
| CLI | Commander + chalk + ora |
| Extension | React + Tailwind + @crxjs/vite-plugin (MV3) |
| Web App | React + Vite (client) + Express SSE (server) |
| Build | tsup (core/CLI), Vite (extension/web) |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest |
| Validation | Zod |

## Web App Architecture

The web package has a split architecture:

- **Express server** (`src/server/`) — crawls via `@stylepeek/core`, streams progress via SSE, generates exports
- **React client** (`src/client/`) — Vite-built SPA with Tailwind, proxies API calls to Express
- **Shared types** (`src/shared/`) — TypeScript interfaces for SSE events and design system data

In development, Vite runs on port 5173 and proxies `/api` to Express on port 4201. In production, Express serves the built SPA static files.

## Production Web Build

```bash
pnpm --filter @stylepeek/web build
# dist/client/  ← static SPA assets
# dist/server/  ← compiled Express server

pnpm start:web
# Serves both SPA and API on port 4201
```

## Contributing

1. Fork and clone
2. `pnpm install && pnpm build`
3. Create a feature branch
4. Make changes, run `pnpm test && pnpm typecheck`
5. Open a PR

### Regenerating demo GIFs

Demo GIFs in `assets/` are generated automatically by the [VHS workflow](.github/workflows/vhs.yml) on every push to `main`. To regenerate locally:

```bash
# 1. Install VHS — https://github.com/charmbracelet/vhs
#    macOS:    brew install vhs
#    Arch:     pacman -S vhs
#    Windows:  scoop install vhs

# 2. Build the project and make the CLI available
pnpm build
pnpm playwright:install
pnpm --filter stylepeek exec -- npm link   # adds `stylepeek` to your PATH

# 3. Generate the GIFs
vhs assets/help.tape   # → assets/help.gif
vhs assets/demo.tape   # → assets/demo.gif  (requires internet, crawls example.com)
```

## License

[MIT](LICENSE)
