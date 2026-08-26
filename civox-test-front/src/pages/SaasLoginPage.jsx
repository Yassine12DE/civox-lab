import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SaasIcon from "../components/saas/SaasIcon";
import { loginSaas } from "../services/authService";
import "../styles/saasLoginPage.css";

function SaasLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginSaas(email, password);
      navigate("/saas", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-login-page">
      <section className="saas-login-shell">
        <div className="saas-login-panel">
          <Link to="/" className="saas-login-brand">
            <span>C</span>
            <div>
              <strong>CIVOX</strong>
              <small>SaaS Administration</small>
            </div>
          </Link>

          <div className="saas-login-panel-header">
            <p className="saas-login-badge">Secure SUPER_ADMIN access</p>
            <h1>Sign in to the global platform console</h1>
            <p>Restricted access for managing tenants, subscriptions, modules, and users.</p>
          </div>

          {error && <p className="saas-login-error">{error}</p>}

          <form className="saas-login-form" onSubmit={handleSubmit}>
            <label className="saas-login-field" htmlFor="saas-email">
              <span>Email</span>
              <div>
                <SaasIcon name="mail" size={18} />
                <input
                  id="saas-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@civox.io"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="saas-login-field" htmlFor="saas-password">
              <span>Password</span>
              <div>
                <SaasIcon name="lock" size={18} />
                <input
                  id="saas-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            <div className="saas-login-options">
              <label className="saas-login-toggle">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                />
                <span />
                Remember session
              </label>
              <span>All access attempts are logged.</span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to platform"}
            </button>
          </form>

          <div className="saas-login-security">
            <SaasIcon name="shield" size={18} />
            <div>
              <strong>Enterprise security boundary</strong>
              <p>/saas/** is restricted to SUPER_ADMIN users only.</p>
            </div>
          </div>

          <Link to="/" className="saas-login-public-link">
            Back to public CIVOX
          </Link>
        </div>

        <aside className="saas-login-preview" aria-label="CIVOX dashboard preview">
          <div className="saas-login-preview__top">
            <span className="saas-login-preview__mark">C</span>
            <div>
              <strong>CIVOX Command Center</strong>
              <small>Production - 99.8% healthy</small>
            </div>
          </div>
          <div className="saas-login-preview__metrics">
            <PreviewMetric label="Organizations" value="118" />
            <PreviewMetric label="MRR" value="$387K" />
            <PreviewMetric label="Requests" value="8" />
          </div>
          <div className="saas-login-preview__chart">
            {[42, 55, 48, 72, 84, 76, 92, 88].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="saas-login-preview__queue">
            <PreviewRow title="Regional Council West" detail="Onboarding quote draft" status="Pending" />
            <PreviewRow title="City of Montreal" detail="Youth Space request" status="Review" />
            <PreviewRow title="File Storage" detail="Latency investigation" status="Monitor" />
          </div>
        </aside>
      </section>
    </div>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function PreviewRow({ title, detail, status }) {
  return (
    <article>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <em>{status}</em>
    </article>
  );
}

export default SaasLoginPage;
