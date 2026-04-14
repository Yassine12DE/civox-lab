import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getSaasOrganizations } from "../services/saasService";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  formatDate,
  formatNumber,
  getInitials,
  includesSearchValue,
  isActiveStatus,
} from "../utils/saasFormat";

function getStatusOptions(organizations) {
  return Array.from(
    new Set(organizations.map((organization) => organization.status).filter(Boolean))
  );
}

function SaasOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getSaasOrganizations();
        setOrganizations(data);
      } catch {
        setError("Organizations could not be loaded. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const statusOptions = useMemo(() => getStatusOptions(organizations), [organizations]);
  const filteredOrganizations = useMemo(
    () =>
      organizations.filter((organization) => {
        const statusMatches =
          statusFilter === "ALL" || String(organization.status) === statusFilter;
        const searchMatches = includesSearchValue(organization, searchTerm, [
          "name",
          "slug",
          "email",
          "description",
        ]);

        return statusMatches && searchMatches;
      }),
    [organizations, searchTerm, statusFilter]
  );

  const activeOrganizations = organizations.filter((organization) =>
    isActiveStatus(organization.status)
  );
  const totalUsers = organizations.reduce(
    (total, organization) => total + Number(organization.usersCount || 0),
    0
  );
  const totalProcesses = organizations.reduce(
    (total, organization) => total + Number(organization.processesCount || 0),
    0
  );

  if (loading) return <SaasLoadingState label="Loading organizations..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Tenant management"
        title="Organizations"
        description="Search, filter, and manage every tenant workspace, access profile, and module allocation."
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: "Organizations" },
        ]}
      />

      {error && (
        <SaasNotice
          tone="danger"
          title="Unable to load organizations"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      <section className="saas-grid saas-grid--stats" aria-label="Organization metrics">
        <SaasStatCard
          label="Organizations"
          value={formatNumber(organizations.length)}
          detail="All tenant workspaces"
          icon="organizations"
          tone="teal"
        />
        <SaasStatCard
          label="Active"
          value={formatNumber(activeOrganizations.length)}
          detail="Available to users"
          icon="check"
          tone="blue"
        />
        <SaasStatCard
          label="Users"
          value={formatNumber(totalUsers)}
          detail="Across all organizations"
          icon="users"
          tone="blue"
        />
        <SaasStatCard
          label="Processes"
          value={formatNumber(totalProcesses)}
          detail="Tracked tenant processes"
          icon="activity"
          tone="amber"
        />
      </section>

      <section className="saas-toolbar" aria-label="Organization filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search organizations">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search by name, slug, email..."
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
            <option value="ALL">All statuses</option>
            {statusOptions.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <span className="saas-table__muted">
          {formatNumber(filteredOrganizations.length)} result
          {filteredOrganizations.length === 1 ? "" : "s"}
        </span>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Organization directory</h2>
            <p>Quick actions stay close to the tenant they affect.</p>
          </div>
        </div>

        {filteredOrganizations.length > 0 ? (
          <div className="saas-table-wrap">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Contact</th>
                  <th>Users</th>
                  <th>Processes</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.map((organization) => (
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
                    <td>
                      <span className="saas-table__title">
                        {organization.email || "No email"}
                      </span>
                      <span className="saas-table__muted">
                        {organization.phone || "No phone"}
                      </span>
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
                        <Link
                          to={`/saas/organizations/${organization.slug}/modules`}
                          className="saas-button saas-button--secondary"
                        >
                          Modules
                        </Link>
                        {organization.slug && (
                          <a
                            href={`http://${organization.slug}.lvh.me:5173`}
                            className="saas-button saas-button--ghost"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <SaasIcon name="external" size={15} />
                          </a>
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
            title={organizations.length ? "No organizations match these filters" : "No organizations yet"}
            message={
              organizations.length
                ? "Adjust the search term or status filter to widen the results."
                : "Tenant workspaces will appear here once they are registered."
            }
          />
        )}
      </section>
    </div>
  );
}

export default SaasOrganizationsPage;
