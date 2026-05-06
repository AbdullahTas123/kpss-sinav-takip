# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

There is **no build step, no package.json, no test runner.** The app is a single-page React app loaded via React 18 UMD + Babel Standalone in the browser.

- To run: open [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html) directly in a browser, or serve the directory over any static server (`python -m http.server`, `npx serve`, etc.). All `.jsx` files are transformed in-browser by Babel — there is no compilation step on the developer side.
- To reset state: in the browser DevTools console, run `kpssStore.reset()` (restore seed data) or `kpssStore.clear()` (wipe everything). State persists in `localStorage` under key `kpss-takip-store-v1`.
- Source language: all UI strings are Turkish (`tr-TR`). Keep new strings Turkish to match.

## Architecture

### Global-namespace module pattern (no bundler)

Each `.jsx`/`.js` file is loaded as a separate `<script>` from [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html) and exposes its public API by attaching to `window`. There are **no ES imports** — everything is wired through globals:

| Global | Defined in | Consumed by |
|---|---|---|
| `window.KPSS_SUBJECTS`, `KPSS_EXAM_DATE`, `KPSS_APPLY_DATE` | [subjects.js](subjects.js) | every page |
| `window.kpssStore` | [store.js](store.js) | dashboard, questions, exams |
| `window.KPSS_UI` (Card, Button, Input, Select, Label, Chip, Tabs, Icon, fmtDate, fmtDateShort, calcNet, round2) | [ui.jsx](ui.jsx) | all pages |
| `window.KPSS_SHELL` (Sidebar, Topbar), `window.useViewport` | [shell.jsx](shell.jsx) | [app.jsx](app.jsx), pages that need responsive width |
| `window.KPSS_DASHBOARD` / `KPSS_QUESTIONS` / `KPSS_EXAMS` | their respective pages | [app.jsx](app.jsx) router |
| `window.KPSS_EXAM_CHART` | [exam-chart.jsx](exam-chart.jsx) | [exams.jsx](exams.jsx) |

**Script load order in the HTML matters**: `subjects.js` → `store.js` → `ui.jsx` → `shell.jsx` → page components → `exams.jsx` (depends on `exam-chart.jsx`) → `app.jsx`. When adding a new file, register the script tag in the correct dependency position.

The hooks (`useState`, `useEffect`, etc.) are aliased per file (`useStateApp`, `useStateShell`, …) because Babel Standalone runs every script in the same global scope and re-`const`-ing the same name across files would throw.

### Routing

URL hash routing in [app.jsx](app.jsx) — `#dashboard`, `#questions`, `#exams`. `App` listens to `hashchange` and swaps between `KPSS_DASHBOARD` / `KPSS_QUESTIONS` / `KPSS_EXAMS`. There is no React Router.

### State / Store

[store.js](store.js) is a custom Zustand-shaped store: `get()`, `subscribe(fn)`, plus mutation methods that immutably replace `state.questions` / `state.exams` and call `save()` (which writes `localStorage` and notifies subscribers). No Redux, no context. Components subscribe in `useEffect` and `useState`-mirror the store.

State shape:
```js
{
  questions: [{ id, date, type: "konu" | "karma", subject, topic, total, correct, wrong, blank, weakTopics: [] }],
  exams: [
    // Genel (full-exam): per-subject correct/wrong, blank/total are derived from KPSS_SUBJECTS[k].fixedCount
    { id, type: "genel", date, name, durationMin, subjects: { turkce: { correct, wrong, weakTopics }, ... } },
    // Branş (single-subject)
    { id, type: "brans", date, name, durationMin, subject, total, correct, wrong, blank, weakTopics }
  ]
}
```

Import/export goes through `kpssStore.exportJSON()` / `importJSON(file)`; backup files have `version`, `exportedAt`, `questions`, `exams`.

### Domain rules (must hold everywhere)

These are enforced in form validation but also assumed by chart/dashboard math — keep them consistent:

- `Net = correct − wrong / 4` (use `KPSS_UI.calcNet`)
- `Blank = Total − (Correct + Wrong)`, never user-entered
- `Correct + Wrong ≤ Total` (Soru Çözümü, Branş Deneme)
- Genel deneme per-subject ceilings are read from `KPSS_SUBJECTS[k].fixedCount` — Türkçe 30, Matematik 30, Tarih 27, Coğrafya 18, Vatandaşlık 15 (sum 120). If KPSS changes its distribution, edit only [subjects.js](subjects.js).
- Each subject has a single canonical color in `KPSS_SUBJECTS[k].color` — reuse it for graphs, badges, table headers; do not hardcode hexes per page.

### Styling

CSS-in-JS via inline `style={...}` props throughout. Dark palette is hardcoded — see [PROJE_OZETI.md](PROJE_OZETI.md) for the full token table (`#0a0a0c` bg, `#111114` surface, `#1f1f23` border, `#10b981` primary green, etc.). The only global CSS lives in the `<style>` block of the HTML (scrollbar, focus ring, number-input spinner reset, Inter font).

### Charts

SVG is hand-rolled in [dashboard.jsx](dashboard.jsx) (line trend) and [exam-chart.jsx](exam-chart.jsx) (multi-mode chart with subject toggles, 7g/1ay/3ay/Son 10 filter, touch-aware tooltip, `ResizeObserver`-based responsive width). No Recharts/D3 — when modifying, work directly with SVG path strings and the existing scale helpers in those files.

## Notes for editing

- [tweaks-panel.jsx](tweaks-panel.jsx) is **not loaded** by the HTML and is unused — leave it alone unless explicitly asked.
- Seed data (`seed()` in [store.js](store.js)) generates dates relative to "today" so the demo always looks fresh; tests/dashboards assume there is at least *some* exam data and degrade gracefully on empty state, so preserve that behaviour.
- The HTML filename contains a space and Turkish characters (`KPSS Sınav Takip.html`) — quote it in shell commands.
