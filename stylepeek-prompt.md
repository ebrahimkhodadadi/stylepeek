# Prompt: Build `stylepeek` — Frontend Design Extractor (CLI + Browser Extension)

## Project Name & Concept

**`stylepeek`** — A tool that crawls any website and extracts its complete design system: colors, typography, spacing, fonts, images, icons, and component-level CSS. Outputs are ready to drop into a new project as Tailwind config, CSS variables, Figma tokens, or a visual HTML style guide.

Target users: frontend developers who want to reverse-engineer or reference a site's design system without manually inspecting DevTools.

---

## Architecture Overview

The project has **two separate deliverables** that share a core extraction engine:

```
stylepeek/
├── packages/
│   ├── core/               # Shared extraction logic (TypeScript)
│   │   ├── src/
│   │   │   ├── crawler/    # Playwright-based page crawler
│   │   │   ├── extractor/  # CSS/asset extraction engine
│   │   │   ├── analyzer/   # Design token analysis & normalization
│   │   │   ├── exporter/   # Output format generators
│   │   │   └── types/      # Shared TypeScript types
│   │   └── package.json
│   │
│   ├── cli/                # Node.js CLI (TypeScript)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── crawl.ts
│   │   │   │   ├── extract.ts
│   │   │   │   └── preview.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── extension/          # Chrome/Firefox Browser Extension (TypeScript)
│       ├── src/
│       │   ├── background/
│       │   ├── content/
│       │   ├── popup/
│       │   └── panel/      # DevTools panel
│       ├── manifest.json   # Manifest V3
│       └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Use **pnpm workspaces** + **Turborepo** for monorepo management.

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Language | TypeScript (strict) | Frontend-native, runs in browser and Node |
| Crawler (CLI) | **Playwright** | Full SPA support, intercepts network, evaluates JS |
| CSS Parsing | **PostCSS** + custom parser | Handles all CSS including CSS-in-JS extracted styles |
| Color Analysis | **chroma-js** | Color space conversion, similarity grouping |
| CLI UI | **Ink** (React for terminal) + **ora** + **chalk** | Rich terminal experience |
| Extension UI | **React** + **Tailwind** (ironic but practical) | DevTools panel + popup |
| Build | **tsup** for packages, **Vite** for extension | Fast builds |
| Testing | **Vitest** | Fast, ESM-native |

---

## Part 1: CLI Tool (`packages/cli`)

### Installation & Basic Usage

```bash
# Install globally
npm install -g stylepeek
# or
pnpm add -g stylepeek

# Basic crawl — outputs everything to ./stylepeek-output/
stylepeek crawl https://stripe.com

# Specific format
stylepeek crawl https://linear.app --format tailwind

# Multiple formats at once
stylepeek crawl https://vercel.com -f tailwind -f css-vars -f figma -f html

# Single page (no crawling)
stylepeek extract https://stripe.com/payments

# Download all fonts
stylepeek crawl https://figma.com --assets fonts --out ./fonts/

# Download all images + icons
stylepeek crawl https://figma.com --assets images,icons --out ./assets/

# Full everything
stylepeek crawl https://example.com --format all --assets all --out ./design-system/

# Preview HTML style guide in browser
stylepeek preview https://example.com

# Crawl with auth (cookie, header, or interactive login)
stylepeek crawl https://app.example.com --cookie "session=abc"
stylepeek crawl https://app.example.com --header "Authorization: Bearer token"
```

### CLI Commands

#### `stylepeek crawl <url>` — Main command

Crawls the entire site (follows internal links) and extracts the full design system.

**Flags:**

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--format` | `-f` | `all` | Output formats: `tailwind`, `css-vars`, `style-dict`, `figma`, `html`, `json`, `all` |
| `--out` | `-o` | `./stylepeek-output/` | Output directory |
| `--assets` | | `none` | Download assets: `fonts`, `images`, `icons`, `svg`, `all` |
| `--depth` | | `2` | Crawl depth (0 = single page) |
| `--workers` | | `3` | Concurrent Playwright pages |
| `--headless` | | `true` | Run headless (set `false` to watch) |
| `--wait` | | `1000` | Wait ms after page load for JS to settle |
| `--include` | | | URL regex to include |
| `--exclude` | | | URL regex to exclude |
| `--cookie` | | | Session cookie string |
| `--header` | | | Custom request header |
| `--proxy` | | | HTTP/SOCKS5 proxy |
| `--ignore-tls` | | `false` | Skip TLS verification |
| `--merge-breakpoints` | | `true` | Merge responsive variants into one token set |
| `--min-usage` | | `2` | Min times a value must appear to be included as a token |
| `--verbose` | `-v` | `false` | Verbose logging |
| `--config` | `-c` | | Path to `stylepeek.config.ts` |

#### `stylepeek extract <url>` — Single page, no crawling

Same flags as `crawl` but processes only the given URL.

#### `stylepeek preview <url>` — Launch HTML style guide in browser

Extracts design tokens and opens a live HTML style guide at `localhost:3456`.

#### `stylepeek diff <url1> <url2>` — Compare two sites' design systems

Shows which tokens differ between two sites (useful for comparing staging vs production, or referencing a competitor).

#### `stylepeek config init` — Generate `stylepeek.config.ts`

---

## Part 2: Browser Extension (`packages/extension`)

### Manifest V3 — Chrome + Firefox compatible

The extension has three surfaces:

**1. Popup** (click the toolbar icon)
- Quick color palette preview of current page
- One-click copy of CSS variables or Tailwind config snippet
- Button to open full DevTools panel

**2. DevTools Panel** (`chrome.devtools` API)
- Full design system view for the current page
- Tabs: Colors | Typography | Spacing | Components | Assets
- Real-time — updates as you navigate
- Export buttons for each format
- Preview of each token with live swatch/example

**3. Content Script**
- Injected into every page
- Reads `document.styleSheets`, `getComputedStyle`, and inline styles
- Intercepts `<link rel="stylesheet">` and `@font-face` declarations
- Sends data to background service worker via `chrome.runtime.sendMessage`

### Extension Features

- **Element Inspector mode**: click any element on the page → see all computed design tokens for that element (colors, font, spacing, border, shadow)
- **Copy to clipboard**: one click copies a Tailwind class string, CSS snippet, or hex color
- **Export panel**: download all extracted tokens as any supported format
- **Diff mode**: compare current page design tokens against a saved baseline

---

## Part 3: Core Extraction Engine (`packages/core`)

This is the shared library used by both CLI and extension.

### 3.1 Crawler (`core/src/crawler/`)

**CLI uses Playwright:**
- Launch Chromium (or Firefox) via Playwright
- Navigate to URL, wait for network idle + JS hydration
- Inject extraction content script into the page context
- Follow internal links up to configured depth using a queue + visited set
- Concurrent pages via `Promise.all` with worker limit
- Intercept network requests to capture: stylesheet URLs, font file URLs, image URLs
- Handle SPAs: wait for route changes, re-extract after navigation

**Extension uses browser APIs directly:**
- `document.styleSheets` — iterate all loaded stylesheets
- `getComputedStyle(el)` — computed styles for any element
- `performance.getEntriesByType('resource')` — all loaded resources
- `MutationObserver` — detect dynamic style changes

### 3.2 CSS Extractor (`core/src/extractor/`)

Extract the following from every page:

**Colors:**
- Parse all CSS rules for color-related properties: `color`, `background-color`, `border-color`, `fill`, `stroke`, `box-shadow`, `outline-color`, `text-decoration-color`
- Parse inline styles
- Parse CSS custom properties (`--*`) from `:root` and other selectors
- Convert all color formats to a normalized object: `{ hex, rgb, hsl, oklch, name? }`
- Group similar colors by perceptual distance (using chroma-js deltaE) — e.g., 12 slightly different grays → grouped as "gray scale"
- Detect semantic naming from CSS variable names: `--color-primary`, `--brand-blue`, etc.
- Extract gradient definitions

**Typography:**
- `font-family` — all used font stacks, deduplicated
- `font-size` — all used sizes, normalized to rem
- `font-weight` — all used weights
- `line-height` — all used values
- `letter-spacing` / `word-spacing`
- `text-transform`
- Detect heading hierarchy: which font styles are used on `h1`–`h6`
- Map computed styles for common text elements: `p`, `h1`–`h6`, `a`, `button`, `label`, `code`

**Spacing:**
- Extract all unique values of `margin`, `padding`, `gap`, `top/right/bottom/left` from all rules
- Detect spacing scale pattern (e.g., 4px base unit → 4, 8, 12, 16, 24, 32…)
- Map to Tailwind spacing scale if it matches (e.g., 4px = `1`, 8px = `2`, etc.)

**Border & Radius:**
- `border-radius` — all unique values
- `border-width`
- `border-style`

**Shadows:**
- `box-shadow` — all unique values, named by size (sm/md/lg/xl)
- `text-shadow`
- `filter: drop-shadow`

**Breakpoints:**
- Detect `@media (min-width: ...)` and `@media (max-width: ...)` declarations
- Map to Tailwind-compatible breakpoint names (sm/md/lg/xl/2xl)

**Z-index:**
- All unique `z-index` values, sorted

**Transitions & Animations:**
- `transition-duration`, `transition-timing-function`
- `animation` keyframe names and durations

**Component-level CSS:**
- For each detected "component" (identified by BEM class patterns, data attributes, or recurring class clusters), extract all CSS rules that apply to it
- Output as a self-contained CSS snippet per component
- Name components intelligently: `.btn`, `.card`, `.nav`, `.modal`, etc.

### 3.3 Asset Extractor (`core/src/extractor/assets.ts`)

**Fonts:**
- Detect all `@font-face` declarations: `font-family`, `src` URLs, `font-weight`, `font-style`
- Download font files (`.woff2`, `.woff`, `.ttf`, `.otf`) to `--out/fonts/`
- Generate a `fonts.css` with local `@font-face` declarations pointing to downloaded files
- Also detect Google Fonts / Adobe Fonts `<link>` tags and note them

**Images:**
- Collect all `<img>` `src` and `srcset` URLs
- Collect CSS `background-image: url(...)` values
- Filter by type: photos (jpg/png/webp), icons (svg, small png), favicons
- Deduplicate by URL
- Download to `--out/images/` with original filenames
- Generate an `image-manifest.json` with all metadata

**Icons / SVGs:**
- Collect all inline `<svg>` elements — extract SVG source, detect viewBox, name by `id` or context
- Collect external `.svg` files
- Download / extract to `--out/icons/`
- Generate an icon sprite sheet (optional `--sprite` flag)

### 3.4 Analyzer (`core/src/analyzer/`)

After extraction, the analyzer **normalizes and names** raw values into a structured design token tree.

**Token naming strategy:**
1. Use existing CSS variable names if available (`--color-primary` → `primary`)
2. Use semantic naming from context (color used most on buttons → `brand`, color used for errors → `danger`)
3. Fall back to generated names (`gray-100`, `gray-200`, etc.)
4. For spacing: map to T-shirt sizes if no scale detected (xs/sm/md/lg/xl)

**Output structure (internal `DesignSystem` type):**

```typescript
interface DesignSystem {
  meta: {
    url: string
    crawledAt: string
    pageCount: number
    framework?: 'tailwind' | 'bootstrap' | 'chakra' | 'mantine' | 'mui' | 'unknown'
  }
  colors: {
    palette: ColorToken[]        // all unique colors
    groups: ColorGroup[]         // perceptually grouped (grays, blues, etc.)
    semantic: SemanticColors     // primary, secondary, danger, warning, success, info
    gradients: GradientToken[]
  }
  typography: {
    fontFamilies: FontFamilyToken[]
    fontSizes: ScaleToken[]
    fontWeights: number[]
    lineHeights: ScaleToken[]
    letterSpacing: ScaleToken[]
    textStyles: TextStyleToken[]  // named combos: heading1, body, caption, etc.
  }
  spacing: ScaleToken[]
  borderRadius: ScaleToken[]
  shadows: ShadowToken[]
  breakpoints: BreakpointToken[]
  zIndex: number[]
  transitions: TransitionToken[]
  components: ComponentToken[]
  assets: {
    fonts: FontAsset[]
    images: ImageAsset[]
    icons: IconAsset[]
  }
}
```

**Framework detection:** Detect if the site uses Tailwind (class patterns like `text-sm`, `bg-blue-500`), Bootstrap (`col-md-6`, `btn-primary`), or other CSS frameworks, and note this in meta.

### 3.5 Exporters (`core/src/exporter/`)

Implement an `Exporter` interface:

```typescript
interface Exporter {
  format: string
  extension: string
  export(ds: DesignSystem): ExportFile | ExportFile[]
}

interface ExportFile {
  filename: string
  content: string
  mimeType: string
}
```

#### a) Tailwind Config (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', 50: '#eef2ff', ... },
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        // ...
      },
      spacing: { 1: '4px', 2: '8px', ... },
      borderRadius: { sm: '4px', md: '8px', ... },
      boxShadow: { sm: '...', md: '...', ... },
      screens: { sm: '640px', md: '768px', ... },
    }
  }
}
```

#### b) CSS Variables (`:root` block)

```css
/* Generated by stylepeek — https://github.com/you/stylepeek */
/* Source: https://stripe.com — 2025-07-10 */

:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-primary-50: #eef2ff;
  --color-danger: #ef4444;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-sm: 0.875rem;
  --line-height-normal: 1.5;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
```

#### c) Style Dictionary JSON

```json
{
  "color": {
    "primary": { "value": "#6366f1", "type": "color" },
    "danger": { "value": "#ef4444", "type": "color" }
  },
  "font": {
    "family": {
      "sans": { "value": "Inter, system-ui, sans-serif", "type": "fontFamily" }
    },
    "size": {
      "sm": { "value": "0.875rem", "type": "fontSize" }
    }
  }
}
```

#### d) Figma Tokens JSON

Compatible with the **Figma Tokens** plugin (token studio format):

```json
{
  "global": {
    "colors": {
      "primary": { "value": "#6366f1", "type": "color" },
      "primary-50": { "value": "#eef2ff", "type": "color" }
    },
    "typography": {
      "heading-1": {
        "value": {
          "fontFamily": "Inter",
          "fontWeight": "700",
          "fontSize": "2.25rem",
          "lineHeight": "2.5rem"
        },
        "type": "typography"
      }
    },
    "spacing": {
      "1": { "value": "4", "type": "spacing" }
    }
  }
}
```

#### e) HTML Style Guide (Priority output — most useful for frontend devs)

Generate a **beautiful, self-contained single HTML file** (`style-guide.html`) that acts as a live visual reference for the extracted design system. Include everything inline (no external dependencies).

Sections:
1. **Header** — source URL, crawl date, page count, detected framework
2. **Color Palette** — swatches with hex/rgb/hsl values, click to copy, grouped by hue family
3. **Typography** — live text samples at each detected size/weight/family combination
4. **Spacing Scale** — visual bars showing each spacing value
5. **Border Radius** — visual boxes showing each radius value
6. **Shadows** — visual boxes with each shadow applied
7. **Breakpoints** — table of all detected breakpoints
8. **Components** — live rendered HTML+CSS snippets for each detected component (with syntax-highlighted source code below each one)
9. **Fonts** — list of all font families with download links if available
10. **Assets** — image gallery and icon grid with download buttons
11. **Export** — download buttons for all other formats (tailwind, css-vars, figma, style-dict)

The HTML style guide must:
- Be fully self-contained (no CDN, no external fonts for the guide's own UI)
- Have a clean, minimal design (dark/light mode toggle)
- Have a sticky sidebar navigation
- Have a search/filter input for colors and tokens
- All values clickable to copy to clipboard
- Show the raw CSS value AND the token name

---

## CLI UX Requirements

Use **Ink** (React for terminals) for the CLI UI. The crawl progress screen should show:

```
  stylepeek  https://stripe.com

  ┌─────────────────────────────────────────────┐
  │  Crawling...                    3 / 12 pages │
  │  ████████░░░░░░░░░░░░░░░░░░░░░  25%          │
  └─────────────────────────────────────────────┘

  Discovered so far:
  ● 47 colors          ● 8 font families
  ● 12 font sizes      ● 16 spacing values
  ● 6 border radii     ● 4 shadows
  ● 3 breakpoints      ● 24 components

  Current: https://stripe.com/payments
  Workers: [●●●] 3 active

  Press Q to stop and export partial results
```

After crawl finishes:

```
  ✓ Crawl complete — 12 pages in 8.3s

  Design System Summary:
  ├─ Colors         48 unique (grouped into 8 families)
  ├─ Typography     5 font families, 10 sizes, 6 weights
  ├─ Spacing        14 unique values (4px base scale detected)
  ├─ Components     24 detected
  └─ Assets         6 fonts, 34 images, 18 icons

  Output written to ./stylepeek-output/stripe.com/
  ├─ tailwind.config.js
  ├─ variables.css
  ├─ tokens.style-dict.json
  ├─ tokens.figma.json
  ├─ style-guide.html            ← open this!
  └─ assets/
     ├─ fonts/   (6 files)
     ├─ images/  (34 files)
     └─ icons/   (18 files)

  Preview: stylepeek preview ./stylepeek-output/stripe.com/style-guide.html
```

---

## Extension UX Requirements

### Popup (300×400px)
- Mini color palette (top 8 colors as swatches)
- Primary font name
- Quick stats (X colors, Y components)
- "Open Panel" button → opens DevTools panel
- "Copy CSS Variables" button → copies `:root` block to clipboard
- "Copy Tailwind Config" button → copies theme extend object

### DevTools Panel (full width/height)
Tabs across top: **Colors | Typography | Spacing | Borders | Shadows | Components | Assets | Export**

Each tab shows:
- Filterable/searchable list of tokens
- Visual preview of each token
- Click any token → copies its value (or CSS var name, or Tailwind class) to clipboard
- Toggle between "Token Name" and "Raw Value" display

**Element Inspector mode** (toolbar button):
- Click to activate → cursor becomes crosshair
- Click any element on page → panel shows all tokens used by that element
- Highlight: background color, text color, font, padding, margin, border, shadow

**Export tab:**
- Checkboxes for each format
- "Export Selected" button → downloads as ZIP
- "Copy to Clipboard" for individual formats

---

## TypeScript Requirements

- **Strict TypeScript** throughout (`"strict": true`)
- No `any` — use proper types everywhere
- All `Exporter` implementations must satisfy the interface
- Use **Zod** for runtime validation of config files and any JSON inputs
- Use **Result types** (`{ ok: true, value: T } | { ok: false, error: Error }`) for operations that can fail — no uncaught promise rejections
- Use **`p-limit`** for concurrency control in the crawler
- Use **`p-retry`** with exponential backoff for HTTP requests
- All public functions must have JSDoc comments

---

## Dependencies

```json
// packages/core
"dependencies": {
  "playwright": "^1.x",
  "postcss": "^8.x",
  "chroma-js": "^3.x",
  "p-limit": "^6.x",
  "p-retry": "^6.x",
  "zod": "^3.x"
},

// packages/cli  
"dependencies": {
  "@stylepeek/core": "workspace:*",
  "ink": "^5.x",
  "commander": "^12.x",
  "chalk": "^5.x",
  "ora": "^8.x",
  "conf": "^13.x"
},

// packages/extension
"dependencies": {
  "@stylepeek/core": "workspace:*",  // shared types only (no Playwright in extension)
  "react": "^18.x",
  "webextension-polyfill": "^0.x"
},
"devDependencies": {
  "vite": "^5.x",
  "@crxjs/vite-plugin": "^2.x"  // Chrome Extension + Vite
}
```

---

## Configuration File (`stylepeek.config.ts`)

```typescript
import { defineConfig } from 'stylepeek'

export default defineConfig({
  crawl: {
    depth: 3,
    workers: 5,
    waitAfterLoad: 1500,
    exclude: ['/blog/**', '/docs/**'],
  },
  extract: {
    minUsage: 2,              // ignore values used only once
    mergeBreakpoints: true,
    groupSimilarColors: true,
    colorSimilarityThreshold: 5,  // deltaE threshold for grouping
    detectComponents: true,
  },
  assets: {
    download: ['fonts', 'icons'],
    maxImageSize: 500_000,    // skip images > 500KB
  },
  output: {
    formats: ['tailwind', 'css-vars', 'html'],
    dir: './design-system/',
    tailwind: {
      prefix: '',             // add prefix to all color names
      includeBase: true,      // merge with Tailwind's default palette
    },
    cssVars: {
      selector: ':root',
      prefix: '--',
    },
  },
})
```

---

## Testing Requirements

- Unit tests with **Vitest** for all extractors and exporters
- Use fixture HTML files as test input (no network calls in unit tests)
- Integration test: spin up a local Express server with known HTML/CSS → run crawler → assert extracted tokens
- Extension tests: use `@testing-library/react` for popup and panel components
- Test coverage > 80% for `core` package

---

## CI/CD

`.github/workflows/ci.yml`:
- Lint (ESLint + TypeScript `tsc --noEmit`)
- Test (Vitest)
- Build all packages
- On tag push: build extension ZIP + publish CLI to npm

---

## README Requirements

- Badges: npm version, license, CI status
- Animated GIF demo (use VHS or asciinema)
- Quick start (3 commands to get from zero to style guide)
- Full format comparison table
- Extension screenshots
- Architecture diagram
- "How it works" section
- Contributing guide

---

## Deliverables

Generate the **complete, working project** including:

1. All TypeScript source files with full implementation (not stubs or TODOs)
2. `pnpm-workspace.yaml` + all `package.json` files
3. `turbo.json`
4. Extension `manifest.json` (Manifest V3)
5. All Vite/tsup config files
6. `vitest.config.ts` + test fixtures + test files
7. `stylepeek.config.ts` example
8. `.github/workflows/ci.yml`
9. `README.md` with full documentation
10. `LICENSE` (MIT)

All code must compile and run. The HTML style guide output must be visually polished. The CLI must have a great terminal UX. The extension must work in Chrome out of the box.

**Priority order for implementation:**
1. `core` extractor (colors, typography, spacing)
2. HTML style guide exporter
3. CLI with Ink UI
4. Tailwind + CSS vars exporters
5. Figma + Style Dictionary exporters
6. Asset downloader
7. Browser extension
8. Component detection
