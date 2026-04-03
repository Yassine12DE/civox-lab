import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCurrentOrganization } from "../services/organizationService";
import { getOrganizationBackOfficeModules } from "../services/orgBackOfficeService";
import "../styles/organizationBackOfficePage.css";

function OrganizationBackOfficePage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const org = await getCurrentOrganization();
        setOrganization(org);

        if (org?.id) {
          const modulesData = await getOrganizationBackOfficeModules(org.id);
          setModules(modulesData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="org-bo-not-found">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="org-bo-not-found">
        <h1>Organization not found</h1>
      </div>
    );
  }

  const pageStyle = {
    "--org-primary": "#2563eb",
    "--org-secondary": "#7c3aed",
  };

  return (
    <div className="org-bo-page" style={pageStyle}>
      <section className="org-bo-hero">
        <p className="org-bo-badge">Organization Back-office</p>
        <h1>{organization.name}</h1>
        <p>
          This area is for organization admins to manage their own users,
          modules, design, and content.
        </p>
      </section>

      <section className="org-bo-grid">
        <div className="org-bo-card">
          <h2>Users</h2>
          <p>Manage organization users.</p>
          <Link to="#" className="org-bo-btn">Manage users</Link>
        </div>

        <div className="org-bo-card">
          <h2>Granted Modules</h2>
          <p>{modules.length} module(s) available for this organization.</p>
          <Link
            to={`/backoffice/modules`}
            className="org-bo-btn"
          >
            Manage modules
          </Link>
        </div>

        <div className="org-bo-card">
          <h2>Front-office Design</h2>
          <p>Update logo, colors, title, banner, and footer text.</p>
          <Link
            to={`/backoffice/design`}
            className="org-bo-btn"
          >
            Customize design
          </Link>
        </div>

        <div className="org-bo-card">
          <h2>Extra Module Requests</h2>
          <p>Request missing modules from Back-office SaaS.</p>
          <Link to={`/backoffice/module-requests`}className="org-bo-btn">
          Request module
          </Link>
        </div>
      </section>
    </div>
  );
}

export default OrganizationBackOfficePage;