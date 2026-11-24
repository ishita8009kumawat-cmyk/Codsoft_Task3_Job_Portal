import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, Stamp } from "../../components/UI";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get("/applications/mine");
    setApplications(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function withdraw(app) {
    if (!confirm(`Withdraw your application for "${app.job_title}"?`)) return;
    await api.delete(`/applications/${app.id}`);
    load();
  }

  return (
    <div>
      <PageHeader eyebrow="Candidate" title="My applications" />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : applications.length === 0 ? (
        <EmptyState text="You haven't applied to any jobs yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{a.job_title}</p>
                    <p className="text-xs text-[var(--color-text-dim)]">{a.job_location}</p>
                  </td>
                  <td className="px-4 py-3">{a.company_name}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-dim)]">{a.applied_at}</td>
                  <td className="px-4 py-3">
                    <Stamp status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "applied" && (
                      <button className="btn btn-danger px-3 py-1 text-xs" onClick={() => withdraw(a)}>
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
