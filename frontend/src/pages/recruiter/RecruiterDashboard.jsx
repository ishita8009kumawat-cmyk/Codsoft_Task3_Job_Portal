import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader, EmptyState, Stamp } from "../../components/UI";

export default function RecruiterDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/recruiter").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Recruiter" title="Hiring overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Open positions" value={stats.openJobs} tone="teal" />
        <StatCard label="Total job posts" value={stats.totalJobs} />
        <StatCard label="Total applications" value={stats.totalApplications} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Pipeline breakdown</h3>
          <ul className="mt-3 space-y-2">
            {Object.entries(stats.pipeline).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">
                <Stamp status={status} />
                <span className="font-mono text-[var(--color-text-dim)]">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Recent applications</h3>
          {stats.recentApplications.length === 0 ? (
            <EmptyState text="No applications yet." />
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.recentApplications.map((a) => (
                <li key={a.id} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--color-ink)]">{a.candidate_name}</span>
                    <Stamp status={a.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-dim)]">{a.job_title}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
