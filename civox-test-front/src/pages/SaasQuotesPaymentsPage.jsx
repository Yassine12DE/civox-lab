import { useEffect, useMemo, useState } from "react";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  approveOrganizationAccessRequest,
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
                      <b>{formatMoney(quote.amount)}</b>
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
              {quotes.map((quote) => (
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
                      <button type="button" className="saas-button saas-button--outline" onClick={() => setNotice({ tone: "info", title: quote.id, message: `${quote.organization} - ${quote.paymentStatus}` })}>Preview</button>
                      <button
                        type="button"
                        className="saas-button saas-button--secondary"
                        onClick={() => action(`payment-${quote.requestId}`, () => resendOrganizationAccessEmail(quote.requestId, "PAYMENT"), `Payment link resent for ${quote.organization}.`)}
                        disabled={busyId !== ""}
                      >
                        {busyId === `payment-${quote.requestId}` ? "Sending..." : "Resend payment link"}
                      </button>
                      {quote.status !== "ACCEPTED" && quote.status !== "PAID" && (
                        <button
                          type="button"
                          className="saas-button saas-button--success"
                          onClick={() => action(`approve-${quote.requestId}`, () => approveOrganizationAccessRequest(quote.requestId), `Request approved and payment link sent for ${quote.organization}.`)}
                          disabled={busyId !== ""}
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
                        >
                          {busyId === `quote-${quote.requestId}` ? "Working..." : "Generate quote"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default SaasQuotesPaymentsPage;
