import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getOrganizationBackOfficeModules,
  updateOrganizationModuleVisibility,
} from "../services/orgBackOfficeService";
import "../styles/organizationManageModulesPage.css";

function OrganizationManageModulesPage() {
  const { organization } = useOutletContext();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const modulesData = await getOrganizationBackOfficeModules(organization.id);
      setModules(modulesData);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  return (
    <div className="org-manage-modules-page">
      <section className="org-manage-modules-hero">
        <p className="org-manage-modules-badge">Organization Back-office</p>
        <h1>Manage Granted Modules</h1>
        <p>
          Org admin can only manage modules already granted by the super admin.
        </p>
        {error && <p className="org-manage-modules-error">{error}</p>}
      </section>

      <section className="org-manage-modules-grid">
        {modules.length > 0 ? (
          modules.map((module) => (
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
          ))
        ) : (
          <div className="org-manage-module-card">
            <h2>No granted modules yet</h2>
            <p>Modules granted to this organization will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default OrganizationManageModulesPage;
