import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader } from "../../components/UI";
import { Link } from "react-router-dom";

export default function CandidateDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/candidate").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Candidate" title="Your job search" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications sent" value={stats.totalApplications} />
        <StatCard label="Active applications" value={stats.activeApplications} tone="teal" />
        <StatCard label="Shortlisted or further" value={stats.shortlistedOrBeyond} tone="good" />
        <StatCard label="Open roles right now" value={stats.openJobsCount} />
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Ready to apply?</h3>
        <p className="mt-2 text-sm text-[var(--color-text-dim)]">Browse open roles that match your skills and experience.</p>
        <Link to="/jobs" className="btn btn-teal mt-4 inline-flex">
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
