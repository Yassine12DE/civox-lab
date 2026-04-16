import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatCard,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import {
  createOrganizationContent,
  getOrganizationContent,
} from "../services/orgBackOfficeService";

const CONTENT_CONFIG = {
  vote: {
    moduleCode: "VOTE",
    apiType: "vote",
    title: "Create a vote",
    titleLabel: "Question",
    bodyLabel: "Context",
    optionsLabel: "Choices",
    submitLabel: "Publish vote",
    titlePlaceholder: "Should we extend library opening hours?",
  },
  concertation: {
    moduleCode: "CONFERENCE",
    apiType: "concertation",
    title: "Create a consultation",
    titleLabel: "Topic",
    bodyLabel: "Participation brief",
    submitLabel: "Publish consultation",
    titlePlaceholder: "Neighborhood mobility plan",
  },
  "youth-news": {
    moduleCode: "YOUTHSPACE",
    apiType: "youth-news",
    title: "Create youth news",
    titleLabel: "Headline",
    bodyLabel: "News item",
    submitLabel: "Publish news",
    titlePlaceholder: "Youth workshop opens on Saturday",
  },
};

function OrganizationContentCreatePage() {
  const { contentType } = useParams();
  const config = CONTENT_CONFIG[contentType];
  const { organization, modules } = useOutletContext();

  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [optionsText, setOptionsText] = useState("Yes\nNo");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const enabledModule = useMemo(() => {
    if (!config) return null;
    return modules.find(
      (module) =>
        module.moduleCode === config.moduleCode &&
        module.grantedBySaas &&
        module.enabledByOrganization
    );
  }, [config, modules]);

  const loadItems = useCallback(async () => {
    if (!organization?.id || !config) return;

    try {
      setLoading(true);
      const data = await getOrganizationContent(organization.id, config.apiType);
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [organization?.id, config]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!organization?.id || !config) return;

    setError("");
    setMessage("");
    setSaving(true);

    const options = config.moduleCode === "VOTE"
      ? optionsText.split("\n").map((option) => option.trim()).filter(Boolean)
      : [];

    try {
      await createOrganizationContent(organization.id, config.apiType, {
        title,
        body,
        options,
        published: true,
      });
      setTitle("");
      setBody("");
      setOptionsText("Yes\nNo");
      setMessage("Published successfully.");
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Failed to publish content");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="premium-admin-page">
        <OrganizationEmptyState
          title="Unknown content type"
          message="Open a supported content composer from Content Management."
          actionLabel="Back-office"
          actionTo="/backoffice"
          icon="file"
        />
      </div>
    );
  }

  if (!enabledModule) {
    return (
      <div className="premium-admin-page">
        <OrganizationEmptyState
          title={config.title}
          message="This module must be granted and visible before new content can be published."
          actionLabel="Content Management"
          actionTo="/backoffice/modules"
          icon="powerOff"
        />
      </div>
    );
  }

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>{config.title}</h1>
          <p>{enabledModule.moduleDescription}</p>
        </div>
        <Link to="/backoffice/modules" className="premium-soft-button">
          Back to Content
        </Link>
      </header>

      {(message || error) && (
        <>
          {message && <OrganizationNotice tone="success">{message}</OrganizationNotice>}
          {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
        </>
      )}

      <section className="premium-admin-stats" aria-label="Publishing summary">
        <PremiumStatCard icon="file" label="Published items" value={String(items.length)} />
        <PremiumStatCard icon="power" label={enabledModule.moduleName} value="Enabled" tone="secondary" />
        <PremiumStatCard icon="layers" label="Content format" value={config.moduleCode === "VOTE" ? "Choices" : "Story"} />
        <PremiumStatCard icon="eye" label="Visibility" value="Public" tone="secondary" />
      </section>

      <section className="premium-form-grid">
        <form className="premium-form-card" onSubmit={handleSubmit}>
          <p className="org-ui-eyebrow">Composer</p>
          <h2>Publish content</h2>
          <p>Write clearly and publish directly into the tenant module.</p>

          <div className="premium-field">
            <label>{config.titleLabel}</label>
            <input
              value={title}
              placeholder={config.titlePlaceholder}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="premium-field">
            <label>{config.bodyLabel}</label>
            <textarea
              rows="6"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </div>

          {config.moduleCode === "VOTE" && (
            <div className="premium-field">
              <label>{config.optionsLabel}</label>
              <textarea
                rows="4"
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="premium-gradient-button" disabled={saving}>
            {saving ? "Publishing..." : config.submitLabel}
          </button>
        </form>

        <section className="premium-preview-card">
          <p className="org-ui-eyebrow">Archive</p>
          <h2>Recent {enabledModule.moduleName}</h2>
          <p>Recently published items for this tenant module.</p>

          <div className="premium-list" style={{ marginTop: 18 }}>
            {loading ? (
              <OrganizationLoadingState
                title="Loading recent content"
                message="Fetching the latest published items."
              />
            ) : items.length > 0 ? (
              items.map((item) => (
                <article key={item.id} className="premium-list-row">
                  <div>
                    <PremiumStatusBadge status="Published">Published</PremiumStatusBadge>
                    <h3 style={{ marginTop: 10 }}>{item.title}</h3>
                    <p>{item.body}</p>
                    {item.options?.length > 0 && (
                      <div className="premium-detail-header__badges" style={{ marginTop: 12, marginBottom: 0 }}>
                        {item.options.map((option) => (
                          <span key={option} className="premium-status premium-status--neutral">
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                    <small>{item.createdByName || "Organization staff"}</small>
                  </div>
                </article>
              ))
            ) : (
              <OrganizationEmptyState
                title="No published content yet"
                message="Published items will appear here after the first submission."
                icon="file"
              />
            )}
          </div>
        </section>
      </section>

      <section className="premium-panel">
        <div className="premium-detail-header__badges">
          <OrgIcon name="info" size={20} />
          <h2>Publishing Rules</h2>
        </div>
        <p>
          Content publishes into the current organization only. Visibility still depends on
          the module being granted by SaaS and enabled in Content Management.
        </p>
      </section>
    </div>
  );
}

export default OrganizationContentCreatePage;
