import { useState } from "react";
import { Link } from "react-router-dom";
import { OrgIcon } from "./organization/OrganizationUi";

const INITIAL_ITEM_COUNT = 4;

function ChatStructuredResult({ payload }) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const modules = Array.isArray(payload?.moduleActivity) ? payload.moduleActivity : [];
  const visibleItems = showAllItems ? items : items.slice(0, INITIAL_ITEM_COUNT);
  const visibleModules = showAllModules ? modules : modules.slice(0, INITIAL_ITEM_COUNT);

  if (!payload) return null;

  return (
    <section className="civox-result" aria-label={payload.header?.title || "CIVOX result"}>
      {payload.header && (
        <header className="civox-result__header">
          <span className="civox-result__mark"><OrgIcon name={headerIcon(payload.type)} size={18} /></span>
          <div>
            <h3>{payload.header.title}</h3>
            {payload.header.subtitle && <p>{payload.header.subtitle}</p>}
            {payload.header.freshness && <small>{payload.header.freshness}</small>}
          </div>
        </header>
      )}

      <KpiGrid kpis={payload.kpis} />

      {payload.secondaryKpis?.length > 0 && (
        <details className="civox-result__details">
          <summary>View all metrics</summary>
          <KpiGrid kpis={payload.secondaryKpis} secondary />
        </details>
      )}

      {payload.insights?.length > 0 && (
        <ResultSection title="Insights" icon="sparkles">
          <div className="civox-result__insights">
            {payload.insights.map((insight, index) => (
              <p key={`${index}-${insight.slice(0, 18)}`}><OrgIcon name="trending" size={15} />{insight}</p>
            ))}
          </div>
        </ResultSection>
      )}

      {payload.charts?.length > 0 && (
        <ResultSection title="Main results" icon="barChart">
          <div className="civox-result__charts">
            {payload.charts.slice(0, 2).map((chart, index) => <ResultChart chart={chart} key={`${index}-${chart.title}`} />)}
            {payload.charts.length > 2 && (
              <details className="civox-result__inline-details">
                <summary>Show {payload.charts.length - 2} more result sections</summary>
                {payload.charts.slice(2).map((chart, index) => <ResultChart chart={chart} key={`${index}-${chart.title}`} />)}
              </details>
            )}
          </div>
        </ResultSection>
      )}

      {payload.moduleActivity?.length > 0 && (
        <ResultSection title="Module activity" icon="activity">
          <div className="civox-result__modules">
            {visibleModules.map((module) => (
              <article className="civox-result__module" key={module.code || module.name}>
                <span className="civox-result__module-icon"><OrgIcon name={moduleIcon(module.code)} size={16} /></span>
                <div>
                  <strong>{module.name}</strong>
                  <small>{plural(module.contentCount, "content item")} · {plural(module.interactionCount, "interaction")}</small>
                  <div className="civox-result__bar" aria-hidden="true">
                    <i style={{ width: `${clamp(module.activityShare)}%` }} />
                  </div>
                  {module.abnormalMetric && <em>{module.metricLabel}: {module.metricValue}</em>}
                </div>
              </article>
            ))}
            {payload.inactiveModuleCount > 0 && (
              <p className="civox-result__muted">
                {plural(payload.inactiveModuleCount, "other module")} currently {payload.inactiveModuleCount === 1 ? "has" : "have"} no recorded activity.
              </p>
            )}
            {modules.length > INITIAL_ITEM_COUNT && (
              <button className="civox-result__more" type="button" onClick={() => setShowAllModules((value) => !value)}>
                {showAllModules ? "Show fewer modules" : `Show ${modules.length - INITIAL_ITEM_COUNT} more active modules`}
                <OrgIcon name="chevronDown" size={15} />
              </button>
            )}
          </div>
        </ResultSection>
      )}

      {items.length > 0 && (
        <div className="civox-result__items">
          {visibleItems.map((item, index) => <ResultItem item={item} key={`${item.id || index}-${item.title}`} />)}
          {items.length > INITIAL_ITEM_COUNT && (
            <button className="civox-result__more" type="button" onClick={() => setShowAllItems((value) => !value)}>
              {showAllItems ? "Show less" : `Show ${items.length - INITIAL_ITEM_COUNT} more`}
              <OrgIcon name="chevronDown" size={15} />
            </button>
          )}
        </div>
      )}

      {payload.alerts?.length > 0 && (
        <ResultSection title="Needs attention" icon="alert" tone="warning">
          <div className="civox-result__alerts">
            {payload.alerts.map((alert, index) => (
              <article key={`${index}-${alert.title}`}>
                <OrgIcon name="alert" size={16} />
                <div><strong>{alert.title}</strong><p>{alert.message}</p></div>
              </article>
            ))}
          </div>
        </ResultSection>
      )}

      {payload.actions?.length > 0 && (
        <nav className="civox-result__actions" aria-label="Result actions">
          {payload.actions.filter((action) => safeRoute(action.route)).map((action) => (
            <Link to={action.route} key={`${action.route}-${action.label}`}>
              <OrgIcon name={action.icon || "arrowRight"} size={15} />
              {action.label}
              <OrgIcon name="arrowRight" size={14} />
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}

function KpiGrid({ kpis, secondary = false }) {
  if (!kpis?.length) return null;
  return (
    <div className={`civox-result__kpis ${secondary ? "civox-result__kpis--secondary" : ""}`}>
      {kpis.map((kpi) => (
        <article className={`civox-result__kpi civox-result__kpi--${safeTone(kpi.tone)}`} key={kpi.key || kpi.label}>
          <span><OrgIcon name={kpi.icon || "barChart"} size={16} /></span>
          <strong>{kpi.value}</strong>
          <p>{kpi.label}</p>
          {kpi.supportingText && <small>{kpi.supportingText}</small>}
          {kpi.trend === "up" && <i aria-label="Trending up"><OrgIcon name="trending" size={13} /></i>}
        </article>
      ))}
    </div>
  );
}

function ResultSection({ title, icon, tone = "default", children }) {
  return (
    <section className={`civox-result__section civox-result__section--${tone}`}>
      <h4><OrgIcon name={icon} size={16} />{title}</h4>
      {children}
    </section>
  );
}

function ResultChart({ chart }) {
  return (
    <article className="civox-result__chart">
      <header><strong>{chart.title}</strong>{chart.subtitle && <small>{chart.subtitle}</small>}</header>
      {chart.points?.map((point) => (
        <div className="civox-result__chart-row" key={point.label}>
          <span><b>{point.label}</b><em>{formatPercentage(point.percentage)} · {point.value}</em></span>
          <div className="civox-result__bar"><i style={{ width: `${clamp(point.percentage)}%` }} /></div>
        </div>
      ))}
    </article>
  );
}

function ResultItem({ item }) {
  const route = safeRoute(item.route);
  return (
    <article className="civox-result__item">
      <span className="civox-result__item-icon"><OrgIcon name={item.icon || "file"} size={17} /></span>
      <div className="civox-result__item-body">
        <header><strong>{item.title}</strong>{item.subtitle && <small>{item.subtitle}</small>}</header>
        {item.statuses?.length > 0 && (
          <div className="civox-result__chips">
            {item.statuses.filter((status) => status?.label).map((status, index) => (
              <span className={`civox-result__chip civox-result__chip--${safeTone(status.tone)}`} key={`${index}-${status.label}`}>{status.label}</span>
            ))}
          </div>
        )}
        {item.description && <p>{item.description}</p>}
        {item.meta?.map((meta, index) => (
          <small className="civox-result__meta" key={`${index}-${meta.label}`}>
            <OrgIcon name={meta.icon || "info"} size={13} />{meta.label}: {formatMeta(meta.value)}
          </small>
        ))}
        {route && <Link className="civox-result__item-action" to={route}>{item.actionLabel || "Open"}<OrgIcon name="arrowRight" size={13} /></Link>}
      </div>
    </article>
  );
}

function headerIcon(type) {
  if (type === "analytics") return "dashboard";
  if (type === "users" || type === "user-summary") return "users";
  if (type?.includes("survey")) return "file";
  if (type?.includes("module")) return "layers";
  return "sparkles";
}

function moduleIcon(code) {
  const normalized = String(code || "").toUpperCase();
  if (normalized === "VOTE") return "vote";
  if (normalized === "CONFERENCE") return "message";
  if (normalized === "SURVEYS") return "file";
  return "layers";
}

function safeRoute(route) {
  return typeof route === "string" && route.startsWith("/") && !route.startsWith("//") ? route : null;
}

function safeTone(tone) {
  return ["success", "warning", "danger", "primary", "neutral"].includes(tone) ? tone : "neutral";
}

function clamp(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
}

function formatPercentage(value) {
  const number = Number(value);
  return `${Number.isInteger(number) ? number : number.toFixed(1)}%`;
}

function formatMeta(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export default ChatStructuredResult;
