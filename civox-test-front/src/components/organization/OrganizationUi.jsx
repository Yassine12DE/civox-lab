import { Link } from "react-router-dom";
import "../../styles/organizationUi.css";

const iconPaths = {
  activity: [
    "M22 12h-4l-3 9L9 3l-3 9H2",
  ],
  alert: [
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
    "M12 9v4",
    "M12 17h.01",
  ],
  arrowDown: ["M12 5v14", "M19 12l-7 7-7-7"],
  arrowLeft: ["M19 12H5", "M12 19l-7-7 7-7"],
  arrowRight: ["M5 12h14", "M12 5l7 7-7 7"],
  arrowUp: ["M12 19V5", "M5 12l7-7 7 7"],
  barChart: ["M3 3v18h18", "M8 17V9", "M13 17V5", "M18 17v-3"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7", "M13.73 21a2 2 0 0 1-3.46 0"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"],
  check: ["M20 6 9 17l-5-5"],
  checkCircle: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
  chevronDown: ["M6 9l6 6 6-6"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 6v6l4 2"],
  copy: ["M8 8h12v12H8Z", "M4 16V4h12"],
  dashboard: ["M3 13h8V3H3Z", "M13 21h8V11h-8Z", "M13 3v6h8V3Z", "M3 21h8v-6H3Z"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  edit: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  filter: ["M22 3H2l8 9.46V19l4 2v-8.54Z"],
  home: ["M3 11 12 3l9 8", "M5 10v11h14V10", "M9 21v-6h6v6"],
  image: ["M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14", "M21 15l-5-5L5 21", "M9 9h.01"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 16v-4", "M12 8h.01"],
  layers: ["M12 2 2 7l10 5 10-5Z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  mail: ["M4 4h16v16H4Z", "m22 6-10 7L2 6"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  message: ["M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"],
  palette: ["M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-1.5a2 2 0 0 0-2 2c0 .8.5 1.3.5 2 0 1.7-1.8 3-4 3Z", "M7.5 10.5h.01", "M10.5 7.5h.01", "M14.5 7.5h.01", "M17 11h.01"],
  plus: ["M12 5v14", "M5 12h14"],
  power: ["M12 2v10", "M18.4 6.6a9 9 0 1 1-12.8 0"],
  powerOff: ["M2 2l20 20", "M12 2v4", "M18.4 6.6A9 9 0 0 1 8 20.1", "M5.6 6.6A9 9 0 0 0 12 21"],
  rotate: ["M3 12a9 9 0 1 0 3-6.7", "M3 4v6h6"],
  save: ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z", "M17 21v-8H7v8", "M7 3v5h8"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M21 21l-4.35-4.35"],
  settings: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.3.2.6.4 1 .6.5.2 1.1.1 1.6-.1h.1a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.82.33c-.26.31-.43.7-.49 1.17Z"],
  share: ["M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .17 1L8.9 8.7a3 3 0 1 0 0 6.6l6.27 3.7A3 3 0 1 0 16 17.3L9.73 13.6a3.1 3.1 0 0 0 0-3.2L16 6.7A3 3 0 0 0 18 8Z"],
  sparkles: ["M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7Z", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z", "M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
  trending: ["M3 17 9 11l4 4 8-8", "M14 7h7v7"],
  type: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  userPlus: ["M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M20 8v6", "M23 11h-6"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M20 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  vote: ["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
  x: ["M18 6 6 18", "M6 6l12 12"],
};

export function OrgIcon({ name, className = "", size = 20, strokeWidth = 2 }) {
  const paths = iconPaths[name] || iconPaths.file;

  return (
    <svg
      className={`org-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export function OrganizationLogoMark({ organization, logoUrl, size = "md", className = "" }) {
  const initial = organization?.name?.trim()?.charAt(0)?.toUpperCase() || "C";

  return (
    <span
      className={`org-ui-logo org-ui-logo--${size} ${logoUrl ? "org-ui-logo--image" : ""} ${className}`.trim()}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={organization?.name || "Organization"} />
      ) : (
        initial
      )}
    </span>
  );
}

export function OrganizationPageHeader({
  eyebrow,
  title,
  description,
  organization,
  logoUrl,
  actions,
  meta,
  variant = "front",
}) {
  return (
    <section className={`org-ui-page-header org-ui-page-header--${variant}`}>
      <div className="org-ui-page-header__content">
        <div className="org-ui-page-header__brandline">
          {organization && <OrganizationLogoMark organization={organization} logoUrl={logoUrl} />}
          <div>
            {eyebrow && <p className="org-ui-eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
          </div>
        </div>
        {description && <p className="org-ui-page-header__description">{description}</p>}
      </div>

      {(meta || actions) && (
        <div className="org-ui-page-header__aside">
          {meta && <div className="org-ui-page-header__meta">{meta}</div>}
          {actions && <div className="org-ui-page-header__actions">{actions}</div>}
        </div>
      )}
    </section>
  );
}

export function OrganizationSectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="org-ui-section-header">
      <div>
        {eyebrow && <p className="org-ui-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="org-ui-section-header__action">{action}</div>}
    </div>
  );
}

export function OrganizationPanel({ children, className = "", tone = "light" }) {
  return (
    <section className={`org-ui-panel org-ui-panel--${tone} ${className}`.trim()}>
      {children}
    </section>
  );
}

export function OrganizationMetricCard({ value, label, detail, tone = "neutral", icon }) {
  return (
    <article className={`org-ui-metric org-ui-metric--${tone}`}>
      {icon && (
        <span className="org-ui-metric__icon">
          <OrgIcon name={icon} size={24} />
        </span>
      )}
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <p>{detail}</p>}
    </article>
  );
}

export function OrganizationActionPanel({
  icon,
  iconName,
  title,
  description,
  to,
  actionLabel,
  meta,
  children,
  tone = "neutral",
}) {
  const iconContent = iconName ? <OrgIcon name={iconName} size={24} /> : icon;
  const body = (
    <>
      <div className="org-ui-action-panel__top">
        {iconContent && <span className="org-ui-action-panel__icon">{iconContent}</span>}
        {meta && <div className="org-ui-action-panel__meta">{meta}</div>}
      </div>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children}
      {actionLabel && <span className="org-ui-action-panel__cta">{actionLabel}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`org-ui-action-panel org-ui-action-panel--${tone}`}>
        {body}
      </Link>
    );
  }

  return <article className={`org-ui-action-panel org-ui-action-panel--${tone}`}>{body}</article>;
}

export function OrganizationEmptyState({ title, message, actionLabel, actionTo, icon = "search" }) {
  return (
    <div className="org-ui-empty-state">
      <span className="org-ui-empty-state__icon" aria-hidden="true">
        <OrgIcon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="org-ui-button org-ui-button--primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function OrganizationNotice({ tone = "info", children }) {
  return <p className={`org-ui-notice org-ui-notice--${tone}`}>{children}</p>;
}

export function OrganizationStatusPill({ tone = "neutral", icon, children }) {
  return (
    <span className={`org-ui-status org-ui-status--${tone}`}>
      {icon && <OrgIcon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function OrganizationLoadingState({
  title = "Loading workspace",
  message = "Preparing the latest tenant data.",
  busy = true,
}) {
  return (
    <div className="org-ui-loading-state">
      <span className={`org-ui-loading-state__mark ${busy ? "" : "org-ui-loading-state__mark--static"}`.trim()} />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function PremiumIconTile({ icon, tone = "primary", className = "" }) {
  return (
    <span className={`premium-icon-tile premium-icon-tile--${tone} ${className}`.trim()}>
      <OrgIcon name={icon} size={26} />
    </span>
  );
}

export function PremiumStatusBadge({ status, children }) {
  const normalized = String(status || "neutral").toLowerCase();
  const tone =
    normalized.includes("closing") || normalized.includes("pending") || normalized.includes("soon")
      ? "warning"
      : normalized.includes("active") || normalized.includes("published") || normalized.includes("visible")
        ? "success"
        : normalized.includes("draft") || normalized.includes("hidden") || normalized.includes("inactive")
          ? "neutral"
          : "info";
  const icon =
    tone === "success"
      ? "checkCircle"
      : tone === "warning"
        ? "alert"
        : normalized.includes("draft") || normalized.includes("hidden")
          ? "powerOff"
          : "clock";

  return (
    <span className={`premium-status premium-status--${tone}`}>
      <OrgIcon name={icon} size={14} />
      {children || status}
    </span>
  );
}

export function PremiumStatCard({ icon, label, value, tone = "primary", detail, change, trend }) {
  return (
    <article className="premium-stat-card">
      <div className="premium-stat-card__top">
        <PremiumIconTile icon={icon} tone={tone} />
        {change && (
          <span className={`premium-change premium-change--${trend === "down" ? "down" : "up"}`}>
            <OrgIcon name={trend === "down" ? "arrowDown" : "arrowUp"} size={12} />
            {change}
          </span>
        )}
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <p>{detail}</p>}
    </article>
  );
}
