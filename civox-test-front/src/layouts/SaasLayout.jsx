import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../services/authService";
import { getTokenRole } from "../utils/authToken";
import { getInitials } from "../utils/saasFormat";
import SaasIcon from "../components/saas/SaasIcon";
import "../styles/saasAdmin.css";

const NAV_SECTIONS = [
  {
    label: "Command center",
    items: [
      { label: "Dashboard", to: "/saas", icon: "dashboard" },
      { label: "Organizations", to: "/saas/organizations", icon: "organizations" },
      { label: "Requests", to: "/saas/requests", icon: "requests" },
      { label: "Module requests", to: "/saas/module-requests", icon: "requests" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Plans", to: "/saas/plans", icon: "billing" },
      { label: "Global users", to: "/saas/users", icon: "users" },
      { label: "Audit log", to: "/saas/activity", icon: "activity" },
      { label: "Settings", to: "/saas/settings", icon: "settings" },
    ],
  },
];

function getCurrentTitle(pathname) {
  if (pathname === "/saas") return "Dashboard";
  if (pathname === "/saas/organizations") return "Organizations";
  if (pathname.includes("/modules")) return "Module Access";
  if (pathname.startsWith("/saas/organizations/")) return "Organization Profile";
  if (pathname === "/saas/requests") return "Organization Requests";
  if (pathname === "/saas/module-requests") return "Module Requests";
  if (pathname === "/saas/plans") return "Plans";
  if (pathname === "/saas/users") return "Global Users";
  if (pathname === "/saas/activity") return "Audit Log";
  if (pathname === "/saas/settings") return "Settings";
  return "SaaS Back-Office";
}

function isActivePath(pathname, target) {
  if (target === "/saas") return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}

function formatDisplayName(user) {
  if (!user) return "Super Admin";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Super Admin";
}

function SaasLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const title = getCurrentTitle(location.pathname);
  const displayName = formatDisplayName(user);
  const roleLabel = user?.role || getTokenRole() || "SUPER_ADMIN";

  useEffect(() => {
    document.title = `${title} | Civox SaaS`;
  }, [title]);

  useEffect(() => {
    let active = true;

    fetchMe()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSignOut = async () => {
    await logout();
    setProfileOpen(false);
    navigate("/saas/login", { replace: true });
  };

  return (
    <div className="saas-admin-shell">
      <aside className={`saas-sidebar ${sidebarOpen ? "saas-sidebar--open" : ""}`}>
        <div className="saas-sidebar__brand">
          <Link
            to="/saas"
            className="saas-brand"
            aria-label="Civox SaaS dashboard"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="saas-brand__mark">C</span>
            <span>
              <strong>Civox</strong>
              <small>SaaS Back-Office</small>
            </span>
          </Link>
          <button
            type="button"
            className="saas-icon-button saas-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <SaasIcon name="close" size={18} />
          </button>
        </div>

        <nav className="saas-sidebar__nav" aria-label="SaaS navigation">
          {NAV_SECTIONS.map((section) => (
            <div className="saas-nav-section" key={section.label}>
              <p>{section.label}</p>
              {section.items.map((item) => {
                const active = isActivePath(location.pathname, item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`saas-nav-link ${active ? "saas-nav-link--active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <SaasIcon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="saas-sidebar__footer">
          <span className="saas-sidebar__shield">
            <SaasIcon name="shield" size={18} />
          </span>
          <div>
            <strong>Platform owner mode</strong>
            <p>Global access across all tenants.</p>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="saas-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <div className="saas-workspace">
        <header className="saas-topbar">
          <div className="saas-topbar__left">
            <button
              type="button"
              className="saas-icon-button saas-topbar__menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <SaasIcon name="menu" size={20} />
            </button>
            <div>
              <p>Super Admin</p>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="saas-topbar__actions">
            <button type="button" className="saas-notification-button" aria-label="Open notifications">
              <SaasIcon name="bell" size={18} />
              <span aria-hidden="true" />
            </button>

            <div className="saas-profile-menu" ref={menuRef}>
              <button
                type="button"
                className="saas-profile-trigger"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <span className="saas-profile-trigger__avatar">{getInitials(displayName)}</span>
                <span className="saas-profile-trigger__text">
                  <strong>{displayName}</strong>
                  <small>{roleLabel}</small>
                </span>
              </button>

              {profileOpen && (
                <div className="saas-profile-dropdown">
                  <div className="saas-profile-dropdown__header">
                    <strong>{displayName}</strong>
                    <span>{user?.email || "SUPER_ADMIN session"}</span>
                  </div>
                  <Link
                    to="/saas/settings"
                    className="saas-profile-dropdown__item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <SaasIcon name="settings" size={16} />
                    Account settings
                  </Link>
                  <button
                    type="button"
                    className="saas-profile-dropdown__item saas-profile-dropdown__item--danger"
                    onClick={handleSignOut}
                  >
                    <SaasIcon name="logout" size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="saas-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SaasLayout;
