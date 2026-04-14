import { useEffect, useMemo, useState } from "react";
import {
  approveModuleRequest,
  getAllModuleRequests,
  rejectModuleRequest,
} from "../services/saasService";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  formatDateTime,
  formatNumber,
  formatStatus,
  includesSearchValue,
  isPendingStatus,
} from "../utils/saasFormat";

function getStatusOptions(requests) {
  return Array.from(new Set(requests.map((request) => request.status).filter(Boolean)));
}

function SaasModuleRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadRequests = async () => {
    setError("");

    try {
      const data = await getAllModuleRequests();
      setRequests(data);
      return data;
    } catch {
      setError("Module requests could not be loaded. Please try again.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const statusOptions = useMemo(() => getStatusOptions(requests), [requests]);
  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const statusMatches = statusFilter === "ALL" || String(request.status) === statusFilter;
        const searchMatches = includesSearchValue(request, searchTerm, [
          "organizationName",
          "moduleName",
          "moduleCode",
          "comment",
        ]);

        return statusMatches && searchMatches;
      }),
    [requests, searchTerm, statusFilter]
  );

  const pendingRequests = requests.filter((request) => isPendingStatus(request.status));
  const approvedRequests = requests.filter(
    (request) => String(request.status).toUpperCase() === "APPROVED"
  );
  const rejectedRequests = requests.filter(
    (request) => String(request.status).toUpperCase() === "REJECTED"
  );

  const openConfirmation = (request, action) => {
    setConfirmation({ request, action });
  };

  const handleDecision = async () => {
    if (!confirmation) return;

    const { request, action } = confirmation;
    setActionLoading(true);
    setNotice(null);

    try {
      if (action === "approve") {
        await approveModuleRequest(request.id, "Approved by SaaS admin");
      } else {
        await rejectModuleRequest(request.id, "Rejected by SaaS admin");
      }

      const freshRequests = await loadRequests();
      const updatedRequest = freshRequests.find((item) => item.id === request.id);
      setSelectedRequest(updatedRequest || null);
      setNotice({
        tone: "success",
        title: action === "approve" ? "Request approved" : "Request rejected",
        message: `${request.moduleName || "The module"} request for ${
          request.organizationName || "this organization"
        } has been ${action === "approve" ? "approved" : "rejected"}.`,
      });
      setConfirmation(null);
    } catch {
      setNotice({
        tone: "danger",
        title: "Decision failed",
        message: "The request status could not be updated. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <SaasLoadingState label="Loading module requests..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Request management"
        title="Module Requests"
        description="Review tenant demand for platform modules, inspect context, and approve or reject requests with a clear decision trail."
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: "Module Requests" },
        ]}
      />

      {error && (
        <SaasNotice
          tone="danger"
          title="Unable to load requests"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {notice && (
        <SaasNotice
          tone={notice.tone}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <section className="saas-grid saas-grid--stats" aria-label="Module request metrics">
        <SaasStatCard
          label="Total requests"
          value={formatNumber(requests.length)}
          detail="All module access requests"
          icon="requests"
          tone="teal"
        />
        <SaasStatCard
          label="Pending"
          value={formatNumber(pendingRequests.length)}
          detail="Needs review"
          icon="alert"
          tone={pendingRequests.length ? "amber" : "teal"}
        />
        <SaasStatCard
          label="Approved"
          value={formatNumber(approvedRequests.length)}
          detail="Granted by SaaS admin"
          icon="check"
          tone="blue"
        />
        <SaasStatCard
          label="Rejected"
          value={formatNumber(rejectedRequests.length)}
          detail="Declined after review"
          icon="close"
          tone="red"
        />
      </section>

      <section className="saas-toolbar" aria-label="Module request filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search module requests">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search organization, module, comment..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select
            className="saas-select-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by request status"
          >
            <option value="ALL">All statuses</option>
            {statusOptions.map((status) => (
              <option value={status} key={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <span className="saas-table__muted">
          {formatNumber(filteredRequests.length)} result
          {filteredRequests.length === 1 ? "" : "s"}
        </span>
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Review queue</h2>
              <p>Every request is visible with module, organization, and timeline context.</p>
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="saas-table-wrap">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Module</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <span className="saas-table__title">{request.organizationName}</span>
                        <span className="saas-table__muted">Request #{request.id}</span>
                      </td>
                      <td>
                        <span className="saas-table__title">
                          {request.moduleName || request.moduleCode}
                        </span>
                        <span className="saas-table__muted">{request.moduleCode}</span>
                      </td>
                      <td>
                        <SaasStatusBadge status={request.status} />
                      </td>
                      <td>{formatDateTime(request.requestDate)}</td>
                      <td>
                        <div className="saas-table__actions">
                          <button
                            type="button"
                            className="saas-button saas-button--ghost"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Details
                          </button>
                          {isPendingStatus(request.status) && (
                            <>
                              <button
                                type="button"
                                className="saas-button saas-button--secondary"
                                onClick={() => openConfirmation(request, "reject")}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="saas-button saas-button--primary"
                                onClick={() => openConfirmation(request, "approve")}
                              >
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <SaasEmptyState
              icon="search"
              title={requests.length ? "No requests match these filters" : "No module requests yet"}
              message={
                requests.length
                  ? "Adjust the search term or status filter to widen the queue."
                  : "When tenant admins request modules, they will appear here."
              }
            />
          )}
        </div>

        <aside className="saas-panel" aria-label="Request details">
          <div className="saas-panel__header">
            <div>
              <h2>Details</h2>
              <p>Selected request context and decision controls.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            {selectedRequest ? (
              <div className="saas-detail-list">
                <div className="saas-detail-list__item">
                  <span>Organization</span>
                  <strong>{selectedRequest.organizationName || "Unknown organization"}</strong>
                </div>
                <div className="saas-detail-list__item">
                  <span>Requested module</span>
                  <strong>{selectedRequest.moduleName || selectedRequest.moduleCode}</strong>
                </div>
                <div className="saas-detail-list__item">
                  <span>Status</span>
                  <SaasStatusBadge status={selectedRequest.status} />
                </div>
                <div className="saas-detail-list__item">
                  <span>Requested on</span>
                  <strong>{formatDateTime(selectedRequest.requestDate)}</strong>
                </div>
                <div className="saas-detail-list__item">
                  <span>Reviewed on</span>
                  <strong>{formatDateTime(selectedRequest.reviewedDate)}</strong>
                </div>
                <div className="saas-detail-list__item">
                  <span>Comment</span>
                  <p>{selectedRequest.comment || "No comment was provided."}</p>
                </div>

                {isPendingStatus(selectedRequest.status) && (
                  <div className="saas-form__actions">
                    <button
                      type="button"
                      className="saas-button saas-button--secondary"
                      onClick={() => openConfirmation(selectedRequest, "reject")}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="saas-button saas-button--primary"
                      onClick={() => openConfirmation(selectedRequest, "approve")}
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <SaasEmptyState
                icon="requests"
                title="Select a request"
                message="Choose a row from the queue to inspect timestamps, comments, and decision actions."
              />
            )}
          </div>
        </aside>
      </section>

      <SaasConfirmDialog
        open={!!confirmation}
        title={confirmation?.action === "approve" ? "Approve module request?" : "Reject module request?"}
        message={
          confirmation
            ? `${confirmation.request.organizationName || "This organization"} will ${
                confirmation.action === "approve" ? "receive access to" : "not receive access to"
              } ${confirmation.request.moduleName || "this module"}.`
            : ""
        }
        confirmLabel={confirmation?.action === "approve" ? "Approve request" : "Reject request"}
        tone={confirmation?.action === "approve" ? "primary" : "danger"}
        busy={actionLoading}
        onConfirm={handleDecision}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}

export default SaasModuleRequestsPage;
