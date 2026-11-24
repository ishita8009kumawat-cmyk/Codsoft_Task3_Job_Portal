import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState, formatSalaryRange, JOB_TYPE_LABELS } from "../../components/UI";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function load() {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (location) params.location = location;
    if (jobType) params.job_type = jobType;
    const res = await api.get("/jobs", { params });
    setJobs(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  async function openDetail(job) {
    const res = await api.get(`/jobs/${job.id}`);
    setSelectedJob(res.data);
    setDetailOpen(true);
  }

  function startApply() {
    setCoverNote("");
    setError("");
    setDetailOpen(false);
    setApplyOpen(true);
  }

  async function submitApplication(e) {
    e.preventDefault();
    setError("");
    setApplying(true);
    try {
      await api.post("/applications", { job_id: selectedJob.id, cover_note: coverNote });
      setApplyOpen(false);
      setSuccessMsg(`Application sent for "${selectedJob.title}"!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not submit application");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Candidate" title="Browse jobs" />

      {successMsg && (
        <div className="mb-4 rounded-lg bg-[var(--color-good-bg)] px-4 py-2 text-sm text-[var(--color-good)]">{successMsg}</div>
      )}

      <form onSubmit={handleSearch} className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label">Keyword</label>
          <input className="input" placeholder="Job title, company…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="min-w-[160px]">
          <label className="label">Location</label>
          <input className="input" placeholder="City or Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="min-w-[150px]">
          <label className="label">Job type</label>
          <select className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">Any</option>
            {Object.entries(JOB_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-teal">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : jobs.length === 0 ? (
        <EmptyState text="No jobs match your search." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card cursor-pointer p-5 hover:border-[var(--color-teal)]" onClick={() => openDetail(job)}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">{job.title}</h3>
                  <p className="text-sm text-[var(--color-teal)]">{job.company_name}</p>
                </div>
                <span className="stamp stamp-info">{JOB_TYPE_LABELS[job.job_type]}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-dim)]">
                {job.location || "Location not specified"} · {formatSalaryRange(job.salary_min, job.salary_max)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={selectedJob?.title} wide>
        {selectedJob && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-teal)]">{selectedJob.company_name}</p>
              <p className="text-sm text-[var(--color-text-dim)]">
                {selectedJob.location || "Location not specified"} · {JOB_TYPE_LABELS[selectedJob.job_type]} ·{" "}
                {formatSalaryRange(selectedJob.salary_min, selectedJob.salary_max)}
              </p>
            </div>
            {selectedJob.company_description && (
              <p className="text-sm text-[var(--color-text-dim)]">{selectedJob.company_description}</p>
            )}
            {selectedJob.description && (
              <div>
                <p className="label">About the role</p>
                <p className="whitespace-pre-wrap text-sm">{selectedJob.description}</p>
              </div>
            )}
            {selectedJob.requirements && (
              <div>
                <p className="label">Requirements</p>
                <p className="whitespace-pre-wrap text-sm">{selectedJob.requirements}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setDetailOpen(false)}>
                Close
              </button>
              {selectedJob.hasApplied ? (
                <span className="stamp stamp-good self-center">Already applied</span>
              ) : (
                <button className="btn btn-teal" onClick={startApply}>
                  Apply now
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply · ${selectedJob?.title || ""}`}>
        <form onSubmit={submitApplication} className="space-y-4">
          <div>
            <label className="label">Cover note (optional)</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Tell the recruiter why you're a good fit…"
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setApplyOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={applying} className="btn btn-teal">
              {applying ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
