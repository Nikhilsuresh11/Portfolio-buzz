# Portfolio Buzz — Next.js Frontend

This folder contains a clean Next.js frontend that replicates the Streamlit UI/UX (login, signup, watchlist/dashboard, search, analysis report) in a simple, modern design.

Quick start (from repository root):

```powershell
cd frontend
npm install
npm run dev
```

Notes:
- The frontend expects backend endpoints for authentication, watchlist and analysis (see `lib/api.js`). If your backend is Streamlit, you'll need to provide a REST API or adapt the fetch calls.
- Authentication and watchlist are persisted to `localStorage` by default so the UI works even without a backend.

Files created:
- `pages/auth/login.js`, `pages/auth/signup.js`
- `pages/index.js` (dashboard)
- `pages/analysis.js`
- `components/*` UI components
- `lib/api.js` lightweight fetch wrapper
- `styles/globals.css` simple CSS for a clean, dazzling UI

If you want, I can wire the frontend to your Streamlit app by adding small HTTP endpoints or run the app for you locally.
