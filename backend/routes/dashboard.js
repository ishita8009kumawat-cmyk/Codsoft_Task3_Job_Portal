const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/recruiter", authorize("recruiter"), (req, res) => {
  const openJobs = db.prepare("SELECT COUNT(*) c FROM jobs WHERE recruiter_id = ? AND status = 'open'").get(req.user.id).c;
  const totalJobs = db.prepare("SELECT COUNT(*) c FROM jobs WHERE recruiter_id = ?").get(req.user.id).c;
  const totalApplications = db
    .prepare(
      `SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = ?`
    )
    .get(req.user.id).c;

  const pipeline = db
    .prepare(
      `SELECT a.status, COUNT(*) c FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE j.recruiter_id = ? GROUP BY a.status`
    )
    .all(req.user.id);
  const pipelineMap = { applied: 0, shortlisted: 0, interview: 0, rejected: 0, hired: 0 };
  pipeline.forEach((p) => (pipelineMap[p.status] = p.c));

  const recentApplications = db
    .prepare(
      `SELECT a.id, a.status, a.applied_at, u.name as candidate_name, j.title as job_title
       FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id
       WHERE j.recruiter_id = ? ORDER BY a.applied_at DESC LIMIT 5`
    )
    .all(req.user.id);

  res.json({ openJobs, totalJobs, totalApplications, pipeline: pipelineMap, recentApplications });
});

router.get("/candidate", authorize("candidate"), (req, res) => {
  const totalApplications = db.prepare("SELECT COUNT(*) c FROM applications WHERE candidate_id = ?").get(req.user.id).c;
  const activeApplications = db
    .prepare("SELECT COUNT(*) c FROM applications WHERE candidate_id = ? AND status NOT IN ('rejected','hired')")
    .get(req.user.id).c;
  const shortlistedOrBeyond = db
    .prepare(
      "SELECT COUNT(*) c FROM applications WHERE candidate_id = ? AND status IN ('shortlisted','interview','hired')"
    )
    .get(req.user.id).c;
  const openJobsCount = db.prepare("SELECT COUNT(*) c FROM jobs WHERE status = 'open'").get().c;

  res.json({ totalApplications, activeApplications, shortlistedOrBeyond, openJobsCount });
});

module.exports = router;
