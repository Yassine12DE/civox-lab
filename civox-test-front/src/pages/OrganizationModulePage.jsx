import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import { getModuleCreateRoute, getModuleRoute } from "../utils/moduleNavigation";
import { canCreateFromModule } from "../utils/rbac";
import {
  getOrganizationContent,
  saveOrganizationContentResponse,
} from "../services/orgBackOfficeService";

const fallbackDetail = {
  title: "2026 Community Budget Allocation",
  body:
    "Help decide how resources should be distributed across infrastructure improvements, educational programs, and sustainability initiatives.",
  createdByName: "Organization staff",
  options: ["Infrastructure First", "Balanced Approach", "Future-Focused"],
  optionDetails: {
    "Infrastructure First": "Focus on roads, facilities, and public infrastructure.",
    "Balanced Approach": "Invest proportionally across every priority area.",
    "Future-Focused": "Prioritize green initiatives, learning, and long-term resilience.",
  },
  votes: [487, 623, 137],
  percentages: [39, 50, 11],
};

function OrganizationModulePage() {
  const { moduleSlug } = useParams();
  const { modules, currentUser, organization } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [savingContentId, setSavingContentId] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);

  const module = modules.find((candidate) =>
    moduleSlugMatches(candidate.moduleCode, moduleSlug)
  );
  const contentType = module ? getContentTypeForModule(module.moduleCode) : null;

  const loadContent = useCallback(async () => {
    if (!currentUser || !organization?.id || !contentType) {
      setItems([]);
      return;
    }

    try {
      setLoadingContent(true);
      setContentError("");
      const data = await getOrganizationContent(organization.id, contentType);
      setItems(data);
    } catch (error) {
      setContentError(error.message || "Failed to load module content");
    } finally {
      setLoadingContent(false);
    }
  }, [currentUser, organization?.id, contentType]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const displayItem = useMemo(() => {
    const item = items[0];
    if (item) {
      return {
        ...item,
        body: item.body || item.description || fallbackDetail.body,
        options: item.options?.length ? item.options : fallbackDetail.options,
        isReal: true,
      };
    }

    return {
      id: "static-preview",
      title: module?.moduleName || fallbackDetail.title,
      body: module?.moduleDescription || fallbackDetail.body,
      createdByName: "Organization staff",
      options: getFallbackOptions(module?.moduleCode),
      isReal: false,
    };
  }, [items, module]);

  const saveResponse = async (payload) => {
    if (!currentUser) {
      return;
    }

    if (!displayItem.isReal || !organization?.id || !contentType) {
      setHasResponded(true);
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
  const responseLabel = getResponseLabelForModule(module.moduleCode);
  const options = normalizeOptions(displayItem, module.moduleCode);
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0) || 1247;
  const participation = Math.max(38, Math.min(92, Math.round(totalVotes / 20)));
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
          <Link to="/modules" className="premium-back-link">
            <OrgIcon name="arrowLeft" size={20} />
            Back to Modules
          </Link>
        </div>
      </div>

      <div className="premium-detail-container">
        <header className="premium-detail-header">
          <div className="premium-detail-header__badges">
            <span className="premium-status premium-status--neutral">
              {getCategory(module.moduleCode)}
            </span>
            <PremiumStatusBadge status="Active">Active</PremiumStatusBadge>
            <span className="premium-status premium-status--neutral">{responseLabel}</span>
          </div>

          <h1>{displayItem.title}</h1>
          <p>{displayItem.body}</p>
        </header>

        {contentError && <OrganizationNotice tone="error">{contentError}</OrganizationNotice>}

        <div className="premium-detail-layout">
          <main className="premium-detail-main">
            {!currentUser && (
              <div className="premium-alert-card">
                <h3>Sign in to participate</h3>
                <p>
                  This preview stays visible, but responses are saved only after you sign in
                  with your organization account.
                </p>
              </div>
            )}

            {loadingContent ? (
              <OrganizationLoadingState
                title="Loading module content"
                message="Fetching the latest published items."
              />
            ) : (
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
                    const showResults = responded || displayItem.isPlaceholder;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`premium-vote-option ${isSelected ? "is-selected" : ""}`}
                        disabled={!currentUser || savingContentId === displayItem.id || responded}
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
                              <span>{option.votes} votes</span>
                            </span>
                          )}
                          {!responded && isSelected && <OrgIcon name="checkCircle" size={24} />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!responded && (
                  <div style={{ marginTop: 28 }}>
                    {currentUser ? (
                      <button
                        type="button"
                        className="premium-gradient-button"
                        disabled={!selectedOption || savingContentId === displayItem.id}
                        onClick={() => saveResponse(buildPayload(module.moduleCode, selectedOption))}
                      >
                        {selectedOption ? getSubmitLabel(module.moduleCode) : "Select an option to continue"}
                      </button>
                    ) : (
                      <Link to="/login" className="premium-gradient-button">
                        Sign in to participate
                      </Link>
                    )}
                  </div>
                )}

                {responded && (
                  <div className="premium-success-card" style={{ marginTop: 22 }}>
                    <strong>Thank you for participating.</strong>
                    <p>Your response has been recorded for this organization workspace.</p>
                  </div>
                )}
              </section>
            )}

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
              <p>
                Published content, response permissions, and visibility stay connected to
                the tenant context for {organization?.name}.
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
              <h3>Vote Statistics</h3>
              <div className="premium-stat-list">
                <div className="premium-stat-list__item">
                  <span className="premium-stat-list__label">
                    <OrgIcon name="users" size={16} />
                    Total Participants
                  </span>
                  <strong>{totalVotes.toLocaleString()}</strong>
                </div>

                <div className="premium-stat-list__item">
                  <span className="premium-stat-list__label">
                    <OrgIcon name="trending" size={16} />
                    Participation Rate
                  </span>
                  <strong>{participation}%</strong>
                  <div className="premium-progress">
                    <span style={{ width: `${participation}%` }} />
                  </div>
                </div>

                <div className="premium-timeline">
                  <div>
                    <span>Started:</span>
                    <strong>April 1, 2026</strong>
                  </div>
                  <div>
                    <span>Ends:</span>
                    <strong>April 20, 2026</strong>
                  </div>
                  <div>
                    <span>Time Remaining:</span>
                    <strong>5 days</strong>
                  </div>
                </div>

                <button type="button" className="premium-soft-button">
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
  if (moduleCode === "CONFERENCE") {
    return [
      {
        value: "participate",
        label: "Participate",
        description: "I plan to participate in this consultation or event.",
        votes: 892,
        percentage: 64,
        participating: true,
      },
      {
        value: "not-participating",
        label: "Not participate",
        description: "I cannot participate, but I want to keep following the topic.",
        votes: 501,
        percentage: 36,
        participating: false,
      },
    ];
  }

  if (moduleCode === "YOUTHSPACE") {
    return [
      {
        value: "react",
        label: "React",
        description: "Save a reaction and show that this update matters to you.",
        votes: 456,
        percentage: 74,
        reaction: true,
      },
      {
        value: "follow",
        label: "Follow updates",
        description: "Keep this item in mind for future youth-space updates.",
        votes: 160,
        percentage: 26,
        reaction: false,
      },
    ];
  }

  return item.options.map((option, index) => {
    const votes = fallbackDetail.votes[index] || 100 + index * 64;
    const percentage = fallbackDetail.percentages[index] || Math.max(10, 55 - index * 12);

    return {
      value: option,
      label: option,
      description: fallbackDetail.optionDetails[option] || "Review this option and cast your vote.",
      votes,
      percentage,
    };
  });
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

function getFallbackOptions(moduleCode) {
  if (moduleCode === "CONFERENCE") return ["participate", "not-participating"];
  if (moduleCode === "YOUTHSPACE") return ["react", "follow"];
  return fallbackDetail.options;
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

function getContentTypeForModule(moduleCode) {
  const contentTypes = {
    VOTE: "vote",
    CONFERENCE: "concertation",
    YOUTHSPACE: "youth-news",
  };

  return contentTypes[moduleCode] || null;
}

function getResponseLabelForModule(moduleCode) {
  const labels = {
    VOTE: "Vote",
    CONFERENCE: "Attend",
    YOUTHSPACE: "React",
  };

  return labels[moduleCode] || "View";
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

function getCategory(moduleCode) {
  const categories = {
    VOTE: "Budget & Finance",
    CONFERENCE: "Consultation",
    YOUTHSPACE: "Community News",
  };

  return categories[moduleCode] || "Organization Module";
}

export default OrganizationModulePage;
