import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SaasTrendChart } from "../components/saas/SaasCharts";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  getOrganizationAccessRequests,
  getSaasOrganizations,
  markOrganizationAccessRequestPaid,
  resendOrganizationAccessEmail,
} from "../services/saasService";
import { buildInvoices, buildRevenueTrendFromSubscriptions, buildSubscriptions } from "../utils/saasDerivedData";
import { formatDate, formatMoney, formatNumber } from "../utils/saasFormat";

function SaasBillingInvoicesPage() {
  const [organizations, setOrganizations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [organizationsData, requestsData] = await Promise.all([
        getSaasOrganizations(),
        getOrganizationAccessRequests(),
      ]);
      setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      setOrganizations([]);
      setRequests([]);
      setNotice({ tone: "danger", title: "Unable to load billing", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subscriptions = useMemo(() => buildSubscriptions(organizations), [organizations]);
  const revenueTrend = useMemo(() => buildRevenueTrendFromSubscriptions(subscriptions), [subscriptions]);
  const invoices = useMemo(() => buildInvoices(requests, organizations), [organizations, requests]);

  const paidRevenue = sumInvoicesByStatus(invoices, "PAID");
  const pendingRevenue = sumInvoicesByStatus(invoices, "PENDING");
  const overdueRevenue = sumInvoicesByStatus(invoices, "OVERDUE");
  const overdueCount = invoices.filter((invoice) => invoice.status === "OVERDUE").length;

  const sendReminder = async (invoice) => {
    if (!invoice.requestId) return;
    setBusyId(`remind-${invoice.id}`);
    try {
      await resendOrganizationAccessEmail(invoice.requestId, "PAYMENT");
      setNotice({ tone: "success", title: "Reminder sent", message: `Payment reminder sent for ${invoice.organization}.` });
      await load();
    } catch (error) {
      setNotice({ tone: "danger", title: "Reminder failed", message: error.message });
    } finally {
      setBusyId("");
    }
  };

  const markPaid = async (invoice) => {
    if (!invoice.requestId) return;
    setBusyId(`paid-${invoice.id}`);
    try {
      await markOrganizationAccessRequestPaid(invoice.requestId);
      setNotice({ tone: "success", title: "Invoice updated", message: `${invoice.organization} invoice marked as paid.` });
      await load();
    } catch (error) {
      setNotice({ tone: "danger", title: "Update failed", message: error.message });
    } finally {
      setBusyId("");
    }
  };

  const downloadInvoice = (invoice) => {
    const content = [
      `Invoice: ${invoice.id}`,
      `Organization: ${invoice.organization}`,
      `Amount: ${formatMoney(invoice.amount)}`,
      `Status: ${invoice.status}`,
      `Due date: ${formatDate(invoice.dueDate)}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <SaasLoadingState label="Loading billing and invoices..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Business operations"
        title="Billing & Invoices"
        description="Revenue collection, invoice follow-up, payment status, and billing alerts."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Billing & Invoices" }]}
        actions={
          <>
            <button type="button" className="saas-button saas-button--outline" onClick={() => downloadCsv(invoices)}>
              <SaasIcon name="download" size={16} />
              Export
            </button>
            <Link to="/saas/quotes-payments" className="saas-button saas-button--primary">
              <SaasIcon name="file" size={16} />
              Open quotes
            </Link>
          </>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Billing metrics">
        <SaasStatCard label="Paid revenue" value={formatMoney(paidRevenue)} detail="Collected this cycle" icon="dollar" tone="teal" />
        <SaasStatCard label="Pending" value={formatMoney(pendingRevenue)} detail="Awaiting payment" icon="clock" tone="amber" />
        <SaasStatCard label="Overdue" value={formatMoney(overdueRevenue)} detail={`${formatNumber(overdueCount)} invoice requires attention`} icon="alert" tone="red" />
        <SaasStatCard label="Invoices" value={formatNumber(invoices.length)} detail="Issued invoices" icon="file" tone="blue" />
      </section>

      {overdueCount > 0 && (
        <section className="saas-alert-band saas-alert-band--danger">
          <span><SaasIcon name="alert" size={18} /></span>
          <div>
            <strong>Payment delay alert</strong>
            <p>{formatNumber(overdueCount)} invoice(s) need immediate follow-up.</p>
          </div>
          <Link to="/saas/quotes-payments" className="saas-button saas-button--outline">Review</Link>
        </section>
      )}

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Revenue chart</h2>
            <p>Monthly revenue trend from active subscriptions.</p>
          </div>
          <SaasStatusBadge status="SUCCESS" label="Live" />
        </div>
        <div className="saas-panel__body">
          <SaasTrendChart data={revenueTrend} />
        </div>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Invoice table</h2>
            <p>Invoice number, organization, plan, amount, due date, and collection status.</p>
          </div>
        </div>
        <div className="saas-table-wrap">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Organization</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Due date</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <span className="saas-table__title">{invoice.id}</span>
                    <span className="saas-table__muted">{invoice.paidDate ? `Paid ${formatDate(invoice.paidDate)}` : "Payment open"}</span>
                  </td>
                  <td>{invoice.organization}</td>
                  <td><SaasStatusBadge status={invoice.plan} label={invoice.plan} tone="info" /></td>
                  <td><strong>{formatMoney(invoice.amount)}</strong></td>
                  <td>{formatDate(invoice.dueDate)}</td>
                  <td><SaasStatusBadge status={invoice.status} /></td>
                  <td>
                    <div className="saas-table__actions">
                      <button type="button" className="saas-icon-button" aria-label={`View ${invoice.id}`} onClick={() => setNotice({ tone: "info", title: invoice.id, message: `${invoice.organization} - ${formatMoney(invoice.amount)}` })}>
                        <SaasIcon name="external" size={15} />
                      </button>
                      <button type="button" className="saas-icon-button" aria-label={`Download ${invoice.id}`} onClick={() => downloadInvoice(invoice)}>
                        <SaasIcon name="download" size={15} />
                      </button>
                      {invoice.status !== "PAID" && (
                        <>
                          <button type="button" className="saas-button saas-button--ghost" onClick={() => sendReminder(invoice)} disabled={busyId !== ""}>
                            {busyId === `remind-${invoice.id}` ? "Sending..." : "Reminder"}
                          </button>
                          <button type="button" className="saas-button saas-button--success" onClick={() => markPaid(invoice)} disabled={busyId !== ""}>
                            {busyId === `paid-${invoice.id}` ? "Saving..." : "Mark paid"}
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
      </section>
    </div>
  );
}

function sumInvoicesByStatus(invoices, status) {
  return invoices
    .filter((invoice) => invoice.status === status)
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
}

function downloadCsv(invoices) {
  const header = ["invoice", "organization", "plan", "amount", "dueDate", "status", "paidDate"];
  const rows = invoices.map((invoice) => [
    invoice.id,
    invoice.organization,
    invoice.plan,
    invoice.amount,
    invoice.dueDate,
    invoice.status,
    invoice.paidDate || "",
  ]);
  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "saas-invoices.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default SaasBillingInvoicesPage;
