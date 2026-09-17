# AGENTS.md — AI Agent Instructions for Campus Connect

## Project Overview
Campus Connect is a college management system with a **React frontend (CRA)** and **Express + MongoDB backend**. It handles student leave requests, faculty leave, gate passes, attendance, events, sports, disciplinary actions, and more.

## Before Making Any Changes

1. **Read `rules.md`** — it contains all conventions, limitations, and patterns
2. **Read `client/DESIGN.md`** — it contains the UI design system and color tokens
3. **Check existing patterns** — grep for similar functionality before writing new code
4. **Never assume a library is available** — check `package.json` first

## Key File Locations

| What | Where |
|------|-------|
| Root CSS variables | `client/src/index.css` |
| Design system | `client/DESIGN.md` |
| Route definitions | `client/src/App.jsx` |
| Sidebar navigation | `client/src/components/Sidebar/DashboardSidebar.jsx` |
| Toast notifications | `client/src/components/Toast/Toast.jsx` |
| Confirm modal | `client/src/components/ConfirmModal/ConfirmModal.jsx` |
| Backend entry | `server/server.js` |
| Staff leave logic | `server/controllers/staffLeaveController.js` |
| Student leave logic | `server/controllers/studentLeaveController.js` |
| Tutor leave logic | `server/controllers/tutorLeaveController.js` |

## Common Tasks

### Adding a New Page
1. Create `client/src/pages/Module/PageName.jsx` + `PageName.css`
2. Import in `client/src/App.jsx`, add route
3. Add sidebar link in `DashboardSidebar.jsx` if needed
4. Add backend route in `server/routes/` if API needed

### Adding a New API Endpoint
1. Add controller function in `server/controllers/`
2. Add route in `server/routes/`
3. Register route in `server/server.js` (line ~100-150)
4. Use `authMiddleware` + `roleMiddleware` + `claimMiddleware`

### Converting Alerts to Modals
1. Import `ConfirmModal` from `../../components/ConfirmModal/ConfirmModal`
2. Add state: `const [alertModal, setAlertModal] = useState({ open: false, ... })`
3. Replace `window.alert(msg)` with `setAlertModal({ open: true, title: "...", message: msg, variant: "success" })`
4. Add `<ConfirmModal ... />` at end of JSX

### Fixing Hardcoded URLs
Replace: `"http://localhost:5000/api/..."` 
With: `` `${API}/api/...` `` where `const API = process.env.REACT_APP_API_URL || "http://localhost:5000";`

## What NOT To Do

- **DO NOT** use `import.meta.env.VITE_*` — this is CRA, not Vite
- **DO NOT** use `window.alert()`, `window.confirm()`, `window.prompt()` — use ConfirmModal
- **DO NOT** hardcode `localhost:5000` in frontend files
- **DO NOT** add new `:root` CSS variable declarations — use existing ones from `index.css`
- **DO NOT** use class components — use functional components with hooks
- **DO NOT** use Bootstrap or Tailwind — use vanilla CSS with the design system tokens
- **DO NOT** skip status validation in state transitions (backend)
- **DO NOT** skip audit logging on leave status changes

## Testing Checklist

After making changes, verify:
1. `npm start` in server/ — no crashes
2. Frontend builds without errors
3. No hardcoded localhost URLs in changed files
4. No `window.alert/confirm/prompt` in changed files
5. All API calls use the `API` constant with env var fallback
6. Modals use `ConfirmModal` component
