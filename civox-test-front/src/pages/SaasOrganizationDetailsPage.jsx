import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  getAllModuleRequests,
  getOrganizationAccessRequests,
  getSaasModuleCatalog,
  getSaasOrganizationBySlug,
  getSaasOrganizationModules,
  getSaasOrganizationSettings,
  getSaasOrganizationUsers,
  grantModuleToOrganization,
  removeModuleFromOrganization,
  updateSaasOrganization,
  updateSaasOrganizationSettings,
} from "../services/saasService";
import { formatDate, formatDateTime, formatNumber } from "../utils/saasFormat";
import { buildSubscriptions, resolvePlan } from "../utils/saasDerivedData";

const TABS = ["Overview", "Branding", "Users", "Modules", "Subscription", "Activity", "Security"];

function SaasOrganizationDetailsPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [grantedModules, setGrantedModules] = useState([]);
  const [moduleRequests, setModuleRequests] = useState([]);
  const [orgRequests, setOrgRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [busyModuleId, setBusyModuleId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const org = await getSaasOrganizationBySlug(slug);
      if (!org) {
        setOrganization(null);
        return;
      }

      const [catalog, orgUsers, orgModules, allModuleRequests, allOrgRequests, orgSettings] = await Promise.all([
        getSaasModuleCatalog(),
        getSaasOrganizationUsers(org.id),
        getSaasOrganizationModules(org.id),
        getAllModuleRequests(),
        getOrganizationAccessRequests(),
        getSaasOrganizationSettings(org.id),
      ]);

      setOrganization({ ...org, plan: resolvePlan(Number(org.usersCount || 0)) });
      setProfileForm({
        id: org.id,
        name: org.name || "",
        slug: org.slug || "",
        email: org.email || "",
        phone: org.phone || "",
        address: org.address || "",
        description: org.description || "",
        status: String(org.status || "ACTIVE").toUpperCase(),
      });
      setUsers(Array.isArray(orgUsers) ? orgUsers : []);
      setModuleCatalog(Array.isArray(catalog) ? catalog : []);
      setGrantedModules(Array.isArray(orgModules) ? orgModules : []);
      setModuleRequests((allModuleRequests || []).filter((request) => request.organizationId === org.id));
      setOrgRequests(
        (allOrgRequests || []).filter(
          (request) => request.desiredSlug === org.slug || request.organizationName === org.name
        )
      );
      setSettings(orgSettings || null);
    } catch (error) {
      setOrganization(null);
      setNotice({ tone: "danger", title: "Unable to load organization", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const subscription = useMemo(
    () => buildSubscriptions(organization ? [organization] : [])[0] || null,
    [organization]
  );

  const disabledModules = useMemo(() => {
    const grantedCodes = new Set(grantedModules.map((module) => module.moduleCode));
    return moduleCatalog.filter((module) => !grantedCodes.has(module.code));
  }, [grantedModules, moduleCatalog]);

  const activity = useMemo(() => {
    const moduleEvents = moduleRequests.map((request) => ({
      key: `module-${request.id}`,
      title: `${request.moduleName || request.moduleCode} ${String(request.status || "").toLowerCase()}`,
      date: request.reviewedDate || request.requestDate,
    }));
    const onboardingEvents = orgRequests.map((request) => ({
      key: `onboarding-${request.id}`,
      title: `Onboarding ${String(request.requestStatus || "").toLowerCase()}`,
      date: request.updatedAt || request.createdAt,
    }));
    return [...moduleEvents, ...onboardingEvents]
      .filter((item) => !!item.date)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [moduleRequests, orgRequests]);

  const toggleModule = async () => {
    if (!organization || !confirmation) return;
    setBusyModuleId(confirmation.id);
    setNotice(null);
    try {
      const updated = confirmation.action === "grant"
        ? await grantModuleToOrganization(organization.id, confirmation.id)
        : await removeModuleFromOrganization(organization.id, confirmation.id);
      setGrantedModules(Array.isArray(updated) ? updated : []);
      setConfirmation(null);
      setNotice({ tone: "success", title: "Module updated", message: "Organization module access was saved." });
    } catch (error) {
      setNotice({ tone: "danger", title: "Module update failed", message: error.message });
    } finally {
      setBusyModuleId(null);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!profileForm?.id) return;

    try {
      await updateSaasOrganization(profileForm.id, profileForm);
      setProfileOpen(false);
      setNotice({ tone: "success", title: "Organization updated", message: "Profile changes were saved." });
      await load();
    } catch (error) {
      setNotice({ tone: "danger", title: "Save failed", message: error.message });
    }
  };

  const saveBranding = async () => {
    if (!organization || !settings) return;
    try {
      const updated = await updateSaasOrganizationSettings(organization.id, settings);
      setSettings(updated);
      setNotice({ tone: "success", title: "Branding saved", message: "Branding settings were saved." });
    } catch (error) {
      setNotice({ tone: "danger", title: "Branding save failed", message: error.message });
    }
  };

  if (loading) return <SaasLoadingState label="Loading organization profile..." />;

  if (!organization) {
    return (
      <div className="saas-page-stack">
        <SaasPageHeader eyebrow="Tenant management" title="Organization not found" />
        <SaasEmptyState
          icon="organizations"
          title="This organization could not be found"
          message="Return to the organization directory and choose another tenant."
          action={<Link to="/saas/organizations" className="saas-button saas-button--outline">Back</Link>}
        />
      </div>
    );
  }

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Organization profile"
        title={organization.name}
        description={`${organization.slug}.civox.io`}
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Organizations", to: "/saas/organizations" }, { label: organization.name }]}
        actions={
          <>
            <button type="button" className="saas-button saas-button--secondary" onClick={() => setProfileOpen(true)}>
              <SaasIcon name="edit" size={16} />
              Edit
            </button>
            <Link to={`/saas/organizations/${organization.slug}/modules`} className="saas-button saas-button--primary">
              Manage modules
            </Link>
          </>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats">
        <SaasStatCard label="Users" value={formatNumber(organization.usersCount)} detail="Registered users" icon="users" tone="blue" />
        <SaasStatCard label="Modules" value={formatNumber(grantedModules.length)} detail="Granted by SaaS" icon="modules" tone="teal" />
        <SaasStatCard label="Plan" value={organization.plan} detail={subscription?.status || "ACTIVE"} icon="billing" tone="amber" />
        <SaasStatCard label="Created" value={formatDate(organization.createdAt)} detail="Workspace created" icon="calendar" tone="blue" />
      </section>

      <div className="saas-tabs">
        {TABS.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "saas-tab saas-tab--active" : "saas-tab"} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <section className="saas-panel">
          <div className="saas-detail-list">
            <Detail label="Email" value={organization.email} />
            <Detail label="Phone" value={organization.phone} />
            <Detail label="Status" value={organization.status} badge />
            <Detail label="Address" value={organization.address} multiline />
            <Detail label="Description" value={organization.description} multiline />
          </div>
        </section>
      )}

      {activeTab === "Branding" && (
        <section className="saas-panel">
          <div className="saas-form__grid">
            <Field label="Logo URL" value={settings?.logoUrl || ""} onChange={(value) => setSettings((prev) => ({ ...prev, logoUrl: value }))} />
            <Field label="Primary color" value={settings?.primaryColor || ""} onChange={(value) => setSettings((prev) => ({ ...prev, primaryColor: value }))} />
            <Field label="Secondary color" value={settings?.secondaryColor || ""} onChange={(value) => setSettings((prev) => ({ ...prev, secondaryColor: value }))} />
            <Field label="Home title" value={settings?.homeTitle || ""} onChange={(value) => setSettings((prev) => ({ ...prev, homeTitle: value }))} />
            <Field label="Banner image URL" value={settings?.bannerImageUrl || ""} onChange={(value) => setSettings((prev) => ({ ...prev, bannerImageUrl: value }))} />
            <label className="saas-form__field saas-form__field--full">
              <span>Welcome text</span>
              <textarea className="saas-textarea-field" value={settings?.welcomeText || ""} onChange={(event) => setSettings((prev) => ({ ...prev, welcomeText: event.target.value }))} />
            </label>
            <label className="saas-form__field saas-form__field--full">
              <span>Footer text</span>
              <textarea className="saas-textarea-field" value={settings?.footerText || ""} onChange={(event) => setSettings((prev) => ({ ...prev, footerText: event.target.value }))} />
            </label>
          </div>
          <button type="button" className="saas-button saas-button--primary" onClick={saveBranding}>Save branding</button>
        </section>
      )}

      {activeTab === "Users" && (
        <section className="saas-panel">
          <div className="saas-panel__header">
            <div><h2>Organization users</h2></div>
            <Link to="/saas/users" className="saas-button saas-button--secondary">Manage users</Link>
          </div>
          <div className="saas-table-wrap">
            <table className="saas-table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email}</td>
                    <td><SaasStatusBadge status={user.role} label={user.role} tone="info" /></td>
                    <td><SaasStatusBadge status={user.enabled ? "ACTIVE" : "INACTIVE"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "Modules" && (
        <section className="saas-grid saas-grid--two">
          <div className="saas-panel">
            <div className="saas-table-wrap">
              <table className="saas-table">
                <thead><tr><th>Module</th><th>Access</th><th /></tr></thead>
                <tbody>
                  {grantedModules.map((module) => (
                    <tr key={module.moduleCode}>
                      <td>{module.moduleName}</td>
                      <td><SaasStatusBadge status={module.grantedBySaas ? "GRANTED" : "NOT_GRANTED"} /></td>
                      <td><button type="button" className="saas-button saas-button--danger" onClick={() => setConfirmation({ id: module.moduleId, action: "remove", name: module.moduleName })}>{busyModuleId === module.moduleId ? "Working..." : "Disable"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="saas-panel">
            <div className="saas-requested-module-list">
              {disabledModules.map((module) => (
                <article key={module.code}>
                  <strong>{module.name}</strong>
                  <p>{module.description}</p>
                  <button type="button" className="saas-button saas-button--success" onClick={() => setConfirmation({ id: module.id, action: "grant", name: module.name })}>
                    {busyModuleId === module.id ? "Working..." : "Grant access"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "Subscription" && (
        <section className="saas-panel">
          <div className="saas-subscription-profile">
            <div><span>Plan</span><strong>{organization.plan}</strong></div>
            <div><span>Status</span><strong>{subscription?.status || "ACTIVE"}</strong></div>
            <div><span>Renewal</span><strong>{formatDate(subscription?.renewalDate)}</strong></div>
          </div>
        </section>
      )}

      {activeTab === "Activity" && (
        <section className="saas-panel">
          <div className="saas-activity-list">
            {activity.map((event) => (
              <article key={event.key} className="saas-activity-item"><div><strong>{event.title}</strong><time>{formatDateTime(event.date)}</time></div></article>
            ))}
            {!activity.length && <SaasEmptyState icon="activity" title="No activity" message="No recent events for this organization." />}
          </div>
        </section>
      )}

      {activeTab === "Security" && (
        <section className="saas-grid saas-grid--three">
          <SaasStatCard label="Enabled users" value={formatNumber(users.filter((user) => user.enabled).length)} detail="Active accounts" icon="check" tone="teal" />
          <SaasStatCard label="Archived users" value={formatNumber(users.filter((user) => user.archived).length)} detail="Disabled accounts" icon="alert" tone="amber" />
          <SaasStatCard label="Pending module requests" value={formatNumber(moduleRequests.filter((request) => String(request.status).toUpperCase() === "PENDING").length)} detail="Needs decision" icon="modules" tone="blue" />
        </section>
      )}

      <SaasConfirmDialog
        open={!!confirmation}
        title={confirmation?.action === "grant" ? "Grant module?" : "Remove module?"}
        message={confirmation ? `${confirmation.name} access will be updated.` : ""}
        confirmLabel={confirmation?.action === "grant" ? "Grant" : "Remove"}
        tone={confirmation?.action === "grant" ? "success" : "danger"}
        busy={busyModuleId !== null}
        onConfirm={toggleModule}
        onCancel={() => setConfirmation(null)}
      />

      {profileOpen && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal" role="dialog" aria-modal="true">
            <div className="saas-modal__header">
              <div><h2>Edit organization</h2><p>Update profile details.</p></div>
              <button type="button" className="saas-icon-button" onClick={() => setProfileOpen(false)}><SaasIcon name="close" size={16} /></button>
            </div>
            <form className="saas-modal__body" onSubmit={saveProfile}>
              <div className="saas-form__grid">
                <Field label="Name" value={profileForm?.name || ""} onChange={(value) => setProfileForm((prev) => ({ ...prev, name: value }))} />
                <Field label="Slug" value={profileForm?.slug || ""} onChange={(value) => setProfileForm((prev) => ({ ...prev, slug: value }))} />
                <Field label="Email" value={profileForm?.email || ""} onChange={(value) => setProfileForm((prev) => ({ ...prev, email: value }))} />
                <Field label="Phone" value={profileForm?.phone || ""} onChange={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))} />
                <Field label="Address" value={profileForm?.address || ""} onChange={(value) => setProfileForm((prev) => ({ ...prev, address: value }))} />
                <label className="saas-form__field"><span>Status</span><select className="saas-select-field" value={profileForm?.status || "ACTIVE"} onChange={(event) => setProfileForm((prev) => ({ ...prev, status: event.target.value }))}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></select></label>
              </div>
              <label className="saas-form__field"><span>Description</span><textarea className="saas-textarea-field" value={profileForm?.description || ""} onChange={(event) => setProfileForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
              <div className="saas-form__actions">
                <button type="button" className="saas-button saas-button--ghost" onClick={() => setProfileOpen(false)}>Cancel</button>
                <button type="submit" className="saas-button saas-button--primary">Save</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="saas-form__field">
      <span>{label}</span>
      <input className="saas-input-field" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Detail({ label, value, multiline = false, badge = false }) {
  return (
    <div className={`saas-detail-list__item ${multiline ? "saas-detail-list__item--multiline" : ""}`}>
      <span>{label}</span>
      {badge ? <SaasStatusBadge status={value} /> : multiline ? <p>{value || "Not provided"}</p> : <strong>{value || "Not provided"}</strong>}
    </div>
  );
}

export default SaasOrganizationDetailsPage;
