import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  PremiumIconTile,
  PremiumStatusBadge,
  OrganizationEmptyState,
} from "../components/organization/OrganizationUi";
import {
  getModuleCategory,
  getModuleIcon,
  getModuleRoute,
  getModuleTone,
} from "../utils/moduleNavigation";

const filters = [
  { id: "all", label: "All Modules" },
  { id: "with-content", label: "With Content" },
  { id: "empty", label: "Empty" },
];

function OrganizationModulesPage() {
  const { organization, modules, moduleInsights } = useOutletContext();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const moduleCards = useMemo(
    () =>
      modules.map((module) => {
        const insight = moduleInsights?.[module.moduleCode] || {};
        const contentCount = Number(insight.contentCount || 0);
        return {
          ...module,
          contentCount,
          responseCount: Number(insight.responseCount || 0),
          status: contentCount > 0 ? "active" : "empty",
        };
      }),
    [moduleInsights, modules]
  );

  const filteredModules = moduleCards.filter((module) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      module.moduleName.toLowerCase().includes(query) ||
      String(module.moduleDescription || "").toLowerCase().includes(query) ||
      module.moduleCode.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (activeFilter === "with-content") return module.contentCount > 0;
    if (activeFilter === "empty") return module.contentCount === 0;
    return true;
  });

  return (
    <div className="premium-page">
      <section className="premium-hero premium-hero--compact">
        <div className="premium-hero__inner">
          <div className="premium-hero__content">
            <h1>Participation Modules</h1>
            <p>
              Explore all modules enabled for {organization?.name || "this organization"}.
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
              {filteredModules.map((module) => (
                <article key={module.moduleCode} className="premium-content-card">
                  <div className="premium-content-card__header">
                    <div className="premium-module-card__top">
                      <PremiumIconTile
                        icon={getModuleIcon(module.moduleCode, "layers")}
                        tone={getModuleTone(module.moduleCode, "primary")}
                      />
                      <PremiumStatusBadge status={module.status}>
                        {module.status === "active" ? "Active" : "No content yet"}
                      </PremiumStatusBadge>
                    </div>
                    <h3>{module.moduleName}</h3>
                    <span className="premium-status premium-status--neutral">
                      {getModuleCategory(module.moduleCode)}
                    </span>
                  </div>

                  <div className="premium-content-card__body">
                    <p>{module.moduleDescription || "Organization module"}</p>

                    <div className="premium-card-stats">
                      <div>
                        <span>Published items</span>
                        <strong>{module.contentCount}</strong>
                      </div>
                      <div>
                        <span>Responses</span>
                        <strong>{module.responseCount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span>Code</span>
                        <strong>{module.moduleCode}</strong>
                      </div>
                    </div>

                    <Link to={getModuleRoute(module.moduleCode)} className="premium-gradient-button" style={{ marginTop: 22 }}>
                      Open Module
                      <OrgIcon name="arrowRight" size={18} />
                    </Link>
                  </div>
                </article>
              ))}
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

export default OrganizationModulesPage;
