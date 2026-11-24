# CareerHub — Job Portal

**CodSoft Internship · Full-Stack Web Development · Task 3**

A modern recruitment platform connecting job seekers and companies through
job listings, applications, candidate profiles, and recruitment dashboards.

## Tech stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios
- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3` — no separate database server needed)
- **Auth:** JWT + bcrypt password hashing

## Features

- **Role-based access** — Recruiter (company account) and Candidate (job seeker) each get a dedicated dashboard and permissions.
- **Recruiter:** post, edit, close/reopen, and delete job listings; view a candidate pipeline across all jobs with one-click status updates (applied → shortlisted → interview → hired/rejected); view each candidate's profile, skills, resume summary, and cover note; manage a company profile.
- **Candidate:** browse open roles with keyword/location/job-type search and filters; view full job details; apply with an optional cover note; track all applications and their status; withdraw an application before it's been reviewed; maintain a profile with headline, skills, experience, and a resume summary.
- Self-service **sign-up** for both recruiters (with company name) and candidates.
- Duplicate applications are prevented server-side; a candidate can't apply to the same job twice.

## Project structure

```
careerhub/
├── backend/          Express API + SQLite database
│   ├── db.js           schema + seed data (auto-runs on first start)
│   ├── server.js        app entry point
│   ├── middleware/       JWT auth + role guard
│   └── routes/           auth, jobs, applications, profile, dashboard
└── frontend/         React (Vite) single-page app
    └── src/
        ├── pages/recruiter | candidate
        ├── components/    Layout, shared UI (StatCard, Modal, Stamp, etc.)
        ├── AuthContext.jsx
        └── api.js          axios client with JWT injection
```

## Getting started

### 1. Backend

```bash
cd backend
npm install
npm start
```

The API starts on **http://localhost:5002**. On first run it automatically
creates `careerhub.db` (SQLite file) and seeds it with sample companies,
jobs, candidates, and applications — the demo credentials are printed in the
terminal.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens on **http://localhost:5173**. It's configured to proxy `/api`
requests to the backend on port 5002, so just make sure the backend is
running first.

### 3. Log in

Use any of the seeded demo accounts (also available as quick-fill buttons on
the login screen), or sign up as a new recruiter or candidate directly from
the login page:

| Role      | Email                              | Password       |
|-----------|--------------------------------------|----------------|
| Recruiter | `ananya@technova.test`              | `recruiter123` |
| Recruiter | `vikram@brightscale.test`           | `recruiter123` |
| Candidate | `rohit.candidate@careerhub.test`    | `candidate123` |

## Resetting the data

Delete `backend/careerhub.db*` and restart the backend — it will recreate the
schema and reseed demo data automatically.

## Notes

- This is a demo/learning project (per the internship's scope of a working
  prototype); the JWT secret in `middleware/auth.js` should be moved to an
  environment variable (`.env`) before any real deployment.
- Resumes are captured as a plain-text summary rather than an uploaded file,
  to keep the project dependency-free (no cloud storage integration); this
  could be swapped for real file uploads (e.g. to S3) in a production version.
- Salaries are shown in ₹ (INR) for the demo data — this is just formatting
  in the frontend and not hardcoded in the backend logic.
