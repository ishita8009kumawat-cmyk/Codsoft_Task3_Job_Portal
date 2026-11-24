const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// Browse open jobs (candidates), with optional search/filter
router.get("/", (req, res) => {
  const { q, location, job_type } = req.query;
  let sql = `
    SELECT j.*, rp.company_name
    FROM jobs j JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
    WHERE j.status = 'open'
  `;
  const params = [];
  if (q) {
    sql += " AND (j.title LIKE ? OR j.description LIKE ? OR rp.company_name LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (location) {
    sql += " AND j.location LIKE ?";
    params.push(`%${location}%`);
  }
  if (job_type) {
    sql += " AND j.job_type = ?";
    params.push(job_type);
  }
  sql += " ORDER BY j.created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Recruiter: own posted jobs (including closed ones)
router.get("/mine", authorize("recruiter"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT j.*, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
       FROM jobs j WHERE j.recruiter_id = ? ORDER BY j.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

// Single job detail (anyone logged in can view)
router.get("/:id", (req, res) => {
  const job = db
    .prepare(
      `SELECT j.*, rp.company_name, rp.company_website, rp.company_description
       FROM jobs j JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
       WHERE j.id = ?`
    )
    .get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });

  let hasApplied = false;
  if (req.user.role === "candidate") {
    const existing = db
      .prepare("SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?")
      .get(req.params.id, req.user.id);
    hasApplied = !!existing;
  }

  res.json({ ...job, hasApplied });
});

// Create job (recruiter)
router.post("/", authorize("recruiter"), (req, res) => {
  const { title, location, job_type, description, requirements, salary_min, salary_max } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const id = db
    .prepare(
      `INSERT INTO jobs (recruiter_id, title, location, job_type, description, requirements, salary_min, salary_max, status)
       VALUES (?,?,?,?,?,?,?,?, 'open')`
    )
    .run(
      req.user.id,
      title,
      location || null,
      job_type || "full_time",
      description || null,
      requirements || null,
      salary_min || null,
      salary_max || null
    ).lastInsertRowid;

  res.status(201).json({ id, message: "Job posted" });
});

// Update job (owning recruiter only)
router.put("/:id", authorize("recruiter"), (req, res) => {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.recruiter_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const { title, location, job_type, description, requirements, salary_min, salary_max, status } = req.body;
  db.prepare(
    `UPDATE jobs SET
      title = COALESCE(?, title), location = ?, job_type = COALESCE(?, job_type),
      description = ?, requirements = ?, salary_min = ?, salary_max = ?, status = COALESCE(?, status)
     WHERE id = ?`
  ).run(
    title ?? null,
    location !== undefined ? location : job.location,
    job_type ?? null,
    description !== undefined ? description : job.description,
    requirements !== undefined ? requirements : job.requirements,
    salary_min !== undefined ? salary_min : job.salary_min,
    salary_max !== undefined ? salary_max : job.salary_max,
    status ?? null,
    req.params.id
  );

  res.json({ message: "Job updated" });
});

// Delete job (owning recruiter only)
router.delete("/:id", authorize("recruiter"), (req, res) => {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.recruiter_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
  res.json({ message: "Job deleted" });
});

module.exports = router;
