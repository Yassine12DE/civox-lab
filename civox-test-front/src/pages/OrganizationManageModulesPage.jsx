import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCurrentOrganization } from "../services/organizationService";
import {
  getOrganizationBackOfficeModules,
  updateOrganizationModuleVisibility,
} from "../services/orgBackOfficeService";
import "../styles/organizationManageModulesPage.css";

function OrganizationManageModulesPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleToggleVisibility = async (moduleCode, currentValue) => {
    if (!organization?.id) return;

    try {
      await updateOrganizationModuleVisibility(
        organization.id,
        moduleCode,
        !currentValue
      );

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to update module visibility");
    }
  };

  if (loading) {
    return (
      <div className="org-manage-modules-not-found">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="org-manage-modules-not-found">
        <h1>Organization not found</h1>
      </div>
    );
  }

  const pageStyle = {
    "--org-primary": "#2563eb",
    "--org-secondary": "#7c3aed",
  };

  return (
    <div className="org-manage-modules-page" style={pageStyle}>
      <section className="org-manage-modules-hero">
        <p className="org-manage-modules-badge">Organization Back-office</p>
        <h1>Manage Granted Modules</h1>
        <p>
          Org admin can only manage modules already granted by the super admin.
        </p>
      </section>

      <section className="org-manage-modules-grid">
        {modules.map((module) => (
          <div key={module.id} className="org-manage-module-card">
            <h2>{module.moduleName}</h2>
            <p>{module.moduleDescription}</p>

            <span
              className={`org-manage-module-status ${
                module.grantedBySaas ? "granted" : "not-granted"
              }`}
            >
              {module.grantedBySaas ? "Granted to organization" : "Not granted"}
            </span>

            <button
              className="org-manage-module-btn"
              onClick={() =>
                handleToggleVisibility(
                  module.moduleCode,
                  module.enabledByOrganization
                )
              }
            >
              {module.enabledByOrganization ? "Hide in Front-office" : "Show in Front-office"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default OrganizationManageModulesPage;