import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentOrganization } from "../services/organizationService";
import {
  getCurrentOrganizationSettings,
  getCurrentOrganizationModules,
} from "../services/organizationDynamicService";
import "../styles/organizationLayout.css";

function OrganizationLayout() {
  const [organization, setOrganization] = useState(null);
  const [settings, setSettings] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [organizationData, settingsData, modulesData] = await Promise.all([
          getCurrentOrganization(),
          getCurrentOrganizationSettings(),
          getCurrentOrganizationModules(),
        ]);

        setOrganization(organizationData);
        setSettings(settingsData);
        setModules(modulesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!organization || !settings) return <div>Failed to load organization.</div>;

  const layoutStyle = {
    "--org-primary": settings.primaryColor || "#0faa9d",
    "--org-secondary": settings.secondaryColor || "#7c3aed",
  };

  return (
    <div className="organization-layout" style={layoutStyle}>
      <header className="organization-header">
        <div className="organization-header-container">
          <div className="organization-brand">
            <div className="organization-brand-logo">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={organization.name}
                  className="organization-brand-logo-image"
                />
              ) : (
                organization.name?.charAt(0)
              )}
            </div>
            <div>
              <h2>{organization.name}</h2>
              <p>{settings.welcomeText}</p>
            </div>
          </div>

          <nav className="organization-nav">
            {modules.map((module) => (
              <Link key={module.id} to="#" className="organization-nav-link">
                {module.moduleName}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="organization-layout-content">
        <Outlet context={{ organization, settings, modules }} />
      </main>
    </div>
  );
}

export default OrganizationLayout;