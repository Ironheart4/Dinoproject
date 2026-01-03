# DinoProject Frontend (scaffold)

This folder is a starter scaffold for the DinoProject frontend. It follows the UX/userflow you provided and contains placeholder pages and a small API client to connect to the backend at `http://localhost:5000`.

Quick start (from `frontend/`):

1. Install deps:

```
npm install
```

2. Run dev server:

```
npm run dev
```

Project layout (important files)
- `index.html` — Vite entry
- `src/main.tsx` — React entry
- `src/App.tsx` — router + layout
- `src/pages/*` — pages matching UX flows (Shop, Encyclopedia, Quiz, Custom Builder, etc.)
- `src/lib/api.ts` — small API helper to call backend endpoints

Extend: add `three` / `@react-three/fiber` when implementing the 3D viewer on the Dino Detail page.
