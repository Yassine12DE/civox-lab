import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSaas } from "../services/authService";
import "../styles/saasLoginPage.css";

function SaasLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <section className="saas-login-panel">
        <p className="saas-login-badge">Civox SaaS</p>
        <h1>Super admin sign in</h1>
        <p className="saas-login-text">
          Use a SUPER_ADMIN account to manage organizations and global module requests.
        </p>

        <form className="saas-login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {error && <p className="saas-login-error">{error}</p>}

        <Link to="/" className="saas-login-public-link">
          Public home
        </Link>
      </section>
    </div>
  );
}

export default SaasLoginPage;
