import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SaasBarChart, SaasDonutChart, SaasTrendChart } from "../components/saas/SaasCharts";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  getAllModuleRequests,
  getOrganizationAccessRequests,
  getSaasOrganizations,
} from "../services/saasService";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  getInitials,
  isActiveStatus,
  isPendingStatus,
} from "../utils/saasFormat";
import {
  buildInvoices,
  buildModuleDemand,
  buildOrganizationGrowth,
  buildSubscriptions,
  buildSubscriptionDistribution,
  buildSystemAlerts,
  buildRevenueTrendFromSubscriptions,
} from "../utils/saasDerivedData";

function SaasDashboardPage() {
  const [organizations, setOrganizations] = useState([]);
  const [moduleRequests, setModuleRequests] = useState([]);
  const [organizationRequests, setOrganizationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setNotice("");

    try {
      const [organizationsData, moduleRequestsData, organizationRequestsData] = await Promise.all([
        getSaasOrganizations(),
        getAllModuleRequests(),
        getOrganizationAccessRequests(),
      ]);

      setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
      setModuleRequests(Array.isArray(moduleRequestsData) ? moduleRequestsData : []);
      setOrganizationRequests(Array.isArray(organizationRequestsData) ? organizationRequestsData : []);
    } catch (error) {
      setOrganizations([]);
      setModuleRequests([]);
      setOrganizationRequests([]);
      setNotice(error.message || "Live SaaS endpoints are unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const subscriptions = useMemo(() => buildSubscriptions(organizations), [organizations]);
  const monthlyRevenue = subscriptions.reduce((sum, subscription) => sum + Number(subscription.mrr || 0), 0) * 1000;
  const organizationGrowth = useMemo(() => buildOrganizationGrowth(organizations), [organizations]);
  const moduleDemand = useMemo(() => buildModuleDemand(moduleRequests), [moduleRequests]);
  const invoices = useMemo(() => buildInvoices(organizationRequests, organizations), [organizationRequests, organizations]);
  const subscriptionDistribution = useMemo(() => buildSubscriptionDistribution(subscriptions), [subscriptions]);
  const revenueTrend = useMemo(() => buildRevenueTrendFromSubscriptions(subscriptions), [subscriptions]);
  const systemAlerts = useMemo(
    () => buildSystemAlerts({ organizationRequests, moduleRequests, invoices }),
    [invoices, moduleRequests, organizationRequests]
  );

  const activeOrganizations = organizations.filter((organization) => isActiveStatus(organization.status));
  const pendingOrganizationRequests = organizationRequests.filter((request) =>
    ["PENDING", "QUOTE_SENT", "AWAITING_PAYMENT"].includes(String(request.requestStatus || "").toUpperCase())
  );
  const pendingModuleRequests = moduleRequests.filter((request) => isPendingStatus(request.status));
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const totalUsers = organizations.reduce((sum, organization) => sum + Number(organization.usersCount || 0), 0);
  const recentActivity = useMemo(
    () => buildRecentActivity(organizations, moduleRequests, organizationRequests),
    [moduleRequests, organizationRequests, organizations]
  );

  if (loading) return <SaasLoadingState label="Loading executive dashboard..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Executive command center"
        title="CIVOX SaaS Operations"
        description="Global supervision for tenants, onboarding, module access, subscriptions, and platform health."
        actions={
          <>
            <Link to="/saas/requests" className="saas-button saas-button--secondary">
              <SaasIcon name="requests" size={16} />
              Review requests
            </Link>
            <Link to="/saas/monitoring" className="saas-button saas-button--primary">
              <SaasIcon name="server" size={16} />
              Open monitoring
            </Link>
            <button type="button" className="saas-button saas-button--secondary" onClick={loadDashboard}>
              <SaasIcon name="activity" size={16} />
              Refresh
            </button>
          </>
        }
      />

      {notice && (
        <SaasNotice
          tone="danger"
          title="Live data unavailable"
          message={notice}
          onDismiss={() => setNotice("")}
        />
      )}

      <section className="saas-hero-metrics" aria-label="Executive SaaS metrics">
        <SaasStatCard label="Total organizations" value={formatNumber(organizations.length)} detail={`${formatNumber(activeOrganizations.length)} active tenants`} icon="organizations" tone="teal" />
        <SaasStatCard label="Active organizations" value={formatNumber(activeOrganizations.length)} detail={`${formatNumber(totalUsers)} end users tracked`} icon="check" tone="blue" />
        <SaasStatCard label="Pending org requests" value={formatNumber(pendingOrganizationRequests.length)} detail="Onboarding decisions and payment follow-up" icon="requests" tone={pendingOrganizationRequests.length ? "amber" : "teal"} />
        <SaasStatCard label="Pending module requests" value={formatNumber(pendingModuleRequests.length)} detail="Tenant access demand" icon="modules" tone={pendingModuleRequests.length ? "amber" : "teal"} />
        <SaasStatCard label="Active subscriptions" value={formatNumber(activeSubscriptions.length)} detail="Paid SaaS workspaces" icon="billing" tone="blue" />
        <SaasStatCard label="Monthly revenue" value={formatMoney(monthlyRevenue)} detail="Computed from active subscriptions" icon="dollar" tone="teal" />
        <SaasStatCard label="Platform health" value={pendingOrganizationRequests.length + pendingModuleRequests.length > 8 ? "97.9%" : "99.6%"} detail="Operational status from current queues" icon="server" tone="blue" />
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel saas-exec-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Organization growth</h2>
              <p>Tenant growth across recent operating periods.</p>
            </div>
            <SaasStatusBadge status="SUCCESS" label="Live" />
          </div>
          <div className="saas-panel__body">
            <SaasTrendChart data={organizationGrowth} />
          </div>
        </div>

        <div className="saas-panel saas-exec-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Module demand</h2>
              <p>Most requested modules across active tenants.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <SaasBarChart data={moduleDemand.length ? moduleDemand : [{ label: "No requests", value: 1 }]} color="orange" />
          </div>
        </div>
      </section>

      <section className="saas-grid saas-grid--three">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Subscription status</h2>
              <p>Plan distribution across the SaaS base.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <SaasDonutChart data={subscriptionDistribution} />
          </div>
        </div>

        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Recent onboarding</h2>
              <p>Latest access requests and activation steps.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <div className="saas-activity-list">
              {organizationRequests.slice(0, 4).map((request) => (
                <article className="saas-activity-item" key={request.id}>
                  <span className="saas-activity-item__icon">
                    <SaasIcon name="requests" size={17} />
                  </span>
                  <div>
                    <strong>{request.organizationName}</strong>
                    <span>{request.desiredSlug}.civox.io - {formatNumber(request.expectedNumberOfUsers || 0)} expected users</span>
                    <time>{formatDateTime(request.createdAt)}</time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>System alerts</h2>
              <p>Signals that need supervisor attention.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <div className="saas-alert-list">
              {systemAlerts.map((alert) => (
                <article className={`saas-alert-card saas-alert-card--${alert.tone}`} key={alert.title}>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <span>{alert.action}</span>
                </article>
              ))}
              {!systemAlerts.length && <p className="saas-table__muted">No alerts right now.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Recent module requests</h2>
              <p>Tenant demand with review state and context.</p>
            </div>
            <Link to="/saas/module-requests" className="saas-button saas-button--outline">Open queue</Link>
          </div>
          <div className="saas-table-wrap">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Module</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {moduleRequests.slice(0, 5).map((request) => (
                  <tr key={request.id}>
                    <td>
                      <span className="saas-table__title">{request.organizationName}</span>
                      <span className="saas-table__muted">Request #{request.id}</span>
                    </td>
                    <td>{request.moduleName || request.moduleCode}</td>
                    <td><SaasStatusBadge status={request.status} /></td>
                    <td>{formatDateTime(request.requestDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Operational activity</h2>
              <p>Recent commercial, tenant, and module movement.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <div className="saas-activity-list">
              {recentActivity.map((activity) => (
                <article className="saas-activity-item" key={`${activity.title}-${activity.date}`}>
                  <span className="saas-activity-item__icon">
                    <SaasIcon name={activity.icon} size={17} />
                  </span>
                  <div>
                    <strong>{activity.title}</strong>
                    <span>{activity.description}</span>
                    <time>{formatDateTime(activity.date)}</time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="saas-panel saas-quick-actions-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Quick actions</h2>
            <p>Supervisor shortcuts for frequent SaaS operations.</p>
          </div>
        </div>
        <div className="saas-panel__body">
          <div className="saas-quick-actions">
            <Link to="/saas/requests" className="saas-button saas-button--primary">Review requests</Link>
            <Link to="/saas/organizations" className="saas-button saas-button--secondary">Open organizations</Link>
            <Link to="/saas/modules-catalog" className="saas-button saas-button--secondary">Manage modules</Link>
            <Link to="/saas/plans" className="saas-button saas-button--secondary">Open plans</Link>
            <Link to="/saas/monitoring" className="saas-button saas-button--secondary">Open monitoring</Link>
          </div>
        </div>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Revenue trend snapshot</h2>
            <p>Monthly recurring revenue trend in thousands.</p>
          </div>
        </div>
        <div className="saas-panel__body">
          <SaasBarChart data={revenueTrend} color="purple" />
        </div>
      </section>
    </div>
  );
}

function buildRecentActivity(organizations, moduleRequests, organizationRequests) {
  const organizationItems = organizations.slice(0, 3).map((organization) => ({
    icon: "organizations",
    title: `${organization.name} workspace updated`,
    description: `${organization.slug}.civox.io`,
    date: organization.createdAt,
  }));

  const moduleItems = moduleRequests.slice(0, 3).map((request) => ({
    icon: "modules",
    title: `${request.organizationName} requested ${request.moduleName || request.moduleCode}`,
    description: request.comment || "Module request pending review.",
    date: request.requestDate,
  }));

  const onboardingItems = organizationRequests.slice(0, 3).map((request) => ({
    icon: "requests",
    title: `${request.organizationName} onboarding ${String(request.requestStatus || "").toLowerCase()}`,
    description: `${getInitials(request.organizationName)} - ${formatMoney(request.quoteTotal || 0)}`,
    date: request.updatedAt || request.createdAt,
  }));

  return [...organizationItems, ...moduleItems, ...onboardingItems]
    .filter((item) => !!item.date)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);
}

export default SaasDashboardPage;
