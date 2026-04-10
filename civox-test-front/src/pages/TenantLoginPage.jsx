import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/tenantLoginPage.css";
import {
  loginToOrganization,
  getCurrentOrganizationBranding,
} from "../services/tenantLoginPage";

function TenantLoginPage() {
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOrganization() {
      try {
        const data = await getCurrentOrganizationBranding();
        setOrganization(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadOrganization();
  }, []);

  useEffect(() => {
    document.title = organization?.name?.trim() || "CIVOX";
  }, [organization?.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginToOrganization(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = organization?.primaryColor || "#1f3c88";
  const secondaryColor = organization?.secondaryColor || "#4aa3df";
  const logoUrl = organization?.organizationLogoUrl || organization?.logoUrl || "";
  const orgName = organization?.name || "Organization Portal";
  const orgDescription =
    organization?.description || "Welcome back. Sign in to access your workspace.";

  return (
    <div
      className="tenant-login-page"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }}
    >
      <div className="tenant-login-left">
        {logoUrl && (
          <img src={logoUrl} alt={orgName} className="tenant-login-logo" />
        )}

        <h1>{orgName}</h1>
        <p>{orgDescription}</p>
      </div>

      <div className="tenant-login-right">
        <div className="tenant-login-card">
          <h2 style={{ color: primaryColor }}>Sign in</h2>
          <p className="tenant-login-subtitle">
            Access your organization space
          </p>

          <form onSubmit={handleSubmit} className="tenant-login-form">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          {error && <p className="tenant-login-error">{error}</p>}

          <p className="tenant-login-footer">Powered by Civox</p>
        </div>
      </div>
    </div>
  );
}

export default TenantLoginPage;
