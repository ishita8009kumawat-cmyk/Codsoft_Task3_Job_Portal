import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader } from "../../components/UI";

const emptyForm = { headline: "", phone: "", location: "", experience_years: "", skills: "", resume_text: "" };

export default function CandidateProfile() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/profile/candidate/me").then((res) => {
      setForm({
        headline: res.data.headline || "",
        phone: res.data.phone || "",
        location: res.data.location || "",
        experience_years: res.data.experience_years ?? "",
        skills: res.data.skills || "",
        resume_text: res.data.resume_text || "",
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
      await api.put("/profile/candidate/me", { ...form, experience_years: Number(form.experience_years) || 0 });
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
      <PageHeader eyebrow="Candidate" title="My profile" />
      <div className="card max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              placeholder="e.g. Frontend Developer"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Years of experience</label>
            <input
              type="number"
              step="0.5"
              min="0"
              className="input"
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Skills</label>
            <input
              className="input"
              placeholder="Comma-separated, e.g. React, Node.js, SQL"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Resume summary</label>
            <textarea
              className="input"
              rows={6}
              placeholder="A short written summary of your experience — recruiters will see this alongside your application."
              value={form.resume_text}
              onChange={(e) => setForm({ ...form, resume_text: e.target.value })}
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
