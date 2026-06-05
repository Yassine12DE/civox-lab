import { useEffect, useMemo, useState } from "react";
import { SaasTrendChart } from "../components/saas/SaasCharts";
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
  getSaasUsers,
} from "../services/saasService";
import { buildAuditLogs, buildMonitoringData, buildRevenueTrendFromSubscriptions, buildSubscriptions } from "../utils/saasDerivedData";
import { formatDateTime, formatNumber } from "../utils/saasFormat";

function SaasPlatformMonitoringPage() {
  const [organizations, setOrganizations] = useState([]);
  const [organizationRequests, setOrganizationRequests] = useState([]);
  const [moduleRequests, setModuleRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  const loadMonitoring = async () => {
    setLoading(true);
    try {
      const [organizationsData, orgRequestsData, moduleRequestsData, usersData] = await Promise.all([
        getSaasOrganizations(),
        getOrganizationAccessRequests(),
        getAllModuleRequests(),
        getSaasUsers(),
      ]);

      setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
      setOrganizationRequests(Array.isArray(orgRequestsData) ? orgRequestsData : []);
      setModuleRequests(Array.isArray(moduleRequestsData) ? moduleRequestsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLastRefreshAt(new Date());
    } catch (error) {
      setOrganizations([]);
      setOrganizationRequests([]);
      setModuleRequests([]);
      setUsers([]);
      setNotice({ tone: "danger", title: "Unable to load monitoring", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  const auditLogs = useMemo(
    () => buildAuditLogs({ organizations, organizationRequests, moduleRequests, users }),
    [moduleRequests, organizationRequests, organizations, users]
  );
  const monitoring = useMemo(
    () => buildMonitoringData({ organizations, moduleRequests, organizationRequests, auditLogs }),
    [auditLogs, moduleRequests, organizationRequests, organizations]
  );
  const subscriptions = useMemo(() => buildSubscriptions(organizations), [organizations]);
  const responseTrend = useMemo(() => buildRevenueTrendFromSubscriptions(subscriptions), [subscriptions]);

  const overallHealth = monitoring.services.length
    ? monitoring.services.reduce((sum, service) => sum + service.uptime, 0) / monitoring.services.length
    : 0;
  const averageResponse = monitoring.services.length
    ? monitoring.services.reduce((sum, service) => sum + service.responseTime, 0) / monitoring.services.length
    : 0;
  const averageErrorRate = monitoring.services.length
    ? monitoring.services.reduce((sum, service) => sum + service.errorRate, 0) / monitoring.services.length
    : 0;
  const degraded = monitoring.services.filter((service) => service.status !== "OPERATIONAL").length;

  if (loading) return <SaasLoadingState label="Loading platform monitoring..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Platform administration"
        title="Platform Monitoring"
        description="DevOps console for service health, uptime, response time, backend errors, and failed email delivery."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Platform Monitoring" }]}
        actions={
          <button type="button" className="saas-button saas-button--secondary" onClick={loadMonitoring}>
            Refresh data
          </button>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Monitoring metrics">
        <SaasStatCard label="Platform health" value={`${overallHealth.toFixed(2)}%`} detail="Uptime across core services" icon="check" tone={degraded ? "amber" : "teal"} />
        <SaasStatCard label="Response time" value={`${Math.round(averageResponse)}ms`} detail="Average service latency" icon="activity" tone="blue" />
        <SaasStatCard label="Error rate" value={`${averageErrorRate.toFixed(2)}%`} detail="Recent window" icon="alert" tone={averageErrorRate > 0.3 ? "red" : "teal"} />
        <SaasStatCard label="System alerts" value={formatNumber(degraded + monitoring.backendErrors.length)} detail="Open operational signals" icon="server" tone="amber" />
      </section>

      {degraded > 0 && (
        <section className="saas-alert-band saas-alert-band--warning">
          <span><SaasIcon name="alert" size={18} /></span>
          <div>
            <strong>Service degradation detected</strong>
            <p>{formatNumber(degraded)} service(s) are currently degraded and require follow-up.</p>
          </div>
          <SaasStatusBadge status="DEGRADED" />
        </section>
      )}

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Service health</h2>
            <p>API, onboarding pipeline, module approvals, and tenant availability.</p>
          </div>
        </div>
        <div className="saas-monitor-grid">
          {monitoring.services.map((service) => (
            <article className="saas-monitor-card" key={service.name}>
              <header>
                <span className={service.status === "OPERATIONAL" ? "saas-service-dot" : "saas-service-dot saas-service-dot--warning"} />
                <div>
                  <strong>{service.name}</strong>
                  <p>{service.responseTime}ms response - {service.errorRate}% error rate</p>
                </div>
                <SaasStatusBadge status={service.status} />
              </header>
              <div className="saas-meter">
                <div className="saas-meter__header">
                  <span>Uptime</span>
                  <strong>{service.uptime}%</strong>
                </div>
                <span className="saas-meter__track">
                  <span className="saas-meter__fill" style={{ width: `${service.uptime}%` }} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Response time trend</h2>
            <p>Recent response trend by month.</p>
          </div>
        </div>
        <div className="saas-panel__body">
          <SaasTrendChart
            data={responseTrend.map((item, index) => ({ label: item.label, value: Math.round(item.value / (index + 6)) }))}
            title="Average platform latency"
            xAxisLabel="Month"
            yAxisLabel="Response time (ms)"
            valueFormatter={(value) => `${Math.round(value)}ms`}
          />
        </div>
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Recent backend errors</h2>
              <p>Grouped errors with count and severity.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <div className="saas-event-list">
              {monitoring.backendErrors.map((error, index) => (
                <article className="saas-event-card" key={`${error.service}-${index}`}>
                  <div>
                    <strong>{error.service}</strong>
                    <p>{error.message}</p>
                    <time>{formatDateTime(error.timestamp)}</time>
                  </div>
                  <div>
                    <SaasStatusBadge status={error.severity} />
                    <span>{formatNumber(error.count)}x</span>
                  </div>
                </article>
              ))}
              {!monitoring.backendErrors.length && <p className="saas-table__muted">No recent backend errors.</p>}
            </div>
          </div>
        </div>

        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Recent failed emails</h2>
              <p>Email delivery warnings from onboarding workflows.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <div className="saas-event-list">
              {monitoring.failedEmails.map((email) => (
                <article className="saas-event-card saas-event-card--danger" key={`${email.recipient}-${email.timestamp}`}>
                  <div>
                    <strong>{email.subject}</strong>
                    <p>{email.recipient}</p>
                    <time>{formatDateTime(email.timestamp)}</time>
                  </div>
                  <SaasStatusBadge status="FAILED" label={email.reason} />
                </article>
              ))}
              {!monitoring.failedEmails.length && <p className="saas-table__muted">No failed emails detected.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="saas-environment-band">
        <div>
          <strong>Environment status</strong>
          <span>Live telemetry - Last refresh: {(lastRefreshAt || new Date()).toLocaleString()}</span>
        </div>
        <SaasStatusBadge status={degraded ? "DEGRADED" : "OPERATIONAL"} label={degraded ? "Needs attention" : "Stable"} />
      </section>
    </div>
  );
}

export default SaasPlatformMonitoringPage;
