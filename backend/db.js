const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "careerhub.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------- SCHEMA ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('recruiter','candidate')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_description TEXT
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  phone TEXT,
  location TEXT,
  experience_years REAL DEFAULT 0,
  skills TEXT,
  resume_text TEXT
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recruiter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  job_type TEXT NOT NULL DEFAULT 'full_time' CHECK(job_type IN ('full_time','part_time','internship','contract')),
  description TEXT,
  requirements TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied','shortlisted','interview','rejected','hired')),
  cover_note TEXT,
  applied_at TEXT DEFAULT (datetime('now')),
  UNIQUE(job_id, candidate_id)
);
`);

// ---------- SEED (only if empty) ----------
const userCount = db.prepare("SELECT COUNT(*) c FROM users").get().c;

if (userCount === 0) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const insertUser = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)");

  const tx = db.transaction(() => {
    // Recruiters
    const insertRecruiterProfile = db.prepare(
      "INSERT INTO recruiter_profiles (user_id, company_name, company_website, company_description) VALUES (?,?,?,?)"
    );
    const rec1UserId = insertUser.run("Ananya Mehta", "ananya@technova.test", hash("recruiter123"), "recruiter").lastInsertRowid;
    insertRecruiterProfile.run(
      rec1UserId,
      "TechNova Solutions",
      "https://technova.test",
      "A fast-growing product company building developer tools."
    );

    const rec2UserId = insertUser.run("Vikram Rao", "vikram@brightscale.test", hash("recruiter123"), "recruiter").lastInsertRowid;
    insertRecruiterProfile.run(
      rec2UserId,
      "BrightScale Analytics",
      "https://brightscale.test",
      "Data and analytics consultancy serving retail clients."
    );

    // Candidates
    const insertCandidateProfile = db.prepare(
      "INSERT INTO candidate_profiles (user_id, headline, phone, location, experience_years, skills, resume_text) VALUES (?,?,?,?,?,?,?)"
    );

    const cand1 = insertUser.run("Rohit Sharma", "rohit.candidate@careerhub.test", hash("candidate123"), "candidate").lastInsertRowid;
    insertCandidateProfile.run(
      cand1,
      "Frontend Developer",
      "9811100001",
      "Bengaluru, India",
      2.5,
      "React, JavaScript, Tailwind CSS, REST APIs",
      "2.5 years building responsive web apps with React and TypeScript. Previously at a startup shipping a customer dashboard used by 10k+ users."
    );

    const cand2 = insertUser.run("Sneha Iyer", "sneha.candidate@careerhub.test", hash("candidate123"), "candidate").lastInsertRowid;
    insertCandidateProfile.run(
      cand2,
      "Backend Engineer",
      "9811100002",
      "Pune, India",
      4,
      "Node.js, PostgreSQL, Docker, AWS",
      "4 years of backend experience designing REST and GraphQL APIs, with a focus on scalable data pipelines."
    );

    const cand3 = insertUser.run("Farhan Ali", "farhan.candidate@careerhub.test", hash("candidate123"), "candidate").lastInsertRowid;
    insertCandidateProfile.run(
      cand3,
      "Data Analyst",
      "9811100003",
      "Remote",
      1,
      "SQL, Python, Power BI, Excel",
      "1 year of experience turning raw data into dashboards and reports for stakeholders."
    );

    // Jobs
    const insertJob = db.prepare(
      `INSERT INTO jobs (recruiter_id, title, location, job_type, description, requirements, salary_min, salary_max, status)
       VALUES (?,?,?,?,?,?,?,?,?)`
    );

    const job1 = insertJob.run(
      rec1UserId,
      "Frontend Developer (React)",
      "Bengaluru, India",
      "full_time",
      "Build and ship user-facing features for our developer tools platform, working closely with design and backend teams.",
      "2+ years with React, strong CSS fundamentals, familiarity with REST APIs. Bonus: TypeScript, testing experience.",
      800000,
      1400000,
      "open"
    ).lastInsertRowid;

    const job2 = insertJob.run(
      rec1UserId,
      "Backend Engineer (Node.js)",
      "Remote",
      "full_time",
      "Own services powering our core API, focusing on reliability and performance at scale.",
      "3+ years with Node.js and a relational database, comfortable with Docker and CI/CD pipelines.",
      1200000,
      2000000,
      "open"
    ).lastInsertRowid;

    const job3 = insertJob.run(
      rec1UserId,
      "Product Design Intern",
      "Bengaluru, India",
      "internship",
      "Support the design team on UX research, wireframes, and prototypes for a 6-month internship.",
      "Currently pursuing a degree in design or HCI; a portfolio of any kind is welcome.",
      25000,
      35000,
      "closed"
    ).lastInsertRowid;

    const job4 = insertJob.run(
      rec2UserId,
      "Data Analyst",
      "Pune, India",
      "full_time",
      "Analyze retail sales data and build dashboards that inform merchandising decisions.",
      "1+ years with SQL and a BI tool (Power BI/Tableau), comfortable presenting findings to non-technical stakeholders.",
      600000,
      950000,
      "open"
    ).lastInsertRowid;

    const job5 = insertJob.run(
      rec2UserId,
      "Data Engineer (Contract)",
      "Remote",
      "contract",
      "6-month contract to build ETL pipelines feeding our analytics warehouse.",
      "Strong Python and SQL, experience with Airflow or similar orchestration tools.",
      100000,
      150000,
      "open"
    ).lastInsertRowid;

    // Applications
    const insertApp = db.prepare(
      "INSERT INTO applications (job_id, candidate_id, status, cover_note) VALUES (?,?,?,?)"
    );
    insertApp.run(job1, cand1, "shortlisted", "I've been using React daily for 2.5 years and would love to bring that experience to TechNova.");
    insertApp.run(job2, cand2, "interview", "My last role involved building and scaling Node.js services handling 5k+ req/min.");
    insertApp.run(job4, cand3, "applied", "I'm excited about applying my SQL and Power BI skills to retail analytics.");
    insertApp.run(job5, cand2, "applied", "I have hands-on experience with Python ETL pipelines and would love to contribute.");
    insertApp.run(job1, cand3, "rejected", "Though my background is more analytics-focused, I'm eager to grow into frontend work.");

    console.log("Seed data inserted.");
    console.log("Login credentials:");
    console.log("  Recruiter: ananya@technova.test / recruiter123");
    console.log("  Recruiter: vikram@brightscale.test / recruiter123");
    console.log("  Candidate: rohit.candidate@careerhub.test / candidate123");
  });

  tx();
}

module.exports = db;
