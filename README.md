# Branches

Branches is a motivational organization prototype for documenting main goals and breaking each one into smaller, connected tasks. Instead of treating planning like a flat checklist, Branches lets each task grow into smaller tasks, so users can move from a broad goal to specific next steps.

## Features

- Start from a dedicated main-goals page
- Create main goals with icons and deadlines
- Open a main goal into a focused workspace
- Add smaller tasks from any task
- View the same task structure in three modes:
  - Branches: a visual branch-inspired workspace
  - Mindmap: a clearer node-based task map
  - Plan Board: a row-based planning view
- Edit task names, notes, due dates, and priority numbers
- Move a task, including all of its smaller tasks, under another task
- Mark tasks as done, even when smaller tasks are unfinished, with confirmation
- Restore completed tasks back into progress
- Remove completed tasks into a collection
- Restore removed tasks from the collection
- Undo the most recent structural or status action
- Progress tracking for the currently selected task
- In-app confirmations and disabled-button hints

## Running Locally

This is a static prototype. From the project folder, run:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── assets/
├── Branches PRD.pdf
└── Branches UI/
```

## Notes

Task data is currently stored in the browser with `localStorage`, so this prototype does not include accounts, cloud sync, or database persistence yet.

## Status

Functional prototype ready for GitHub.
