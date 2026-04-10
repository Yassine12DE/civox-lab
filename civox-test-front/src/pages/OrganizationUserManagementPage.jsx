import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  createOrganizationUser,
  getOrganizationUsers,
  setOrganizationUserArchived,
} from "../services/orgBackOfficeService";
import { ROLES, canAssignTenantRole } from "../utils/rbac";
import "../styles/organizationUserManagementPage.css";

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

  const loadUsers = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const data = await getOrganizationUsers(organization.id);
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users");
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
    } catch (err) {
      setError(err.message || "Failed to create user");
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
    } catch (err) {
      setError(err.message || "Failed to update user");
    }
  };

  return (
    <div className="org-users-page">
      <section className="org-users-hero">
        <p className="org-users-badge">User Management</p>
        <h1>{organization?.name} users</h1>
        <p>Manage tenant users without leaving the current organization.</p>
        {message && <p className="org-users-success">{message}</p>}
        {error && <p className="org-users-error">{error}</p>}
      </section>

      <div className="org-users-grid">
        <form className="org-users-form" onSubmit={handleSubmit}>
          <h2>Create user</h2>

          <label>First name</label>
          <input name="firstName" value={formData.firstName} onChange={handleChange} required />

          <label>Last name</label>
          <input name="lastName" value={formData.lastName} onChange={handleChange} required />

          <label>Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required />

          <label>Phone</label>
          <input name="phone" value={formData.phone} onChange={handleChange} />

          <label>Temporary password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            minLength="8"
            required
          />

          <label>Role</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create user"}
          </button>
        </form>

        <section className="org-users-list">
          <h2>Organization users</h2>
          {loading ? (
            <p>Loading users...</p>
          ) : users.length > 0 ? (
            <div className="org-users-table">
              {users.map((user) => (
                <article key={user.id} className="org-users-row">
                  <div>
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p>{user.email}</p>
                    <small>{user.role} · {user.status}</small>
                  </div>

                  {canArchiveTarget(currentUser, user) && (
                    <button type="button" onClick={() => handleArchiveToggle(user)}>
                      {user.status === "archived" ? "Restore" : "Archive"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p>No users found for this organization.</p>
          )}
        </section>
      </div>
    </div>
  );
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

export default OrganizationUserManagementPage;
