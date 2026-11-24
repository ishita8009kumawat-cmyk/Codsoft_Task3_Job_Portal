const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  let profile = null;
  if (user.role === "recruiter") {
    profile = db.prepare("SELECT * FROM recruiter_profiles WHERE user_id = ?").get(user.id);
  } else {
    profile = db.prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(user.id);
  }

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    profile,
  });
});

// Self-service signup for both recruiters and candidates
router.post("/register", (req, res) => {
  const { name, email, password, role, company_name } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }
  if (!["recruiter", "candidate"].includes(role)) {
    return res.status(400).json({ error: "role must be 'recruiter' or 'candidate'" });
  }
  if (role === "recruiter" && !company_name) {
    return res.status(400).json({ error: "company_name is required for recruiter accounts" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const hash = bcrypt.hashSync(password, 10);
  const tx = db.transaction(() => {
    const userId = db
      .prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)")
      .run(name, email, hash, role).lastInsertRowid;

    if (role === "recruiter") {
      db.prepare("INSERT INTO recruiter_profiles (user_id, company_name) VALUES (?,?)").run(userId, company_name);
    } else {
      db.prepare("INSERT INTO candidate_profiles (user_id) VALUES (?)").run(userId);
    }
    return userId;
  });

  const userId = tx();
  const user = { id: userId, name, email, role };
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: "8h",
  });

  res.status(201).json({ token, user });
});

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
