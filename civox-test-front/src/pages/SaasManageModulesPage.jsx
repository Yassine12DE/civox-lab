import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { modules } from "../data/modules";
import {
  getSaasOrganizationBySlug,
  getSaasOrganizationModules,
  grantModuleToOrganization,
  removeModuleFromOrganization,
} from "../services/saasService";
import "../styles/saasManageModulesPage.css";

function SaasManageModulesPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [grantedModules, setGrantedModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const org = await getSaasOrganizationBySlug(slug);
      setOrganization(org);

      if (org?.id) {
        const modulesData = await getSaasOrganizationModules(org.id);
        setGrantedModules(modulesData);
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

  const handleToggleModule = async (moduleCode, isGranted) => {
    if (!organization?.id) return;

    try {
      if (isGranted) {
        await removeModuleFromOrganization(organization.id, moduleCode);
      } else {
        await grantModuleToOrganization(organization.id, moduleCode);
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Action failed");
    }
  };

  if (loading) {
    return (
      <div className="saas-manage-modules-not-found">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="saas-manage-modules-not-found">
        <h1>Organization not found</h1>
      </div>
    );
  }

  return (
    <div className="saas-manage-modules-page">
      <section className="saas-manage-modules-hero">
        <p className="saas-manage-modules-badge">Manage Modules</p>
        <h1>{organization.name}</h1>
        <p>
          Super admin can grant or remove modules for this organization.
        </p>
      </section>

      <section className="saas-manage-modules-grid">
        {modules.map((module) => {
          const isGranted = grantedModules.some(
            (granted) => granted.moduleCode === module.code && granted.grantedBySaas
          );

          return (
            <div key={module.id} className="saas-manage-module-card">
              <h2>{module.name}</h2>
              <p>{module.description}</p>

              <div className="saas-manage-module-status">
                <span
                  className={
                    isGranted
                      ? "saas-module-status granted"
                      : "saas-module-status not-granted"
                  }
                >
                  {isGranted ? "Granted" : "Not granted"}
                </span>
              </div>

              <button
                className="saas-manage-module-btn"
                onClick={() => handleToggleModule(module.code, isGranted)}
              >
                {isGranted ? "Remove Module" : "Grant Module"}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default SaasManageModulesPage;