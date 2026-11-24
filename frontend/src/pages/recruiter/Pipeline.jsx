import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api";
import { PageHeader, Modal, EmptyState, Stamp } from "../../components/UI";

const STATUS_FLOW = ["applied", "shortlisted", "interview", "hired", "rejected"];

export default function Pipeline() {
  const [searchParams] = useSearchParams();
  const jobFilter = searchParams.get("job");

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function load() {
    setLoading(true);
    const [appsRes, jobsRes] = await Promise.all([api.get("/applications/pipeline"), api.get("/jobs/mine")]);
    setApplications(appsRes.data);
    setJobs(jobsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function openDetail(app) {
    const job = jobs.find((j) => j.title === app.job_title);
    if (job) {
      const res = await api.get(`/applications/job/${job.id}`);
      const full = res.data.find((a) => a.id === app.id);
      setSelected(full || app);
    } else {
      setSelected(app);
    }
    setDetailOpen(true);
  }

  async function updateStatus(app, status) {
    await api.put(`/applications/${app.id}/status`, { status });
    load();
    if (selected && selected.id === app.id) setSelected({ ...selected, status });
  }

  const jobTitleFilter = jobFilter ? jobs.find((j) => String(j.id) === jobFilter)?.title : null;
  const displayed = jobTitleFilter ? applications.filter((a) => a.job_title === jobTitleFilter) : applications;

  return (
    <div>
      <PageHeader eyebrow="Recruiter · Pipeline" title={jobTitleFilter ? `Candidates · ${jobTitleFilter}` : "Candidate pipeline"} />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : displayed.length === 0 ? (
        <EmptyState text="No applications yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{a.candidate_name}</td>
                  <td className="px-4 py-3">{a.job_title}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-dim)]">{a.applied_at}</td>
                  <td className="px-4 py-3">
                    <Stamp status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-outline px-3 py-1 text-xs" onClick={() => openDetail(a)}>
                      View & update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={selected?.candidate_name || "Candidate"} wide>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[var(--color-text-dim)]">{selected.job_title}</p>
              {selected.headline && <p className="font-medium text-[var(--color-ink)]">{selected.headline}</p>}
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-dim)]">
                {selected.candidate_email && <span>{selected.candidate_email}</span>}
                {selected.phone && <span>{selected.phone}</span>}
                {selected.location && <span>{selected.location}</span>}
                {selected.experience_years != null && <span>{selected.experience_years} yrs experience</span>}
              </div>
            </div>

            {selected.skills && (
              <div>
                <p className="label">Skills</p>
                <p className="text-sm">{selected.skills}</p>
              </div>
            )}

            {selected.resume_text && (
              <div>
                <p className="label">Resume summary</p>
                <p className="whitespace-pre-wrap text-sm text-[var(--color-text)]">{selected.resume_text}</p>
              </div>
            )}

            {selected.cover_note && (
              <div>
                <p className="label">Cover note</p>
                <p className="whitespace-pre-wrap text-sm italic text-[var(--color-text-dim)]">{selected.cover_note}</p>
              </div>
            )}

            <div>
              <p className="label">Update status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected, s)}
                    className={`stamp ${selected.status === s ? "" : "opacity-40"} ${
                      s === "hired" ? "stamp-good" : s === "rejected" ? "stamp-bad" : "stamp-warn"
                    }`}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
