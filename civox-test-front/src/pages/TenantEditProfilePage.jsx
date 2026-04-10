import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { updateMe } from "../services/authService";
import "../styles/tenantProfilePage.css";

function TenantEditProfilePage() {
  const { currentUser, setCurrentUser, refreshCurrentUser } = useOutletContext();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      refreshCurrentUser?.();
      return;
    }

    setForm({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      phone: currentUser.phone || "",
      birthDate: currentUser.birthDate || "",
    });
  }, [currentUser, refreshCurrentUser]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const updated = await updateMe(form);
      setCurrentUser(updated);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tenant-profile-page">
      <section className="tenant-profile-card">
        <p className="tenant-profile-eyebrow">Edit Profile</p>
        <h1>Update your personal info</h1>
        <p className="tenant-profile-muted">
          Your email, role, account status, and organization are managed by Civox administrators.
        </p>

        <form className="tenant-profile-form" onSubmit={handleSubmit}>
          <label>
            First name
            <input
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              autoComplete="given-name"
            />
          </label>

          <label>
            Last name
            <input
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              autoComplete="family-name"
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              autoComplete="tel"
            />
          </label>

          <label>
            Birth date
            <input
              value={form.birthDate}
              onChange={(event) => updateField("birthDate", event.target.value)}
              placeholder="YYYY-MM-DD"
              autoComplete="bday"
            />
          </label>

          {message && <p className="tenant-profile-success">{message}</p>}
          {error && <p className="tenant-profile-error">{error}</p>}

          <div className="tenant-profile-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <Link to="/me">Cancel</Link>
          </div>
        </form>
      </section>
    </div>
  );
}

export default TenantEditProfilePage;
