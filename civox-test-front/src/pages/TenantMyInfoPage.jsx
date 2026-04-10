import { Link, useOutletContext } from "react-router-dom";
import "../styles/tenantProfilePage.css";

function initialsFor(user) {
  const first = user?.firstName?.charAt(0) || "";
  const last = user?.lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";
}

function TenantMyInfoPage() {
  const { currentUser, organization } = useOutletContext();
  const fullName =
    `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "No name yet";

  return (
    <div className="tenant-profile-page">
      <section className="tenant-profile-card tenant-profile-hero-card">
        <div className="tenant-profile-large-avatar">{initialsFor(currentUser)}</div>
        <div>
          <p className="tenant-profile-eyebrow">My Info</p>
          <h1>{fullName}</h1>
          <p className="tenant-profile-muted">
            Your tenant account for {currentUser?.organizationName || organization?.name}.
          </p>
          <Link to="/profile/edit" className="tenant-profile-primary-link">
            Edit Profile
          </Link>
        </div>
      </section>

      <section className="tenant-profile-card">
        <h2>Profile Details</h2>
        <div className="tenant-profile-details-grid">
          <ProfileField label="Email" value={currentUser?.email} />
          <ProfileField label="Phone" value={currentUser?.phone} />
          <ProfileField label="First name" value={currentUser?.firstName} />
          <ProfileField label="Last name" value={currentUser?.lastName} />
          <ProfileField label="Birth date" value={currentUser?.birthDate} />
          <ProfileField label="Role" value={currentUser?.role} />
          <ProfileField label="Account status" value={currentUser?.accountStatus} />
          <ProfileField label="Organization" value={currentUser?.organizationName || organization?.name} />
        </div>
      </section>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="tenant-profile-field">
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

export default TenantMyInfoPage;
