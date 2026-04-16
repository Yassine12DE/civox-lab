import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  PremiumIconTile,
  PremiumStatCard,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import { getModuleRoute } from "../utils/moduleNavigation";

const fallbackModules = [
  {
    moduleCode: "VOTE",
    moduleName: "Active Votes",
    moduleDescription: "Participate in ongoing community decisions",
    count: 5,
  },
  {
    moduleCode: "CONFERENCE",
    moduleName: "Consultations",
    moduleDescription: "Share your opinion on local initiatives",
    count: 8,
  },
  {
    moduleCode: "YOUTHSPACE",
    moduleName: "Community News",
    moduleDescription: "Stay informed about organization developments",
    count: 12,
  },
];

const highlights = [
  {
    title: "Budget Allocation Vote",
    description: "Help decide how resources should be invested in the community's future.",
    status: "Active",
    deadline: "5 days left",
    participants: 1247,
  },
  {
    title: "Public Space Consultation",
    description: "Share your ideas for improving shared spaces and local services.",
    status: "Active",
    deadline: "12 days left",
    participants: 892,
  },
  {
    title: "Community Priorities Survey",
    description: "Your feedback helps prioritize upcoming organization actions.",
    status: "Closing Soon",
    deadline: "2 days left",
    participants: 2103,
  },
];

function OrganizationDetailsPage() {
  const { organization, settings, modules } = useOutletContext();

  if (!organization || !settings) {
    return (
      <div className="premium-empty-center">
        <h1>Organization not found</h1>
      </div>
    );
  }

  const visibleModules = modules.length > 0 ? modules : fallbackModules;
  const moduleCards = fillTemplateModules(modules);
  const heroTitle = settings.homeTitle || `Your Voice Shapes ${organization.name}`;
  const heroText =
    settings.welcomeText ||
    organization.description ||
    "Join engaged members making a real difference in this community. Participate, vote, and be heard.";
  const bannerStyle = settings.bannerImageUrl
    ? { "--org-banner-image": `url("${settings.bannerImageUrl}")` }
    : undefined;

  const stats = [
    {
      label: "Active Votes",
      value: String(countModule(modules, "VOTE") || 12),
      icon: "vote",
      tone: "primary",
    },
    {
      label: "Participants",
      value: "8.5K",
      icon: "users",
      tone: "secondary",
    },
    {
      label: "Consultations",
      value: String(countModule(modules, "CONFERENCE") || 24),
      icon: "message",
      tone: "primary",
    },
    {
      label: "Engagement",
      value: "94%",
      icon: "trending",
      tone: "secondary",
    },
  ];

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
            <p>
              Explore interactive modules designed to amplify your voice and make civic
              participation effortless.
            </p>
          </div>

          <div className="premium-module-grid">
            {moduleCards.map((module, index) => {
              const info = getModuleInfo(module.moduleCode, index);
              return (
                <Link
                  key={`${module.moduleCode}-${index}`}
                  to={module.isPlaceholder ? "/modules" : getModuleRoute(module.moduleCode)}
                  className="premium-module-card"
                >
                  <div className="premium-module-card__top">
                    <PremiumIconTile icon={info.icon} tone={info.tone} />
                    <span className="premium-count-pill">{module.count || index + 5}</span>
                  </div>
                  <h3>{module.moduleName}</h3>
                  <p>{module.moduleDescription}</p>
                  <span className="premium-card-cta">
                    Explore
                    <OrgIcon name="arrowRight" size={18} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="premium-section premium-section--tinted">
        <div className="premium-container">
          <div className="premium-section__header premium-section__header--split">
            <div>
              <h2>Trending Now</h2>
              <p>Join these important conversations</p>
            </div>
            <Link to="/modules" className="premium-gradient-button">
              View All
              <OrgIcon name="arrowRight" size={18} />
            </Link>
          </div>

          <div className="premium-highlight-grid">
            {highlights.map((item) => (
              <article key={item.title} className="premium-highlight-card">
                <div className="premium-highlight-card__top">
                  <PremiumStatusBadge status={item.status}>{item.status}</PremiumStatusBadge>
                  <span className="premium-status premium-status--neutral">
                    <OrgIcon name="clock" size={14} />
                    {item.deadline}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <div className="premium-meta-row">
                  <span>
                    <OrgIcon name="users" size={16} />
                    {item.participants.toLocaleString()} participants
                  </span>
                  <Link
                    to={visibleModules[0]?.moduleCode ? getModuleRoute(visibleModules[0].moduleCode) : "/modules"}
                    className="premium-card-cta"
                  >
                    Participate
                    <OrgIcon name="arrowRight" size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section" id="about-organization">
        <div className="premium-container">
          <div className="premium-cta-panel">
            <h2>Ready to Make a Difference?</h2>
            <p>
              Join {organization.name} and start participating in decisions that shape
              the future of this community.
            </p>
            <Link to="/modules" className="premium-hero__primary">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function countModule(modules, moduleCode) {
  return modules.filter((module) => module.moduleCode === moduleCode).length;
}

function fillTemplateModules(modules) {
  const realModules = modules.map((module) => ({
    ...module,
    count: module.contentCount || module.count || 1,
  }));

  if (realModules.length >= 3) {
    return realModules.slice(0, 3);
  }

  const usedCodes = new Set(realModules.map((module) => module.moduleCode));
  const placeholders = fallbackModules
    .filter((module) => !usedCodes.has(module.moduleCode))
    .map((module) => ({ ...module, isPlaceholder: true }));

  return [...realModules, ...placeholders].slice(0, 3);
}

function getModuleInfo(moduleCode, index = 0) {
  const map = {
    VOTE: { icon: "vote", tone: "primary" },
    CONFERENCE: { icon: "message", tone: "secondary" },
    YOUTHSPACE: { icon: "file", tone: "primary" },
  };

  return map[moduleCode] || {
    icon: index % 2 === 0 ? "layers" : "file",
    tone: index % 2 === 0 ? "primary" : "secondary",
  };
}

export default OrganizationDetailsPage;
