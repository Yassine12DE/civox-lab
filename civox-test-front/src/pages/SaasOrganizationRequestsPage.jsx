import { useEffect, useMemo, useState } from "react";
import {
  approveOrganizationAccessRequest,
  declineOrganizationAccessRequest,
  getOrganizationAccessRequests,
  markOrganizationAccessRequestPaid,
  resendOrganizationAccessEmail,
  sendOrganizationAccessQuote,
} from "../services/saasService";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  formatStatus,
  includesSearchValue,
} from "../utils/saasFormat";
import "../styles/saasOrganizationRequestsPage.css";

const STATUSES = [
  "ALL",
  "PENDING",
  "QUOTE_SENT",
  "AWAITING_PAYMENT",
  "PAID",
  "APPROVED",
  "DECLINED",
  "CANCELLED",
];

function SaasOrganizationRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [declineRequest, setDeclineRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  const loadRequests = async () => {
    setError("");

    try {
      const data = await getOrganizationAccessRequests();
      setRequests(data);
      setSelectedRequest((current) => {
        if (!current) return data[0] || null;
        return data.find((request) => request.id === current.id) || data[0] || null;
      });
      return data;
    } catch (requestError) {
      setError(requestError.message || "Organization requests could not be loaded.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const statusMatches = statusFilter === "ALL" || request.requestStatus === statusFilter;
        const searchMatches = includesSearchValue(request, searchTerm, [
          "organizationName",
          "desiredSlug",
          "contactEmail",
          "adminEmail",
        ]);
        return statusMatches && searchMatches;
      }),
    [requests, searchTerm, statusFilter]
  );

  const metrics = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.requestStatus === "PENDING").length,
      awaitingPayment: requests.filter((request) => request.requestStatus === "AWAITING_PAYMENT").length,
      approved: requests.filter((request) => request.requestStatus === "APPROVED").length,
    }),
    [requests]
  );

  const syncUpdatedRequest = (updatedRequest) => {
    setRequests((current) =>
      current.map((request) => (request.id === updatedRequest.id ? updatedRequest : request))
    );
    setSelectedRequest(updatedRequest);
    return updatedRequest;
  };

  const runAction = async (actionKey, action, successTitle, successMessage) => {
    setActionLoading(actionKey);
    setNotice(null);

    try {
      const updatedRequest = await action();
      syncUpdatedRequest(updatedRequest);
      setNotice({
        tone: updatedRequest.emailDeliveryWarning ? "info" : "success",
        title: successTitle,
        message: updatedRequest.emailDeliveryWarning
          ? `${successMessage} ${updatedRequest.emailDeliveryWarning}`
          : successMessage,
      });
    } catch (actionError) {
      setNotice({
        tone: "danger",
        title: "Action failed",
        message: actionError.message || "The request could not be updated. Please try again.",
      });
    } finally {
      setActionLoading("");
    }
  };

  const handleGenerateQuote = (request) =>
    runAction(
      `quote-${request.id}`,
      () => sendOrganizationAccessQuote(request.id),
      "Quote generated",
      `${request.organizationName} has a stored quote and the contact has been notified.`
    );

  const handleApprove = (request) =>
    runAction(
      `approve-${request.id}`,
      () => approveOrganizationAccessRequest(request.id, approvalNotes),
      "Payment link sent",
      `${request.organizationName} can now complete payment.`
    );

  const handleMarkPaid = (request) =>
    runAction(
      `paid-${request.id}`,
      () => markOrganizationAccessRequestPaid(request.id),
      "Organization activated",
      `${request.organizationName} is active and the welcome email has been sent.`
    );

  const handleResend = (request, type) =>
    runAction(
      `resend-${type}-${request.id}`,
      () => resendOrganizationAccessEmail(request.id, type),
      "Email sent",
      `${formatStatus(type)} email was queued for ${request.organizationName}.`
    );

  const handleDecline = async () => {
    if (!declineRequest) return;
    await runAction(
      `decline-${declineRequest.id}`,
      () => declineOrganizationAccessRequest(declineRequest.id, declineReason),
      "Request declined",
      `${declineRequest.organizationName} has been notified professionally.`
    );
    setDeclineRequest(null);
    setDeclineReason("");
  };

  if (loading) return <SaasLoadingState label="Loading organization requests..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Onboarding"
        title="Organization Requests"
        description="Review access requests, prepare quotes, send payment links, and activate new tenant workspaces after payment."
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: "Organization Requests" },
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

      <section className="saas-grid saas-grid--stats" aria-label="Organization request metrics">
        <SaasStatCard label="Total requests" value={formatNumber(metrics.total)} detail="All access requests" icon="requests" tone="teal" />
        <SaasStatCard label="Pending" value={formatNumber(metrics.pending)} detail="Needs first review" icon="alert" tone={metrics.pending ? "amber" : "teal"} />
        <SaasStatCard label="Awaiting payment" value={formatNumber(metrics.awaitingPayment)} detail="Payment link sent" icon="billing" tone="blue" />
        <SaasStatCard label="Activated" value={formatNumber(metrics.approved)} detail="Tenant created" icon="check" tone="teal" />
      </section>

      <section className="saas-toolbar" aria-label="Organization request filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search organization requests">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search name, slug, contact, admin..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select
            className="saas-select-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            {STATUSES.map((status) => (
              <option value={status} key={status}>
                {status === "ALL" ? "All statuses" : formatStatus(status)}
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
              <h2>Access queue</h2>
              <p>Requests move from review to quote, payment, and automatic tenant activation.</p>
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="saas-table-wrap">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Contact</th>
                    <th>Quote</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <span className="saas-table__title">{request.organizationName}</span>
                        <span className="saas-table__muted">{request.desiredSlug}.lvh.me</span>
                      </td>
                      <td>
                        <span className="saas-table__title">{request.contactPersonName}</span>
                        <span className="saas-table__muted">{request.contactEmail}</span>
                      </td>
                      <td>
                        <span className="saas-table__title">{formatMoney(request.quoteTotal)}</span>
                        <span className="saas-table__muted">
                          {request.expectedNumberOfUsers || 0} users, {request.requestedModuleCodes?.length || 0} modules
                        </span>
                      </td>
                      <td>
                        <SaasStatusBadge status={request.requestStatus} />
                      </td>
                      <td>{formatDateTime(request.createdAt)}</td>
                      <td>
                        <div className="saas-table__actions">
                          <button
                            type="button"
                            className="saas-button saas-button--ghost"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Details
                          </button>
                          {canGenerateQuote(request) && (
                            <button
                              type="button"
                              className="saas-button saas-button--secondary"
                              disabled={!!actionLoading}
                              onClick={() => handleGenerateQuote(request)}
                            >
                              {actionLoading === `quote-${request.id}` ? "Working..." : "Quote"}
                            </button>
                          )}
                          {canApprove(request) && (
                            <button
                              type="button"
                              className="saas-button saas-button--primary"
                              disabled={!!actionLoading}
                              onClick={() => handleApprove(request)}
                            >
                              Approve
                            </button>
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
              icon="requests"
              title={requests.length ? "No requests match these filters" : "No access requests yet"}
              message={
                requests.length
                  ? "Adjust the search term or status filter to widen the queue."
                  : "Public organization access requests will appear here after submission."
              }
            />
          )}
        </div>

        <RequestDetails
          request={selectedRequest}
          actionLoading={actionLoading}
          approvalNotes={approvalNotes}
          onApprovalNotesChange={setApprovalNotes}
          onGenerateQuote={handleGenerateQuote}
          onApprove={handleApprove}
          onMarkPaid={handleMarkPaid}
          onDecline={(request) => setDeclineRequest(request)}
          onResend={handleResend}
        />
      </section>

      {declineRequest && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal saas-requests-decline-modal" role="dialog" aria-modal="true">
            <div className="saas-modal__header">
              <div>
                <h2>Decline request</h2>
                <p>{declineRequest.organizationName} will receive a respectful email with this reason.</p>
              </div>
              <button type="button" className="saas-icon-button" onClick={() => setDeclineRequest(null)}>
                <SaasIcon name="close" size={16} />
              </button>
            </div>
            <div className="saas-modal__body">
              <label className="saas-form__field">
                <span>Decline reason</span>
                <textarea
                  className="saas-textarea-field"
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  placeholder="Share a concise, professional reason."
                />
              </label>
              <div className="saas-form__actions">
                <button type="button" className="saas-button saas-button--ghost" onClick={() => setDeclineRequest(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="saas-button saas-button--danger"
                  disabled={!!actionLoading}
                  onClick={handleDecline}
                >
                  {actionLoading === `decline-${declineRequest.id}` ? "Declining..." : "Decline request"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function RequestDetails({
  request,
  actionLoading,
  approvalNotes,
  onApprovalNotesChange,
  onGenerateQuote,
  onApprove,
  onMarkPaid,
  onDecline,
  onResend,
}) {
  if (!request) {
    return (
      <aside className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Request details</h2>
            <p>Select a request to inspect organization, quote, and timeline details.</p>
          </div>
        </div>
        <div className="saas-panel__body">
          <SaasEmptyState icon="requests" title="Select a request" message="Choose a row from the queue." />
        </div>
      </aside>
    );
  }

  return (
    <aside className="saas-panel">
      <div className="saas-panel__header">
        <div>
          <h2>{request.organizationName}</h2>
          <p>{request.desiredSlug}.lvh.me</p>
        </div>
        <SaasStatusBadge status={request.requestStatus} />
      </div>

      <div className="saas-panel__body saas-request-detail">
        <div className="saas-request-detail__section">
          <h3>Organization</h3>
          <Detail label="Contact" value={request.contactPersonName} />
          <Detail label="Contact email" value={request.contactEmail} />
          <Detail label="Phone" value={request.phone || "Not provided"} />
          <Detail label="Address" value={request.address || "Not provided"} />
          <Detail label="Description" value={request.description || "No description provided."} multiline />
        </div>

        <div className="saas-request-detail__section">
          <h3>Initial admin</h3>
          <Detail label="Name" value={`${request.adminFirstName || ""} ${request.adminLastName || ""}`.trim()} />
          <Detail label="Email" value={request.adminEmail} />
        </div>

        <div className="saas-request-detail__section">
          <h3>Scope</h3>
          <div className="saas-request-chip-list">
            <span>{request.expectedNumberOfUsers || 0} expected users</span>
            {(request.requestedModuleCodes || []).map((moduleCode) => (
              <span key={moduleCode}>{moduleCode}</span>
            ))}
          </div>
        </div>

        <QuoteCard request={request} />

        {request.paymentUrl && (
          <div className="saas-request-detail__section">
            <h3>Payment link</h3>
            <p className="saas-request-muted">
              Use this link for local testing if SMTP delivery is unavailable.
            </p>
            <a href={request.paymentUrl} target="_blank" rel="noreferrer" className="saas-button saas-button--secondary">
              Open payment page
            </a>
          </div>
        )}

        <div className="saas-request-detail__section">
          <h3>Approval notes</h3>
          <textarea
            className="saas-textarea-field"
            value={approvalNotes}
            onChange={(event) => onApprovalNotesChange(event.target.value)}
            placeholder="Optional notes for the request record."
          />
        </div>

        <div className="saas-request-actions">
          {canGenerateQuote(request) && (
            <button
              type="button"
              className="saas-button saas-button--secondary"
              disabled={!!actionLoading}
              onClick={() => onGenerateQuote(request)}
            >
              {actionLoading === `quote-${request.id}` ? "Generating..." : "Generate quote"}
            </button>
          )}
          {canApprove(request) && (
            <button
              type="button"
              className="saas-button saas-button--primary"
              disabled={!!actionLoading}
              onClick={() => onApprove(request)}
            >
              {actionLoading === `approve-${request.id}` ? "Sending..." : "Approve and send payment"}
            </button>
          )}
          {canMarkPaid(request) && (
            <button
              type="button"
              className="saas-button saas-button--primary"
              disabled={!!actionLoading}
              onClick={() => onMarkPaid(request)}
            >
              {actionLoading === `paid-${request.id}` ? "Activating..." : "Mark payment completed"}
            </button>
          )}
          {canDecline(request) && (
            <button type="button" className="saas-button saas-button--danger" onClick={() => onDecline(request)}>
              Decline
            </button>
          )}
        </div>

        <div className="saas-request-email-actions">
          <button type="button" className="saas-button saas-button--ghost" onClick={() => onResend(request, "REQUEST_RECEIVED")}>
            Resend received
          </button>
          <button type="button" className="saas-button saas-button--ghost" onClick={() => onResend(request, "QUOTE")}>
            Resend quote
          </button>
          {canResendPayment(request) && (
            <button type="button" className="saas-button saas-button--ghost" onClick={() => onResend(request, "PAYMENT")}>
              Resend payment
            </button>
          )}
          {request.requestStatus === "APPROVED" && (
            <button type="button" className="saas-button saas-button--ghost" onClick={() => onResend(request, "WELCOME")}>
              Resend welcome
            </button>
          )}
        </div>

        <Timeline request={request} />
      </div>
    </aside>
  );
}

function QuoteCard({ request }) {
  if (!request.quoteTotal) {
    return (
      <div className="saas-request-detail__section">
        <h3>Quote</h3>
        <p className="saas-request-muted">No quote has been generated yet.</p>
      </div>
    );
  }

  return (
    <div className="saas-request-detail__section">
      <h3>Quote breakdown</h3>
      <div className="saas-request-quote-grid">
        <Detail label="Base fee" value={formatMoney(request.quoteBaseFee)} />
        <Detail label="User fee" value={formatMoney(request.quoteUserFee)} />
        <Detail label="Module fee" value={formatMoney(request.quoteModuleFee)} />
        <Detail label="Setup fee" value={formatMoney(request.quoteSetupFee)} />
        <Detail label="Total" value={formatMoney(request.quoteTotal)} strong />
      </div>
      {request.quoteAssumptions && <p className="saas-request-muted">{request.quoteAssumptions}</p>}
    </div>
  );
}

function Timeline({ request }) {
  const events = [
    { label: "Submitted", date: request.createdAt, active: true },
    { label: "Quote sent", date: request.quoteSentAt, active: !!request.quoteSentAt },
    { label: "Approved for payment", date: request.approvedAt, active: !!request.approvedAt },
    { label: "Payment completed", date: request.paidAt, active: !!request.paidAt },
    { label: "Tenant activated", date: request.activatedAt, active: !!request.activatedAt },
    { label: "Declined", date: request.declinedAt, active: !!request.declinedAt },
  ].filter((event) => event.active);

  return (
    <div className="saas-request-detail__section">
      <h3>Timeline</h3>
      <div className="saas-request-timeline">
        {events.map((event) => (
          <div className="saas-request-timeline__item" key={event.label}>
            <span />
            <div>
              <strong>{event.label}</strong>
              <time>{formatDateTime(event.date)}</time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value, multiline = false, strong = false }) {
  return (
    <div className={multiline ? "saas-request-detail-line saas-request-detail-line--multiline" : "saas-request-detail-line"}>
      <span>{label}</span>
      {strong ? <strong>{value}</strong> : <p>{value || "Not provided"}</p>}
    </div>
  );
}

function canGenerateQuote(request) {
  return ["PENDING", "QUOTE_SENT"].includes(request.requestStatus);
}

function canApprove(request) {
  return ["PENDING", "QUOTE_SENT"].includes(request.requestStatus);
}

function canMarkPaid(request) {
  return request.requestStatus === "AWAITING_PAYMENT" || request.paymentStatus === "AWAITING_PAYMENT";
}

function canResendPayment(request) {
  return (
    !!request.quoteTotal &&
    (request.requestStatus === "AWAITING_PAYMENT" || request.paymentStatus === "AWAITING_PAYMENT")
  );
}

function canDecline(request) {
  return !["APPROVED", "PAID", "DECLINED", "CANCELLED", "REJECTED"].includes(request.requestStatus);
}

export default SaasOrganizationRequestsPage;
