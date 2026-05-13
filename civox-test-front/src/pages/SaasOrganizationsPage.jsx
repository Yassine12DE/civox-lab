import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  createSaasOrganization,
  getSaasOrganizationModules,
  getSaasOrganizations,
  toggleSaasOrganizationStatus,
  updateSaasOrganization,
} from "../services/saasService";
import {
  formatDate,
  formatNumber,
  getInitials,
  includesSearchValue,
  isActiveStatus,
} from "../utils/saasFormat";

const emptyForm = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  status: "ACTIVE",
};

function SaasOrganizationsPage() {
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [createdFilter, setCreatedFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);

  const loadOrganizations = async () => {
    setLoading(true);

    try {
      const data = await getSaasOrganizations();
      const withModules = await Promise.all(
        data.map(async (organization) => {
          try {
            const modules = await getSaasOrganizationModules(organization.id);
            return {
              ...organization,
              enabledModules: (modules || [])
                .filter((module) => module.grantedBySaas)
                .map((module) => module.moduleName),
              health: buildHealth(organization, modules || []),
            };
          } catch {
            return {
              ...organization,
              enabledModules: [],
              health: buildHealth(organization, []),
            };
          }
        })
      );

      setOrganizations(withModules);
    } catch (error) {
      setOrganizations([]);
      setNotice({ tone: "danger", title: "Unable to load organizations", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const moduleOptions = useMemo(
    () => Array.from(new Set(organizations.flatMap((organization) => organization.enabledModules || []))),
    [organizations]
  );

  const filteredOrganizations = useMemo(
    () =>
      organizations.filter((organization) => {
        const statusMatches =
          statusFilter === "ALL" || String(organization.status || "").toUpperCase() === statusFilter;
        const moduleMatches =
          moduleFilter === "ALL" || (organization.enabledModules || []).includes(moduleFilter);
        const dateMatches = createdFilter === "ALL" || matchesCreatedFilter(organization.createdAt, createdFilter);
        const searchMatches = includesSearchValue(organization, searchTerm, [
          "name",
          "slug",
          "email",
          "description",
        ]);

        return statusMatches && moduleMatches && dateMatches && searchMatches;
      }),
    [createdFilter, moduleFilter, organizations, searchTerm, statusFilter]
  );

  const activeOrganizations = organizations.filter((organization) => isActiveStatus(organization.status));
  const inactiveOrganizations = organizations.filter(
    (organization) => String(organization.status || "").toUpperCase() === "INACTIVE"
  );
  const totalUsers = organizations.reduce((total, organization) => total + Number(organization.usersCount || 0), 0);
  const avgHealth = Math.round(
    organizations.reduce((sum, organization) => sum + Number(organization.health || 0), 0) /
      Math.max(organizations.length, 1)
  );

  const openCreateModal = () => {
    setForm(emptyForm);
    setModal("create");
  };

  const openEditModal = (organization) => {
    setForm({
      id: organization.id,
      name: organization.name || "",
      slug: organization.slug || "",
      email: organization.email || "",
      phone: organization.phone || "",
      address: organization.address || "",
      description: organization.description || "",
      status: String(organization.status || "ACTIVE").toUpperCase(),
    });
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const payload = {
      name: form.name,
      slug: form.slug,
      email: form.email,
      phone: form.phone,
      address: form.address,
      description: form.description,
      status: form.status,
      usersCount: 0,
      processesCount: 0,
    };

    try {
      if (modal === "create") {
        await createSaasOrganization(payload);
        setNotice({ tone: "success", title: "Organization created", message: `${form.name} is now available.` });
      } else {
        await updateSaasOrganization(form.id, payload);
        setNotice({ tone: "success", title: "Organization updated", message: `${form.name} was updated.` });
      }

      closeModal();
      await loadOrganizations();
    } catch (error) {
      setNotice({ tone: "danger", title: "Save failed", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    setSaving(true);
    setNotice(null);

    try {
      await toggleSaasOrganizationStatus(toggleTarget.id);
      setNotice({
        tone: "success",
        title: "Status updated",
        message: `${toggleTarget.name} status was toggled successfully.`,
      });
      setToggleTarget(null);
      await loadOrganizations();
    } catch (error) {
      setNotice({ tone: "danger", title: "Status update failed", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SaasLoadingState label="Loading organizations..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Tenant management"
        title="Organizations"
        description="Tenant directory with status, module footprint, health, creation date, and operational actions."
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: "Organizations" },
        ]}
        actions={
          <button type="button" className="saas-button saas-button--primary" onClick={openCreateModal}>
            <SaasIcon name="plus" size={16} />
            Create organization
          </button>
        }
      />

      {notice && (
        <SaasNotice
          tone={notice.tone}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <section className="saas-grid saas-grid--stats" aria-label="Organization metrics">
        <SaasStatCard label="Organizations" value={formatNumber(organizations.length)} detail="All tenant workspaces" icon="organizations" tone="teal" />
        <SaasStatCard label="Active" value={formatNumber(activeOrganizations.length)} detail="Available to tenant users" icon="check" tone="blue" />
        <SaasStatCard label="Inactive" value={formatNumber(inactiveOrganizations.length)} detail="Restricted tenant access" icon="power" tone={inactiveOrganizations.length ? "red" : "teal"} />
        <SaasStatCard label="Avg health" value={`${avgHealth}%`} detail={`${formatNumber(totalUsers)} users across tenants`} icon="activity" tone="blue" />
      </section>

      <section className="saas-toolbar saas-toolbar--dense" aria-label="Organization filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search organizations">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search name, slug, email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select className="saas-select-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>

          <select className="saas-select-field" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} aria-label="Filter by module">
            <option value="ALL">All modules</option>
            {moduleOptions.map((module) => <option value={module} key={module}>{module}</option>)}
          </select>

          <select className="saas-select-field" value={createdFilter} onChange={(event) => setCreatedFilter(event.target.value)} aria-label="Filter by creation date">
            <option value="ALL">Any creation date</option>
            <option value="2026">Created in 2026</option>
            <option value="2025">Created in 2025</option>
            <option value="OLDER">Before 2025</option>
          </select>
        </div>

        <span className="saas-table__muted">
          {formatNumber(filteredOrganizations.length)} result{filteredOrganizations.length === 1 ? "" : "s"}
        </span>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Organization directory</h2>
            <p>Each row connects tenant status, module footprint, and health.</p>
          </div>
        </div>

        <div className="saas-table-wrap">
          <table className="saas-table saas-table--organizations">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Users</th>
                <th>Enabled modules</th>
                <th>Created</th>
                <th>Health</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map((organization) => (
                <tr key={organization.id || organization.slug}>
                  <td>
                    <div className="saas-identity">
                      <span className="saas-identity__avatar">{getInitials(organization.name)}</span>
                      <div className="saas-identity__content">
                        <strong>{organization.name}</strong>
                        <span>{organization.slug}.civox.io</span>
                      </div>
                    </div>
                  </td>
                  <td><SaasStatusBadge status={organization.status} /></td>
                  <td>{formatNumber(organization.usersCount)}</td>
                  <td>
                    <div className="saas-chip-row">
                      {(organization.enabledModules || []).slice(0, 3).map((module) => <span key={module}>{module}</span>)}
                      {(organization.enabledModules || []).length > 3 && <span>+{organization.enabledModules.length - 3}</span>}
                      {!organization.enabledModules?.length && <span>None</span>}
                    </div>
                  </td>
                  <td>{formatDate(organization.createdAt)}</td>
                  <td><HealthMeter value={organization.health} /></td>
                  <td>
                    <div className="saas-table__actions">
                      <Link to={`/saas/organizations/${organization.slug}`} className="saas-button saas-button--outline">View details</Link>
                      <button type="button" className="saas-button saas-button--secondary" onClick={() => openEditModal(organization)}>Edit</button>
                      <button
                        type="button"
                        className={`saas-button ${isActiveStatus(organization.status) ? "saas-button--danger" : "saas-button--success"}`}
                        onClick={() => setToggleTarget(organization)}
                      >
                        {isActiveStatus(organization.status) ? "Deactivate" : "Activate"}
                      </button>
                      <Link to={`/saas/organizations/${organization.slug}/modules`} className="saas-button saas-button--secondary">Modules</Link>
                      {organization.slug && (
                        <a href={`http://${organization.slug}.lvh.me:5173`} className="saas-icon-button" target="_blank" rel="noreferrer" aria-label={`Open ${organization.name} tenant space`}>
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
      </section>

      {modal && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal" role="dialog" aria-modal="true">
            <div className="saas-modal__header">
              <div>
                <h2>{modal === "create" ? "Create organization" : "Edit organization"}</h2>
                <p>Save organization identity and contact details.</p>
              </div>
              <button type="button" className="saas-icon-button" onClick={closeModal}>
                <SaasIcon name="close" size={16} />
              </button>
            </div>
            <form className="saas-modal__body" onSubmit={handleSubmit}>
              <div className="saas-form__grid">
                <label className="saas-form__field"><span>Name</span><input className="saas-input-field" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required /></label>
                <label className="saas-form__field"><span>Slug</span><input className="saas-input-field" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") }))} required /></label>
                <label className="saas-form__field"><span>Email</span><input className="saas-input-field" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /></label>
                <label className="saas-form__field"><span>Phone</span><input className="saas-input-field" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                <label className="saas-form__field"><span>Status</span><select className="saas-select-field" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></select></label>
                <label className="saas-form__field saas-form__field--full"><span>Address</span><input className="saas-input-field" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} /></label>
                <label className="saas-form__field saas-form__field--full"><span>Description</span><textarea className="saas-textarea-field" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
              </div>
              <div className="saas-form__actions">
                <button type="button" className="saas-button saas-button--ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="saas-button saas-button--primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <SaasConfirmDialog
        open={!!toggleTarget}
        title={isActiveStatus(toggleTarget?.status) ? "Deactivate organization?" : "Activate organization?"}
        message={
          toggleTarget
            ? isActiveStatus(toggleTarget.status)
              ? `${toggleTarget.name} will be set to inactive.`
              : `${toggleTarget.name} will be set to active.`
            : ""
        }
        confirmLabel={isActiveStatus(toggleTarget?.status) ? "Deactivate" : "Activate"}
        tone={isActiveStatus(toggleTarget?.status) ? "danger" : "success"}
        busy={saving}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}

function HealthMeter({ value = 0 }) {
  if (!value) return <span className="saas-table__muted">Setup</span>;

  return (
    <div className="saas-health-meter">
      <span className="saas-health-meter__track">
        <span
          className={value >= 95 ? "saas-health-meter__fill" : value >= 75 ? "saas-health-meter__fill saas-health-meter__fill--warning" : "saas-health-meter__fill saas-health-meter__fill--danger"}
          style={{ width: `${value}%` }}
        />
      </span>
      <strong>{value}%</strong>
    </div>
  );
}

function matchesCreatedFilter(createdAt, filter) {
  const year = new Date(createdAt).getFullYear();
  if (Number.isNaN(year)) return false;
  if (filter === "OLDER") return year < 2025;
  return String(year) === filter;
}

function buildHealth(organization, modules) {
  const moduleCount = (modules || []).filter((module) => module.grantedBySaas).length;
  const statusScore = String(organization.status || "").toUpperCase() === "ACTIVE" ? 35 : 10;
  const userScore = Math.min(40, Number(organization.usersCount || 0) / 10);
  const moduleScore = Math.min(25, moduleCount * 5);
  return Math.min(100, Math.round(statusScore + userScore + moduleScore));
}

export default SaasOrganizationsPage;

