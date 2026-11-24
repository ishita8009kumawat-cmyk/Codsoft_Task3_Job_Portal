require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./db"); // initializes + seeds sqlite db on first run

const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const profileRoutes = require("./routes/profile");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "CareerHub API" }));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`CareerHub API running on http://localhost:${PORT}`);
});
