import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader } from "../../components/UI";

export default function CompanyProfile() {
  const [form, setForm] = useState({ company_name: "", company_website: "", company_description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/profile/recruiter/me").then((res) => {
      setForm({
        company_name: res.data.company_name || "",
        company_website: res.data.company_website || "",
        company_description: res.data.company_description || "",
      });
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api.put("/profile/recruiter/me", form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Recruiter" title="Company profile" />
      <div className="card max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Company name</label>
            <input
              className="input"
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Website</label>
            <input
              className="input"
              placeholder="https://"
              value={form.company_website}
              onChange={(e) => setForm({ ...form, company_website: e.target.value })}
            />
          </div>
          <div>
            <label className="label">About the company</label>
            <textarea
              className="input"
              rows={4}
              value={form.company_description}
              onChange={(e) => setForm({ ...form, company_description: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
          {saved && <p className="text-sm text-[var(--color-good)]">Profile updated.</p>}

          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
