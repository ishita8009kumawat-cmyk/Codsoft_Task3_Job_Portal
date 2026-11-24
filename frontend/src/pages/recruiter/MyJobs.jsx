import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState, Stamp, formatSalaryRange, JOB_TYPE_LABELS } from "../../components/UI";
import { Link } from "react-router-dom";

const emptyForm = {
  title: "",
  location: "",
  job_type: "full_time",
  description: "",
  requirements: "",
  salary_min: "",
  salary_max: "",
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await api.get("/jobs/mine");
    setJobs(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(job) {
    setEditing(job);
    setForm({
      title: job.title,
      location: job.location || "",
      job_type: job.job_type,
      description: job.description || "",
      requirements: job.requirements || "",
      salary_min: job.salary_min || "",
      salary_max: job.salary_max || "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
      };
      if (editing) {
        await api.put(`/jobs/${editing.id}`, payload);
      } else {
        await api.post("/jobs", payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function toggleStatus(job) {
    await api.put(`/jobs/${job.id}`, { status: job.status === "open" ? "closed" : "open" });
    load();
  }

  async function handleDelete(job) {
    if (!confirm(`Delete job posting "${job.title}"?`)) return;
    await api.delete(`/jobs/${job.id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiter · Postings"
        title="My job posts"
        action={
          <button className="btn btn-teal" onClick={openAdd}>
            + Post a job
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : jobs.length === 0 ? (
        <EmptyState text="You haven't posted any jobs yet." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)]">{job.title}</h3>
                    <Stamp status={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-dim)]">
                    {job.location || "Location not specified"} · {JOB_TYPE_LABELS[job.job_type]} · {formatSalaryRange(job.salary_min, job.salary_max)}
                  </p>
                </div>
                <Link to={`/pipeline?job=${job.id}`} className="stamp stamp-info">
                  {job.application_count} application{job.application_count === 1 ? "" : "s"}
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-outline px-3 py-1 text-xs" onClick={() => openEdit(job)}>
                  Edit
                </button>
                <button className="btn btn-outline px-3 py-1 text-xs" onClick={() => toggleStatus(job)}>
                  {job.status === "open" ? "Close posting" : "Reopen posting"}
                </button>
                <button className="btn btn-danger px-3 py-1 text-xs" onClick={() => handleDelete(job)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit job post" : "Post a new job"} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Job title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="e.g. Bengaluru, India / Remote"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Job type</label>
              <select className="input" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                {Object.entries(JOB_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Salary min (₹/yr)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Salary max (₹/yr)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Requirements</label>
            <textarea
              className="input"
              rows={3}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "Save changes" : "Post job"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
