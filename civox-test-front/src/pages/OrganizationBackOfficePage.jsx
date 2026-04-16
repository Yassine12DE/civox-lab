import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatCard,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import { getOrganizationBackOfficeModules } from "../services/orgBackOfficeService";
import { getModuleCreateRoute } from "../utils/moduleNavigation";
import {
  canCreateFromModule,
  canCustomizeDesign,
  canManageModuleVisibility,
  canManageUsers,
} from "../utils/rbac";

function OrganizationBackOfficePage() {
  const { organization, currentUser } = useOutletContext();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) return;

      try {
        const modulesData = await getOrganizationBackOfficeModules(organization.id);
        setModules(modulesData);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError.message || "Failed to load back-office data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organization?.id]);

  if (loading) {
    return (
      <div className="premium-empty-center">
        <OrganizationLoadingState
          title="Loading back-office workspace"
          message="Collecting tenant modules, permissions, and admin controls."
        />
      </div>
    );
  }

  const enabledModules = modules.filter(
    (module) => module.grantedBySaas && module.enabledByOrganization
  );
  const hiddenModules = modules.filter(
    (module) => module.grantedBySaas && !module.enabledByOrganization
  );
  const creationModules = enabledModules.filter((module) =>
    canCreateFromModule(currentUser, module.moduleCode)
  );

  const stats = [
    {
      label: "Total Users",
      value: "12,847",
      change: "+12.5%",
      trend: "up",
      icon: "users",
      tone: "primary",
    },
    {
      label: "Active Votes",
      value: String(enabledModules.filter((module) => module.moduleCode === "VOTE").length || 24),
      change: "+3",
      trend: "up",
      icon: "vote",
      tone: "secondary",
    },
    {
      label: "Engagement Rate",
      value: "68.4%",
      change: "+4.2%",
      trend: "up",
      icon: "trending",
      tone: "primary",
    },
    {
      label: "Consultations",
      value: String(enabledModules.filter((module) => module.moduleCode === "CONFERENCE").length || 18),
      change: hiddenModules.length ? `-${hiddenModules.length}` : "+0",
      trend: hiddenModules.length ? "down" : "up",
      icon: "message",
      tone: "secondary",
    },
  ];

  const quickActions = [
    canCreateFromModule(currentUser, "VOTE") && {
      label: "Create Vote",
      icon: "vote",
      href: getModuleCreateRoute("VOTE") || "/backoffice/modules",
    },
    canManageUsers(currentUser) && {
      label: "Add User",
      icon: "users",
      href: "/backoffice/users",
    },
    creationModules[0] && {
      label: "New Content",
      icon: "file",
      href: getModuleCreateRoute(creationModules[0].moduleCode),
    },
    canCustomizeDesign(currentUser) && {
      label: "Settings",
      icon: "settings",
      href: "/backoffice/design",
    },
  ].filter(Boolean);

  const activeModules = enabledModules.length
    ? enabledModules.slice(0, 3)
    : [
        {
          moduleName: "Community Budget Vote",
          moduleCode: "VOTE",
          moduleDescription: "Decision workspace",
        },
        {
          moduleName: "Traffic Calming Survey",
          moduleCode: "VOTE",
          moduleDescription: "Closing soon",
        },
        {
          moduleName: "Central Park Ideas",
          moduleCode: "CONFERENCE",
          moduleDescription: "Consultation workspace",
        },
      ];

  const recentActivity = [
    { title: "New vote created: Budget Allocation 2026", user: "Admin Team", time: "2 hours ago", icon: "vote" },
    { title: "124 new users registered today", user: "System", time: "4 hours ago", icon: "users" },
    { title: "Consultation ended: Public space renovation", user: "Moderator", time: "6 hours ago", icon: "message" },
    { title: "Published: Sustainability Roadmap 2030", user: "Organization staff", time: "1 day ago", icon: "file" },
  ];

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here&apos;s what&apos;s happening with {organization?.name}.</p>
        </div>
        <Link to="/" className="premium-soft-button">
          View Front Office
        </Link>
      </header>

      {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}

      <section className="premium-admin-stats" aria-label="Back-office summary">
        {stats.map((stat) => (
          <PremiumStatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="premium-panel">
        <h2>Quick Actions</h2>
        <div className="premium-quick-actions">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href} className="premium-quick-action">
              <OrgIcon name={action.icon} size={32} />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="premium-admin-grid">
        <div className="premium-panel">
          <div className="premium-section__header premium-section__header--split">
            <div>
              <h2>Active Modules</h2>
            </div>
            {canManageModuleVisibility(currentUser) && (
              <Link to="/backoffice/modules" className="premium-card-cta">
                View All
                <OrgIcon name="eye" size={16} />
              </Link>
            )}
          </div>

          <div className="premium-list">
            {activeModules.map((module, index) => (
              <article key={`${module.moduleCode}-${index}`} className="premium-list-row">
                <div>
                  <h3>{module.moduleName}</h3>
                  <p>{module.moduleDescription || "Organization module"}</p>
                  <div className="premium-detail-header__badges" style={{ marginTop: 10, marginBottom: 0 }}>
                    <span className="premium-status premium-status--neutral">{module.moduleCode}</span>
                    <span className="premium-status premium-status--neutral">
                      <OrgIcon name="users" size={14} />
                      {(1247 + index * 428).toLocaleString()}
                    </span>
                  </div>
                </div>
                <PremiumStatusBadge status={index === 1 ? "Closing Soon" : "Active"}>
                  {index === 1 ? "Closing Soon" : "Active"}
                </PremiumStatusBadge>
              </article>
            ))}
          </div>
        </div>

        <aside className="premium-panel">
          <div className="premium-detail-header__badges">
            <OrgIcon name="activity" size={20} />
            <h2>Recent Activity</h2>
          </div>

          {recentActivity.map((activity) => (
            <div key={activity.title} className="premium-activity">
              <span className="premium-activity__icon">
                <OrgIcon name={activity.icon} size={20} />
              </span>
              <div>
                <h3>{activity.title}</h3>
                <p>{activity.user} - {activity.time}</p>
              </div>
            </div>
          ))}

          <button type="button" className="premium-soft-button" style={{ marginTop: 8 }}>
            View All Activity
          </button>
        </aside>
      </section>

      <section className="premium-panel">
        <div className="premium-detail-header__badges">
          <OrgIcon name="barChart" size={20} />
          <h2>Engagement Overview</h2>
        </div>

        <div className="premium-analytics-grid">
          <MetricPreview label="Weekly Active Users" value="8,492" progress={78} detail="78% of total users" />
          <MetricPreview label="Avg. Time per Session" value="12m 34s" progress={85} detail="+2m 15s from last week" tone="secondary" />
          <MetricPreview label="Content Views" value="24.8K" progress={92} detail="+18% this month" />
        </div>
      </section>
    </div>
  );
}

function MetricPreview({ label, value, progress, detail, tone = "primary" }) {
  return (
    <div>
      <div style={{ color: "#6b7280", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#111827", fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
        {value}
      </div>
      <div className="premium-progress">
        <span
          style={{
            width: `${progress}%`,
            background:
              tone === "secondary"
                ? "linear-gradient(90deg, var(--org-secondary), var(--org-secondary-2))"
                : undefined,
          }}
        />
      </div>
      <div style={{ color: "#6b7280", fontSize: ".82rem", marginTop: 6 }}>{detail}</div>
    </div>
  );
}

export default OrganizationBackOfficePage;
