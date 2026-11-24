const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// Candidate: apply to a job
router.post("/", authorize("candidate"), (req, res) => {
  const { job_id, cover_note } = req.body;
  if (!job_id) return res.status(400).json({ error: "job_id is required" });

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(job_id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status !== "open") return res.status(400).json({ error: "This job is no longer accepting applications" });

  const existing = db.prepare("SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?").get(job_id, req.user.id);
  if (existing) return res.status(409).json({ error: "You've already applied to this job" });

  try {
    const id = db
      .prepare("INSERT INTO applications (job_id, candidate_id, cover_note) VALUES (?,?,?)")
      .run(job_id, req.user.id, cover_note || null).lastInsertRowid;
    res.status(201).json({ id, message: "Application submitted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Candidate: own applications
router.get("/mine", authorize("candidate"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, j.title as job_title, j.location as job_location, j.status as job_status, rp.company_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
       WHERE a.candidate_id = ?
       ORDER BY a.applied_at DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

// Candidate: withdraw an application (only while still 'applied')
router.delete("/:id", authorize("candidate"), (req, res) => {
  const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!app) return res.status(404).json({ error: "Application not found" });
  if (app.candidate_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (app.status !== "applied") {
    return res.status(400).json({ error: "You can only withdraw an application that hasn't been reviewed yet" });
  }
  db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
  res.json({ message: "Application withdrawn" });
});

// Recruiter: applications for a specific job they own
router.get("/job/:jobId", authorize("recruiter"), (req, res) => {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.recruiter_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const rows = db
    .prepare(
      `SELECT a.*, u.name as candidate_name, u.email as candidate_email, cp.headline, cp.location, cp.experience_years, cp.skills, cp.resume_text, cp.phone
       FROM applications a
       JOIN users u ON u.id = a.candidate_id
       LEFT JOIN candidate_profiles cp ON cp.user_id = a.candidate_id
       WHERE a.job_id = ?
       ORDER BY a.applied_at DESC`
    )
    .all(req.params.jobId);
  res.json(rows);
});

// Recruiter: all applications across all their jobs (pipeline overview)
router.get("/pipeline", authorize("recruiter"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, u.name as candidate_name, j.title as job_title
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.candidate_id
       WHERE j.recruiter_id = ?
       ORDER BY a.applied_at DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

// Recruiter: update an application's status
router.put("/:id/status", authorize("recruiter"), (req, res) => {
  const { status } = req.body;
  const validStatuses = ["applied", "shortlisted", "interview", "rejected", "hired"];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const app = db
    .prepare(`SELECT a.*, j.recruiter_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`)
    .get(req.params.id);
  if (!app) return res.status(404).json({ error: "Application not found" });
  if (app.recruiter_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ message: `Application marked as ${status}` });
});

module.exports = router;
