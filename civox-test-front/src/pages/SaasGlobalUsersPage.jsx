import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  archiveSaasUser,
  createSaasUser,
  getSaasOrganizations,
  getSaasUsers,
  resetSaasUserPassword,
  updateSaasUser,
} from "../services/saasService";
import { formatNumber, getInitials, includesSearchValue } from "../utils/saasFormat";

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "MODERATOR", "CITIZEN", "OBSERVER"];

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "ADMIN",
  organizationId: "",
  password: "",
};

function SaasGlobalUsersPage() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [usersData, organizationsData] = await Promise.all([getSaasUsers(), getSaasOrganizations()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
    } catch (error) {
      setUsers([]);
      setNotice({ tone: "danger", title: "Unable to load users", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const searchMatches = includesSearchValue(user, searchTerm, ["firstName", "lastName", "email", "organization", "role"]);
        const roleMatches = roleFilter === "ALL" || user.role === roleFilter;
        const statusMatches = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? !isUserArchived(user) : isUserArchived(user));
        return searchMatches && roleMatches && statusMatches;
      }),
    [roleFilter, searchTerm, statusFilter, users]
  );

  const superAdmins = users.filter((user) => user.role === "SUPER_ADMIN").length;
  const orgAdmins = users.filter((user) => user.role === "ADMIN").length;
  const archivedUsers = users.filter((user) => isUserArchived(user)).length;
  const activeUsers = users.filter((user) => !isUserArchived(user)).length;

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "ADMIN",
      organizationId: user.organizationId || "",
      password: "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        organizationId: form.organizationId ? Number(form.organizationId) : null,
      };

      if (editingUser) {
        await updateSaasUser(editingUser.id, payload);
      } else {
        await createSaasUser({ ...payload, password: form.password });
      }

      closeForm();
      setNotice({ tone: "success", title: "User saved", message: "User changes were applied." });
      await load();
    } catch (error) {
      setNotice({ tone: "danger", title: "Save failed", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirm) return;

    setSaving(true);
    setActionUserId(confirm.user.id);
    setNotice(null);

    try {
      if (confirm.type === "archive") {
        const nextArchived = !isUserArchived(confirm.user);
        const updatedUser = await archiveSaasUser(confirm.user.id, nextArchived);
        if (updatedUser?.id) {
          setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user)));
        } else {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === confirm.user.id
                ? {
                    ...user,
                    archived: nextArchived,
                    status: nextArchived ? "INACTIVE" : "ACTIVE",
                  }
                : user
            )
          );
        }
      }
      if (confirm.type === "reset") {
        await resetSaasUserPassword(confirm.user.id);
      }
      setConfirm(null);
      setNotice({
        tone: "success",
        title: confirm.type === "archive" ? "User status updated" : "Action completed",
        message:
          confirm.type === "archive"
            ? `${confirm.user.email} was ${isUserArchived(confirm.user) ? "restored" : "archived"} successfully.`
            : "User action completed successfully.",
      });
      await load();
    } catch (error) {
      setNotice({ tone: "danger", title: "Action failed", message: error.message });
    } finally {
      setSaving(false);
      setActionUserId(null);
    }
  };

  if (loading) return <SaasLoadingState label="Loading global users..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Platform administration"
        title="Global Users"
        description="SaaS-level user inventory with role and organization assignments."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Global Users" }]}
        actions={
          <button type="button" className="saas-button saas-button--primary" onClick={openCreate}>
            <SaasIcon name="plus" size={16} />
            Invite user
          </button>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Global user metrics">
        <SaasStatCard label="Super admins" value={formatNumber(superAdmins)} detail="Platform owner accounts" icon="shield" tone="red" />
        <SaasStatCard label="Organization admins" value={formatNumber(orgAdmins)} detail="Tenant administration owners" icon="users" tone="blue" />
        <SaasStatCard label="Archived users" value={formatNumber(archivedUsers)} detail="Archived accounts" icon="alert" tone="amber" />
        <SaasStatCard label="Active users" value={formatNumber(activeUsers)} detail={`${formatNumber(users.length)} total records`} icon="check" tone="blue" />
      </section>

      <section className="saas-toolbar" aria-label="Global user filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search users">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search user, email, organization, role..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select className="saas-select-field" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role">
            <option value="ALL">All roles</option>
            {ROLES.map((role) => <option value={role} key={role}>{role}</option>)}
          </select>
          <select className="saas-select-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <span className="saas-table__muted">{formatNumber(filteredUsers.length)} users</span>
      </section>

      <section className="saas-panel">
        <div className="saas-table-wrap">
          <table className="saas-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="saas-identity">
                      <span className="saas-identity__avatar">{getInitials(`${user.firstName || ""} ${user.lastName || ""}`)}</span>
                      <div className="saas-identity__content">
                        <strong>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><SaasStatusBadge status={user.role} label={user.role} tone={getRoleTone(user.role)} /></td>
                  <td>{user.organization || "Platform"}</td>
                  <td><SaasStatusBadge status={isUserArchived(user) ? "INACTIVE" : "ACTIVE"} /></td>
                  <td>{user.createdAt || "N/A"}</td>
                  <td>
                    <div className="saas-table__actions">
                      <button type="button" className="saas-button saas-button--outline" onClick={() => openEdit(user)}>Edit</button>
                      <button type="button" className="saas-button saas-button--secondary" onClick={() => setConfirm({ type: "reset", user })}>Reset password</button>
                      <button
                        type="button"
                        className={`saas-button ${isUserArchived(user) ? "saas-button--success" : "saas-button--danger"}`}
                        onClick={() => setConfirm({ type: "archive", user })}
                        title={isUserArchived(user) ? "Restore user" : "Archive user"}
                        aria-label={isUserArchived(user) ? "Restore user" : "Archive user"}
                        disabled={saving && actionUserId === user.id}
                      >
                        <SaasIcon name={isUserArchived(user) ? "check" : "alert"} size={15} />
                        {saving && actionUserId === user.id ? "Working..." : isUserArchived(user) ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal" role="dialog" aria-modal="true">
            <div className="saas-modal__header">
              <div><h2>{editingUser ? "Edit user" : "Create user"}</h2><p>Configure role, contact details, and organization.</p></div>
              <button type="button" className="saas-icon-button" onClick={closeForm}><SaasIcon name="close" size={16} /></button>
            </div>
            <form className="saas-modal__body" onSubmit={submitForm}>
              <div className="saas-form__grid">
                <Field label="First name" value={form.firstName} onChange={(value) => setForm((prev) => ({ ...prev, firstName: value }))} />
                <Field label="Last name" value={form.lastName} onChange={(value) => setForm((prev) => ({ ...prev, lastName: value }))} />
                <Field label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} type="email" disabled={!!editingUser} />
                <Field label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
                <label className="saas-form__field"><span>Role</span><select className="saas-select-field" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>{ROLES.map((role) => <option value={role} key={role}>{role}</option>)}</select></label>
                <label className="saas-form__field"><span>Organization</span><select className="saas-select-field" value={form.organizationId} onChange={(event) => setForm((prev) => ({ ...prev, organizationId: event.target.value }))}><option value="">Platform</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
                {!editingUser && <Field label="Temporary password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} type="password" />}
              </div>
              <div className="saas-form__actions">
                <button type="button" className="saas-button saas-button--ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="saas-button saas-button--primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <SaasConfirmDialog
        open={!!confirm}
        title={confirm?.type === "reset" ? "Reset password?" : isUserArchived(confirm?.user) ? "Restore user?" : "Archive user?"}
        message={
          confirm
            ? confirm.type === "reset"
              ? `Apply action to ${confirm.user.email}?`
              : isUserArchived(confirm.user)
                ? `${confirm.user.email} will be restored and reactivated.`
                : `${confirm.user.email} will be archived and deactivated.`
            : ""
        }
        confirmLabel={confirm?.type === "reset" ? "Reset" : isUserArchived(confirm?.user) ? "Restore" : "Archive"}
        tone={confirm?.type === "reset" ? "primary" : isUserArchived(confirm?.user) ? "success" : "danger"}
        busy={saving}
        onConfirm={runConfirmAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }) {
  return (
    <label className="saas-form__field">
      <span>{label}</span>
      <input className="saas-input-field" type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
    </label>
  );
}

function getRoleTone(role) {
  if (role === "SUPER_ADMIN") return "danger";
  if (role === "ADMIN") return "info";
  if (role === "MANAGER") return "success";
  if (role === "MODERATOR") return "warning";
  return "neutral";
}

function isUserArchived(user) {
  if (!user) return false;
  if (user.archived) return true;
  return String(user.status || "").toUpperCase() !== "ACTIVE";
}

export default SaasGlobalUsersPage;
