import { Link, useOutletContext } from "react-router-dom";
import { getModuleRoute } from "../utils/moduleNavigation";
import "../styles/organizationDetailsPage.css";

function OrganizationDetailsPage() {
  const { organization, settings, modules } = useOutletContext();

  if (!organization || !settings) {
    return (
      <div className="org-home-not-found">
        <h1>Organization not found</h1>
      </div>
    );
  }

  return (
    <div className="org-home-page">
      <section className="org-home-hero">
        <div className="org-home-hero-content">
          <p className="org-home-badge">Organization Home</p>
          <h1 className="org-home-title">{settings.homeTitle || organization.name}</h1>
          <p className="org-home-text">{settings.welcomeText || organization.description}</p>

          <div className="org-home-actions">
            <a className="org-home-primary-btn" href="#available-modules">Explore Space</a>
            <a className="org-home-secondary-btn" href="#about-organization">Learn More</a>
          </div>
        </div>

        <div className="org-home-banner-card">
          <div className="org-home-banner-top">
            <div className="org-home-banner-logo">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={organization.name} className="org-home-banner-logo-image" />
              ) : (
                organization.name?.charAt(0)
              )}
            </div>
            <div>
              <h3>{organization.name}</h3>
              <p>{settings.footerText}</p>
            </div>
          </div>

          <div className="org-home-banner-body">
            <p>
              This is the personalized home page of <strong>{organization.name}</strong>.
            </p>
          </div>
        </div>
      </section>

      <section className="org-home-section" id="available-modules">
        <div className="org-home-section-header">
          <h2>Available Modules</h2>
          <p>Only modules granted to this organization appear here.</p>
        </div>

        <div className="org-home-modules-grid">
          {modules.length > 0 ? modules.map((module) => (
            <div key={module.id} className="org-home-module-card">
              <h3>{module.moduleName}</h3>
              <p>{module.moduleDescription}</p>
              <Link to={getModuleRoute(module.moduleCode)} className="org-home-module-btn">
                Open Module
              </Link>
            </div>
          )) : (
            <div className="org-home-module-card">
              <h3>No modules are enabled yet</h3>
              <p>Enabled organization modules will appear here as soon as they are available.</p>
            </div>
          )}
        </div>
      </section>

      <section className="org-home-section" id="about-organization">
        <div className="org-home-info-box">
          <h2>About {organization.name}</h2>
          <p>{organization.description}</p>
        </div>
      </section>
    </div>
  );
}

export default OrganizationDetailsPage;
