import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SaasBarChart } from "../components/saas/SaasCharts";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import { getOrganizationAccessRequests, getSaasOrganizations } from "../services/saasService";
import { createSaasStripeCheckoutSession } from "../services/stripeService";
import { buildRevenueTrendFromSubscriptions, buildSubscriptions } from "../utils/saasDerivedData";
import { formatDate, formatMoney, formatNumber } from "../utils/saasFormat";

function SaasPlansSubscriptionsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
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
        setNotice({ tone: "danger", title: "Unable to load subscriptions", message: error.message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const subscriptions = useMemo(() => buildSubscriptions(organizations), [organizations]);
  const revenueTrend = useMemo(() => buildRevenueTrendFromSubscriptions(subscriptions), [subscriptions]);

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const trialSubscriptions = subscriptions.filter((subscription) => subscription.trial);
  const totalMrr = subscriptions.reduce((sum, subscription) => sum + subscription.mrr, 0) * 1000;
  const arr = totalMrr * 12;

  const planCards = useMemo(() => {
    const grouped = subscriptions.reduce((acc, subscription) => {
      const plan = subscription.plan;
      if (!acc[plan]) {
        acc[plan] = { name: plan, organizations: 0, users: 0, mrr: 0 };
      }
      acc[plan].organizations += 1;
      acc[plan].users += Number(subscription.users || 0);
      acc[plan].mrr += Number(subscription.mrr || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((left, right) => right.organizations - left.organizations);
  }, [subscriptions]);

  const exportSubscriptions = () => {
    const header = ["organization", "slug", "plan", "status", "users", "mrr", "renewalDate"];
    const rows = subscriptions.map((subscription) => [
      subscription.organization,
      subscription.slug,
      subscription.plan,
      subscription.status,
      subscription.users,
      subscription.mrr,
      subscription.renewalDate,
    ]);
    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "saas-subscriptions.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const launchStripeCheckout = async (subscription) => {
    const actionId = String(subscription.organizationId || subscription.slug || "subscription");
    setBusyId(actionId);
    setNotice(null);

    try {
      // Stripe test card for demo checkout: 4242 4242 4242 4242, any future expiry, any CVC.
      const session = await createSaasStripeCheckoutSession({
        flowType: "SUBSCRIPTION",
        organizationId: subscription.organizationId,
        planCode: subscription.plan,
      });

      if (!session?.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned by the backend.");
      }

      window.location.assign(session.checkoutUrl);
    } catch (error) {
      setNotice({ tone: "danger", title: "Stripe checkout unavailable", message: error.message });
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <SaasLoadingState label="Loading plans and subscriptions..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Business operations"
        title="Plans & Subscriptions"
        description="Pricing packages, subscription lifecycle, trials, renewals, and commercial controls."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Plans & Subscriptions" }]}
        actions={
          <>
            <button type="button" className="saas-button saas-button--outline" onClick={exportSubscriptions}>
              Export subscriptions
            </button>
            <Link to="/saas/settings" className="saas-button saas-button--primary">
              <SaasIcon name="plus" size={16} />
              Manage defaults
            </Link>
          </>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Subscription metrics">
        <SaasStatCard label="Monthly revenue" value={formatMoney(totalMrr)} detail="Computed from active plans" icon="dollar" tone="teal" />
        <SaasStatCard label="ARR" value={formatMoney(arr)} detail="Projected annual recurring revenue" icon="trend" tone="blue" />
        <SaasStatCard label="Active subscriptions" value={formatNumber(activeSubscriptions.length)} detail="Paid organization workspaces" icon="billing" tone="blue" />
        <SaasStatCard label="Trials" value={formatNumber(trialSubscriptions.length)} detail="Awaiting conversion" icon="clock" tone="amber" />
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Revenue trend</h2>
              <p>Monthly recurring revenue shown in thousands.</p>
            </div>
            <SaasStatusBadge status="ACTIVE" label="Live" />
          </div>
          <div className="saas-panel__body">
            <SaasBarChart
              data={revenueTrend}
              color="purple"
              title="MRR by month"
              xAxisLabel="Month"
              yAxisLabel="MRR (USD)"
              valueFormatter={(value) => formatMoney(value * 1000)}
            />
          </div>
        </div>

        <div className="saas-panel saas-lifecycle-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Onboarding lifecycle</h2>
              <p>Current onboarding and activation stages.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            {[
              ["Pending", requests.filter((request) => String(request.requestStatus || "").toUpperCase() === "PENDING").length],
              ["Quote sent", requests.filter((request) => String(request.requestStatus || "").toUpperCase() === "QUOTE_SENT").length],
              ["Awaiting payment", requests.filter((request) => String(request.requestStatus || "").toUpperCase() === "AWAITING_PAYMENT").length],
              ["Activated", requests.filter((request) => String(request.requestStatus || "").toUpperCase() === "APPROVED").length],
            ].map(([label, count]) => (
              <div className="saas-timeline-row" key={label}>
                <span className="saas-timeline-dot saas-timeline-dot--active" />
                <div>
                  <strong>{label}</strong>
                  <p>{formatNumber(count)} request(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="saas-pricing-grid" aria-label="Pricing plans">
        {planCards.map((plan) => (
          <article className="saas-plan-card" key={plan.name}>
            <div className="saas-plan-card__mark">{plan.name.charAt(0)}</div>
            <h2>{plan.name}</h2>
            <p>Live plan usage and volume</p>
            <strong className="saas-plan-card__price">{formatMoney(plan.mrr * 1000)} MRR</strong>
            <ul>
              <li><SaasIcon name="check" size={15} />{formatNumber(plan.organizations)} organizations</li>
              <li><SaasIcon name="check" size={15} />{formatNumber(plan.users)} users</li>
            </ul>
            <div className="saas-plan-card__footer">
              <span>{formatNumber(plan.organizations)} organizations</span>
              <Link to="/saas/settings" className="saas-button saas-button--outline">Manage plan</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Subscription table</h2>
            <p>Organization-level subscription state, trial status, and renewal date.</p>
          </div>
        </div>
        <div className="saas-table-wrap">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>MRR</th>
                <th>Status</th>
                <th>Users</th>
                <th>Renewal</th>
                <th>Lifecycle</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.organizationId || subscription.slug}>
                  <td>
                    <span className="saas-table__title">{subscription.organization}</span>
                    <span className="saas-table__muted">{subscription.slug}.civox.io</span>
                  </td>
                  <td><SaasStatusBadge status={subscription.plan} label={subscription.plan} tone="info" /></td>
                  <td>{formatMoney(subscription.mrr * 1000)}</td>
                  <td><SaasStatusBadge status={subscription.status} /></td>
                  <td>{formatNumber(subscription.users)}</td>
                  <td>{formatDate(subscription.renewalDate)}</td>
                  <td>{subscription.lifecycle}</td>
                  <td>
                    <div className="saas-table__actions">
                      <Link to={`/saas/organizations/${subscription.slug}`} className="saas-button saas-button--outline">
                        Open
                      </Link>
                      <button
                        type="button"
                        className="saas-button saas-button--primary"
                        onClick={() => launchStripeCheckout(subscription)}
                        disabled={!!busyId}
                        aria-busy={busyId === String(subscription.organizationId || subscription.slug || "subscription")}
                      >
                        {busyId === String(subscription.organizationId || subscription.slug || "subscription")
                          ? "Opening..."
                          : "Stripe checkout"}
                      </button>
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

export default SaasPlansSubscriptionsPage;
