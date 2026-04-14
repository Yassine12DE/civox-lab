import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { modules as moduleCatalog } from "../data/modules";
import { getAllModuleRequests, getSaasOrganizations } from "../services/saasService";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatStatus,
  getInitials,
  isActiveStatus,
  isPendingStatus,
} from "../utils/saasFormat";

function buildRecentActivity(organizations, requests) {
  const organizationItems = organizations.map((organization) => ({
    id: `organization-${organization.id}`,
    icon: "organizations",
    title: `${organization.name} joined Civox`,
    description: organization.email || organization.slug || "Organization profile created.",
    date: organization.createdAt,
  }));

  const requestItems = requests.map((request) => ({
    id: `request-${request.id}`,
    icon: "requests",
    title: `${request.organizationName || "Organization"} requested ${request.moduleName || "a module"}`,
    description: `${formatStatus(request.status)} module request`,
    date: request.reviewedDate || request.requestDate,
  }));

  return [...organizationItems, ...requestItems]
    .filter((item) => item.date)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);
}

function SaasDashboardPage() {
  const [organizations, setOrganizations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [organizationsData, requestsData] = await Promise.all([
          getSaasOrganizations(),
          getAllModuleRequests(),
        ]);
        setOrganizations(organizationsData);
        setRequests(requestsData);
      } catch {
        setError("The SaaS dashboard could not be loaded. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeOrganizations = organizations.filter((organization) =>
    isActiveStatus(organization.status)
  );
  const pendingRequests = requests.filter((request) => isPendingStatus(request.status));
  const totalUsers = organizations.reduce(
    (total, organization) => total + Number(organization.usersCount || 0),
    0
  );
  const recentActivity = useMemo(
    () => buildRecentActivity(organizations, requests),
    [organizations, requests]
  );

  if (loading) return <SaasLoadingState label="Loading SaaS dashboard..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Command center"
        title="Operate every Civox tenant from one place"
        description="Monitor organization health, module demand, and platform activity with a clear super-admin overview."
        actions={
          <>
            <Link to="/saas/organizations" className="saas-button saas-button--secondary">
              <SaasIcon name="organizations" size={16} />
              View organizations
            </Link>
            <Link to="/saas/module-requests" className="saas-button saas-button--primary">
              <SaasIcon name="requests" size={16} />
              Review requests
            </Link>
          </>
        }
      />

      {error && (
        <SaasNotice
          tone="danger"
          title="Dashboard unavailable"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      <section className="saas-grid saas-grid--stats" aria-label="SaaS key metrics">
        <SaasStatCard
          label="Total organizations"
          value={formatNumber(organizations.length)}
          detail={`${formatNumber(activeOrganizations.length)} active now`}
          icon="organizations"
          tone="teal"
        />
        <SaasStatCard
          label="Active organizations"
          value={formatNumber(activeOrganizations.length)}
          detail="Live tenant workspaces"
          icon="check"
          tone="blue"
        />
        <SaasStatCard
          label="Pending requests"
          value={formatNumber(pendingRequests.length)}
          detail="Waiting for SaaS review"
          icon="requests"
          tone={pendingRequests.length ? "amber" : "teal"}
        />
        <SaasStatCard
          label="Global users"
          value={formatNumber(totalUsers)}
          detail={`${formatNumber(moduleCatalog.length)} modules in catalog`}
          icon="users"
          tone="blue"
        />
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Operational queue</h2>
              <p>Module requests that need a platform owner decision.</p>
            </div>
            <Link to="/saas/module-requests" className="saas-button saas-button--ghost">
              Open queue
            </Link>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="saas-table-wrap">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Module</th>
                    <th>Requested</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.slice(0, 5).map((request) => (
                    <tr key={request.id}>
                      <td>
                        <span className="saas-table__title">{request.organizationName}</span>
                        <span className="saas-table__muted">Request #{request.id}</span>
                      </td>
                      <td>{request.moduleName || request.moduleCode}</td>
                      <td>{formatDateTime(request.requestDate)}</td>
                      <td>
                        <SaasStatusBadge status={request.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <SaasEmptyState
              icon="check"
              title="No pending module requests"
              message="Every module request has been reviewed. New requests will appear here."
            />
          )}
        </div>

        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Recent activity</h2>
              <p>Latest organization and module request movement.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            {recentActivity.length > 0 ? (
              <div className="saas-activity-list">
                {recentActivity.map((activity) => (
                  <article className="saas-activity-item" key={activity.id}>
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
            ) : (
              <SaasEmptyState
                icon="activity"
                title="Activity will appear here"
                message="Organization creation and module request events will build the audit trail."
              />
            )}
          </div>
        </div>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Organization health</h2>
            <p>Core tenant indicators for quick triage.</p>
          </div>
          <Link to="/saas/organizations" className="saas-button saas-button--secondary">
            Manage all
          </Link>
        </div>

        {organizations.length > 0 ? (
          <div className="saas-table-wrap">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Processes</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {organizations.slice(0, 6).map((organization) => (
                  <tr key={organization.id}>
                    <td>
                      <div className="saas-identity">
                        <span className="saas-identity__avatar">
                          {getInitials(organization.name)}
                        </span>
                        <div className="saas-identity__content">
                          <strong>{organization.name}</strong>
                          <span>{organization.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <SaasStatusBadge status={organization.status} />
                    </td>
                    <td>{formatNumber(organization.usersCount)}</td>
                    <td>{formatNumber(organization.processesCount)}</td>
                    <td>{formatDate(organization.createdAt)}</td>
                    <td>
                      <div className="saas-table__actions">
                        <Link
                          to={`/saas/organizations/${organization.slug}`}
                          className="saas-button saas-button--ghost"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <SaasEmptyState
            icon="organizations"
            title="No organizations yet"
            message="When organizations join Civox, their health and access data will appear here."
          />
        )}
      </section>
    </div>
  );
}

export default SaasDashboardPage;
