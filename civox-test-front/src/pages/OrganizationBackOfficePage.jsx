import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getOrganizationBackOfficeModules } from "../services/orgBackOfficeService";
import { getModuleCreateRoute } from "../utils/moduleNavigation";
import {
  canCreateFromModule,
  canCustomizeDesign,
  canManageModuleVisibility,
  canManageUsers,
  canRequestModules,
} from "../utils/rbac";
import "../styles/organizationBackOfficePage.css";

function OrganizationBackOfficePage() {
  const { organization, currentUser } = useOutletContext();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) return;

      try {
        const modulesData = await getOrganizationBackOfficeModules(organization.id);
        setModules(modulesData);
      } catch (error) {
        console.error(error);
        setError(error.message || "Failed to load back-office data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organization?.id]);

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

  const enabledModules = modules.filter(
    (module) => module.grantedBySaas && module.enabledByOrganization
  );
  const creationModules = enabledModules.filter((module) =>
    canCreateFromModule(currentUser, module.moduleCode)
  );

  return (
    <div className="org-bo-page">
      <section className="org-bo-hero">
        <p className="org-bo-badge">Organization Back-office</p>
        <h1>{organization.name}</h1>
        <p>
          This area is for organization admins to manage their own users,
          modules, design, and content.
        </p>
        {error && <p className="org-bo-error">{error}</p>}
      </section>

      <section className="org-bo-grid">
        {canManageUsers(currentUser) && (
          <div className="org-bo-card">
            <h2>Users</h2>
            <p>Manage organization users inside this tenant.</p>
            <Link to="/backoffice/users" className="org-bo-btn">Manage users</Link>
          </div>
        )}

        {canManageModuleVisibility(currentUser) && (
          <div className="org-bo-card">
            <h2>Granted Modules</h2>
            <p>{modules.length} module(s) available for this organization.</p>
            <Link to="/backoffice/modules" className="org-bo-btn">
              Manage modules
            </Link>
          </div>
        )}

        {canCustomizeDesign(currentUser) && (
          <div className="org-bo-card">
            <h2>Front-office Design</h2>
            <p>Update logo, colors, title, banner, and footer text.</p>
            <Link to="/backoffice/design" className="org-bo-btn">
              Customize design
            </Link>
          </div>
        )}

        {canRequestModules(currentUser) && (
          <div className="org-bo-card">
            <h2>Extra Module Requests</h2>
            <p>Request missing modules from Back-office SaaS.</p>
            <Link to="/backoffice/module-requests" className="org-bo-btn">
              Request module
            </Link>
          </div>
        )}

        {creationModules.map((module) => (
          <div key={module.moduleCode} className="org-bo-card">
            <h2>Create {module.moduleName}</h2>
            <p>{module.moduleDescription}</p>
            <Link to={getModuleCreateRoute(module.moduleCode)} className="org-bo-btn">
              Create content
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}

export default OrganizationBackOfficePage;
