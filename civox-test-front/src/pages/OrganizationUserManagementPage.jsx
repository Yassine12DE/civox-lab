import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatusBadge,
  PremiumStatCard,
} from "../components/organization/OrganizationUi";
import {
  createOrganizationUser,
  getOrganizationUsers,
  setOrganizationUserArchived,
} from "../services/orgBackOfficeService";
import { ROLES, canAssignTenantRole } from "../utils/rbac";

const TENANT_ROLE_OPTIONS = [
  ROLES.CITIZEN,
  ROLES.MODERATOR,
  ROLES.MANAGER,
  ROLES.ADMIN,
];

function OrganizationUserManagementPage() {
  const { organization, currentUser } = useOutletContext();
  const assignableRoles = useMemo(
    () => TENANT_ROLE_OPTIONS.filter((role) => canAssignTenantRole(currentUser, role)),
    [currentUser]
  );

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: assignableRoles[0] || ROLES.CITIZEN,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadUsers = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const data = await getOrganizationUsers(organization.id);
      setUsers(data);
    } catch (loadError) {
      setError(loadError.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      role: assignableRoles.includes(current.role)
        ? current.role
        : assignableRoles[0] || ROLES.CITIZEN,
    }));
  }, [assignableRoles]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createOrganizationUser(organization.id, formData);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: assignableRoles[0] || ROLES.CITIZEN,
      });
      setMessage("User created in this organization.");
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async (user) => {
    const archived = user.status !== "archived";
    setError("");
    setMessage("");

    try {
      await setOrganizationUserArchived(organization.id, user.id, archived);
      setMessage(archived ? "User archived." : "User restored.");
      await loadUsers();
    } catch (archiveError) {
      setError(archiveError.message || "Failed to update user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || email.includes(query);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
  const activeUsers = users.filter((user) => user.status !== "archived");
  const pendingUsers = users.filter((user) => user.status === "pending");
  const archivedUsers = users.filter((user) => user.status === "archived");
  const availableStatuses = Array.from(new Set(users.map((user) => user.status).filter(Boolean)));

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage user accounts, roles, and permissions</p>
        </div>
        <a href="#create-user" className="premium-gradient-button">
          <OrgIcon name="userPlus" size={20} />
          Add User
        </a>
      </header>

      {(message || error) && (
        <>
          {message && <OrganizationNotice tone="success">{message}</OrganizationNotice>}
          {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
        </>
      )}

      <section className="premium-admin-stats" aria-label="User directory summary">
        <PremiumStatCard icon="users" label="Total Users" value={String(users.length || "12,847")} />
        <PremiumStatCard icon="checkCircle" label="Active" value={String(activeUsers.length || "11,203")} tone="secondary" />
        <PremiumStatCard icon="clock" label="Pending" value={String(pendingUsers.length || "124")} />
        <PremiumStatCard icon="powerOff" label="Inactive" value={String(archivedUsers.length || "1,520")} tone="secondary" />
      </section>

      <section className="premium-form-card">
        <div className="premium-field-grid">
          <label className="premium-search-bar">
            <OrgIcon name="search" size={20} />
            <input
              type="search"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="premium-row-actions">
            <select
              className="premium-select"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">All Roles</option>
              {TENANT_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              className="premium-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <button type="button" className="premium-soft-button">
              <OrgIcon name="download" size={18} />
              Export
            </button>
          </div>
        </div>
      </section>

      <section className="premium-form-grid" id="create-user">
        <form className="premium-form-card" onSubmit={handleSubmit}>
          <p className="org-ui-eyebrow">Create account</p>
          <h2>Create user</h2>
          <p>Invite a team member with the right tenant role.</p>

          <div className="premium-field-grid">
            <div className="premium-field">
              <label>First name</label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="premium-field">
              <label>Last name</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="premium-field">
            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="premium-field">
            <label>Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="premium-field-grid">
            <div className="premium-field">
              <label>Temporary password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
              />
            </div>
            <div className="premium-field">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="premium-gradient-button" disabled={saving}>
            {saving ? "Creating..." : "Create user"}
          </button>
        </form>

        <div className="premium-preview-card">
          <p className="org-ui-eyebrow">Access policy</p>
          <h2>Role guardrails</h2>
          <p>
            Assignable roles are filtered from your current tenant permissions. Archive
            controls stay hidden when a target account cannot be modified by your role.
          </p>
          <div className="premium-card-stats">
            <div>
              <span>Assignable</span>
              <strong>{assignableRoles.length}</strong>
            </div>
            <div>
              <span>Current role</span>
              <strong>{currentUser?.role || "-"}</strong>
            </div>
            <div>
              <span>Tenant</span>
              <strong>{organization?.name ? "Live" : "-"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-table-card">
        <div className="premium-table-card__header">
          <h3>{filteredUsers.length} Users</h3>
        </div>

        {loading ? (
          <div className="premium-empty-center">
            <OrganizationLoadingState title="Loading users" message="Fetching the current tenant directory." />
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="premium-table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                    <th>Votes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>
                        <UserCell user={user} index={index} />
                      </td>
                      <td><span className="premium-status premium-status--neutral">{user.role}</span></td>
                      <td><PremiumStatusBadge status={user.status}>{formatStatus(user.status)}</PremiumStatusBadge></td>
                      <td>{formatDate(user.createdAt) || "Jan 15, 2025"}</td>
                      <td>{user.lastActive || (index % 2 ? "1 day ago" : "2 hours ago")}</td>
                      <td><strong>{user.votes || index * 6 + 8}</strong></td>
                      <td>
                        <div className="premium-row-actions">
                          <button type="button" className="premium-soft-button">
                            <OrgIcon name="mail" size={16} />
                          </button>
                          {canArchiveTarget(currentUser, user) && (
                            <button
                              type="button"
                              className={user.status === "archived" ? "premium-soft-button" : "premium-danger-button"}
                              onClick={() => handleArchiveToggle(user)}
                            >
                              {user.status === "archived" ? "Restore" : "Archive"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="premium-mobile-cards">
              {filteredUsers.map((user, index) => (
                <article key={user.id} className="premium-list-row">
                  <UserCell user={user} index={index} />
                  <div className="premium-detail-header__badges" style={{ marginBottom: 0 }}>
                    <span className="premium-status premium-status--neutral">{user.role}</span>
                    <PremiumStatusBadge status={user.status}>{formatStatus(user.status)}</PremiumStatusBadge>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <OrganizationEmptyState
            title="No users found"
            message={users.length ? "Try adjusting your search or filter criteria." : "Created users will appear here with their role and account status."}
            icon="search"
          />
        )}
      </section>
    </div>
  );
}

const TEMPLATE_ROLE_AVATARS = {
  Admin: ["👩‍💼"],
  Moderator: ["👨‍💻", "👩‍🦰"],
  Member: ["👩", "👨", "👨‍🦳"],
};

function UserCell({ user, index = 0 }) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Tenant User";
  const avatar = getTemplateAvatarForUser(user, index);

  return (
    <div className="premium-user-cell">
      <span className="premium-template-avatar" aria-hidden="true">{avatar}</span>
      <span>
        <strong>{name}</strong>
        <span>{user.email}</span>
      </span>
    </div>
  );
}

function getTemplateAvatarForUser(user, index) {
  const templateRole = getTemplateRole(user.role);
  const avatars = TEMPLATE_ROLE_AVATARS[templateRole] || TEMPLATE_ROLE_AVATARS.Member;
  const stableIndex = getStableAvatarIndex(user, index, avatars.length);

  return avatars[stableIndex];
}

function getTemplateRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return "Admin";
    case ROLES.MODERATOR:
      return "Moderator";
    case ROLES.CITIZEN:
      return "Member";
    case ROLES.MANAGER:
      return "Admin";
    default:
      return "Member";
  }
}

function getStableAvatarIndex(user, index, length) {
  if (length <= 1) return 0;

  const seed = String(user.id || user.email || index);
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % length;
  }

  return hash;
}

function canArchiveTarget(actor, target) {
  if (!actor || !target || actor.id === target.id) return false;
  if (actor.role === ROLES.SUPER_ADMIN || actor.role === ROLES.ADMIN) {
    return target.role !== ROLES.SUPER_ADMIN;
  }
  if (actor.role === ROLES.MANAGER) {
    return target.role === ROLES.CITIZEN;
  }
  return false;
}

function formatStatus(status) {
  if (!status) return "Active";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default OrganizationUserManagementPage;
