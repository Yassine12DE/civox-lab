import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import TenantProfileMenu from "../components/TenantProfileMenu";
import { fetchMe } from "../services/authService";
import { getCurrentOrganization } from "../services/organizationService";
import {
  getCurrentOrganizationSettings,
  getCurrentOrganizationModules,
} from "../services/organizationDynamicService";
import { clearTokens, getAccessToken } from "../utils/tokenStorage";
import { getModuleRoute } from "../utils/moduleNavigation";
import { canOpenBackOffice } from "../utils/rbac";
import "../styles/organizationLayout.css";

function OrganizationLayout() {
  const [organization, setOrganization] = useState(null);
  const [settings, setSettings] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshCurrentUser = async () => {
    if (!getAccessToken()) {
      setCurrentUser(null);
      return null;
    }

    try {
      const user = await fetchMe();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.warn("Profile session unavailable", error);
      clearTokens();
      setCurrentUser(null);
      return null;
    }
  };

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
        await refreshCurrentUser();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    document.title = organization?.name?.trim() || "CIVOX";
  }, [organization?.name]);

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
          <div className="organization-header-topline">
            <Link to="/" className="organization-brand">
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
            </Link>

            <TenantProfileMenu
              user={currentUser}
              organization={organization}
              settings={settings}
              onSignedOut={() => setCurrentUser(null)}
            />
          </div>

          <nav className="organization-nav">
            <Link to="/" className="organization-nav-link">
              Home
            </Link>
            {canOpenBackOffice(currentUser) && (
              <Link to="/backoffice" className="organization-nav-link">
                Back Office
              </Link>
            )}
            {modules.map((module) => (
              <Link
                key={module.id}
                to={getModuleRoute(module.moduleCode)}
                className="organization-nav-link"
              >
                {module.moduleName}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="organization-layout-content">
        <Outlet
          context={{
            organization,
            settings,
            modules,
            currentUser,
            setCurrentUser,
            refreshCurrentUser,
          }}
        />
      </main>
    </div>
  );
}

export default OrganizationLayout;
