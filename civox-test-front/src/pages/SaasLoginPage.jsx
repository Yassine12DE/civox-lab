import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.png";
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
        <aside className="saas-login-brand-panel">
          <Link to="/" className="saas-login-brand">
            <span>C</span>
            <strong>Civox</strong>
          </Link>

          <div className="saas-login-brand-copy">
            <p className="saas-login-badge">SaaS Back-Office</p>
            <h1>Platform control for Civox operators</h1>
            <p>
              Manage organizations, module access, and platform-level decisions from
              a secure super-admin workspace.
            </p>
          </div>

          <div className="saas-login-visual">
            <img src={heroImage} alt="Civox platform layers" />
          </div>

          <div className="saas-login-highlights" aria-label="Back-office highlights">
            <span>Tenant overview</span>
            <span>Module approvals</span>
            <span>Global governance</span>
          </div>
        </aside>

        <div className="saas-login-panel">
          <div className="saas-login-panel-header">
            <p className="saas-login-badge">Secure access</p>
            <h2>Super admin sign in</h2>
            <p>Use your SUPER_ADMIN credentials to access the Civox platform workspace.</p>
          </div>

          {error && <p className="saas-login-error">{error}</p>}

          <form className="saas-login-form" onSubmit={handleSubmit}>
            <div className="saas-login-field">
              <label htmlFor="saas-email">Email</label>
              <input
                id="saas-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@civox.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="saas-login-field">
              <label htmlFor="saas-password">Password</label>
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

            <div className="saas-login-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                />
                Keep this session on this device
              </label>
              <span>Contact your platform owner for password reset.</span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to back-office"}
            </button>
          </form>

          <Link to="/" className="saas-login-public-link">
            Back to public Civox
          </Link>
        </div>
      </section>
    </div>
  );
}

export default SaasLoginPage;
