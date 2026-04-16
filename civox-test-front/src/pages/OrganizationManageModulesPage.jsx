import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumIconTile,
  PremiumStatusBadge,
  PremiumStatCard,
} from "../components/organization/OrganizationUi";
import {
  getOrganizationBackOfficeModules,
  updateOrganizationModuleVisibility,
} from "../services/orgBackOfficeService";
import { getModuleCreateRoute } from "../utils/moduleNavigation";

const tabs = [
  { id: "all", label: "All Content" },
  { id: "votes", label: "Votes" },
  { id: "consultations", label: "Consultations" },
  { id: "news", label: "News" },
];

const placeholderContent = [
  {
    id: "static-budget",
    moduleCode: "VOTE",
    moduleName: "Community Budget Allocation 2026",
    moduleDescription: "Decision on community development fund distribution",
    status: "active",
    participants: 1247,
    views: 3421,
    engagement: 68,
    created: "Apr 1, 2026",
    deadline: "Apr 20, 2026",
    author: "Admin Team",
    isPlaceholder: true,
  },
  {
    id: "static-park",
    moduleCode: "CONFERENCE",
    moduleName: "Public Space Renovation Ideas",
    moduleDescription: "Gathering community input for shared space improvements",
    status: "active",
    participants: 892,
    views: 2103,
    engagement: 52,
    created: "Mar 28, 2026",
    deadline: "Apr 27, 2026",
    author: "Moderator",
    isPlaceholder: true,
  },
  {
    id: "static-news",
    moduleCode: "YOUTHSPACE",
    moduleName: "Youth Programs Expansion Announcement",
    moduleDescription: "New youth programs and activities",
    status: "published",
    participants: 0,
    views: 1234,
    engagement: 0,
    created: "Apr 10, 2026",
    deadline: "-",
    author: "Organization staff",
    isPlaceholder: true,
  },
];

function OrganizationManageModulesPage() {
  const { organization } = useOutletContext();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const modulesData = await getOrganizationBackOfficeModules(organization.id);
      setModules(modulesData);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Failed to load modules");
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
      await updateOrganizationModuleVisibility(organization.id, moduleCode, !currentValue);
      await loadData();
    } catch (toggleError) {
      console.error(toggleError);
      setError("Failed to update module visibility");
    }
  };

  const content = useMemo(() => buildContentCards(modules), [modules]);
  const filteredContent = content.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "votes") return item.moduleCode === "VOTE";
    if (activeTab === "consultations") return item.moduleCode === "CONFERENCE";
    if (activeTab === "news") return item.moduleCode === "YOUTHSPACE";
    return true;
  });

  if (loading) {
    return (
      <div className="premium-empty-center">
        <OrganizationLoadingState
          title="Loading content controls"
          message="Fetching tenant grants and visibility settings."
        />
      </div>
    );
  }

  const grantedCount = modules.filter((module) => module.grantedBySaas).length;
  const visibleCount = modules.filter((module) => module.enabledByOrganization).length;
  const createRoute = content.find((item) => getModuleCreateRoute(item.moduleCode))?.moduleCode;

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>Content Management</h1>
          <p>Create and manage votes, consultations, announcements, and module visibility</p>
        </div>
        {createRoute && (
          <Link to={getModuleCreateRoute(createRoute)} className="premium-gradient-button">
            <OrgIcon name="plus" size={20} />
            Create Content
          </Link>
        )}
      </header>

      {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}

      <section className="premium-admin-stats" aria-label="Content summary">
        <PremiumStatCard icon="layers" label="Total Content" value={String(content.length || 42)} />
        <PremiumStatCard icon="power" label="Active Now" value={String(visibleCount || 16)} tone="secondary" />
        <PremiumStatCard icon="eye" label="Total Views" value="24.8K" />
        <PremiumStatCard icon="trending" label="Avg Engagement" value="62%" tone="secondary" />
      </section>

      <section className="premium-form-card">
        <div className="premium-filter-tabs">
          {tabs.map((tab) => {
            const count = getTabCount(content, tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span style={{ marginLeft: 8 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {filteredContent.length > 0 ? (
        <section className="premium-content-grid">
          {filteredContent.map((item, index) => {
            const info = getModuleInfo(item.moduleCode, index);
            const createHref = getModuleCreateRoute(item.moduleCode);

            return (
              <article
                key={item.id || `${item.moduleCode}-${index}`}
                className={`premium-content-card ${info.tone === "secondary" ? "premium-content-card--secondary" : ""}`}
              >
                <div className="premium-content-card__header">
                  <div className="premium-module-card__top">
                    <PremiumIconTile icon={info.icon} tone={info.tone} />
                    <PremiumStatusBadge status={item.status}>
                      {formatStatus(item.status)}
                    </PremiumStatusBadge>
                  </div>
                  <h3>{item.moduleName}</h3>
                  <p>{item.moduleDescription}</p>
                </div>

                <div className="premium-content-card__body">
                  <div className="premium-card-stats">
                    <div>
                      <span>Participants</span>
                      <strong>{item.participants ? item.participants.toLocaleString() : "-"}</strong>
                    </div>
                    <div>
                      <span>Views</span>
                      <strong>{item.views ? item.views.toLocaleString() : "-"}</strong>
                    </div>
                    <div>
                      <span>Engagement</span>
                      <strong>{item.engagement ? `${item.engagement}%` : "-"}</strong>
                    </div>
                  </div>

                  <div className="premium-meta-row" style={{ marginBottom: 20 }}>
                    <span>Created: <strong>{item.created}</strong></span>
                    <span>Deadline: <strong>{item.deadline}</strong></span>
                  </div>

                  <div className="premium-card-actions">
                    {createHref && !item.isPlaceholder && (
                      <Link to={createHref} className="premium-soft-button">
                        <OrgIcon name="edit" size={16} />
                        Edit
                      </Link>
                    )}
                    {!item.isPlaceholder && (
                      <button
                        type="button"
                        className={item.enabledByOrganization ? "premium-soft-button" : "premium-gradient-button"}
                        disabled={!item.grantedBySaas}
                        onClick={() => handleToggleVisibility(item.moduleCode, item.enabledByOrganization)}
                      >
                        <OrgIcon name={item.enabledByOrganization ? "powerOff" : "power"} size={16} />
                        {item.enabledByOrganization ? "Hide" : "Show"}
                      </button>
                    )}
                    <button type="button" className="premium-soft-button">
                      <OrgIcon name="copy" size={16} />
                    </button>
                    <button type="button" className="premium-danger-button">
                      <OrgIcon name="trash" size={16} />
                    </button>
                  </div>

                  {!item.grantedBySaas && !item.isPlaceholder && (
                    <p style={{ marginTop: 14, color: "#9a3412" }}>
                      This module is not granted by SaaS yet.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <OrganizationEmptyState
          title="No content found"
          message="Get started by creating your first piece of content."
          actionLabel="Create Content"
          actionTo={createRoute ? getModuleCreateRoute(createRoute) : "/backoffice"}
          icon="file"
        />
      )}

      <section className="premium-panel">
        <div className="premium-card-stats">
          <div>
            <span>Granted by SaaS</span>
            <strong>{grantedCount}</strong>
          </div>
          <div>
            <span>Visible front-office</span>
            <strong>{visibleCount}</strong>
          </div>
          <div>
            <span>Unavailable</span>
            <strong>{Math.max(modules.length - grantedCount, 0)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function buildContentCards(modules) {
  const realCards = modules.map((module, index) => ({
    ...module,
    status: module.enabledByOrganization ? "active" : module.grantedBySaas ? "draft" : "unavailable",
    participants: module.participants || [1247, 892, 2103][index % 3],
    views: module.views || [3421, 2103, 5847][index % 3],
    engagement: module.engagement || [68, 52, 85][index % 3],
    created: module.createdAt ? formatDate(module.createdAt) : ["Apr 1, 2026", "Mar 28, 2026", "Apr 3, 2026"][index % 3],
    deadline: module.deadline || ["Apr 20, 2026", "Apr 27, 2026", "Apr 17, 2026"][index % 3],
    author: module.author || "Organization staff",
  }));

  if (realCards.length >= 6) return realCards;

  const usedCodes = new Set(realCards.map((module) => module.moduleCode));
  const placeholders = placeholderContent.filter((module) => !usedCodes.has(module.moduleCode));

  return [...realCards, ...placeholders].slice(0, 6);
}

function getTabCount(content, tabId) {
  if (tabId === "all") return content.length;
  if (tabId === "votes") return content.filter((item) => item.moduleCode === "VOTE").length;
  if (tabId === "consultations") return content.filter((item) => item.moduleCode === "CONFERENCE").length;
  if (tabId === "news") return content.filter((item) => item.moduleCode === "YOUTHSPACE").length;
  return 0;
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

function formatStatus(status) {
  if (!status) return "Draft";
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default OrganizationManageModulesPage;
