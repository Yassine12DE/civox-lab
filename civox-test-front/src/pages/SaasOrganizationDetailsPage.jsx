import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getSaasOrganizationBySlug,
  getSaasOrganizationModules,
  toggleSaasOrganizationStatus,
  updateSaasOrganization,
} from "../services/saasService";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
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
  isActiveStatus,
} from "../utils/saasFormat";

function createOrganizationForm(organization) {
  return {
    name: organization?.name || "",
    email: organization?.email || "",
    phone: organization?.phone || "",
    address: organization?.address || "",
    description: organization?.description || "",
  };
}

function SaasOrganizationDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [grantedModules, setGrantedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(createOrganizationForm());
  const [saving, setSaving] = useState(false);
  const [statusConfirmationOpen, setStatusConfirmationOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const loadOrganization = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const org = await getSaasOrganizationBySlug(slug);
      setOrganization(org || null);

      if (org?.id) {
        const modulesData = await getSaasOrganizationModules(org.id);
        setGrantedModules(modulesData);
      } else {
        setGrantedModules([]);
      }
    } catch {
      setError("Organization details could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  const openEditModal = () => {
    setForm(createOrganizationForm(organization));
    setEditing(true);
  };

  const updateFormValue = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!organization?.id) return;

    if (!form.name.trim()) {
      setNotice({
        tone: "danger",
        title: "Name is required",
        message: "The organization name cannot be empty.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const updatedOrganization = await updateSaasOrganization(organization.id, {
        ...organization,
        ...form,
      });
      const nextOrganization = {
        ...organization,
        ...updatedOrganization,
        ...form,
      };

      setOrganization(nextOrganization);
      setEditing(false);
      setNotice({
        tone: "success",
        title: "Organization updated",
        message: `${nextOrganization.name} has been updated successfully.`,
      });

      if (updatedOrganization.slug && updatedOrganization.slug !== slug) {
        navigate(`/saas/organizations/${updatedOrganization.slug}`, { replace: true });
      }
    } catch {
      setNotice({
        tone: "danger",
        title: "Update failed",
        message: "The organization profile could not be updated. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!organization?.id) return;

    setStatusSaving(true);
    setNotice(null);

    try {
      const updatedOrganization = await toggleSaasOrganizationStatus(organization.id);
      setOrganization((current) => ({ ...current, ...updatedOrganization }));
      setNotice({
        tone: "success",
        title: "Status updated",
        message: `${organization.name} is now ${updatedOrganization.status}.`,
      });
      setStatusConfirmationOpen(false);
    } catch {
      setNotice({
        tone: "danger",
        title: "Status update failed",
        message: "The organization status could not be changed. Please try again.",
      });
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) return <SaasLoadingState label="Loading organization profile..." />;

  if (!organization) {
    return (
      <div className="saas-page-stack">
        <SaasPageHeader
          eyebrow="Tenant management"
          title="Organization not found"
          breadcrumbs={[
            { label: "Dashboard", to: "/saas" },
            { label: "Organizations", to: "/saas/organizations" },
            { label: "Not found" },
          ]}
        />
        <SaasEmptyState
          icon="organizations"
          title="This organization could not be found"
          message={error || "Check the organization slug or return to the organization directory."}
          action={
            <Link to="/saas/organizations" className="saas-button saas-button--primary">
              Back to organizations
            </Link>
          }
        />
      </div>
    );
  }

  const organizationActive = isActiveStatus(organization.status);

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Organization profile"
        title={organization.name}
        description={organization.description || "Manage tenant profile, contact data, status, and module access."}
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: "Organizations", to: "/saas/organizations" },
          { label: organization.name },
        ]}
        actions={
          <>
            <button type="button" className="saas-button saas-button--secondary" onClick={openEditModal}>
              <SaasIcon name="edit" size={16} />
              Edit profile
            </button>
            <button
              type="button"
              className={`saas-button ${organizationActive ? "saas-button--danger" : "saas-button--primary"}`}
              onClick={() => setStatusConfirmationOpen(true)}
            >
              {organizationActive ? "Deactivate" : "Activate"}
            </button>
            <Link
              to={`/saas/organizations/${organization.slug}/modules`}
              className="saas-button saas-button--primary"
            >
              <SaasIcon name="modules" size={16} />
              Manage modules
            </Link>
          </>
        }
      />

      {error && (
        <SaasNotice
          tone="danger"
          title="Profile warning"
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

      <section className="saas-grid saas-grid--stats" aria-label="Organization metrics">
        <SaasStatCard
          label="Status"
          value={organization.status || "Unknown"}
          detail={organizationActive ? "Tenant workspace is active" : "Tenant workspace is restricted"}
          icon={organizationActive ? "check" : "alert"}
          tone={organizationActive ? "teal" : "red"}
        />
        <SaasStatCard
          label="Users"
          value={formatNumber(organization.usersCount)}
          detail="Registered in this tenant"
          icon="users"
          tone="blue"
        />
        <SaasStatCard
          label="Processes"
          value={formatNumber(organization.processesCount)}
          detail="Tracked tenant processes"
          icon="activity"
          tone="amber"
        />
        <SaasStatCard
          label="Granted modules"
          value={formatNumber(grantedModules.length)}
          detail="Available from SaaS"
          icon="modules"
          tone="teal"
        />
      </section>

      <section className="saas-grid saas-grid--two">
        <div className="saas-panel">
          <div className="saas-panel__header">
            <div className="saas-identity">
              <span className="saas-identity__avatar">{getInitials(organization.name)}</span>
              <div className="saas-identity__content">
                <strong>{organization.name}</strong>
                <span>{organization.slug}</span>
              </div>
            </div>
            <SaasStatusBadge status={organization.status} />
          </div>
          <div className="saas-panel__body">
            <div className="saas-detail-list">
              <div className="saas-detail-list__item">
                <span>Description</span>
                <p>{organization.description || "No description has been added yet."}</p>
              </div>
              <div className="saas-detail-list__item">
                <span>Created</span>
                <strong>{formatDate(organization.createdAt)}</strong>
              </div>
              <div className="saas-detail-list__item">
                <span>Public workspace</span>
                {organization.slug ? (
                  <a
                    href={`http://${organization.slug}.lvh.me:5173`}
                    className="saas-button saas-button--secondary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open tenant site
                    <SaasIcon name="external" size={15} />
                  </a>
                ) : (
                  <strong>No public slug</strong>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="saas-panel">
          <div className="saas-panel__header">
            <div>
              <h2>Contact</h2>
              <p>Operational contact details for platform support.</p>
            </div>
          </div>
          <div className="saas-panel__body">
            <div className="saas-detail-list">
              <div className="saas-detail-list__item">
                <span>Email</span>
                <strong>{organization.email || "No email provided"}</strong>
              </div>
              <div className="saas-detail-list__item">
                <span>Phone</span>
                <strong>{organization.phone || "No phone provided"}</strong>
              </div>
              <div className="saas-detail-list__item">
                <span>Address</span>
                <p>{organization.address || "No address provided"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="saas-panel">
        <div className="saas-panel__header">
          <div>
            <h2>Granted modules</h2>
            <p>Modules granted by SaaS and optionally enabled by the organization.</p>
          </div>
          <Link
            to={`/saas/organizations/${organization.slug}/modules`}
            className="saas-button saas-button--secondary"
          >
            Manage access
          </Link>
        </div>

        {grantedModules.length > 0 ? (
          <div className="saas-table-wrap">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>SaaS access</th>
                  <th>Tenant visibility</th>
                  <th>Display order</th>
                </tr>
              </thead>
              <tbody>
                {grantedModules.map((module) => (
                  <tr key={module.id || module.moduleCode}>
                    <td>
                      <span className="saas-table__title">{module.moduleName}</span>
                      <span className="saas-table__muted">{module.moduleCode}</span>
                    </td>
                    <td>
                      <SaasStatusBadge
                        status={module.grantedBySaas ? "GRANTED" : "NOT_GRANTED"}
                        label={module.grantedBySaas ? "Granted" : "Not granted"}
                      />
                    </td>
                    <td>
                      <SaasStatusBadge
                        status={module.enabledByOrganization ? "ENABLED" : "DISABLED"}
                        label={module.enabledByOrganization ? "Enabled" : "Disabled"}
                        tone={module.enabledByOrganization ? "success" : "neutral"}
                      />
                    </td>
                    <td>{module.displayOrder ?? "Not set"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <SaasEmptyState
            icon="modules"
            title="No modules granted yet"
            message="Grant modules to make them available for this organization."
            action={
              <Link
                to={`/saas/organizations/${organization.slug}/modules`}
                className="saas-button saas-button--primary"
              >
                Grant modules
              </Link>
            }
          />
        )}
      </section>

      {editing && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal" role="dialog" aria-modal="true" aria-labelledby="edit-org-title">
            <header className="saas-modal__header">
              <div>
                <h2 id="edit-org-title">Edit organization profile</h2>
                <p>Update the operational information visible to SaaS administrators.</p>
              </div>
              <button
                type="button"
                className="saas-icon-button"
                onClick={() => setEditing(false)}
                aria-label="Close edit form"
              >
                <SaasIcon name="close" size={16} />
              </button>
            </header>

            <div className="saas-modal__body">
              <form className="saas-form" onSubmit={handleSubmit}>
                <div className="saas-form__grid">
                  <div className="saas-form__field">
                    <label htmlFor="organization-name">Organization name</label>
                    <input
                      id="organization-name"
                      className="saas-input-field"
                      value={form.name}
                      onChange={(event) => updateFormValue("name", event.target.value)}
                      required
                    />
                  </div>

                  <div className="saas-form__field">
                    <label htmlFor="organization-slug">Slug</label>
                    <input
                      id="organization-slug"
                      className="saas-input-field"
                      value={organization.slug || ""}
                      disabled
                    />
                    <span className="saas-form__hint">Slug changes should be handled carefully because they affect tenant URLs.</span>
                  </div>

                  <div className="saas-form__field">
                    <label htmlFor="organization-email">Email</label>
                    <input
                      id="organization-email"
                      type="email"
                      className="saas-input-field"
                      value={form.email}
                      onChange={(event) => updateFormValue("email", event.target.value)}
                    />
                  </div>

                  <div className="saas-form__field">
                    <label htmlFor="organization-phone">Phone</label>
                    <input
                      id="organization-phone"
                      className="saas-input-field"
                      value={form.phone}
                      onChange={(event) => updateFormValue("phone", event.target.value)}
                    />
                  </div>

                  <div className="saas-form__field saas-form__field--full">
                    <label htmlFor="organization-address">Address</label>
                    <input
                      id="organization-address"
                      className="saas-input-field"
                      value={form.address}
                      onChange={(event) => updateFormValue("address", event.target.value)}
                    />
                  </div>

                  <div className="saas-form__field saas-form__field--full">
                    <label htmlFor="organization-description">Description</label>
                    <textarea
                      id="organization-description"
                      className="saas-textarea-field"
                      value={form.description}
                      onChange={(event) => updateFormValue("description", event.target.value)}
                    />
                  </div>
                </div>

                <div className="saas-form__actions">
                  <button
                    type="button"
                    className="saas-button saas-button--ghost"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="saas-button saas-button--primary" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}

      <SaasConfirmDialog
        open={statusConfirmationOpen}
        title={organizationActive ? "Deactivate organization?" : "Activate organization?"}
        message={
          organizationActive
            ? `${organization.name} will be marked inactive until reactivated.`
            : `${organization.name} will become active again.`
        }
        confirmLabel={organizationActive ? "Deactivate" : "Activate"}
        tone={organizationActive ? "danger" : "primary"}
        busy={statusSaving}
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusConfirmationOpen(false)}
      />
    </div>
  );
}

export default SaasOrganizationDetailsPage;
