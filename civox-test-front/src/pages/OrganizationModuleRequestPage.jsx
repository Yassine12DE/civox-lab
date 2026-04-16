import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatCard,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import { modules } from "../data/modules";
import {
  createModuleRequest,
  getOrganizationBackOfficeModules,
  getOrganizationModuleRequests,
} from "../services/orgBackOfficeService";

function OrganizationModuleRequestPage() {
  const { organization } = useOutletContext();
  const [grantedModules, setGrantedModules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const [modulesData, requestsData] = await Promise.all([
        getOrganizationBackOfficeModules(organization.id),
        getOrganizationModuleRequests(organization.id),
      ]);

      setGrantedModules(modulesData);
      setRequests(requestsData);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Failed to load module requests");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!organization?.id || !selectedModule) return;
    setError("");
    setMessage("");

    try {
      await createModuleRequest(organization.id, selectedModule, comment);
      setSelectedModule("");
      setComment("");
      await loadData();
      setMessage("Module request submitted successfully.");
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "Failed to submit request");
    }
  };

  if (loading) {
    return (
      <div className="premium-empty-center">
        <OrganizationLoadingState
          title="Loading module requests"
          message="Fetching current grants and request history."
        />
      </div>
    );
  }

  const grantedCodes = grantedModules.map((item) => item.moduleCode);
  const requestableModules = modules.filter((module) => !grantedCodes.includes(module.code));

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>Module Request Desk</h1>
          <p>Ask the SaaS team to grant additional modules when your organization needs more capabilities.</p>
        </div>
      </header>

      {(message || error) && (
        <>
          {message && <OrganizationNotice tone="success">{message}</OrganizationNotice>}
          {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
        </>
      )}

      <section className="premium-admin-stats" aria-label="Module request summary">
        <PremiumStatCard icon="layers" label="Granted modules" value={String(grantedModules.length)} />
        <PremiumStatCard icon="plus" label="Requestable" value={String(requestableModules.length)} tone="secondary" />
        <PremiumStatCard icon="file" label="Submitted requests" value={String(requests.length)} />
        <PremiumStatCard icon="trending" label="Review status" value="Tracked" tone="secondary" />
      </section>

      <section className="premium-form-grid">
        <form className="premium-form-card" onSubmit={handleSubmit}>
          <p className="org-ui-eyebrow">New request</p>
          <h2>Request a module</h2>
          <p>Explain the operational need so the SaaS team can review it quickly.</p>

          <div className="premium-field">
            <label>Module</label>
            <select value={selectedModule} onChange={(event) => setSelectedModule(event.target.value)}>
              <option value="">Select a module</option>
              {requestableModules.map((module) => (
                <option key={module.code} value={module.code}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

          <div className="premium-field">
            <label>Comment</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Why do you need this module?"
            />
          </div>

          <button type="submit" className="premium-gradient-button">
            Submit Request
          </button>
        </form>

        <section className="premium-preview-card">
          <p className="org-ui-eyebrow">History</p>
          <h2>Previous requests</h2>
          <p>Track submitted requests and their current status.</p>

          <div className="premium-list" style={{ marginTop: 18 }}>
            {requests.length > 0 ? (
              requests.map((request) => (
                <article key={request.id} className="premium-list-row">
                  <div>
                    <h3>{request.moduleName}</h3>
                    <p>{request.comment}</p>
                  </div>
                  <PremiumStatusBadge status={request.status}>{request.status}</PremiumStatusBadge>
                </article>
              ))
            ) : (
              <OrganizationEmptyState
                title="No requests yet"
                message="Submitted module requests will appear here for follow-up."
                icon="plus"
              />
            )}
          </div>
        </section>
      </section>

      <section className="premium-panel">
        <div className="premium-detail-header__badges">
          <OrgIcon name="info" size={20} />
          <h2>Request Guidance</h2>
        </div>
        <p>
          Requests do not immediately enable public modules. They create a review trail
          for SaaS administrators, then approved modules can be made visible from Content Management.
        </p>
      </section>
    </div>
  );
}

export default OrganizationModuleRequestPage;
