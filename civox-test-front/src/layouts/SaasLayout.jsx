import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../services/authService";
import { getAllModuleRequests, getOrganizationAccessRequests } from "../services/saasService";
import { getTokenRole } from "../utils/authToken";
import { getInitials } from "../utils/saasFormat";
import SaasIcon from "../components/saas/SaasIcon";
import "../styles/saasAdmin.css";

const NAV_SECTIONS = [
  {
    label: "Command Center",
    items: [
      { label: "Dashboard", to: "/saas", icon: "dashboard" },
      { label: "Organizations", to: "/saas/organizations", icon: "organizations" },
      { label: "Organization Requests", to: "/saas/requests", icon: "requests" },
      { label: "Module Requests", to: "/saas/module-requests", icon: "modules" },
    ],
  },
  {
    label: "Business Operations",
    items: [
      { label: "Plans & Subscriptions", to: "/saas/plans", icon: "billing" },
      { label: "Billing & Invoices", to: "/saas/billing", icon: "file" },
      { label: "Quotes & Payments", to: "/saas/quotes-payments", icon: "dollar" },
    ],
  },
  {
    label: "Platform Administration",
    items: [
      { label: "Global Users", to: "/saas/users", icon: "users" },
      { label: "Modules Catalog", to: "/saas/modules-catalog", icon: "book" },
      { label: "Audit Log", to: "/saas/activity", icon: "activity" },
      { label: "Platform Monitoring", to: "/saas/monitoring", icon: "server" },
      { label: "Settings", to: "/saas/settings", icon: "settings" },
    ],
  },
];

function getCurrentTitle(pathname) {
  if (pathname === "/saas") return "Dashboard";
  if (pathname === "/saas/organizations") return "Organizations";
  if (pathname === "/saas/requests") return "Organization Requests";
  if (pathname === "/saas/module-requests") return "Module Requests";
  if (pathname === "/saas/modules-catalog") return "Modules Catalog";
  if (pathname === "/saas/plans") return "Plans & Subscriptions";
  if (pathname === "/saas/billing") return "Billing & Invoices";
  if (pathname === "/saas/quotes-payments") return "Quotes & Payments";
  if (pathname === "/saas/users") return "Global Users";
  if (pathname === "/saas/activity") return "Audit Log";
  if (pathname === "/saas/monitoring") return "Platform Monitoring";
  if (pathname === "/saas/settings") return "Settings";
  if (pathname.includes("/modules")) return "Module Access";
  if (pathname.startsWith("/saas/organizations/")) return "Organization Profile";
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
  const notificationRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [signals, setSignals] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const title = getCurrentTitle(location.pathname);
  const displayName = formatDisplayName(user);
  const roleLabel = user?.role || getTokenRole() || "SUPER_ADMIN";
  const hasWarningSignal = signals.some((signal) => signal.tone === "warning");
  const healthLabel = hasWarningSignal ? "98.9%" : "99.7%";

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
    let active = true;

    const loadSignals = async () => {
      try {
        const [organizationRequests, moduleRequests] = await Promise.all([
          getOrganizationAccessRequests(),
          getAllModuleRequests(),
        ]);

        if (!active) return;

        const pendingOrganizations = (organizationRequests || []).filter(
          (request) =>
            ["PENDING", "QUOTE_SENT", "AWAITING_PAYMENT"].includes(
              String(request.requestStatus || "").toUpperCase()
            )
        ).length;
        const pendingModules = (moduleRequests || []).filter(
          (request) => String(request.status || "").toUpperCase() === "PENDING"
        ).length;

        const nextSignals = [];
        if (pendingOrganizations > 0) {
          nextSignals.push({
            tone: "warning",
            title: "Onboarding queue",
            detail: `${pendingOrganizations} organization request(s) need review.`,
          });
        }
        if (pendingModules > 0) {
          nextSignals.push({
            tone: "info",
            title: "Module demand",
            detail: `${pendingModules} module request(s) are pending.`,
          });
        }
        if (!nextSignals.length) {
          nextSignals.push({
            tone: "info",
            title: "System stable",
            detail: "No pending onboarding or module approvals.",
          });
        }

        setSignals(nextSignals);
      } catch {
        if (active) {
          setSignals([]);
        }
      }
    };

    loadSignals();
    const timer = setInterval(loadSignals, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [location.pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
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

  const runGlobalSearch = () => {
    const raw = globalSearch.trim();
    if (!raw) return;

    const normalized = raw.toLowerCase();
    let target = "/saas/organizations";
    let query = raw;

    if (normalized.startsWith("user:") || normalized.startsWith("users:")) {
      target = "/saas/users";
      query = raw.replace(/^users?:/i, "").trim() || raw;
    } else if (normalized.startsWith("module:") || normalized.startsWith("modules:")) {
      target = "/saas/modules-catalog";
      query = raw.replace(/^modules?:/i, "").trim() || raw;
    } else if (normalized.startsWith("request:") || normalized.startsWith("requests:")) {
      target = "/saas/requests";
      query = raw.replace(/^requests?:/i, "").trim() || raw;
    } else if (normalized.startsWith("activity:") || normalized.startsWith("audit:")) {
      target = "/saas/activity";
      query = raw.replace(/^(activity|audit):/i, "").trim() || raw;
    }

    navigate(`${target}?q=${encodeURIComponent(query)}`);
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
              <strong>CIVOX</strong>
              <small>Global SaaS Console</small>
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
            <strong>Platform health {healthLabel}</strong>
            <p>{hasWarningSignal ? "Some queues require review." : "Production systems operational."}</p>
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
              <p>SUPER_ADMIN / Global platform</p>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="saas-topbar__actions">
            <label className="saas-global-search" aria-label="Global SaaS search">
              <SaasIcon name="search" size={17} />
              <input
                type="search"
                placeholder="Search or use prefixes: user:, module:, request:"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    runGlobalSearch();
                  }
                }}
              />
            </label>

            <div className="saas-health-pill" title="Platform health">
              <span />
              <strong>{healthLabel}</strong>
              <small>{hasWarningSignal ? "Watch" : "Healthy"}</small>
            </div>

            <div className="saas-notification-menu" ref={notificationRef}>
              <button
                type="button"
                className="saas-notification-button"
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <SaasIcon name="bell" size={18} />
                <span aria-hidden="true" />
              </button>

              {notificationsOpen && (
                <div className="saas-notification-panel">
                  <header>
                    <strong>Notifications</strong>
                    <small>{signals.length} open signal{signals.length === 1 ? "" : "s"}</small>
                  </header>
                  {signals.map((signal) => (
                    <NotificationItem
                      key={signal.title}
                      tone={signal.tone}
                      title={signal.title}
                      detail={signal.detail}
                    />
                  ))}
                </div>
              )}
            </div>

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
                  <Link
                    to="/saas/activity"
                    className="saas-profile-dropdown__item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <SaasIcon name="activity" size={16} />
                    Audit trail
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

function NotificationItem({ tone, title, detail }) {
  return (
    <article className={`saas-notification-item saas-notification-item--${tone}`}>
      <span />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export default SaasLayout;
