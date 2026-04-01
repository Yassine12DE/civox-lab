import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getSaasOrganizationBySlug,
  getSaasOrganizationModules,
} from "../services/saasService";
import "../styles/saasOrganizationDetailsPage.css";

function SaasOrganizationDetailsPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const org = await getSaasOrganizationBySlug(slug);
        setOrganization(org);

        if (org?.id) {
          const modulesData = await getSaasOrganizationModules(org.id);
          setModules(modulesData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [slug]);

  if (loading) {
    return (
      <div className="saas-org-not-found">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="saas-org-not-found">
        <h1>Organization not found</h1>
      </div>
    );
  }

  return (
    <div className="saas-org-page">
      <section className="saas-org-hero">
        <div className="saas-org-hero-left">
          <p className="saas-org-badge">Organization Management</p>
          <h1>{organization.name}</h1>
          <p>{organization.description}</p>
        </div>

        <div className="saas-org-hero-card">
          <div className="saas-org-logo">{organization.name?.charAt(0)}</div>
          <h3>{organization.name}</h3>
          <p>{organization.slug}</p>
        </div>
      </section>

      <section className="saas-org-grid">
        <div className="saas-org-box">
          <h2>Organization Info</h2>
          <p><strong>Name:</strong> {organization.name}</p>
          <p><strong>Slug:</strong> {organization.slug}</p>
          <p><strong>Status:</strong> {organization.status}</p>
        </div>

        <div className="saas-org-box saas-org-box-full">
          <h2>Granted Modules</h2>
          <div className="saas-org-modules">
            {modules.length > 0 ? (
              modules.map((module) => (
                <span key={module.id} className="saas-org-module-pill">
                  {module.moduleName}
                </span>
              ))
            ) : (
              <p>No granted modules.</p>
            )}
          </div>
        </div>

        <div className="saas-org-box saas-org-box-full">
          <h2>Super Admin Actions</h2>
          <div className="saas-org-actions">
            <button>Edit organization</button>
            <Link
              to={`/saas/organizations/${organization.slug}/modules`}
              className="saas-org-action-link"
            >
              Manage modules
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SaasOrganizationDetailsPage;