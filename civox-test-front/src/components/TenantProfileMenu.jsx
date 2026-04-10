import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import "../styles/tenantProfileMenu.css";

function getInitials(user) {
  const first = user?.firstName?.trim()?.charAt(0) || "";
  const last = user?.lastName?.trim()?.charAt(0) || "";
  const fromName = `${first}${last}`.trim();

  if (fromName) return fromName.toUpperCase();
  if (user?.email) return user.email.charAt(0).toUpperCase();
  return "U";
}

function TenantProfileMenu({ user, organization, settings, onSignedOut }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const primaryColor = settings?.primaryColor || "#2563eb";
  const initials = getInitials(user);
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Guest";

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSignOut = async () => {
    await logout();
    setOpen(false);
    onSignedOut?.();
    navigate("/", { replace: true });
  };

  const closeMenu = () => setOpen(false);

  return (
    <div className="tenant-profile-menu" ref={menuRef}>
      <button
        type="button"
        className="tenant-profile-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <span className="tenant-profile-avatar" style={{ backgroundColor: primaryColor }}>
          {user ? initials : organization?.name?.charAt(0)?.toUpperCase() || "?"}
        </span>
        <span className="tenant-profile-label">
          {user ? displayName : "Profile"}
        </span>
      </button>

      {open && (
        <div className="tenant-profile-dropdown">
          <div className="tenant-profile-dropdown-header">
            <strong>{displayName}</strong>
            <span>{user?.email || organization?.name || "Organization visitor"}</span>
          </div>

          {user ? (
            <>
              <Link to="/me" className="tenant-profile-menu-item" onClick={closeMenu}>
                My Info
              </Link>
              <Link to="/profile/edit" className="tenant-profile-menu-item" onClick={closeMenu}>
                Edit Profile
              </Link>
              <button
                type="button"
                className="tenant-profile-menu-item tenant-profile-menu-button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="tenant-profile-menu-item" onClick={closeMenu}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default TenantProfileMenu;
