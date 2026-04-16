import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  PremiumIconTile,
  PremiumStatusBadge,
  OrganizationEmptyState,
} from "../components/organization/OrganizationUi";
import { getModuleRoute } from "../utils/moduleNavigation";

const fallbackCards = [
  {
    id: "placeholder-budget",
    moduleCode: "VOTE",
    moduleName: "2026 Community Budget Allocation",
    moduleDescription:
      "Cast your vote on how community development funds should be allocated across infrastructure, education, and sustainability projects.",
    status: "active",
    category: "Budget & Finance",
    participants: 1247,
    deadline: "5 days left",
    completion: 62,
    isPlaceholder: true,
  },
  {
    id: "placeholder-park",
    moduleCode: "CONFERENCE",
    moduleName: "Public Space Renovation Ideas",
    moduleDescription:
      "Share your vision for improving a shared community space and making it more accessible for everyone.",
    status: "active",
    category: "Urban Development",
    participants: 892,
    deadline: "12 days left",
    completion: 45,
    isPlaceholder: true,
  },
  {
    id: "placeholder-traffic",
    moduleCode: "VOTE",
    moduleName: "Community Priorities Survey",
    moduleDescription:
      "Help decide which local improvements should be prioritized in the next planning cycle.",
    status: "closing-soon",
    category: "Participation",
    participants: 2103,
    deadline: "2 days left",
    completion: 85,
    isPlaceholder: true,
  },
  {
    id: "placeholder-news",
    moduleCode: "YOUTHSPACE",
    moduleName: "Youth Programs Expansion",
    moduleDescription:
      "Learn about new youth activities and help shape opportunities for young community members.",
    status: "active",
    category: "Education",
    participants: 456,
    deadline: "Ongoing",
    completion: 0,
    isPlaceholder: true,
  },
  {
    id: "placeholder-sustainability",
    moduleCode: "CONFERENCE",
    moduleName: "Sustainability Roadmap 2030",
    moduleDescription:
      "Join the conversation about renewable energy, waste reduction, and greener public spaces.",
    status: "active",
    category: "Environment",
    participants: 1567,
    deadline: "18 days left",
    completion: 38,
    isPlaceholder: true,
  },
  {
    id: "placeholder-hours",
    moduleCode: "VOTE",
    moduleName: "Community Center Operating Hours",
    moduleDescription:
      "Vote on proposed changes to public service hours and evening availability.",
    status: "upcoming",
    category: "Community Services",
    participants: 0,
    deadline: "Starts in 3 days",
    completion: 0,
    isPlaceholder: true,
  },
];

const filters = [
  { id: "all", label: "All Modules" },
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

function OrganizationModulesPage() {
  const { organization, modules } = useOutletContext();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const moduleCards = useMemo(() => buildModuleCards(modules), [modules]);
  const filteredModules = moduleCards.filter((module) => {
    const matchesFilter = activeFilter === "all" || module.status === activeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      module.moduleName.toLowerCase().includes(query) ||
      module.moduleDescription.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="premium-page">
      <section className="premium-hero premium-hero--compact">
        <div className="premium-hero__inner">
          <div className="premium-hero__content">
            <h1>Participation Modules</h1>
            <p>
              Explore all the ways you can engage with {organization?.name || "your community"}.
              Vote, share ideas, and stay informed.
            </p>
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-container">
          <div className="premium-toolbar">
            <label className="premium-search-bar">
              <OrgIcon name="search" size={20} />
              <input
                type="search"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <div className="premium-filter-tabs">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeFilter === filter.id ? "is-active" : ""}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <p className="premium-results-count">
            Showing <strong>{filteredModules.length}</strong>{" "}
            {filteredModules.length === 1 ? "module" : "modules"}
          </p>

          {filteredModules.length > 0 ? (
            <div className="premium-content-grid">
              {filteredModules.map((module, index) => {
                const info = getModuleInfo(module.moduleCode, index);
                const to = module.isPlaceholder ? "/modules" : getModuleRoute(module.moduleCode);

                return (
                  <article
                    key={module.id || `${module.moduleCode}-${index}`}
                    className={`premium-content-card ${info.tone === "secondary" ? "premium-content-card--secondary" : ""}`}
                  >
                    <div className="premium-content-card__header">
                      <div className="premium-module-card__top">
                        <PremiumIconTile icon={info.icon} tone={info.tone} />
                        <PremiumStatusBadge status={module.statusLabel || module.status}>
                          {module.statusLabel || formatStatus(module.status)}
                        </PremiumStatusBadge>
                      </div>
                      <h3>{module.moduleName}</h3>
                      <span className="premium-status premium-status--neutral">
                        {module.category || getCategory(module.moduleCode)}
                      </span>
                    </div>

                    <div className="premium-content-card__body">
                      <p>{module.moduleDescription}</p>

                      <div className="premium-card-stats">
                        <div>
                          <span>Participants</span>
                          <strong>{module.participants ? module.participants.toLocaleString() : "-"}</strong>
                        </div>
                        <div>
                          <span>Deadline</span>
                          <strong>{module.deadline || "Ongoing"}</strong>
                        </div>
                        <div>
                          <span>Progress</span>
                          <strong>{module.completion ? `${module.completion}%` : "-"}</strong>
                        </div>
                      </div>

                      {module.completion > 0 && (
                        <div className="premium-progress" aria-hidden="true">
                          <span style={{ width: `${module.completion}%` }} />
                        </div>
                      )}

                      <Link to={to} className="premium-gradient-button" style={{ marginTop: 22 }}>
                        {module.status === "upcoming" ? "Learn More" : "Participate Now"}
                        <OrgIcon name="arrowRight" size={18} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <OrganizationEmptyState
              title="No modules found"
              message="Try adjusting your search or filter criteria."
              icon="search"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function buildModuleCards(modules) {
  const realCards = modules.map((module, index) => ({
    ...module,
    status: "active",
    statusLabel: "Active",
    category: getCategory(module.moduleCode),
    participants: module.participants || [1247, 892, 456][index % 3],
    deadline: module.deadline || "Ongoing",
    completion: module.completion || [62, 45, 0][index % 3],
  }));

  if (realCards.length >= 6) {
    return realCards;
  }

  const usedNames = new Set(realCards.map((module) => module.moduleName));
  const placeholders = fallbackCards.filter((module) => !usedNames.has(module.moduleName));

  return [...realCards, ...placeholders].slice(0, 6);
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

function getCategory(moduleCode) {
  const categories = {
    VOTE: "Civic Decision",
    CONFERENCE: "Consultation",
    YOUTHSPACE: "Community News",
  };

  return categories[moduleCode] || "Organization Module";
}

function formatStatus(status) {
  if (!status) return "Active";
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default OrganizationModulesPage;
