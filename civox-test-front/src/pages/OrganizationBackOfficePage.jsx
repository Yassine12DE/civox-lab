import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationLoadingState,
  OrganizationNotice,
  PremiumStatCard,
  PremiumStatusBadge,
} from "../components/organization/OrganizationUi";
import {
  getOrganizationAnalyticsDashboard,
  getOrganizationBackOfficeModules,
} from "../services/orgBackOfficeService";
import {
  getModuleCategory,
  getModuleCreateRoute,
  getModuleResponseLabel,
  isModuleBackOfficeVisible,
} from "../utils/moduleNavigation";
import {
  canCreateFromModule,
  canCustomizeDesign,
  canManageModuleVisibility,
  canManageUsers,
} from "../utils/rbac";

const ANALYTICS_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

const KPI_ICON_BY_KEY = {
  total_users: "users",
  active_users: "checkCircle",
  new_users_month: "trending",
  consultations: "message",
  votes: "vote",
  requests: "alert",
  news: "file",
  events: "calendar",
  participation_rate: "activity",
  engagement_rate: "barChart",
  interactions: "message",
  pending_moderation: "alert",
  recent_activity: "clock",
};

const KPI_TONE_CLASS = {
  success: "success",
  warning: "warning",
  danger: "danger",
  primary: "primary",
  neutral: "neutral",
  info: "info",
};

function OrganizationBackOfficePage() {
  const { organization, currentUser, moduleInsights } = useOutletContext();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsState, setAnalyticsState] = useState("hidden");

  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) return;

      try {
        setError("");
        const modulesData = await getOrganizationBackOfficeModules(organization.id);
        setModules((Array.isArray(modulesData) ? modulesData : []).filter(isModuleBackOfficeVisible));
      } catch (loadError) {
        setError(loadError.message || "Failed to load back-office data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organization?.id]);

  const analyticsModuleEnabled = useMemo(
    () =>
      modules.some(
        (module) =>
          String(module?.moduleCode || "").toUpperCase() === "ANALYTICS" &&
          module.grantedBySaas &&
          module.enabledByOrganization
      ),
    [modules]
  );

  const canViewAnalytics = ANALYTICS_ROLES.has(String(currentUser?.role || ""));

  useEffect(() => {
    if (!organization?.id || loading) {
      return;
    }

    if (!analyticsModuleEnabled) {
      setAnalyticsState("disabled");
      setAnalytics(null);
      setAnalyticsLoading(false);
      setAnalyticsError("");
      return;
    }

    if (!canViewAnalytics) {
      setAnalyticsState("forbidden");
      setAnalytics(null);
      setAnalyticsLoading(false);
      setAnalyticsError("");
      return;
    }

    let cancelled = false;

    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");

        const data = await getOrganizationAnalyticsDashboard(organization.id);
        if (cancelled) return;

        if (data?.analyticsEnabled === false) {
          setAnalyticsState("disabled");
          setAnalytics(data);
          return;
        }

        setAnalytics(data || null);
        setAnalyticsState("enabled");
      } catch (loadError) {
        if (cancelled) return;

        if (loadError?.status === 403) {
          setAnalyticsState("forbidden");
          setAnalyticsError(
            loadError.message || "You are not allowed to view organization analytics."
          );
          return;
        }

        setAnalyticsState("error");
        setAnalyticsError(
          loadError.message || "Failed to load organization analytics dashboard."
        );
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [analyticsModuleEnabled, canViewAnalytics, loading, organization?.id]);

  if (loading) {
    return (
      <div className="premium-empty-center">
        <OrganizationLoadingState
          title="Loading back-office workspace"
          message="Collecting tenant modules and admin controls."
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

  const publishedItems = enabledModules.reduce(
    (sum, module) => sum + Number(moduleInsights?.[module.moduleCode]?.contentCount || 0),
    0
  );
  const totalResponses = enabledModules.reduce(
    (sum, module) => sum + Number(moduleInsights?.[module.moduleCode]?.responseCount || 0),
    0
  );

  const stats = [
    {
      label: "Granted modules",
      value: String(modules.length),
      icon: "layers",
      tone: "primary",
    },
    {
      label: "Visible modules",
      value: String(enabledModules.length),
      icon: "eye",
      tone: "secondary",
    },
    {
      label: "Published content",
      value: String(publishedItems),
      icon: "file",
      tone: "primary",
    },
    {
      label: "Responses",
      value: totalResponses.toLocaleString(),
      icon: "users",
      tone: "secondary",
    },
  ];

  const quickActions = [
    enabledModules.find((module) => canCreateFromModule(currentUser, module.moduleCode)) && {
      label: "Create Content",
      icon: "plus",
      href: getModuleCreateRoute(
        enabledModules.find((module) => canCreateFromModule(currentUser, module.moduleCode))
          ?.moduleCode
      ),
    },
    canManageUsers(currentUser) && {
      label: "Manage Users",
      icon: "users",
      href: "/backoffice/users",
    },
    canManageModuleVisibility(currentUser) && {
      label: "Module Visibility",
      icon: "layers",
      href: "/backoffice/modules",
    },
    canCustomizeDesign(currentUser) && {
      label: "Branding",
      icon: "settings",
      href: "/backoffice/design",
    },
  ].filter((action) => Boolean(action && action.href));

  const activeModules = enabledModules.slice(0, 5);
  const analyticsCharts = Array.isArray(analytics?.charts) ? analytics.charts : [];
  const chartByKey = Object.fromEntries(
    analyticsCharts
      .filter((chart) => chart?.key)
      .map((chart) => [chart.key, chart])
  );
  const analyticsKpis = Array.isArray(analytics?.kpis) ? analytics.kpis : [];
  const insights = Array.isArray(analytics?.insights) ? analytics.insights : [];
  const recentActivities = Array.isArray(analytics?.recentActivities)
    ? analytics.recentActivities
    : [];

  return (
    <div className="premium-admin-page">
      <header className="premium-admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Live tenant operations for {organization?.name}.</p>
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

      {quickActions.length > 0 && (
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
      )}

      <section className="tenant-analytics" aria-label="Tenant analytics">
        <div className="tenant-analytics__header">
          <div>
            <h2>Tenant Analytics</h2>
            <p>Operational insights focused on this organization only.</p>
          </div>
          <span className="premium-status premium-status--info">Organization scope</span>
        </div>

        {analyticsLoading && (
          <div className="tenant-analytics__state">
            <OrganizationLoadingState
              title="Preparing analytics"
              message="Calculating KPIs, trends, and engagement insights for this tenant."
            />
          </div>
        )}

        {!analyticsLoading && analyticsState === "disabled" && (
          <div className="tenant-analytics__state tenant-analytics__state--empty">
            <OrgIcon name="barChart" size={26} />
            <div>
              <h3>Analytics module not enabled</h3>
              <p>
                Enable the Analytics module for this organization to unlock KPI cards,
                engagement trends, and module performance charts.
              </p>
            </div>
          </div>
        )}

        {!analyticsLoading && analyticsState === "forbidden" && (
          <OrganizationNotice tone="error">
            {analyticsError || "You do not have permission to view this analytics section."}
          </OrganizationNotice>
        )}

        {!analyticsLoading && analyticsState === "error" && (
          <OrganizationNotice tone="error">
            {analyticsError || "Unable to load analytics right now."}
          </OrganizationNotice>
        )}

        {!analyticsLoading && analyticsState === "enabled" && (
          <>
            <div className="tenant-analytics-kpis">
              {analyticsKpis.map((kpi) => {
                const toneClass = KPI_TONE_CLASS[kpi?.tone] || "neutral";
                const icon = KPI_ICON_BY_KEY[kpi?.key] || "barChart";
                return (
                  <article
                    key={kpi.key || kpi.label}
                    className={`tenant-analytics-kpi tenant-analytics-kpi--${toneClass}`}
                  >
                    <header>
                      <span>{kpi.label}</span>
                      <OrgIcon name={icon} size={17} />
                    </header>
                    <p>{formatKpiValue(kpi)}</p>
                  </article>
                );
              })}
            </div>

            <div className="tenant-analytics-grid tenant-analytics-grid--two">
              <TenantAreaChart chart={chartByKey["engagement-evolution"]} />
              <TenantLineComparisonChart chart={chartByKey["user-growth"]} />
            </div>

            <div className="tenant-analytics-grid tenant-analytics-grid--two">
              <TenantHorizontalBarChart chart={chartByKey["activity-by-module"]} />
              <TenantRadialProgressChart
                chart={chartByKey["participation-by-content-type"]}
              />
            </div>

            <div className="tenant-analytics-grid tenant-analytics-grid--two">
              <TenantDonutChart chart={chartByKey["requests-status-distribution"]} />
              <TenantRankedContentChart chart={chartByKey["top-content-interactions"]} />
            </div>

            <div className="tenant-analytics-grid tenant-analytics-grid--content">
              <TenantTimeline activities={recentActivities} />
              <TenantInsights insights={insights} />
            </div>
          </>
        )}
      </section>

      <section className="premium-admin-grid">
        <div className="premium-panel">
          <div className="premium-section__header premium-section__header--split">
            <div>
              <h2>Enabled Modules</h2>
            </div>
            {canManageModuleVisibility(currentUser) && (
              <Link to="/backoffice/modules" className="premium-card-cta">
                View All
                <OrgIcon name="eye" size={16} />
              </Link>
            )}
          </div>

          <div className="premium-list">
            {activeModules.length ? (
              activeModules.map((module) => (
                <article key={module.moduleCode} className="premium-list-row">
                  <div>
                    <h3>{module.moduleName}</h3>
                    <p>{module.moduleDescription || "Organization module"}</p>
                    <div
                      className="premium-detail-header__badges"
                      style={{ marginTop: 10, marginBottom: 0 }}
                    >
                      <span className="premium-status premium-status--neutral">
                        {module.moduleCode}
                      </span>
                      <span className="premium-status premium-status--neutral">
                        {getModuleCategory(module.moduleCode)}
                      </span>
                      <span className="premium-status premium-status--neutral">
                        {getModuleResponseLabel(module.moduleCode)}
                      </span>
                    </div>
                  </div>
                  <PremiumStatusBadge status="ACTIVE">Active</PremiumStatusBadge>
                </article>
              ))
            ) : (
              <p>No module is currently enabled for this tenant.</p>
            )}
          </div>
        </div>

        <aside className="premium-panel">
          <div className="premium-detail-header__badges">
            <OrgIcon name="activity" size={20} />
            <h2>Operational Snapshot</h2>
          </div>

          <div className="premium-activity">
            <span className="premium-activity__icon">
              <OrgIcon name="layers" size={20} />
            </span>
            <div>
              <h3>{enabledModules.length} modules enabled</h3>
              <p>{hiddenModules.length} granted modules are currently hidden.</p>
            </div>
          </div>
          <div className="premium-activity">
            <span className="premium-activity__icon">
              <OrgIcon name="file" size={20} />
            </span>
            <div>
              <h3>{publishedItems} published items</h3>
              <p>Public content is synchronized with tenant module visibility.</p>
            </div>
          </div>
          <div className="premium-activity">
            <span className="premium-activity__icon">
              <OrgIcon name="users" size={20} />
            </span>
            <div>
              <h3>{totalResponses.toLocaleString()} responses captured</h3>
              <p>Engagement comes from live module interactions.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function formatKpiValue(kpi) {
  if (!kpi) return "0";
  if (kpi.valueDisplay) return kpi.valueDisplay;

  const numericValue = Number(kpi.value);
  if (!Number.isFinite(numericValue)) {
    return String(kpi.value || "0");
  }

  if (String(kpi.key || "").includes("rate")) {
    return `${numericValue.toFixed(1)}%`;
  }

  return numericValue.toLocaleString();
}

function TenantAreaChart({ chart }) {
  const points = useMemo(
    () => (Array.isArray(chart?.points) ? chart.points : []),
    [chart]
  );
  const hasValues = hasMeaningfulValues(points, [
    "value",
    "votes",
    "consultations",
    "comments",
    "reactions",
    "requests",
  ]);
  const [activeIndex, setActiveIndex] = useState(null);
  const summary = useMemo(() => buildSeriesSummary(points, "value"), [points]);
  const model = useMemo(() => buildAreaModel(points), [points]);
  const defaultIndex = points.length ? points.length - 1 : -1;
  const resolvedIndex =
    activeIndex === null
      ? defaultIndex
      : Math.max(0, Math.min(Number(activeIndex), points.length - 1));
  const activePoint = resolvedIndex >= 0 ? points[resolvedIndex] : null;
  const activeCoord = resolvedIndex >= 0 ? model.coords[resolvedIndex] : null;

  return (
    <article className="tenant-analytics-card tenant-analytics-card--wide">
      <div className="tenant-analytics-card__header">
        <h3>{chart?.title || "Engagement evolution"}</h3>
        <p>
          {chart?.subtitle ||
            "Votes, consultation participation, reactions, comments, and requests over time."}
        </p>
      </div>
      <div className="tenant-trend-summary">
        <div className="tenant-trend-summary__metric">
          <span>Current period engagement</span>
          <strong>{formatCompactNumber(summary.current)}</strong>
        </div>
        <div
          className={`tenant-trend-summary__delta tenant-trend-summary__delta--${summary.direction}`}
        >
          <OrgIcon
            name={
              summary.direction === "down"
                ? "arrowDown"
                : summary.direction === "up"
                  ? "arrowUp"
                  : "arrowRight"
            }
            size={14}
          />
          <span>{formatSignedPercent(summary.deltaPercent)}</span>
          <small>
            vs previous ({formatCompactNumber(summary.previous)})
          </small>
        </div>
      </div>
      {!points.length || !hasValues ? (
        <p className="tenant-analytics-empty">
          No engagement activity yet for the selected periods.
        </p>
      ) : (
        <div className="tenant-trend-chart">
          <div className="tenant-trend-chart__y-axis" aria-hidden="true">
            {model.ticks.map((tick) => (
              <span key={`engagement-tick-${tick}`}>{formatCompactNumber(tick)}</span>
            ))}
          </div>
          <div className="tenant-trend-chart__plot" onMouseLeave={() => setActiveIndex(null)}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${chart?.title || "Engagement evolution"} by ${chart?.xAxisLabel || "month"}`}
            >
              <defs>
                <linearGradient id="tenantEngagementAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>

              {model.ticks.map((tick) => {
                const y = valueToY(tick, model.maxValue);
                return (
                  <line
                    key={`engagement-grid-${tick}`}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    className="tenant-trend-chart__grid-line"
                  />
                );
              })}

              <path d={model.areaPath} className="tenant-trend-chart__area" />
              <path d={model.linePath} className="tenant-trend-chart__line" />

              {model.coords.map((coord, index) => (
                <g
                  key={`engagement-point-${coord.label}-${index}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  <circle cx={coord.x} cy={coord.y} r="1.8" className="tenant-trend-chart__point" />
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="4.6"
                    className="tenant-trend-chart__point-hit"
                  />
                </g>
              ))}
            </svg>

            {activePoint && activeCoord && (
              <div
                className="tenant-trend-tooltip"
                style={{
                  left: `${Math.max(6, Math.min(activeCoord.x, 94))}%`,
                  top: `${Math.max(14, activeCoord.y - 8)}%`,
                }}
              >
                <strong>{activePoint?.label}</strong>
                <span>Total: {formatCompactNumber(toNumber(activePoint?.value))}</span>
                <span>Votes: {formatCompactNumber(toNumber(activePoint?.votes))}</span>
                <span>
                  Consultations: {formatCompactNumber(toNumber(activePoint?.consultations))}
                </span>
                <span>Comments: {formatCompactNumber(toNumber(activePoint?.comments))}</span>
                <span>Reactions: {formatCompactNumber(toNumber(activePoint?.reactions))}</span>
                <span>Requests: {formatCompactNumber(toNumber(activePoint?.requests))}</span>
              </div>
            )}

            <div className="tenant-chart-axis">
              {points.map((point) => (
                <span key={`engagement-axis-${point?.label}`}>{point?.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="tenant-trend-chart__axis-labels">
        <span>{chart?.yAxisLabel || "Engagement actions"}</span>
        <span>{chart?.xAxisLabel || "Month"}</span>
      </div>
    </article>
  );
}

function TenantLineComparisonChart({ chart }) {
  const points = useMemo(
    () => (Array.isArray(chart?.points) ? chart.points : []),
    [chart]
  );
  const hasValues = hasMeaningfulValues(points, ["value", "cumulative", "activeUsers"]);
  const [activeIndex, setActiveIndex] = useState(null);
  const summary = useMemo(() => buildSeriesSummary(points, "value"), [points]);
  const model = useMemo(() => buildGrowthModel(points), [points]);
  const defaultIndex = points.length ? points.length - 1 : -1;
  const resolvedIndex =
    activeIndex === null
      ? defaultIndex
      : Math.max(0, Math.min(Number(activeIndex), points.length - 1));
  const activePoint = resolvedIndex >= 0 ? points[resolvedIndex] : null;
  const activeCoord = resolvedIndex >= 0 ? model.items[resolvedIndex] : null;

  return (
    <article className="tenant-analytics-card tenant-analytics-card--wide">
      <div className="tenant-analytics-card__header">
        <h3>{chart?.title || "User growth by month"}</h3>
        <p>
          {chart?.subtitle ||
            "Monthly registrations with cumulative users and active user progression."}
        </p>
      </div>
      <div className="tenant-trend-summary">
        <div className="tenant-trend-summary__metric">
          <span>New users this month</span>
          <strong>{formatCompactNumber(summary.current)}</strong>
        </div>
        <div
          className={`tenant-trend-summary__delta tenant-trend-summary__delta--${summary.direction}`}
        >
          <OrgIcon
            name={
              summary.direction === "down"
                ? "arrowDown"
                : summary.direction === "up"
                  ? "arrowUp"
                  : "arrowRight"
            }
            size={14}
          />
          <span>{formatSignedPercent(summary.deltaPercent)}</span>
          <small>
            vs last month ({formatCompactNumber(summary.previous)})
          </small>
        </div>
      </div>
      {!points.length || !hasValues ? (
        <p className="tenant-analytics-empty">
          No user growth data available yet for this organization.
        </p>
      ) : (
        <div className="tenant-trend-chart">
          <div className="tenant-trend-chart__y-axis" aria-hidden="true">
            {model.ticks.map((tick) => (
              <span key={`users-tick-${tick}`}>{formatCompactNumber(tick)}</span>
            ))}
          </div>
          <div className="tenant-trend-chart__plot" onMouseLeave={() => setActiveIndex(null)}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${chart?.title || "User growth by month"} chart`}
            >
              {model.ticks.map((tick) => {
                const y = valueToY(tick, model.maxValue);
                return (
                  <line
                    key={`users-grid-${tick}`}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    className="tenant-trend-chart__grid-line"
                  />
                );
              })}

              {model.items.map((item) => (
                <rect
                  key={`users-bar-${item.label}`}
                  x={item.barX}
                  y={item.barY}
                  width={item.barWidth}
                  height={item.barHeight}
                  className="tenant-growth-bar"
                />
              ))}

              <path d={model.cumulativePath} className="tenant-growth-line" />
              <path d={model.activePath} className="tenant-growth-line tenant-growth-line--active" />

              {model.items.map((item, index) => (
                <g
                  key={`users-point-${item.label}-${index}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  <circle cx={item.x} cy={item.cumulativeY} r="1.6" className="tenant-growth-point" />
                  <circle
                    cx={item.x}
                    cy={item.cumulativeY}
                    r="4.8"
                    className="tenant-trend-chart__point-hit"
                  />
                </g>
              ))}
            </svg>

            {activePoint && activeCoord && (
              <div
                className="tenant-trend-tooltip tenant-trend-tooltip--users"
                style={{
                  left: `${Math.max(6, Math.min(activeCoord.x, 94))}%`,
                  top: `${Math.max(14, activeCoord.cumulativeY - 8)}%`,
                }}
              >
                <strong>{activePoint?.label}</strong>
                <span>New users: {formatCompactNumber(toNumber(activePoint?.value))}</span>
                <span>
                  Cumulative users: {formatCompactNumber(toNumber(activePoint?.cumulative))}
                </span>
                <span>
                  Active users: {formatCompactNumber(toNumber(activePoint?.activeUsers))}
                </span>
              </div>
            )}

            <div className="tenant-chart-axis">
              {points.map((point) => (
                <span key={`users-axis-${point?.label}`}>{point?.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="tenant-chart-legend">
        <span><i className="tenant-chart-dot tenant-chart-dot--bar" /> New users</span>
        <span><i className="tenant-chart-dot tenant-chart-dot--solid" /> Cumulative users</span>
        <span><i className="tenant-chart-dot tenant-chart-dot--dashed" /> Active users</span>
      </div>
      <div className="tenant-trend-chart__axis-labels">
        <span>{chart?.yAxisLabel || "Users"}</span>
        <span>{chart?.xAxisLabel || "Month"}</span>
      </div>
    </article>
  );
}

function buildAreaModel(points) {
  const values = points.map((point) => toNumber(point?.value));
  const maxValue = Math.max(...values, 1);
  const ticks = buildAxisTicks(maxValue, 4);

  const coords = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / Math.max(points.length - 1, 1)) * 100;
    const y = valueToY(toNumber(point?.value), maxValue);
    return { x, y, label: point?.label || "" };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x},${coord.y}`)
    .join(" ");
  const areaPath = `${linePath} L 100,90 L 0,90 Z`;

  return {
    maxValue,
    ticks,
    coords,
    linePath,
    areaPath,
  };
}

function buildGrowthModel(points) {
  const values = points.map((point) => Math.max(
    toNumber(point?.value),
    toNumber(point?.cumulative),
    toNumber(point?.activeUsers)
  ));
  const maxValue = Math.max(...values, 1);
  const ticks = buildAxisTicks(maxValue, 4);
  const step = points.length <= 1 ? 0 : 100 / (points.length - 1);
  const barWidth = points.length <= 1 ? 14 : Math.min(11, step * 0.54);

  const items = points.map((point, index) => {
    const x = points.length <= 1 ? 50 : index * step;
    const monthly = toNumber(point?.value);
    const cumulative = toNumber(point?.cumulative);
    const activeUsers = toNumber(point?.activeUsers);
    const barY = valueToY(monthly, maxValue);
    const barHeight = Math.max(1, 90 - barY);

    return {
      label: point?.label || "",
      x,
      monthly,
      cumulative,
      activeUsers,
      cumulativeY: valueToY(cumulative, maxValue),
      activeY: valueToY(activeUsers, maxValue),
      barX: x - barWidth / 2,
      barY,
      barWidth,
      barHeight,
    };
  });

  const cumulativePath = items
    .map((item, index) => `${index === 0 ? "M" : "L"} ${item.x},${item.cumulativeY}`)
    .join(" ");
  const activePath = items
    .map((item, index) => `${index === 0 ? "M" : "L"} ${item.x},${item.activeY}`)
    .join(" ");

  return {
    maxValue,
    ticks,
    items,
    cumulativePath,
    activePath,
  };
}

function buildAxisTicks(maxValue, steps = 4) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return [0];
  }
  return Array.from({ length: steps + 1 }, (_, index) => {
    const factor = steps - index;
    return Math.round((maxValue / steps) * factor);
  });
}

function valueToY(value, maxValue) {
  const safeMax = Math.max(toNumber(maxValue), 1);
  const safeValue = Math.max(0, toNumber(value));
  return 90 - (safeValue / safeMax) * 76;
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function hasMeaningfulValues(points, keys = []) {
  if (!Array.isArray(points) || !points.length) {
    return false;
  }
  return points.some((point) => keys.some((key) => toNumber(point?.[key]) > 0));
}

function buildSeriesSummary(points, key) {
  if (!Array.isArray(points) || !points.length) {
    return { current: 0, previous: 0, delta: 0, deltaPercent: 0, direction: "flat" };
  }

  const current = toNumber(points[points.length - 1]?.[key]);
  const previous = points.length > 1 ? toNumber(points[points.length - 2]?.[key]) : 0;
  const delta = current - previous;
  const deltaPercent =
    previous > 0 ? (delta / previous) * 100 : current > 0 ? 100 : 0;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return { current, previous, delta, deltaPercent, direction };
}

function formatCompactNumber(value) {
  const numericValue = toNumber(value);
  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)}M`;
  }
  if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)}k`;
  }
  return numericValue.toLocaleString();
}

function formatSignedPercent(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "0%";
  }
  if (numericValue > 0) {
    return `+${numericValue.toFixed(1)}%`;
  }
  return `${numericValue.toFixed(1)}%`;
}

function TenantHorizontalBarChart({ chart }) {
  const points = Array.isArray(chart?.points) ? chart.points : [];
  const maxValue = Math.max(...points.map((point) => Number(point?.value || 0)), 1);

  return (
    <article className="tenant-analytics-card">
      <div className="tenant-analytics-card__header">
        <h3>{chart?.title || "Activity by module"}</h3>
        <p>{chart?.yAxisLabel || "Interactions"} by module</p>
      </div>
      {!points.length ? (
        <p className="tenant-analytics-empty">No module activity yet.</p>
      ) : (
        <div className="tenant-horizontal-bars">
          {points.map((point) => {
            const value = Number(point?.value || 0);
            const width = Math.max(4, Math.round((value / maxValue) * 100));
            return (
              <div key={point?.label} className="tenant-horizontal-bar-row">
                <div>
                  <strong>{point?.label}</strong>
                  <span>{value.toLocaleString()} interactions</span>
                </div>
                <div className="tenant-horizontal-bar-track">
                  <span style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function TenantRadialProgressChart({ chart }) {
  const points = Array.isArray(chart?.points) ? chart.points : [];

  return (
    <article className="tenant-analytics-card">
      <div className="tenant-analytics-card__header">
        <h3>{chart?.title || "Participation by content type"}</h3>
        <p>Engagement share per content stream</p>
      </div>
      {!points.length ? (
        <p className="tenant-analytics-empty">No participation data yet.</p>
      ) : (
        <div className="tenant-radials">
          {points.map((point) => {
            const progress = Math.max(0, Math.min(100, Number(point?.progress || 0)));
            const dash = `${progress} ${100 - progress}`;
            return (
              <div className="tenant-radial-item" key={point?.label}>
                <svg viewBox="0 0 42 42" aria-hidden="true">
                  <circle className="tenant-radial-track" cx="21" cy="21" r="15.915" />
                  <circle
                    className="tenant-radial-progress"
                    cx="21"
                    cy="21"
                    r="15.915"
                    strokeDasharray={dash}
                    strokeDashoffset="25"
                  />
                </svg>
                <div>
                  <strong>{point?.label}</strong>
                  <span>{Number(point?.value || 0).toLocaleString()} interactions</span>
                </div>
                <em>{progress.toFixed(1)}%</em>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function TenantDonutChart({ chart }) {
  const points = Array.isArray(chart?.points) ? chart.points : [];
  const total = points.reduce((sum, point) => sum + Number(point?.value || 0), 0);

  return (
    <article className="tenant-analytics-card">
      <div className="tenant-analytics-card__header">
        <h3>{chart?.title || "Requests status distribution"}</h3>
        <p>Current requests split by status</p>
      </div>
      {!points.length ? (
        <p className="tenant-analytics-empty">No requests yet.</p>
      ) : (
        <div className="tenant-donut-wrap">
          <div
            className="tenant-donut"
            style={{
              background: buildConicGradient(points, total),
            }}
            role="img"
            aria-label="Requests status distribution"
          >
            <div>
              <strong>{total}</strong>
              <span>requests</span>
            </div>
          </div>
          <div className="tenant-donut-legend">
            {points.map((point) => {
              const value = Number(point?.value || 0);
              const percent = total ? (value / total) * 100 : 0;
              const tone = String(point?.tone || "neutral").toLowerCase();
              return (
                <span key={point?.label}>
                  <i className={`tenant-dot tenant-dot--${tone}`} />
                  {point?.label}: {value} ({percent.toFixed(0)}%)
                </span>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

function buildConicGradient(points, total) {
  const palette = {
    warning: "#f59e0b",
    success: "#16a34a",
    danger: "#dc2626",
    info: "#2563eb",
    neutral: "#94a3b8",
  };

  let cursor = 0;
  const segments = points.map((point) => {
    const tone = String(point?.tone || "neutral").toLowerCase();
    const color = palette[tone] || palette.neutral;
    const ratio = total > 0 ? Number(point?.value || 0) / total : 0;
    const start = cursor * 360;
    cursor += ratio;
    const end = cursor * 360;
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${segments.join(",")})`;
}

function TenantRankedContentChart({ chart }) {
  const points = Array.isArray(chart?.points) ? chart.points : [];

  return (
    <article className="tenant-analytics-card">
      <div className="tenant-analytics-card__header">
        <h3>{chart?.title || "Top content by interactions"}</h3>
        <p>Most engaged items for this organization</p>
      </div>
      {!points.length ? (
        <p className="tenant-analytics-empty">No ranked content yet.</p>
      ) : (
        <div className="tenant-ranked-list">
          {points.map((point, index) => (
            <div className="tenant-ranked-row" key={`${point?.label}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{point?.label}</strong>
                <small>{point?.type || "Content"}</small>
              </div>
              <em>{Number(point?.value || 0).toLocaleString()}</em>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function TenantTimeline({ activities }) {
  return (
    <article className="tenant-analytics-card tenant-analytics-card--wide">
      <div className="tenant-analytics-card__header">
        <h3>Recent activity timeline</h3>
        <p>Latest tenant events across users, content, and requests</p>
      </div>
      {!activities.length ? (
        <p className="tenant-analytics-empty">No recent activity available.</p>
      ) : (
        <div className="tenant-timeline">
          {activities.slice(0, 8).map((activity, index) => (
            <div key={`${activity?.type}-${index}`} className="tenant-timeline-row">
              <i className={`tenant-timeline-dot tenant-timeline-dot--${String(activity?.tone || "neutral").toLowerCase()}`} />
              <div>
                <strong>{activity?.title || "Activity"}</strong>
                <p>{activity?.description || ""}</p>
              </div>
              <time>{formatActivityDate(activity?.createdAt)}</time>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function TenantInsights({ insights }) {
  return (
    <article className="tenant-analytics-card">
      <div className="tenant-analytics-card__header">
        <h3>Smart insights</h3>
        <p>Automated signals based on your organization data</p>
      </div>
      {!insights.length ? (
        <p className="tenant-analytics-empty">No insights available.</p>
      ) : (
        <ul className="tenant-insights">
          {insights.map((insight, index) => (
            <li key={`${insight}-${index}`}>
              <OrgIcon name="sparkles" size={14} />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function formatActivityDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default OrganizationBackOfficePage;
