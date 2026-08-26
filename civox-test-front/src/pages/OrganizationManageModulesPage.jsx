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
  getOrganizationContent,
  setOrganizationContentPublished,
  updateOrganizationModuleVisibility,
} from "../services/orgBackOfficeService";
import {
  getCurrentOrganizationContent,
  getCurrentOrganizationSettings,
} from "../services/organizationDynamicService";
import {
  getModuleContentType,
  getModuleCreateRoute,
  getModuleIcon,
  isModuleBackOfficeVisible,
  getModuleTone,
} from "../utils/moduleNavigation";

const tabs = [
  { id: "all", label: "All Modules" },
  { id: "enabled", label: "Enabled" },
  { id: "hidden", label: "Hidden" },
  { id: "unsupported", label: "No Content Type" },
];

function OrganizationManageModulesPage() {
  const { organization } = useOutletContext();
  const [modules, setModules] = useState([]);
  const [contentByModule, setContentByModule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [busyKey, setBusyKey] = useState("");
  const [previewState, setPreviewState] = useState({
    open: false,
    loading: false,
    error: "",
    item: null,
    moduleName: "",
    moduleCode: "",
    publicItem: null,
    branding: null,
  });

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const modulesData = await getOrganizationBackOfficeModules(organization.id);
      const normalizedModules = (Array.isArray(modulesData) ? modulesData : []).filter(
        isModuleBackOfficeVisible
      );
      setModules(normalizedModules);

      const contentEntries = await Promise.all(
        normalizedModules.map(async (module) => {
          const contentType = getModuleContentType(module.moduleCode);
          if (!contentType || !module.enabledByOrganization) {
            return [module.moduleCode, []];
          }

          try {
            const items = await getOrganizationContent(organization.id, contentType, true);
            return [module.moduleCode, Array.isArray(items) ? items : []];
          } catch {
            return [module.moduleCode, []];
          }
        })
      );
      setContentByModule(Object.fromEntries(contentEntries));
    } catch (loadError) {
      setError(loadError.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleVisibility = async (moduleCode, enabledByOrganization) => {
    if (!organization?.id) return;
    setBusyKey(`visibility-${moduleCode}`);
    setError("");
    try {
      await updateOrganizationModuleVisibility(
        organization.id,
        moduleCode,
        !enabledByOrganization
      );
      await loadData();
    } catch (toggleError) {
      setError(toggleError.message || "Failed to update module visibility");
    } finally {
      setBusyKey("");
    }
  };

  const handleTogglePublished = async (moduleCode, item) => {
    if (!organization?.id || !item?.id) return;
    const contentType = getModuleContentType(moduleCode);
    if (!contentType) return;

    setBusyKey(`publish-${item.id}`);
    setError("");
    try {
      await setOrganizationContentPublished(
        organization.id,
        contentType,
        item.id,
        !item.published
      );
      await loadData();
    } catch (toggleError) {
      setError(toggleError.message || "Failed to update content publication");
    } finally {
      setBusyKey("");
    }
  };

  const openPagePreview = async (moduleCode, moduleName, item) => {
    const contentType = getModuleContentType(moduleCode);
    if (!contentType || !item?.id) return;

    setPreviewState({
      open: true,
      loading: true,
      error: "",
      item,
      moduleName,
      moduleCode,
      publicItem: null,
      branding: null,
    });

    try {
      const [publicContent, branding] = await Promise.all([
        getCurrentOrganizationContent(contentType),
        getCurrentOrganizationSettings(),
      ]);
      const matchedItem = (Array.isArray(publicContent) ? publicContent : []).find(
        (currentItem) => currentItem.id === item.id
      );

      setPreviewState((current) => ({
        ...current,
        loading: false,
        publicItem: matchedItem || null,
        branding: branding || null,
      }));
    } catch (previewError) {
      setPreviewState((current) => ({
        ...current,
        loading: false,
        error: previewError.message || "Page preview could not be loaded.",
      }));
    }
  };

  const closePagePreview = () => {
    setPreviewState({
      open: false,
      loading: false,
      error: "",
      item: null,
      moduleName: "",
      moduleCode: "",
      publicItem: null,
      branding: null,
    });
  };

  const moduleCards = useMemo(
    () =>
      modules.map((module) => {
        const contentItems = contentByModule[module.moduleCode] || [];
        const latestItem = contentItems[0] || null;
        const contentType = getModuleContentType(module.moduleCode);

        return {
          ...module,
          contentType,
          contentCount: contentItems.length,
          latestItem,
          status:
            !module.grantedBySaas
              ? "not-granted"
              : module.enabledByOrganization
                ? "enabled"
                : "hidden",
        };
      }),
    [contentByModule, modules]
  );

  const filteredModules = moduleCards.filter((item) => {
    if (activeTab === "enabled") return item.status === "enabled";
    if (activeTab === "hidden") return item.status === "hidden";
    if (activeTab === "unsupported") return !item.contentType;
    return true;
  });

  if (loading) {
    return (
      <div className="premium-empty-center">
        <OrganizationLoadingState
          title="Loading content controls"
          message="Fetching tenant grants and module content."
        />
      </div>
    );
  }

  const grantedCount = modules.filter((module) => module.grantedBySaas).length;
  const visibleCount = modules.filter((module) => module.enabledByOrganization).length;
  const totalContent = moduleCards.reduce((sum, module) => sum + module.contentCount, 0);

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>Content Management</h1>
          <p>Control module visibility and publication in one synchronized flow.</p>
        </div>
      </header>

      {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}

      <section className="premium-admin-stats" aria-label="Content summary">
        <PremiumStatCard icon="layers" label="Granted modules" value={String(grantedCount)} />
        <PremiumStatCard icon="eye" label="Visible modules" value={String(visibleCount)} tone="secondary" />
        <PremiumStatCard icon="file" label="Published items" value={String(totalContent)} />
        <PremiumStatCard icon="powerOff" label="Hidden modules" value={String(Math.max(grantedCount - visibleCount, 0))} tone="secondary" />
      </section>

      <section className="premium-form-card">
        <div className="premium-filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {filteredModules.length > 0 ? (
        <section className="premium-content-grid">
          {filteredModules.map((item) => {
            const createHref = getModuleCreateRoute(item.moduleCode);
            const latestItem = item.latestItem;
            return (
              <article key={item.moduleCode} className="premium-content-card">
                <div className="premium-content-card__header">
                  <div className="premium-module-card__top">
                    <PremiumIconTile
                      icon={getModuleIcon(item.moduleCode, "layers")}
                      tone={getModuleTone(item.moduleCode, "primary")}
                    />
                    <PremiumStatusBadge status={item.status}>
                      {formatStatus(item.status)}
                    </PremiumStatusBadge>
                  </div>
                  <h3>{item.moduleName}</h3>
                  <p>{item.moduleDescription || "Organization module"}</p>
                </div>

                <div className="premium-content-card__body">
                  <div className="premium-card-stats">
                    <div>
                      <span>Content type</span>
                      <strong>{item.contentType || "N/A"}</strong>
                    </div>
                    <div>
                      <span>Published items</span>
                      <strong>{item.contentCount}</strong>
                    </div>
                    <div>
                      <span>Visibility</span>
                      <strong>{item.enabledByOrganization ? "Public" : "Hidden"}</strong>
                    </div>
                  </div>

                  {latestItem && (
                    <div className="premium-meta-row" style={{ marginBottom: 20 }}>
                      <span>
                        Latest: <strong>{latestItem.title}</strong>
                      </span>
                    </div>
                  )}

                  <div className="premium-card-actions">
                    {createHref && item.grantedBySaas && (
                      <Link to={createHref} className="premium-soft-button">
                        <OrgIcon name="edit" size={16} />
                        Create
                      </Link>
                    )}
                    {latestItem && item.contentType && (
                      <button
                        type="button"
                        className="premium-soft-button premium-soft-button--neutral"
                        onClick={() => openPagePreview(item.moduleCode, item.moduleName, latestItem)}
                      >
                        <OrgIcon name="eye" size={16} />
                        Preview page
                      </button>
                    )}
                    <button
                      type="button"
                      className={item.enabledByOrganization ? "premium-warning-button" : "premium-success-button"}
                      disabled={!item.grantedBySaas || busyKey === `visibility-${item.moduleCode}`}
                      onClick={() => handleToggleVisibility(item.moduleCode, item.enabledByOrganization)}
                    >
                      <OrgIcon name={item.enabledByOrganization ? "powerOff" : "power"} size={16} />
                      {busyKey === `visibility-${item.moduleCode}`
                        ? "Saving..."
                        : item.enabledByOrganization
                          ? "Hide module"
                          : "Show module"}
                    </button>
                    {latestItem && item.contentType && (
                      <button
                        type="button"
                        className={latestItem.published ? "premium-danger-button" : "premium-success-button"}
                        disabled={busyKey === `publish-${latestItem.id}`}
                        onClick={() => handleTogglePublished(item.moduleCode, latestItem)}
                      >
                        <OrgIcon name={latestItem.published ? "trash" : "checkCircle"} size={16} />
                        {busyKey === `publish-${latestItem.id}`
                          ? "Saving..."
                          : latestItem.published
                            ? "Archive latest"
                            : "Restore latest"}
                      </button>
                    )}
                  </div>

                  {!item.grantedBySaas && (
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
          title="No modules found"
          message="Adjust your filter to inspect another module status."
          icon="layers"
        />
      )}

      {previewState.open && (
        <div className="premium-modal-backdrop" role="presentation">
          <section className="premium-modal premium-modal--wide" role="dialog" aria-modal="true">
            <div className="premium-modal__header">
              <div>
                <h2>Page Preview</h2>
                <p>{previewState.moduleName || "Organization content preview"}</p>
              </div>
              <button
                type="button"
                className="premium-icon-button"
                onClick={closePagePreview}
                aria-label="Close page preview"
              >
                <OrgIcon name="x" size={16} />
              </button>
            </div>
            <div className="premium-modal__body">
              {previewState.loading && (
                <OrganizationLoadingState
                  title="Loading page preview"
                  message="Preparing the front-office representation."
                />
              )}

              {!previewState.loading && previewState.error && (
                <OrganizationNotice tone="error">{previewState.error}</OrganizationNotice>
              )}

              {!previewState.loading && !previewState.error && !previewState.publicItem && (
                <OrganizationEmptyState
                  title="No public preview available"
                  message="This item is not currently visible in the front-office or has no published version."
                  icon="eye"
                />
              )}

              {!previewState.loading && !previewState.error && previewState.publicItem && (
                <PagePreviewContent
                  item={previewState.publicItem}
                  moduleName={previewState.moduleName}
                  moduleCode={previewState.moduleCode}
                  branding={previewState.branding}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PagePreviewContent({ item, moduleName, moduleCode, branding }) {
  const primaryColor = branding?.primaryColor || "#7B2CBF";
  const secondaryColor = branding?.secondaryColor || "#FF6B35";
  const statusLabel = item.published ? "Published" : "Draft";
  const visibilityLabel = item.published ? "Public front-office" : "Back-office only";

  return (
    <article className="page-preview-shell">
      <header
        className="page-preview-header"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <p>CIVOX Front-Office Preview</p>
        <h3>{item.title}</h3>
        <div className="page-preview-header__meta">
          <span>{moduleName}</span>
          <span>{moduleCode}</span>
          <span>{statusLabel}</span>
          <span>{visibilityLabel}</span>
        </div>
      </header>

      <div className="page-preview-body">
        <div className="page-preview-body__grid">
          <div>
            <strong>Title</strong>
            <p>{item.title}</p>
          </div>
          <div>
            <strong>Status</strong>
            <p>{statusLabel}</p>
          </div>
          <div>
            <strong>Visibility</strong>
            <p>{visibilityLabel}</p>
          </div>
          <div>
            <strong>Published Date</strong>
            <p>{formatDate(item.createdAt)}</p>
          </div>
        </div>

        <section>
          <h4>Content</h4>
          <p>{item.body || "No page body provided."}</p>
        </section>

        {Array.isArray(item.options) && item.options.length > 0 && (
          <section>
            <h4>Selectable Options</h4>
            <div className="page-preview-options">
              {item.options.map((option) => (
                <span key={option}>{option}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function formatStatus(status) {
  const labels = {
    enabled: "Enabled",
    hidden: "Hidden",
    "not-granted": "Not granted",
  };
  return labels[status] || "Unknown";
}

function formatDate(value) {
  if (!value) return "Not available";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Not available";
  }
}

export default OrganizationManageModulesPage;
