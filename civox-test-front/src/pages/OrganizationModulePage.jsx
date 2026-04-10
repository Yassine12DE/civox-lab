import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { getModuleCreateRoute, getModuleRoute } from "../utils/moduleNavigation";
import { canCreateFromModule } from "../utils/rbac";
import {
  getOrganizationContent,
  saveOrganizationContentResponse,
} from "../services/orgBackOfficeService";
import "../styles/organizationModulePage.css";

function OrganizationModulePage() {
  const { moduleSlug } = useParams();
  const { modules, currentUser, organization } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [savingContentId, setSavingContentId] = useState(null);

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

  const saveResponse = async (item, payload) => {
    if (!organization?.id || !contentType) return;

    try {
      setSavingContentId(item.id);
      setContentError("");
      const updatedItem = await saveOrganizationContentResponse(
        organization.id,
        contentType,
        item.id,
        payload
      );
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem
        )
      );
    } catch (error) {
      setContentError(error.message || "Failed to save your response");
    } finally {
      setSavingContentId(null);
    }
  };

  if (!module) {
    return (
      <div className="org-module-page">
        <section className="org-module-panel">
          <p className="org-module-badge">Unavailable module</p>
          <h1>This module is not enabled for {organization?.name || "this organization"}.</h1>
          <p>Open an enabled module from the organization navigation.</p>
          <Link to="/" className="org-module-link">Organization home</Link>
        </section>
      </div>
    );
  }

  const createRoute = getModuleCreateRoute(module.moduleCode);
  const canCreate = createRoute && canCreateFromModule(currentUser, module.moduleCode);

  return (
    <div className="org-module-page">
      <section className="org-module-panel">
        <p className="org-module-badge">Organization module</p>
        <h1>{module.moduleName}</h1>
        <p>{module.moduleDescription}</p>

        <div className="org-module-actions">
          {canCreate && (
            <Link to={createRoute} className="org-module-primary-link">
              Create in back-office
            </Link>
          )}

          {!currentUser && (
            <Link to="/login" className="org-module-link">
              Sign in
            </Link>
          )}
        </div>
      </section>

      <section className="org-module-info">
        <h2>{module.moduleName} space</h2>
        {!currentUser ? (
          <div className="org-module-empty">
            <p>Sign in with your organization account to view and answer this module content.</p>
            <Link to="/login" className="org-module-link">Sign in</Link>
          </div>
        ) : loadingContent ? (
          <p>Loading content...</p>
        ) : contentError ? (
          <p className="org-module-error">{contentError}</p>
        ) : items.length > 0 ? (
          <div className="org-module-content-list">
            {items.map((item) => (
              <article key={item.id} className="org-module-content-item">
                <div>
                  <p className="org-module-content-meta">{item.createdByName || "Organization staff"}</p>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>

                {module.moduleCode === "VOTE" && (
                  <div className="org-module-response-group">
                    {item.options?.length > 0 ? (
                      item.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={item.myAnswer === option ? "is-selected" : ""}
                          disabled={savingContentId === item.id}
                          onClick={() => saveResponse(item, { answer: option })}
                        >
                          {option}
                        </button>
                      ))
                    ) : (
                      <p>No vote choices are available.</p>
                    )}
                    {item.myAnswer && <small>Your vote: {item.myAnswer}</small>}
                  </div>
                )}

                {module.moduleCode === "CONFERENCE" && (
                  <div className="org-module-response-group">
                    <button
                      type="button"
                      className={item.myParticipating === true ? "is-selected" : ""}
                      disabled={savingContentId === item.id}
                      onClick={() => saveResponse(item, { participating: true })}
                    >
                      Participate
                    </button>
                    <button
                      type="button"
                      className={item.myParticipating === false ? "is-selected" : ""}
                      disabled={savingContentId === item.id}
                      onClick={() => saveResponse(item, { participating: false })}
                    >
                      Not participate
                    </button>
                    {item.myParticipating !== null && item.myParticipating !== undefined && (
                      <small>
                        Your answer: {item.myParticipating ? "Participating" : "Not participating"}
                      </small>
                    )}
                  </div>
                )}

                {module.moduleCode === "YOUTHSPACE" && (
                  <div className="org-module-response-group">
                    <button
                      type="button"
                      className={item.myReaction ? "is-selected" : ""}
                      disabled={savingContentId === item.id}
                      onClick={() => saveResponse(item, { reaction: "REACTED" })}
                    >
                      React
                    </button>
                    {item.myReaction && <small>Reaction saved.</small>}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p>No published content yet.</p>
        )}
      </section>
    </div>
  );
}

export default OrganizationModulePage;

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
