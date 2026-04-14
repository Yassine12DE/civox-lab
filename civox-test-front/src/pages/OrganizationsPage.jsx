import { useEffect, useMemo, useState } from "react";
import SaasIcon from "../components/saas/SaasIcon";
import { getPublicOrganizations } from "../services/organizationService";
import "../styles/organizationsPage.css";

function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const data = await getPublicOrganizations();
        setOrganizations(data);
      } catch {
        setError("Failed to load organizations.");
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const filteredOrganizations = useMemo(
    () =>
      organizations.filter((org) => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;

        return [org.name, org.slug, org.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      }),
    [organizations, searchTerm]
  );

  if (loading) {
    return (
      <div className="organizations-page">
        <div className="public-state-card">Loading organizations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="organizations-page">
        <div className="public-state-card">{error}</div>
      </div>
    );
  }

  return (
    <div className="organizations-page">
      <div className="organizations-container">
        <div className="organizations-header">
          <p className="organizations-badge">Civox Directory</p>
          <h1 className="organizations-title">Explore Registered Organizations</h1>
          <p className="organizations-description">
            Discover organizations that joined Civox and access their public space.
          </p>
        </div>

        <div className="organizations-toolbar">
          <label className="organizations-search">
            <SaasIcon name="search" size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search organizations..."
            />
          </label>
          <span>
            {filteredOrganizations.length} organization
            {filteredOrganizations.length === 1 ? "" : "s"}
          </span>
        </div>

        {filteredOrganizations.length > 0 ? (
          <div className="organizations-grid">
            {filteredOrganizations.map((org) => (
              <div key={org.id} className="organization-card">
                <div className="organization-avatar">{org.name?.charAt(0)}</div>

                <h2 className="organization-name">{org.name}</h2>
                <p className="organization-text">
                  {org.description || "This organization is registered on Civox."}
                </p>
                <p className="organization-slug">
                  <strong>Slug:</strong> {org.slug}
                </p>

                <a href={`http://${org.slug}.lvh.me:5173`} className="organization-link">
                  View organization
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="public-state-card">No organizations match your search.</div>
        )}
      </div>
    </div>
  );
}

export default OrganizationsPage;
