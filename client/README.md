# MedOrbit — Client 🩺

React 19 + Vite 7 frontend for MedOrbit. Requires **Node.js 20.19+** (or 22.12+).

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env.local` in this directory first:

```env
VITE_API_URL=http://localhost:5000
```

The dev server starts on **http://localhost:5173** and expects the API on port 5000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

See the [root README](../README.md) for full setup, environment variables, and architecture notes.
