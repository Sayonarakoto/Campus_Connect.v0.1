# Campus Connect (v0.1)

> **Enterprise College Management System**  
> Designed for institutional administration, academic tracking, student services, and campus security.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Core Feature Modules](#-core-feature-modules)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Database Seeding & Test Credentials](#-database-seeding--test-credentials)
  - [Frontend Setup](#frontend-setup)
- [API Namespaces](#-api-namespaces)
- [Enterprise Git & Engineering Standards](#-enterprise-git--engineering-standards)
  - [Branching Strategy](#branching-strategy)
  - [Conventional Commits & Ticket Linking](#conventional-commits--ticket-linking)
  - [Codebase Conventions](#codebase-conventions)

---

## 🏛 Overview

**Campus Connect** is a full-stack enterprise institutional management platform built to streamline academic operations, multi-tier approvals, student safety, and faculty administration. It features end-to-end digital workflows including gate passes with real-time QR validation, multi-stage student leave pipelines, duty leave management with file proof verification, daily lecture-hour attendance tracking with automated correction workflows, campus promotion engines, and sports committee tournament management.

---

## 💻 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  React 19 • React Router DOM v7 • FontAwesome • Pure CSS    │
│  (Custom Institutional Design System with Scoped Styles)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Server Layer                          │
│  Node.js • Express 5 • Multer (Disk & Memory) • JWT Bearer   │
│  Role Middleware • Error Hierarchy • Validation Middlewares │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                         │
│  MongoDB (Replica/Standalone) • GridFS Bucket Storage        │
│  (Profile Photos & Event Media Streams)                     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
* **Frontend**: React 19 (`react-scripts 5.0.1`), `react-router-dom` v7, `axios`, `@fortawesome/react-fontawesome`, `html5-qrcode`.
* **Backend**: Node.js, Express 5 (`commonjs`), Mongoose 9, `jsonwebtoken`, `bcrypt`, `multer`, `multer-gridfs-storage`, `qrcode`.
* **Database**: MongoDB with GridFS for media files and local disk storage for administrative proofs.

---

## 👥 Role-Based Access Control (RBAC)

The system supports **11 distinct user roles** with granular permissions and specialized workspaces:

| Role | Key Capabilities & Workspaces |
| :--- | :--- |
| **`student`** | Submit gate pass, apply student leaves, track attendance, submit duty leave requests, register for sports events, view disciplinary profile. |
| **`parent`** | Verify and approve student leave requests, monitor disciplinary notices, view student attendance records. |
| **`faculty`** | Mark period attendance, review gate passes, apply for staff/duty leaves, review student late entries, view sports events. |
| **`tutor`** | Review student leaves, perform manual overrides, monitor student duty leaves, monitor student attendance summaries. |
| **`hod`** | Approve department staff & student leaves, process duty leaves, assign temporary HOD delegates, review late entries, manage department disciplinary queues. |
| **`principal`** | Institution-wide leave reviews, oversee HOD approvals, audit academic compliance. |
| **`director`** | Executive leave approvals, faculty duty leave sign-offs, institution-wide governance. |
| **`hraccounts`** | Staff payroll verification, faculty duty leave balance tracking, HR attendance ledgers. |
| **`security`** | Live QR scanner terminal, verify and check out active student gate passes in real time. |
| **`admin`** | User management, assign temporary HOD roles, manage campus promotion banners, audit system trails. |
| **`sports committee`** | Create and manage athletic tournaments, maintain event rosters, verify participation, issue activity points. |

---

## 🚀 Core Feature Modules

### 1. Gate Pass System
* Students initiate digital pass requests selecting approver roles (Faculty/HOD).
* Real-time status lifecycle: `PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `USED` $\rightarrow$ `EXPIRED` $\rightarrow$ `REJECTED`.
* Automated cryptographic **QR Code Generation** upon approval.
* Dedicated **Security Scanner Terminal** with camera integration (`html5-qrcode`) for gate-side validation.

### 2. Multi-Tier Leave Request Pipeline
* Hierarchical approval chain tailored to institutional governance:
  $$\text{Student Submission} \longrightarrow \text{Parent Verification} \longrightarrow \text{Tutor Review} \longrightarrow \text{HOD Approval} \longrightarrow \text{Principal / Director}$$
* Tutor override capability with recorded audit trail.
* Staff leave quota tracking with causal categorization (Casual, Medical, Duty).

### 3. Attendance & Correction Engine
* Lecture hour-by-hour attendance recording (`P`, `A`, `OD`, `L`).
* Student attendance percentage computation and monthly/semester analytics.
* **Attendance Correction System**: Students and tutors can file correction requests with reasons; HOD approval dynamically updates attendance logs and leaves an audit trail.

### 4. Duty Leaves & Proof Verification
* Application with event name, organizer, date ranges, and mandatory document upload.
* Integrated Multer storage for proof files.
* HOD and Director approval workflow with automated student notification and balance updates.

### 5. Campus Promotions & Notification Engine
* Contextual banner, modal, and floating promotional campaigns across student and staff dashboards.
* Granular targeting by role, department, and display location.
* Impression and interaction analytics tracking.

### 6. Sports & Activities Management
* Athletic tournaments creation, category categorization, and student registration.
* Sports Committee roster generation and match score entries.
* Automated Activity Points generation for participating students.

---

## 📂 Project Directory Structure

```
Campus_Connect.v0.1/
├── client/                     # Frontend React SPA
│   ├── public/                 # Static assets & HTML template
│   ├── src/
│   │   ├── api/                # Axios API helpers
│   │   ├── components/         # Shared functional components (Navbar, Footer, Promotions)
│   │   ├── pages/              # Module pages & Workspaces
│   │   │   ├── Access/         # Access Denied (403)
│   │   │   ├── Admin/          # Admin promotions & Temp HOD assignments
│   │   │   ├── Attendance/     # Attendance sheets, summaries, & corrections
│   │   │   ├── Audit/          # Institutional audit trails
│   │   │   ├── Dashboard/      # Workspaces for all 11 roles
│   │   │   ├── Discpline/      # Disciplinary queues and notices
│   │   │   ├── DutyLeaves/     # Student & faculty duty leave workflows
│   │   │   ├── Event/          # College event management & dashboards
│   │   │   ├── FacultySportsModule/ # Faculty sports verification
│   │   │   ├── GatePass/       # Gate pass request, QR generator, approval
│   │   │   ├── LateEntry/      # Late entry recording & review
│   │   │   ├── Leave/          # Staff leave workflows
│   │   │   ├── LeaveRequest/   # Student multi-tier leave pipeline
│   │   │   ├── Security/       # QR scanner terminal
│   │   │   └── Sports/         # Sports registration & event management
│   │   ├── App.jsx             # Router definition & ProtectedRoute guards
│   │   ├── index.js            # React root mount
│   │   └── index.css           # Global typography & reset
│   ├── .env.example            # Client environment template
│   ├── .gitignore              # Client ignore rules
│   └── package.json            # Client dependencies
│
├── server/                     # Backend Node.js / Express API
│   ├── config/                 # DB (Mongoose) & GridFS configurations
│   ├── constants/              # System roles, status enums, permissions
│   ├── controllers/            # Request handlers with error handling
│   ├── errors/                 # AppError and specialized error classes
│   ├── middleware/             # authMiddleware, roleMiddleware, upload handlers
│   ├── models/                 # Mongoose schemas (User, Student, GatePass, Leave, etc.)
│   ├── routes/                 # Express API routes
│   ├── services/               # Reusable business logic (Attendance, Audit, GridFS)
│   ├── uploads/                # Local disk storage (dutyProofs, profilePhotos, promotions)
│   ├── upload/                 # Fallback media directory (events)
│   ├── validators/             # Request payload validation logic
│   ├── .env.example            # Server environment template
│   ├── .gitignore              # Server ignore rules
│   ├── package.json            # Server dependencies
│   └── server.js               # Express application entrypoint
│
├── .gitignore                  # Root Git ignore rules
└── README.md                   # Project documentation
```

---

## 🛠 Getting Started

### Prerequisites
* **Node.js**: `v18.x` or higher
* **npm**: `v9.x` or higher
* **MongoDB**: Locally installed instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

---

### Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` configuration file from template:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:3000
   MONGO_URI=mongodb://127.0.0.1:27017/campus_connect
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development
   SEED_DEFAULT_PASSWORD=password123
   SEED_FILE=seed.js
   ```

5. Seed the database with initial institutional accounts (Optional but Recommended):
   ```bash
   npm run seed
   ```
   *Provisions 60 verified user accounts and 30 student records across all 6 departments.*

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will boot on `http://localhost:5000` with GridFS initialized.*

---

### 🌱 Database Seeding & Test Credentials

The backend includes a standalone seed utility ([`server/seed.js`](server/seed.js)) that automatically provisions complete institutional data across all 6 academic departments.

#### Running the Seed Script

From the `server` directory:

```bash
npm run seed
```
*(or `node seed.js`)*

#### What Gets Seeded
* **Departments**: Mechanical Engineering, Computer Engineering, Automobile Engineering, Electrical and Electronics Engineering, Civil Engineering, and Fire Technology and Safety.
* **Per Department Breakdown**:
  * **5 Students**: 4-digit admission numbers (`1001`–`1005`, `2001`–`2005`, etc.), 10-digit register numbers (`2101001001`...). Mechanical students are split into `Mech-A` and `Mech-B`; other departments have `null` section.
  * **2 Faculty Members**: `isLabStaff: false`, IDs `FAC1001`, `FAC1002`, etc.
  * **1 Head of Department (HOD)**: `role: "hod"`, `isLabStaff: false`, IDs `HOD1001`, etc.
  * **2 Lab Staff Members**: `role: "faculty"`, `isLabStaff: true`, IDs `LAB1001`, `LAB1002`, etc.
* **Total Accounts**: 60 Users + 30 linked Student profiles.
* **Universal Password**: `password123` (configured via `SEED_DEFAULT_PASSWORD` in `.env`).

#### Sample Login Credentials Matrix

All accounts support logging in using either their **ID** or **Institutional Email**:

| Department | Role | Name | Login ID (Admission No / Faculty ID) | Institutional Email | Password | Division / Section |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mechanical** | Student | Student MECH 1 | `1001` | `student.mech1@college.edu` | `password123` | `Mech-A` |
| **Mechanical** | Student | Student MECH 4 | `1004` | `student.mech4@college.edu` | `password123` | `Mech-B` |
| **Mechanical** | Faculty | Prof. MECH Faculty 1 | `FAC1001` | `faculty.mech1@college.edu` | `password123` | N/A |
| **Mechanical** | Faculty (Lab) | Lab Instructor MECH 1 | `LAB1001` | `lab.mech1@college.edu` | `password123` | N/A (Lab Staff) |
| **Mechanical** | HOD | Dr. MECH HOD | `HOD1001` | `hod.mech@college.edu` | `password123` | N/A |
| **Computer** | Student | Student COMP 1 | `2001` | `student.comp1@college.edu` | `password123` | Single Division |
| **Computer** | Faculty | Prof. COMP Faculty 1 | `FAC2001` | `faculty.comp1@college.edu` | `password123` | N/A |
| **Computer** | HOD | Dr. COMP HOD | `HOD2001` | `hod.comp@college.edu` | `password123` | N/A |
| **Automobile** | Student | Student AUTO 1 | `3001` | `student.auto1@college.edu` | `password123` | Single Division |
| **Automobile** | Faculty | Prof. AUTO Faculty 1 | `FAC3001` | `faculty.auto1@college.edu` | `password123` | N/A |
| **EEE** | Student | Student EEE 1 | `4001` | `student.eee1@college.edu` | `password123` | Single Division |
| **Civil** | Student | Student CIVIL 1 | `5001` | `student.civil1@college.edu` | `password123` | Single Division |
| **Fire Tech** | Student | Student FTS 1 | `6001` | `student.fts1@college.edu` | `password123` | Single Division |

> **Note**: The seed script is completely **idempotent**. Running `npm run seed` multiple times safely updates existing records without triggering duplicate key errors.

---

### Frontend Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` configuration file from template:
   ```bash
   cp .env.example .env
   ```

4. Verify or adjust the API endpoint:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

5. Start the React development server:
   ```bash
   npm start
   ```
   *The client will launch at `http://localhost:3000`.*

---

## 🔌 API Namespaces

All endpoints are mounted under `/api` and secured with JWT Bearer authentication:

| Resource Route | Description | Primary Access |
| :--- | :--- | :--- |
| `/api/auth` | Login, registration, token validation, user profile | Public / All |
| `/api/gatepass` | Gate pass submission, approvals, QR fetch, security scan | Student, Faculty, HOD, Security |
| `/api/student-leaves` | Student leave creation, parent verification, status tracking | Student, Parent, Tutor |
| `/api/staffleave` | Staff leave application, HOD/Principal review | Faculty, HOD, Principal, Director |
| `/api/attendance` | Period attendance recording, student history, semester logs | Faculty, Tutor, Student |
| `/api/attendance-corrections` | Attendance correction submission, approval, audit | Student, Faculty, HOD |
| `/api/duty-leaves` | Student duty leave application and HOD verification | Student, Tutor, HOD |
| `/api/faculty-duty-leave` | Faculty duty leave applications and Director review | Faculty, HOD, Director, HR |
| `/api/disciplinary` | Incident filing, disciplinary queue, student notices | Faculty, HOD, Student, Parent |
| `/api/events` | College events, media uploads (GridFS), attendee registration | Faculty, Student, Admin |
| `/api/sports-events` | Sports tournament setup, registration, committee rosters | Sports Committee, Student |
| `/api/promotions` | Promotion campaigns, views tracking, dashboard banners | Admin, All |
| `/api/admin` | Temporary HOD assignments, administrative maintenance | Admin |

---

## 🛡 Enterprise Git & Engineering Standards

To maintain an audit-ready, enterprise-grade codebase, **do not commit directly to `main`** and **never use meaningless commit messages (such as `git commit -m "."`)**.

### Branching Strategy
Every task, bug fix, or feature must originate from an issue or ticket:

```
<type>/<ticket-id>-<short-description>
```

* **Features**: `feat/CC-10-leave-approval-workflow`
* **Bug Fixes**: `fix/CC-10-attendance-calculation`
* **Refactoring**: `refactor/CC-10-gridfs-service`
* **Documentation/Chores**: `chore/CC-10-update-env-templates`

---

### Conventional Commits & Ticket Linking
Each commit must be **atomic** (representing a single logical milestone) and follow the Conventional Commits specification:

```
<type>(<scope>): <ticket-id> <short imperative description>
```

#### Example Commits:
```bash
# 1. Database Schema
git commit -m "feat(attendance): CC-10 add AttendanceCorrection schema with timestamps"

# 2. Controller & Service
git commit -m "feat(attendance): CC-10 implement approval endpoint with roleMiddleware"

# 3. Frontend UI Component
git commit -m "feat(attendance-ui): CC-10 create correction request form and card layout"

# 4. Bug Fix
git commit -m "fix(auth): CC-10 resolve token expiration redirect loop in ProtectedRoute"
```

---

### Codebase Conventions

1. **No Out-of-Place Frameworks**: Follow the existing Vanilla CSS variable styling system (`--primary-dark`, `--gold`, `--bg-body`) located in modular stylesheets. Do not introduce arbitrary CSS libraries or external state management stores.
2. **Explicit Error Handling**: Every API route and service method must employ `try/catch` blocks and leverage the centralized [`errors/`](server/errors) hierarchy.
3. **Database Integrity**: All Mongoose models must specify `{ timestamps: true }` and utilize snake_case for database fields and camelCase for JSON API payloads.
4. **Environment Security**: Never commit `.env` files or credentials. Always reference configuration via `process.env`.
