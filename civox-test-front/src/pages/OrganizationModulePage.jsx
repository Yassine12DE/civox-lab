import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import {
  getModuleCategory,
  getModuleContentType,
  getModuleCreateRoute,
  getModuleResponseLabel,
  getModuleRoute,
} from "../utils/moduleNavigation";
import { canCreateFromModule } from "../utils/rbac";
import {
  getOrganizationContent,
  saveOrganizationContentResponse,
} from "../services/orgBackOfficeService";
import { getCurrentOrganizationContent } from "../services/organizationDynamicService";

function OrganizationModulePage() {
  const { moduleSlug, contentId } = useParams();
  const { modules, currentUser, organization } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [savingContentId, setSavingContentId] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [notice, setNotice] = useState("");

  const module = modules.find((candidate) =>
    moduleSlugMatches(candidate.moduleCode, moduleSlug)
  );
  const contentType = module ? getModuleContentType(module.moduleCode) : null;

  const loadContent = useCallback(async () => {
    if (!organization?.id || !contentType) {
      setItems([]);
      return;
    }

    try {
      setLoadingContent(true);
      setContentError("");
      const data = currentUser
        ? await getOrganizationContent(organization.id, contentType)
        : await getCurrentOrganizationContent(contentType);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setContentError(error.message || "Failed to load module content");
    } finally {
      setLoadingContent(false);
    }
  }, [contentType, currentUser, organization?.id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const displayItem = useMemo(
    () => contentId ? items.find((item) => String(item.id) === String(contentId)) || null : null,
    [contentId, items]
  );

  const saveResponse = async (payload) => {
    if (!currentUser || !displayItem || !organization?.id || !contentType) {
      return;
    }

    try {
      setSavingContentId(displayItem.id);
      setContentError("");
      const updatedItem = await saveOrganizationContentResponse(
        organization.id,
        contentType,
        displayItem.id,
        payload
      );
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem
        )
      );
      setHasResponded(true);
    } catch (error) {
      setContentError(error.message || "Failed to save your response");
    } finally {
      setSavingContentId(null);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("Link copied to clipboard.");
    } catch {
      setNotice("Could not copy the link. You can copy it directly from the address bar.");
    }
  };

  if (!module) {
    return (
      <div className="premium-page">
        <section className="premium-section">
          <div className="premium-container">
            <OrganizationEmptyState
              title={`This module is not enabled for ${organization?.name || "this organization"}.`}
              message="Open an enabled module from the organization modules page."
              actionLabel="Organization modules"
              actionTo="/modules"
              icon="layers"
            />
          </div>
        </section>
      </div>
    );
  }

  const createRoute = getModuleCreateRoute(module.moduleCode);
  const canCreate = createRoute && canCreateFromModule(currentUser, module.moduleCode);

  if (!contentType) {
    return (
      <div className="premium-page">
        <section className="premium-section">
          <div className="premium-container">
            <OrganizationEmptyState
              title={`${module.moduleName} is available`}
              message="This module is enabled but does not yet expose interactive content in this tenant interface."
              actionLabel="Back to modules"
              actionTo="/modules"
              icon="layers"
            />
          </div>
        </section>
      </div>
    );
  }

  if (loadingContent) {
    return (
      <div className="premium-page">
        <section className="premium-section">
          <div className="premium-container">
            <OrganizationLoadingState
              title="Loading module content"
              message="Fetching the latest published item."
            />
          </div>
        </section>
      </div>
    );
  }

  if (!contentId && items.length > 0) {
    return (
      <div className="premium-page">
        <section className="premium-section">
          <div className="premium-container">
            <div className="premium-detail-header">
              <div className="premium-detail-header__badges">
                <span className="premium-status premium-status--neutral">{getModuleCategory(module.moduleCode)}</span>
                <PremiumStatusBadge status="Active">{items.length} published</PremiumStatusBadge>
              </div>
              <h1>{module.moduleName}</h1>
              <p>{module.moduleDescription || "Explore all published organization content in this module."}</p>
            </div>
            {contentError && <OrganizationNotice tone="error">{contentError}</OrganizationNotice>}
            <div className="premium-content-grid">
              {items.map((item) => (
                <article key={item.id} className="premium-content-card">
                  <div className="premium-content-card__header">
                    <p>{formatDate(item.createdAt)}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <div className="premium-content-card__body">
                    <p>{item.body || "Open this item to review the details and participate."}</p>
                    <div className="premium-card-stats">
                      <span><strong>{Number(item.totalResponses || 0)}</strong> Responses</span>
                    </div>
                    <Link to={`/modules/${moduleSlug}/${item.id}`} className="premium-soft-button">
                      Open item <OrgIcon name="arrowRight" size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!displayItem) {
    return (
      <div className="premium-page">
        <section className="premium-section">
          <div className="premium-container">
            <OrganizationEmptyState
              title={contentId ? "Content unavailable" : "No published content yet"}
              message={contentId ? "This item does not exist or is not published." : "This module is enabled, but no content has been published."}
              actionLabel={contentId ? "Back to module" : "Back to modules"}
              actionTo={contentId ? `/modules/${moduleSlug}` : "/modules"}
              icon="file"
            />
          </div>
        </section>
      </div>
    );
  }

  const options = normalizeOptions(displayItem, module.moduleCode);
  const totalVotes = Number(displayItem.totalResponses || 0);
  const responded =
    hasResponded ||
    Boolean(
      displayItem.myAnswer ||
      (displayItem.myParticipating !== null && displayItem.myParticipating !== undefined) ||
      displayItem.myReaction
    );

  return (
    <div className="premium-page">
      <div className="premium-detail-topbar">
        <div className="premium-detail-topbar__inner">
          <Link to={`/modules/${moduleSlug}`} className="premium-back-link">
            <OrgIcon name="arrowLeft" size={20} />
            Back to Modules
          </Link>
        </div>
      </div>

      <div className="premium-detail-container">
        <header className="premium-detail-header">
          <div className="premium-detail-header__badges">
            <span className="premium-status premium-status--neutral">
              {getModuleCategory(module.moduleCode)}
            </span>
            <PremiumStatusBadge status={displayItem.lifecycle}>{displayItem.lifecycle || "Active"}</PremiumStatusBadge>
            <span className="premium-status premium-status--neutral">
              {getModuleResponseLabel(module.moduleCode)}
            </span>
          </div>

          <h1>{displayItem.title}</h1>
          <p>{displayItem.body || module.moduleDescription || "Published organization content."}</p>
        </header>

        {(contentError || notice) && (
          <>
            {contentError && <OrganizationNotice tone="error">{contentError}</OrganizationNotice>}
            {notice && <OrganizationNotice tone="success">{notice}</OrganizationNotice>}
          </>
        )}

        <div className="premium-detail-layout">
          <main className="premium-detail-main">
            {!currentUser && (
              <div className="premium-alert-card">
                <h3>Sign in to participate</h3>
                <p>Content is public, but responses are saved only for authenticated tenant users.</p>
              </div>
            )}
            {currentUser && !displayItem.acceptingResponses && (
              <div className="premium-alert-card">
                <h3>Responses are closed</h3>
                <p>This item is available to read, but its participation window is not open.</p>
              </div>
            )}

            <section className="premium-panel">
              <h2>{responded ? "Your Response" : getChooseTitle(module.moduleCode)}</h2>

              <div className="premium-option-list">
                {options.map((option) => {
                  const isSelected =
                    selectedOption === option.value ||
                    displayItem.myAnswer === option.value ||
                    (option.participating !== undefined &&
                      displayItem.myParticipating === option.participating) ||
                    (option.reaction !== undefined && Boolean(displayItem.myReaction && option.reaction));
                  const showResults = Boolean(displayItem.resultsVisible);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`premium-vote-option ${isSelected ? "is-selected" : ""}`}
                      disabled={!currentUser || !displayItem.acceptingResponses || savingContentId === displayItem.id}
                      onClick={() => setSelectedOption(option.value)}
                    >
                      {showResults && (
                        <span
                          className="premium-vote-option__bar"
                          style={{ width: `${option.percentage}%` }}
                        />
                      )}
                      <span className="premium-vote-option__content">
                        <span>
                          <h3>{option.label}</h3>
                          <p>{option.description}</p>
                        </span>
                        {showResults && (
                          <span className="premium-vote-option__result">
                            <strong>{option.percentage}%</strong>
                            <span>{option.votes} responses</span>
                          </span>
                        )}
                        {!responded && isSelected && <OrgIcon name="checkCircle" size={24} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {currentUser && displayItem.acceptingResponses && (
                <div style={{ marginTop: 28 }}>
                  <button
                    type="button"
                    className="premium-gradient-button"
                    disabled={!selectedOption || savingContentId === displayItem.id}
                    onClick={() => saveResponse(buildPayload(module.moduleCode, selectedOption))}
                  >
                    {selectedOption ? (responded ? "Update response" : getSubmitLabel(module.moduleCode)) : "Select an option to continue"}
                  </button>
                </div>
              )}

              {!responded && !currentUser && (
                <div style={{ marginTop: 28 }}>
                  <Link to="/login" className="premium-gradient-button">
                    Sign in to participate
                  </Link>
                </div>
              )}
            </section>

            <section className="premium-panel">
              <div className="premium-detail-header__badges">
                <span className="premium-icon-tile premium-icon-tile--primary">
                  <OrgIcon name="info" size={22} />
                </span>
                <h3>About This Module</h3>
              </div>
              <p>
                {module.moduleDescription ||
                  "This participation space is configured by the organization and published through CIVOX."}
              </p>
              {canCreate && (
                <Link to={createRoute} className="premium-soft-button" style={{ marginTop: 18 }}>
                  Create in back-office
                </Link>
              )}
            </section>
          </main>

          <aside className="premium-detail-sidebar">
            <section className="premium-panel">
              <h3>Live Statistics</h3>
              <div className="premium-stat-list">
                <div className="premium-stat-list__item">
                  <span className="premium-stat-list__label">
                    <OrgIcon name="users" size={16} />
                    Total Responses
                  </span>
                  <strong>{displayItem.resultsVisible ? totalVotes.toLocaleString() : "Hidden"}</strong>
                </div>

                <div className="premium-stat-list__item">
                  <span className="premium-stat-list__label">
                    <OrgIcon name="trending" size={16} />
                    Recorded responses
                  </span>
                  <strong>{displayItem.resultsVisible ? totalVotes.toLocaleString() : "Hidden"}</strong>
                </div>

                <div className="premium-timeline">
                  <div>
                    <span>Published:</span>
                    <strong>{formatDate(displayItem.createdAt) || "-"}</strong>
                  </div>
                  <div>
                    <span>Author:</span>
                    <strong>{displayItem.createdByName || "Organization staff"}</strong>
                  </div>
                </div>

                <button type="button" className="premium-soft-button" onClick={handleShare}>
                  <OrgIcon name="share" size={16} />
                  Share This Module
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function normalizeOptions(item, moduleCode) {
  const totalResponses = Number(item.totalResponses || 0);
  const breakdown = item.responseBreakdown || {};

  if (moduleCode === "CONFERENCE") {
    const participating = Number(breakdown.participating || 0);
    const notParticipating = Number(breakdown.notParticipating || 0);
    return [
      buildOption("participate", "Participate", "I plan to participate.", participating, totalResponses, { participating: true }),
      buildOption("not-participating", "Not participate", "I cannot participate right now.", notParticipating, totalResponses, { participating: false }),
    ];
  }

  if (moduleCode === "YOUTHSPACE") {
    const reacted = Number(breakdown.reacted || 0);
    return [
      buildOption("react", "React", "Save a reaction to this update.", reacted, totalResponses, { reaction: true }),
    ];
  }

  const options = Array.isArray(item.options) ? item.options : [];
  return options.map((option) =>
    buildOption(
      option,
      option,
      "Review this option and cast your vote.",
      Number(breakdown[option] || 0),
      totalResponses
    )
  );
}

function buildOption(value, label, description, votes, totalResponses, extra = {}) {
  const percentage = totalResponses > 0 ? Math.round((votes / totalResponses) * 100) : 0;
  return {
    value,
    label,
    description,
    votes,
    percentage,
    ...extra,
  };
}

function buildPayload(moduleCode, selectedOption) {
  if (moduleCode === "CONFERENCE") {
    return { participating: selectedOption === "participate" };
  }

  if (moduleCode === "YOUTHSPACE") {
    return { reaction: selectedOption === "react" ? "REACTED" : "" };
  }

  return { answer: selectedOption };
}

function moduleSlugMatches(moduleCode, moduleSlug) {
  if (getModuleRoute(moduleCode).endsWith(`/modules/${moduleSlug}`)) {
    return true;
  }

  const aliases = {
    VOTE: ["vote", "votes"],
    CONFERENCE: ["conference", "concertation", "concertations"],
    YOUTHSPACE: ["youthspace", "youth-news", "news"],
  };

  return aliases[moduleCode]?.includes(moduleSlug) || false;
}

function getChooseTitle(moduleCode) {
  const titles = {
    VOTE: "Choose Your Option",
    CONFERENCE: "Choose Your Attendance",
    YOUTHSPACE: "Choose Your Reaction",
  };

  return titles[moduleCode] || "Choose Your Response";
}

function getSubmitLabel(moduleCode) {
  const labels = {
    VOTE: "Cast Your Vote",
    CONFERENCE: "Save Attendance",
    YOUTHSPACE: "Save Reaction",
  };

  return labels[moduleCode] || "Submit Response";
}

function formatDate(value) {
  if (!value) return "";
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

export default OrganizationModulePage;
