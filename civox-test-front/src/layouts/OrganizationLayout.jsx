import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import TenantProfileMenu from "../components/TenantProfileMenu";
import {
  OrgIcon,
  OrganizationLoadingState,
  OrganizationLogoMark,
} from "../components/organization/OrganizationUi";
import { fetchMe } from "../services/authService";
import { getCurrentOrganization } from "../services/organizationService";
import {
  getCurrentOrganizationSettings,
  getCurrentOrganizationModules,
} from "../services/organizationDynamicService";
import { clearTokens, getAccessToken } from "../utils/tokenStorage";
import {
  canCustomizeDesign,
  canManageModuleVisibility,
  canManageUsers,
  canOpenBackOffice,
  canRequestModules,
} from "../utils/rbac";

function OrganizationLayout() {
  const location = useLocation();
  const [organization, setOrganization] = useState(null);
  const [settings, setSettings] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshCurrentUser = async () => {
    if (!getAccessToken()) {
      setCurrentUser(null);
      return null;
    }

    try {
      const user = await fetchMe();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.warn("Profile session unavailable", error);
      clearTokens();
      setCurrentUser(null);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [organizationData, settingsData, modulesData] = await Promise.all([
          getCurrentOrganization(),
          getCurrentOrganizationSettings(),
          getCurrentOrganizationModules(),
        ]);

        setOrganization(organizationData);
        setSettings(settingsData);
        setModules(modulesData);
        await refreshCurrentUser();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    document.title = organization?.name?.trim() || "CIVOX";
  }, [organization?.name]);

  const isBackOffice = location.pathname.startsWith("/backoffice");

  if (loading) {
    return (
      <div className="premium-front-shell premium-empty-center">
        <OrganizationLoadingState
          title="Loading organization workspace"
          message="Your tenant experience is being prepared."
        />
      </div>
    );
  }

  if (!organization || !settings) {
    return (
      <div className="premium-front-shell premium-empty-center">
        <OrganizationLoadingState
          title="Organization unavailable"
          message="This workspace could not be loaded. Please check the tenant address or try again."
          busy={false}
        />
      </div>
    );
  }

  const layoutStyle = {
    "--org-primary": settings.primaryColor || "#7B2CBF",
    "--org-secondary": settings.secondaryColor || "#FF6B35",
  };
  const welcomeText =
    settings.welcomeText ||
    organization.description ||
    "A dedicated CIVOX workspace for services, updates, and civic participation.";
  const canUseBackOffice = canOpenBackOffice(currentUser);

  const adminNavigation = [
    { label: "Dashboard", to: "/backoffice", access: canUseBackOffice, icon: "dashboard" },
    { label: "Users", to: "/backoffice/users", access: canManageUsers(currentUser), icon: "users" },
    {
      label: "Content",
      to: "/backoffice/modules",
      access: canManageModuleVisibility(currentUser),
      icon: "layers",
    },
    {
      label: "Settings",
      to: "/backoffice/design",
      access: canCustomizeDesign(currentUser),
      icon: "settings",
    },
    {
      label: "Requests",
      to: "/backoffice/module-requests",
      access: canRequestModules(currentUser),
      icon: "plus",
    },
  ].filter((item) => item.access);

  const outletContext = {
    organization,
    settings,
    setSettings,
    modules,
    currentUser,
    setCurrentUser,
    refreshCurrentUser,
  };

  if (isBackOffice) {
    return (
      <div className="premium-admin-shell" style={layoutStyle}>
        <header className="premium-admin-topbar">
          <div className="premium-admin-topbar__inner">
            <div className="premium-admin-topbar__left">
              <button
                type="button"
                className="premium-mobile-toggle"
                onClick={() => setAdminMenuOpen((current) => !current)}
                aria-expanded={adminMenuOpen}
                aria-label="Toggle back-office navigation"
              >
                <OrgIcon name="menu" size={22} />
              </button>

              <Link to="/" className="premium-civox-brand">
                <span className="premium-civox-brand__mark">C</span>
                <span className="premium-civox-brand__word">CIVOX</span>
              </Link>

              <span className="premium-admin-divider" aria-hidden="true" />

              <div className="premium-admin-org">
                <button
                  type="button"
                  className="premium-admin-org-button"
                  onClick={() => setOrgDropdownOpen((current) => !current)}
                >
                  <OrganizationLogoMark
                    organization={organization}
                    logoUrl={settings.logoUrl}
                    size="sm"
                  />
                  <span>
                    <strong>{organization.name}</strong>
                    <span>{currentUser?.role || "Tenant workspace"}</span>
                  </span>
                  <OrgIcon name="chevronDown" size={16} />
                </button>

                {orgDropdownOpen && (
                  <div className="premium-admin-org-menu">
                    <div className="premium-admin-org-menu__label">Your Organizations</div>
                    <button type="button" className="premium-admin-org-menu__item">
                      <OrganizationLogoMark
                        organization={organization}
                        logoUrl={settings.logoUrl}
                        size="sm"
                      />
                      <span>
                        <strong>{organization.name}</strong>
                        <span>Current</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="premium-admin-topbar__actions">
              <label className="premium-admin-search">
                <OrgIcon name="search" size={17} />
                <input type="search" placeholder="Search..." />
              </label>
              <button type="button" className="premium-icon-button premium-icon-button--alert" aria-label="Notifications">
                <OrgIcon name="bell" size={20} />
              </button>
              <Link to="/" className="premium-icon-button" title="View front-office">
                <OrgIcon name="home" size={20} />
              </Link>
              <TenantProfileMenu
                user={currentUser}
                organization={organization}
                settings={settings}
                onSignedOut={() => setCurrentUser(null)}
              />
            </div>
          </div>
        </header>

        <div className="premium-admin-body">
          {adminMenuOpen && (
            <button
              type="button"
              className="premium-admin-overlay"
              onClick={() => setAdminMenuOpen(false)}
              aria-label="Close back-office navigation"
            />
          )}

          <aside className={`premium-admin-sidebar ${adminMenuOpen ? "is-open" : ""}`}>
            <nav className="premium-admin-nav" aria-label="Back-office navigation">
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/backoffice"}
                  onClick={() => setAdminMenuOpen(false)}
                  className={({ isActive }) =>
                    `premium-admin-nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  <OrgIcon name={item.icon} size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="premium-admin-sidebar__card">
              <span>Tenant brand</span>
              <strong>{modules.length} public modules</strong>
              <p>Logo, color, copy, and module visibility are resolved from this organization.</p>
            </div>
          </aside>

          <main className="premium-admin-content">
            <Outlet context={outletContext} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-front-shell" style={layoutStyle}>
      <header className="premium-front-nav">
        <div className="premium-front-nav__inner">
          <div className="premium-front-nav__row">
            <Link to="/" className="premium-brand">
              <OrganizationLogoMark
                organization={organization}
                logoUrl={settings.logoUrl}
                size="sm"
                className="premium-brand__mark"
              />
              <span>
                <strong>{organization.name}</strong>
                <span>Powered by CIVOX</span>
              </span>
            </Link>

            <nav className="premium-front-nav__links" aria-label="Organization navigation">
              <NavLink to="/" end className={({ isActive }) => `premium-nav-link ${isActive ? "is-active" : ""}`}>
                Home
              </NavLink>
              <NavLink to="/modules" className={({ isActive }) => `premium-nav-link ${isActive ? "is-active" : ""}`}>
                Modules
              </NavLink>
              <a href="/#about-organization" className="premium-nav-link">About</a>
            </nav>

            <div className="premium-front-nav__actions">
              {canUseBackOffice && (
                <Link to="/backoffice" className="premium-admin-link">
                  <OrgIcon name="settings" size={16} />
                  Admin
                </Link>
              )}
              {!currentUser && (
                <Link to="/login" className="premium-design-link">
                  Sign in
                </Link>
              )}
              {currentUser && (
                <TenantProfileMenu
                  user={currentUser}
                  organization={organization}
                  settings={settings}
                  onSignedOut={() => setCurrentUser(null)}
                />
              )}
            </div>

            <button
              type="button"
              className="premium-mobile-toggle"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle organization navigation"
            >
              <OrgIcon name="menu" size={22} />
            </button>
          </div>

          <div className={`premium-mobile-menu ${mobileMenuOpen ? "is-open" : ""}`}>
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `premium-nav-link ${isActive ? "is-active" : ""}`}>
              Home
            </NavLink>
            <NavLink to="/modules" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `premium-nav-link ${isActive ? "is-active" : ""}`}>
              Modules
            </NavLink>
            <a href="/#about-organization" className="premium-nav-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </a>
            {canUseBackOffice && (
              <Link to="/backoffice" className="premium-admin-link" onClick={() => setMobileMenuOpen(false)}>
                <OrgIcon name="settings" size={16} />
                Admin
              </Link>
            )}
            {!currentUser && (
              <Link to="/login" className="premium-design-link" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="premium-front-main">
        <Outlet context={outletContext} />
      </main>

      <footer className="premium-footer">
        <div className="premium-footer__inner">
          <div>
            <Link to="/" className="premium-brand">
              <OrganizationLogoMark organization={organization} logoUrl={settings.logoUrl} size="sm" />
              <span>
                <strong>{organization.name}</strong>
                <span>Powered by CIVOX</span>
              </span>
            </Link>
            <p>{settings.footerText || welcomeText}</p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/modules">Modules</Link></li>
              <li><a href="/#about-organization">About</a></li>
            </ul>
          </div>

          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="/#about-organization">Help Center</a></li>
              <li><a href="/#about-organization">Contact Us</a></li>
              <li><a href="/#about-organization">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="premium-footer__bottom">
          &copy; 2026 CIVOX Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default OrganizationLayout;
