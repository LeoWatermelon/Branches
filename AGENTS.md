# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, etc.) working in this repo.

## What this project is

Branches is a static, client-side prototype for breaking long-term goals into
nested sub-tasks ("branches"), viewable as a branch diagram, a mindmap, or a
plan board. There is no backend — all state lives in the browser via
`localStorage`. See `README.md` for the feature list and product framing, and
`docs/branches-prd.pdf` for the original product spec.

## Git workflow

This repo is shared — changes can land on GitHub (`origin/main`) from outside
your session (e.g. edits made directly in the GitHub UI or by another
collaborator/agent). **Before making any local changes, run `git fetch
origin` and check `origin/main` against your local `main`; if it has moved,
pull/rebase before you start editing** so you're never working from a stale
tree and don't create an avoidable divergence. Rebase (not merge) local
commits on top of `origin/main` when they do diverge, to keep history linear.
Do the same fetch-and-check immediately before pushing, in case the remote
moved again while you were working.

## Committing and branching

Agents should automatically commit and push their own changes rather than
leaving work uncommitted for the user to handle:

- Always commit changes to an appropriately named branch (not directly to
  `main`) and push to `origin` as you go, rather than waiting until a task is
  "done."
- When you recognize that a new, distinct unit of work is starting (a fix, a
  bug, or a feature different from what's currently in progress), first open
  a PR for the branch you were just working on (if it isn't already open),
  then create a fresh branch for the new work off an up-to-date `main`.
- Keep each branch/PR scoped to one fix/feature — don't pile unrelated work
  into the same branch.

## Tech stack

Plain HTML/CSS/JavaScript. No framework, no bundler, no package manager
dependencies — `package.json` only defines convenience scripts. Do not
introduce a build step, framework, or npm dependency unless explicitly asked.

## File layout

```
index.html         Full DOM structure — every element the app touches by id, plus <template> nodes for repeated markup (tree cards, mindmap nodes, etc.)
src/styles.css      All styling for the header, goals page, and all three workspace views
src/app.js          Entire application logic (~1900 lines, single file, no modules)
assets/             Background textures and reference images used by src/styles.css (referenced with ../assets/ paths from CSS)
docs/screenshots/   Preview screenshots referenced from README.md
docs/branches-prd.pdf  Original product requirements document
design-qa.md        Latest Product Design QA report when a UI redesign is implemented
```

There is exactly one JS file and it is loaded directly by `index.html` with a
plain `<script src="src/app.js">` (no ES modules, no imports). Keep new code
in `src/app.js` unless the file's size genuinely warrants a split — ask
before introducing a module system.

## Running / checking the app

```bash
npm start   # python3 -m http.server 5173, then open http://localhost:5173
npm run check   # node --check src/app.js — syntax check only, not a real test suite
```

There are no automated tests. After any non-trivial change to `src/app.js`, run
`npm run check` and then manually exercise the change in a browser (see the
`run` skill / start the dev server and click through the flow) before calling
the work done.

## Data model (in `src/app.js`)

- `state` is a single object persisted to `localStorage` under `storageKey`
  (`src/app.js:1`). **Bump `storageKey`'s version suffix (e.g. `-v11` → `-v12`)
  whenever you change the shape of persisted data**, so old localStorage
  payloads from users' browsers don't crash the new code.
- `state.trees` is an array of goal trees. Each tree has a `root` branch and a
  `collection` (removed/completed items).
- Each branch node (`root`, and every item under `children`) is a recursive
  structure: `{ id, title, why, icon, finishedAt, deadline, order, children }`.
  There's no separate "task" type at the data level — tasks are just nested
  branches.
- `elements` (`src/app.js:46`) caches every DOM node the app reads/writes by
  `document.querySelector`. If you add UI, add its element(s) here rather than
  querying ad hoc inside render functions.
- Flow: `bindEvents()` wires DOM listeners → they mutate `state` → `render()`
  re-derives the DOM from `state`. Treat `state` as the single source of
  truth; don't hand-edit the DOM outside a `render*` function.

## Conventions to follow

- Functions are grouped by concern (render functions, mutation functions,
  tree-traversal helpers) but not namespaced — keep new functions named
  consistently with neighbors (`renderX`, `createX`, `getX`, `findX`).
- Undo support exists (`undoSnapshot`) — if you add a new destructive/
  structural action, wire it into the existing undo mechanism rather than
  adding a parallel one.
- Confirmation dialogs (`confirmOverlay` etc.) are the existing pattern for
  "are you sure" flows — reuse them instead of `window.confirm`.
- No comments-heavy style in this codebase; match the existing terse,
  self-documenting function naming rather than adding explanatory comments.

## Keeping this file current

Always update this file as part of your work, not as an afterthought — a
fresh chat has no memory of this session and relies on AGENTS.md to
understand the project's current state. When you change the file layout,
data model, conventions, workflow, or add/remove any notable piece of
architecture, update the relevant section here in the same change (and same
commit/PR) rather than leaving it stale.

## Things to avoid

- Don't add a package manager dependency, bundler, or framework without
  asking — this is deliberately a zero-dependency static prototype.
- Don't fetch from or assume a backend/API exists; there isn't one.
- Don't forget the `storageKey` version bump when changing persisted state
  shape, and don't remove the migration-friendly defaulting in `loadState()`
  without checking how it degrades for old saved data.
