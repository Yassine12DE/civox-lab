import { useEffect, useMemo, useState } from "react";
import SaasIcon from "../components/saas/SaasIcon";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  approveOrganizationAccessRequest,
  getOrganizationAccessRequest,
  getOrganizationAccessRequests,
  resendOrganizationAccessEmail,
  sendOrganizationAccessQuote,
} from "../services/saasService";
import { buildQuotesPayments } from "../utils/saasDerivedData";
import { formatDate, formatMoney, formatNumber } from "../utils/saasFormat";

function SaasQuotesPaymentsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [previewState, setPreviewState] = useState({
    open: false,
    loading: false,
    error: "",
    quote: null,
    request: null,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationAccessRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setRequests([]);
      setNotice({ tone: "danger", title: "Unable to load quotes", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const quotes = useMemo(() => buildQuotesPayments(requests), [requests]);

  const sentQuotes = quotes.filter((quote) => quote.status === "SENT").length;
  const acceptedQuotes = quotes.filter((quote) => quote.status === "ACCEPTED").length;
  const paidQuotes = quotes.filter((quote) => quote.paymentStatus === "PAID").length;
  const openPipeline = quotes
    .filter((quote) => quote.paymentStatus !== "PAID")
    .reduce((sum, quote) => sum + quote.amount, 0);

  const action = async (key, run, successMessage) => {
    setBusyId(key);
    try {
      await run();
      setNotice({ tone: "success", title: "Action completed", message: successMessage });
      await load();
    } catch (error) {
      setNotice({ tone: "danger", title: "Action failed", message: error.message });
    } finally {
      setBusyId("");
    }
  };

  const openQuotePreview = async (quote) => {
    setPreviewState({
      open: true,
      loading: true,
      error: "",
      quote,
      request: null,
    });

    try {
      const request = await getOrganizationAccessRequest(quote.requestId);
      setPreviewState((current) => ({
        ...current,
        loading: false,
        request: request || null,
      }));
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Quote preview could not be loaded.",
      }));
    }
  };

  const closeQuotePreview = () => {
    setPreviewState({
      open: false,
      loading: false,
      error: "",
      quote: null,
      request: null,
    });
  };

  if (loading) return <SaasLoadingState label="Loading quotes and payments..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Business operations"
        title="Quotes & Payments"
        description="Quote production, payment links, acceptance state, and onboarding handoff."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Quotes & Payments" }]}
        actions={
          <button
            type="button"
            className="saas-button saas-button--primary"
            onClick={() => {
              const draft = requests.find((request) => !request.quoteTotal);
              if (!draft) {
                setNotice({ tone: "info", title: "No draft request", message: "All requests already have quotes." });
                return;
              }
              action(`quote-${draft.id}`, () => sendOrganizationAccessQuote(draft.id), `Quote generated for ${draft.organizationName}.`);
            }}
          >
            <SaasIcon name="send" size={16} />
            Send quote
          </button>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Quote metrics">
        <SaasStatCard label="Open pipeline" value={formatMoney(openPipeline)} detail="Draft, sent, and accepted quotes" icon="dollar" tone="teal" />
        <SaasStatCard label="Sent" value={formatNumber(sentQuotes)} detail="Waiting for customer response" icon="send" tone="blue" />
        <SaasStatCard label="Accepted" value={formatNumber(acceptedQuotes)} detail="Payment link active" icon="check" tone="amber" />
        <SaasStatCard label="Paid" value={formatNumber(paidQuotes)} detail="Ready for tenant activation" icon="billing" tone="teal" />
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Quote pipeline</h2>
            <p>Commercial handoff from onboarding request to confirmed payment.</p>
          </div>
        </div>
        <div className="saas-kanban">
          {["NOT_CREATED", "SENT", "ACCEPTED", "PAID"].map((status) => (
            <section className="saas-kanban__column" key={status}>
              <header>
                <SaasStatusBadge status={status} />
                <span>{quotes.filter((quote) => quote.status === status || (status === "PAID" && quote.paymentStatus === "PAID")).length}</span>
              </header>
              {quotes
                .filter((quote) => quote.status === status || (status === "PAID" && quote.paymentStatus === "PAID"))
                .map((quote) => (
                  <article className="saas-kanban-card" key={quote.id}>
                    <strong>{quote.organization}</strong>
                    <span>{quote.id}</span>
                    <p>{quote.owner} - {quote.modules} requested modules</p>
                    <div>
                      <span className="saas-kanban-card__amount">{formatMoney(quote.amount)}</span>
                      <SaasStatusBadge status={quote.paymentStatus} />
                    </div>
                  </article>
                ))}
            </section>
          ))}
        </div>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Payment follow-up</h2>
            <p>Quote expiration, payment state, and reminder controls.</p>
          </div>
        </div>
        <div className="saas-table-wrap">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Organization</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Expires</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {quotes.length > 0 ? quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <span className="saas-table__title">{quote.id}</span>
                    <span className="saas-table__muted">{quote.modules} modules</span>
                  </td>
                  <td>{quote.organization}</td>
                  <td><strong>{formatMoney(quote.amount)}</strong></td>
                  <td><SaasStatusBadge status={quote.status} /></td>
                  <td>{quote.paymentStatus}</td>
                  <td>{formatDate(quote.expiresAt)}</td>
                  <td>
                    <div className="saas-table__actions">
                      <button
                        type="button"
                        className="saas-button saas-button--secondary"
                        onClick={() => openQuotePreview(quote)}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="saas-button saas-button--outline"
                        onClick={() => action(`payment-${quote.requestId}`, () => resendOrganizationAccessEmail(quote.requestId, "PAYMENT"), `Payment link resent for ${quote.organization}.`)}
                        disabled={busyId !== ""}
                        aria-busy={busyId === `payment-${quote.requestId}`}
                      >
                        {busyId === `payment-${quote.requestId}` ? "Sending..." : "Resend payment link"}
                      </button>
                      {quote.status !== "ACCEPTED" && quote.status !== "PAID" && (
                        <button
                          type="button"
                          className="saas-button saas-button--success"
                          onClick={() => action(`approve-${quote.requestId}`, () => approveOrganizationAccessRequest(quote.requestId), `Request approved and payment link sent for ${quote.organization}.`)}
                          disabled={busyId !== ""}
                          aria-busy={busyId === `approve-${quote.requestId}`}
                        >
                          {busyId === `approve-${quote.requestId}` ? "Working..." : "Approve"}
                        </button>
                      )}
                      {quote.status === "NOT_CREATED" && (
                        <button
                          type="button"
                          className="saas-button saas-button--primary"
                          onClick={() => action(`quote-${quote.requestId}`, () => sendOrganizationAccessQuote(quote.requestId), `Quote generated for ${quote.organization}.`)}
                          disabled={busyId !== ""}
                          aria-busy={busyId === `quote-${quote.requestId}`}
                        >
                          {busyId === `quote-${quote.requestId}` ? "Working..." : "Generate quote"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>
                    <SaasEmptyState
                      icon="file"
                      title="No quotes to display"
                      message="Quotes will appear once onboarding requests move into quoting."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {previewState.open && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal saas-modal--wide" role="dialog" aria-modal="true">
            <div className="saas-modal__header">
              <div>
                <h2>Quote Preview</h2>
                <p>{previewState.quote?.id || "Quote details"}</p>
              </div>
              <button type="button" className="saas-icon-button" onClick={closeQuotePreview} aria-label="Close quote preview">
                <SaasIcon name="close" size={16} />
              </button>
            </div>
            <div className="saas-modal__body">
              {previewState.loading && <SaasLoadingState label="Loading quote preview..." />}

              {!previewState.loading && previewState.error && (
                <SaasNotice
                  tone="danger"
                  title="Preview unavailable"
                  message={previewState.error}
                  onDismiss={() => setPreviewState((current) => ({ ...current, error: "" }))}
                />
              )}

              {!previewState.loading && !previewState.error && !previewState.request && (
                <SaasEmptyState
                  icon="file"
                  title="No quote data available"
                  message="The selected quote could not be loaded from the backend."
                />
              )}

              {!previewState.loading && !previewState.error && previewState.request && (
                <QuotePreview request={previewState.request} quote={previewState.quote} />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function QuotePreview({ request, quote }) {
  const modules = Array.isArray(request.requestedModuleCodes) ? request.requestedModuleCodes : [];
  const notes = request.additionalNotes || request.reviewComment || request.approvalNotes || quote?.notes || "";

  return (
    <div className="saas-preview-stack">
      <section className="saas-preview-hero">
        <div>
          <p className="saas-preview-eyebrow">CIVOX Commercial Preview</p>
          <h3>{quote?.id || `Request #${request.id}`}</h3>
          <p>{request.organizationName} • {request.desiredSlug}.civox.io</p>
        </div>
        <div className="saas-preview-badges">
          <SaasStatusBadge status={quote?.status || request.quoteStatus || "NOT_CREATED"} />
          <SaasStatusBadge status={quote?.paymentStatus || request.paymentStatus || "NOT_STARTED"} />
          <SaasStatusBadge status={request.requestStatus || "PENDING"} />
        </div>
      </section>

      <section className="saas-preview-grid">
        <PreviewDetail label="Organization" value={request.organizationName} />
        <PreviewDetail label="Contact" value={request.contactPersonName || "Not provided"} />
        <PreviewDetail label="Contact Email" value={request.contactEmail || "Not provided"} />
        <PreviewDetail label="Expected Users" value={formatNumber(request.expectedNumberOfUsers || 0)} />
        <PreviewDetail label="Quote Sent" value={formatDate(request.quoteSentAt || request.createdAt)} />
        <PreviewDetail label="Approved At" value={formatDate(request.approvedAt)} />
      </section>

      <section className="saas-preview-panel">
        <h4>Requested Modules</h4>
        {modules.length > 0 ? (
          <div className="saas-module-strip">
            {modules.map((moduleCode) => (
              <span key={moduleCode}>{moduleCode}</span>
            ))}
          </div>
        ) : (
          <p className="saas-table__muted">No specific modules were recorded for this quote.</p>
        )}
      </section>

      <section className="saas-preview-panel">
        <h4>Pricing Breakdown</h4>
        <div className="saas-preview-grid">
          <PreviewDetail label="Base platform fee" value={formatMoney(request.quoteBaseFee || 0)} />
          <PreviewDetail label="User fee" value={formatMoney(request.quoteUserFee || 0)} />
          <PreviewDetail label="Module fee" value={formatMoney(request.quoteModuleFee || 0)} />
          <PreviewDetail label="Setup fee" value={formatMoney(request.quoteSetupFee || 0)} />
          <PreviewDetail label="Total" value={formatMoney(request.quoteTotal || 0)} strong />
        </div>
        {request.quoteAssumptions && <p className="saas-table__muted">{request.quoteAssumptions}</p>}
      </section>

      <section className="saas-preview-panel">
        <h4>Notes</h4>
        <p>{notes || "No additional notes were provided."}</p>
      </section>
    </div>
  );
}

function PreviewDetail({ label, value, strong = false }) {
  return (
    <div className="saas-detail-list__item">
      <span>{label}</span>
      {strong ? <strong>{value || "Not available"}</strong> : <p>{value || "Not available"}</p>}
    </div>
  );
}

export default SaasQuotesPaymentsPage;
