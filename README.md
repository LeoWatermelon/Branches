# Branches 🌿

Branches is a motivational organization prototype for documenting main goals and breaking each one into smaller, connected tasks. Instead of treating planning like a flat checklist, Branches lets each task grow into smaller tasks, so users can move from a broad goal to specific next steps.

![Branches preview](Branches%20UI/Main%20preview.png)

## Features

- Start from a dedicated main-goals page
- Create main goals with icons and deadlines
- Open a main goal into a focused workspace
- Add smaller tasks from any task
- View the same task structure in three modes:
  - **Branches** — a visual branch-inspired workspace
  - **Mindmap** — a clearer node-based task map
  - **Plan Board** — a row-based planning view
- Edit task names, notes, due dates, and priority numbers
- Move a task, including all of its smaller tasks, under another task
- Mark tasks as done, even when smaller tasks are unfinished, with confirmation
- Restore completed tasks back into progress
- Remove completed tasks into a collection
- Restore removed tasks from the collection
- Undo the most recent structural or status action
- Progress tracking for the currently selected task
- In-app confirmations and disabled-button hints

## Tech Stack

Plain HTML, CSS, and JavaScript — no build step or framework. Task data is persisted client-side with `localStorage`.

## Getting Started

This is a static prototype with no dependencies to install. From the project folder, run:

```bash
npm start
```

This serves the app at:

```text
http://localhost:5173
```

Alternatively, serve it directly with Python:

```bash
python3 -m http.server 5173
```

## Project Structure

```text
.
├── index.html          # App shell and markup
├── styles.css           # Styling for all three view modes
├── app.js               # App state, rendering, and interactions
├── assets/               # Background textures and reference images
├── Branches UI/          # Preview screenshots
├── Branches PRD.pdf      # Product requirements doc
└── package.json
```

## Notes

Task data is currently stored in the browser with `localStorage`, so this prototype does not include accounts, cloud sync, or database persistence yet.

## Status

Functional prototype ready for GitHub.
