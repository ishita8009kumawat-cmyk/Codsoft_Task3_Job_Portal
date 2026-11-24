import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Recruiter", email: "ananya@technova.test", password: "recruiter123" },
  { role: "Candidate", email: "rohit.candidate@careerhub.test", password: "candidate123" },
];

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | signup
  const [signupRole, setSignupRole] = useState("candidate");
  const [form, setForm] = useState({ name: "", email: "", password: "", company_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({ ...form, role: signupRole });
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(acc) {
    setMode("login");
    setForm({ ...form, email: acc.email, password: acc.password });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)] px-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-[var(--color-ink-light)] p-10 text-white md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-teal-light)]">CodSoft Internship · Task 3</p>
            <h1 className="mt-3 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              CareerHub
            </h1>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              A modern recruitment platform connecting job seekers and
              companies through listings, applications, and pipelines.
            </p>
          </div>
          <div className="space-y-2 text-xs text-white/50">
            <p>Full-Stack Web Development</p>
            <p>React · Node.js · Express · SQLite</p>
          </div>
        </div>

        <div className="bg-[var(--color-card)] p-10">
          <div className="mb-6 flex gap-2">
            <button
              className={`text-sm font-semibold pb-1 border-b-2 ${mode === "login" ? "border-[var(--color-teal)] text-[var(--color-ink)]" : "border-transparent text-[var(--color-text-dim)]"}`}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <span className="text-[var(--color-text-dim)]">·</span>
            <button
              className={`text-sm font-semibold pb-1 border-b-2 ${mode === "signup" ? "border-[var(--color-teal)] text-[var(--color-ink)]" : "border-transparent text-[var(--color-text-dim)]"}`}
              onClick={() => setMode("signup")}
            >
              New here? Sign up
            </button>
          </div>

          {mode === "signup" && (
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                className={`btn flex-1 ${signupRole === "candidate" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSignupRole("candidate")}
              >
                I'm job hunting
              </button>
              <button
                type="button"
                className={`btn flex-1 ${signupRole === "recruiter" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSignupRole("recruiter")}
              >
                I'm hiring
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="label">Full name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@careerhub.test"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            {mode === "signup" && signupRole === "recruiter" && (
              <div>
                <label className="label">Company name</label>
                <input
                  className="input"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>
            )}
            {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-6 border-t border-[var(--color-line)] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
                Demo accounts
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button key={acc.role} type="button" onClick={() => fillDemo(acc)} className="btn btn-outline text-xs">
                    {acc.role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
