import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSaasOrganizations } from "../services/saasService";
import "../styles/saasDashboardPage.css";

function SaasDashboardPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const data = await getSaasOrganizations();
        setOrganizations(data);
      } catch {
        setError("Failed to load organizations.");
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const totalOrganizations = organizations.length;
  const publicOrganizations = organizations.filter(
    (org) => String(org.status).toLowerCase() === "active"
  ).length;

  if (loading) return <div className="saas-page"><p>Loading organizations...</p></div>;
  if (error) return <div className="saas-page"><p>{error}</p></div>;

  return (
    <div className="saas-page">
      <section className="saas-hero">
        <div>
          <p className="saas-badge">Back-office SaaS</p>
          <h1 className="saas-title">Manage organizations across the Civox platform</h1>
          <p className="saas-description">
            This space is for super admins. It centralizes organization management,
            granted modules, and future SaaS-level controls.
          </p>
        </div>

        <div className="saas-hero-card">
          <h3>Super Admin Space</h3>
          <p>
            Control organizations, module availability, and future branding settings
            from one central place.
          </p>
        </div>
      </section>

      <section className="saas-stats">
        <div className="saas-stat-card">
          <h3>{totalOrganizations}</h3>
          <p>Total organizations</p>
        </div>

        <div className="saas-stat-card">
          <h3>{publicOrganizations}</h3>
          <p>Active organizations</p>
        </div>
      </section>

      <section className="saas-organizations-section">
        <div className="saas-section-header">
          <h2>Organizations</h2>
          <p>Manage each organization and its granted modules.</p>
        </div>

        <div className="saas-organizations-grid">
          {organizations.map((org) => (
            <div key={org.id} className="saas-organization-card">
              <div className="saas-organization-top">
                <Link to="/saas/module-requests" className="saas-primary-btn">
                Review module requests
                </Link>
                <div className="saas-organization-logo">
                  {org.name?.charAt(0)}
                </div>
                <div>
                  <h3>{org.name}</h3>
                  <p>{org.slug}</p>
                </div>
              </div>

              <p className="saas-organization-text">{org.description}</p>

              <div className="saas-card-actions">
                <Link to={`/saas/organizations/${org.slug}`} className="saas-primary-btn">
                  Manage organization
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SaasDashboardPage;
