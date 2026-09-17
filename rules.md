# Campus Connect — Codebase Rules & Conventions

## Architecture

```
Campus_Connect.v0.1/
├── client/          # React frontend (CRA, NOT Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI (Sidebar, Navbar, Toast, ConfirmModal)
│   │   ├── pages/         # Route-level page components
│   │   │   ├── Admin/     # UserManagement, WorkflowBuilder, RoleManagement
│   │   │   ├── Dashboard/ # WorkDashboard, CoverageDashboard
│   │   │   ├── LeaveRequest/ # StudentLeaveForm, TutorLeavereview, HODLeaveapproval, etc.
│   │   │   ├── GatePass/
│   │   │   ├── Event/
│   │   │   └── ...
│   │   ├── utils/         # Shared helpers (pdf generators, etc.)
│   │   ├── App.jsx        # Route definitions
│   │   └── index.css      # Root CSS variables (:root theme)
│   └── DESIGN.md          # UI design system reference
├── server/          # Express + MongoDB backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js          # Entry point, registers all routes
└── .gitignore
```

## Critical Rules

### 1. Environment Variables
- **Frontend (CRA):** Use `process.env.REACT_APP_*` — NEVER `import.meta.env.VITE_*`
- **Backend:** Use `process.env.VAR_NAME` via dotenv
- **All API URLs must use env var with localhost fallback:**
  ```js
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  ```
- **Never hardcode `http://localhost:5000`** in frontend files

### 2. No Native Browser Dialogs
- **NEVER use** `window.alert()`, `window.confirm()`, `window.prompt()`
- **Always use** the `ConfirmModal` component from `../../components/ConfirmModal/ConfirmModal`
- For text input prompts, use the inline prompt modal pattern (see TutorLeavereview.jsx)

### 3. React Component Rules
- Pages are **functional components with hooks** — no class components
- One component per file, filename matches component name
- Co-locate CSS: `MyComponent.jsx` → `MyComponent.css` (import in JS, NOT in index.js)
- Use CSS classes from the design system, avoid inline styles where possible

### 4. Styling Conventions
- **CSS variables** defined in `client/src/index.css` are the source of truth
- **Never redeclare `:root`** in component CSS files — use the existing variables
- **Tailwind utility classes are NOT used** — everything is vanilla CSS
- **No Bootstrap** — some legacy files use it but new code must not
- **Border-radius:** Use `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (14px)
- **Shadows:** Use `--shadow-sm/md/lg/xl` — never raw box-shadow values

### 5. Backend Conventions
- Routes: `/api/{resource}` (e.g. `/api/staffleave`, `/api/tutor-leaves`)
- All routes require `authMiddleware` + `roleMiddleware` + optional `claimMiddleware`
- Controller functions: `exports.functionName = async (req, res) => { ... }`
- Always validate status before state transitions (e.g. reject only if status is correct)
- Always log to `auditLogs` array on leave status changes

### 6. Status Flow (Faculty Leave)
```
PENDING_COVERAGE → COVERAGE_ACCEPTED → HOD_VERIFIED → PRINCIPAL_REVIEWED → FINAL_APPROVED
EMERGENCY_PENDING (skip coverage) → HOD_VERIFIED → ...
HOD_REJECTED / DIRECTOR_REJECTED (terminal)
```

### 7. Status Flow (Student Leave)
```
Student submits → Tutor reviews → Parent verifies (if parent route) → Approved/Rejected
```

### 8. Modal Pattern
```jsx
const [confirmModal, setConfirmModal] = useState({
  open: false, title: "", message: "", variant: "primary",
  confirmText: "Confirm", onConfirm: null
});

<ConfirmModal
  isOpen={confirmModal.open}
  title={confirmModal.title}
  message={confirmModal.message}
  variant={confirmModal.variant}
  confirmText={confirmModal.confirmText}
  onConfirm={confirmModal.onConfirm}
  onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
/>
```

### 9. Known Limitations
- Multiple `:root` CSS declarations across files cause cascade conflicts — prefer using variables from `index.css`
- Some legacy files use `import.meta.env.VITE_API_URL` (Vite syntax) — always use `process.env.REACT_APP_API_URL` instead
- The `Server.js` file is large (~1100 lines) — be careful editing it
- MongoDB connections use `0.0.0.0/0` for Render deployment
- SMTP uses IPv4-first DNS resolution (fix applied in `emailService.js`)

### 10. File Naming
- Pages: `PascalCase.jsx` (e.g. `UserManagement.jsx`)
- CSS: `PascalCase.css` or `kebab-case.css` (both exist, stay consistent within a module)
- Backend controllers: `camelCase.js` (e.g. `staffLeaveController.js`)
- Backend models: `PascalCase.js` (e.g. `StaffLeave.js`)
