import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  createOrganizationContent,
  getOrganizationContent,
} from "../services/orgBackOfficeService";
import "../styles/organizationContentCreatePage.css";

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
    title: "Create a concertation",
    titleLabel: "Topic",
    bodyLabel: "Participation brief",
    submitLabel: "Publish concertation",
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
    } catch (err) {
      setError(err.message || "Failed to load content");
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
    } catch (err) {
      setError(err.message || "Failed to publish content");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return <div className="org-content-create-page"><h1>Unknown content type</h1></div>;
  }

  if (!enabledModule) {
    return (
      <div className="org-content-create-page">
        <section className="org-content-create-hero">
          <p className="org-content-create-badge">Module disabled</p>
          <h1>{config.title}</h1>
          <p>This module must be granted and visible before new content can be published.</p>
          <Link to="/backoffice" className="org-content-create-link">Back-office</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="org-content-create-page">
      <section className="org-content-create-hero">
        <p className="org-content-create-badge">Back-office publishing</p>
        <h1>{config.title}</h1>
        <p>{enabledModule.moduleDescription}</p>
        {message && <p className="org-content-create-success">{message}</p>}
        {error && <p className="org-content-create-error">{error}</p>}
      </section>

      <div className="org-content-create-grid">
        <form className="org-content-create-form" onSubmit={handleSubmit}>
          <label>{config.titleLabel}</label>
          <input
            value={title}
            placeholder={config.titlePlaceholder}
            onChange={(event) => setTitle(event.target.value)}
            required
          />

          <label>{config.bodyLabel}</label>
          <textarea
            rows="6"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
          />

          {config.moduleCode === "VOTE" && (
            <>
              <label>{config.optionsLabel}</label>
              <textarea
                rows="4"
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                required
              />
            </>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Publishing..." : config.submitLabel}
          </button>
        </form>

        <section className="org-content-create-list">
          <h2>Recent {enabledModule.moduleName}</h2>
          {loading ? (
            <p>Loading...</p>
          ) : items.length > 0 ? (
            items.map((item) => (
              <article key={item.id} className="org-content-create-item">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {item.options?.length > 0 && (
                  <div className="org-content-create-options">
                    {item.options.map((option) => <span key={option}>{option}</span>)}
                  </div>
                )}
                <small>{item.createdByName || "Organization staff"}</small>
              </article>
            ))
          ) : (
            <p>No published content yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default OrganizationContentCreatePage;
