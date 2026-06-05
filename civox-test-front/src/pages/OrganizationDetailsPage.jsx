import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  PremiumIconTile,
  PremiumStatCard,
} from "../components/organization/OrganizationUi";
import {
  getModuleCategory,
  getModuleIcon,
  getModuleRoute,
  getModuleTone,
} from "../utils/moduleNavigation";

function OrganizationDetailsPage() {
  const { organization, settings, modules, moduleInsights } = useOutletContext();

  if (!organization || !settings) {
    return (
      <div className="premium-empty-center">
        <h1>Organization not found</h1>
      </div>
    );
  }

  const heroTitle = settings.homeTitle || `Your Voice Shapes ${organization.name}`;
  const heroText =
    settings.welcomeText ||
    organization.description ||
    "Join engaged members making a real difference in this community.";
  const bannerStyle = settings.bannerImageUrl
    ? { "--org-banner-image": `url("${settings.bannerImageUrl}")` }
    : undefined;

  const publishedItems = modules.reduce(
    (sum, module) => sum + Number(moduleInsights?.[module.moduleCode]?.contentCount || 0),
    0
  );
  const totalResponses = modules.reduce(
    (sum, module) => sum + Number(moduleInsights?.[module.moduleCode]?.responseCount || 0),
    0
  );

  const stats = [
    {
      label: "Active Modules",
      value: String(modules.length),
      icon: "layers",
      tone: "primary",
    },
    {
      label: "Published Items",
      value: String(publishedItems),
      icon: "file",
      tone: "secondary",
    },
    {
      label: "Citizen Responses",
      value: totalResponses.toLocaleString(),
      icon: "users",
      tone: "primary",
    },
    {
      label: "Tenant Visibility",
      value: "Live",
      icon: "checkCircle",
      tone: "secondary",
    },
  ];

  const spotlightModules = modules.slice(0, 3);

  return (
    <div className="premium-page">
      <section
        className={`premium-hero ${settings.bannerImageUrl ? "has-banner" : ""}`}
        style={bannerStyle}
      >
        <div className="premium-hero__inner">
          <div className="premium-hero__content">
            <div className="premium-hero__badge">
              <OrgIcon name="sparkles" size={16} />
              Powered by CIVOX Platform
            </div>
            <h1>{heroTitle}</h1>
            <p>{heroText}</p>
            <div className="premium-hero__actions">
              <Link to="/modules" className="premium-hero__primary">
                Explore Modules
                <OrgIcon name="arrowRight" size={20} />
              </Link>
              <a href="#about-organization" className="premium-hero__secondary">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-stats-grid" aria-label="Organization activity summary">
        {stats.map((stat) => (
          <PremiumStatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="premium-section">
        <div className="premium-container">
          <div className="premium-section__header">
            <h2>Engage with Your Community</h2>
            <p>All modules below are synchronized from SaaS and tenant configuration.</p>
          </div>

          {spotlightModules.length > 0 ? (
            <div className="premium-module-grid">
              {spotlightModules.map((module) => (
                <Link
                  key={module.moduleCode}
                  to={getModuleRoute(module.moduleCode)}
                  className="premium-module-card"
                >
                  <div className="premium-module-card__top">
                    <PremiumIconTile icon={getModuleIcon(module.moduleCode, "layers")} tone={getModuleTone(module.moduleCode, "primary")} />
                    <span className="premium-count-pill">
                      {moduleInsights?.[module.moduleCode]?.contentCount || 0}
                    </span>
                  </div>
                  <h3>{module.moduleName}</h3>
                  <p>{module.moduleDescription || "Organization module"}</p>
                  <span className="premium-status premium-status--neutral">
                    {getModuleCategory(module.moduleCode)}
                  </span>
                  <span className="premium-card-cta">
                    Explore
                    <OrgIcon name="arrowRight" size={18} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <OrganizationEmptyState
              title="No modules are visible yet"
              message="This tenant currently has no public modules enabled."
              icon="layers"
            />
          )}
        </div>
      </section>

      <section className="premium-section" id="about-organization">
        <div className="premium-container">
          <div className="premium-cta-panel">
            <h2>Ready to Participate?</h2>
            <p>
              Join {organization.name} and participate in the modules currently enabled for
              this workspace.
            </p>
            <Link to="/modules" className="premium-hero__primary">
              Open Modules
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OrganizationDetailsPage;
