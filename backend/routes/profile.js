const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/candidate/me", authorize("candidate"), (req, res) => {
  const profile = db.prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

router.put("/candidate/me", authorize("candidate"), (req, res) => {
  const { headline, phone, location, experience_years, skills, resume_text } = req.body;
  const existing = db.prepare("SELECT id FROM candidate_profiles WHERE user_id = ?").get(req.user.id);

  if (!existing) {
    db.prepare(
      "INSERT INTO candidate_profiles (user_id, headline, phone, location, experience_years, skills, resume_text) VALUES (?,?,?,?,?,?,?)"
    ).run(req.user.id, headline || null, phone || null, location || null, experience_years || 0, skills || null, resume_text || null);
  } else {
    db.prepare(
      `UPDATE candidate_profiles SET
        headline = ?, phone = ?, location = ?, experience_years = ?, skills = ?, resume_text = ?
       WHERE user_id = ?`
    ).run(
      headline || null,
      phone || null,
      location || null,
      experience_years || 0,
      skills || null,
      resume_text || null,
      req.user.id
    );
  }

  res.json({ message: "Profile updated" });
});

router.get("/recruiter/me", authorize("recruiter"), (req, res) => {
  const profile = db.prepare("SELECT * FROM recruiter_profiles WHERE user_id = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

router.put("/recruiter/me", authorize("recruiter"), (req, res) => {
  const { company_name, company_website, company_description } = req.body;
  if (!company_name) return res.status(400).json({ error: "company_name is required" });

  db.prepare(
    "UPDATE recruiter_profiles SET company_name = ?, company_website = ?, company_description = ? WHERE user_id = ?"
  ).run(company_name, company_website || null, company_description || null, req.user.id);

  res.json({ message: "Company profile updated" });
});

module.exports = router;
