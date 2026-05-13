import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  getAllModuleRequests,
  getOrganizationAccessRequests,
  getSaasOrganizations,
  getSaasUsers,
} from "../services/saasService";
import { buildAuditLogs } from "../utils/saasDerivedData";
import { formatDateTime, formatNumber, getInitials, includesSearchValue } from "../utils/saasFormat";

function SaasAuditLogPage() {
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [organizationRequests, setOrganizationRequests] = useState([]);
  const [moduleRequests, setModuleRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [organizationsData, orgRequestsData, moduleRequestsData, usersData] = await Promise.all([
          getSaasOrganizations(),
          getOrganizationAccessRequests(),
          getAllModuleRequests(),
          getSaasUsers(),
        ]);

        setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
        setOrganizationRequests(Array.isArray(orgRequestsData) ? orgRequestsData : []);
        setModuleRequests(Array.isArray(moduleRequestsData) ? moduleRequestsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        setOrganizations([]);
        setOrganizationRequests([]);
        setModuleRequests([]);
        setUsers([]);
        setNotice({ tone: "danger", title: "Unable to load audit data", message: error.message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const auditLogs = useMemo(
    () => buildAuditLogs({ organizations, organizationRequests, moduleRequests, users }),
    [moduleRequests, organizationRequests, organizations, users]
  );

  const filteredLogs = useMemo(
    () =>
      auditLogs.filter((log) => {
        const searchMatches = includesSearchValue(log, searchTerm, [
          "actor",
          "role",
          "action",
          "targetOrganization",
          "targetObject",
          "ip",
        ]);
        const severityMatches = severityFilter === "ALL" || log.severity === severityFilter;
        const outcomeMatches = outcomeFilter === "ALL" || log.outcome === outcomeFilter;
        return searchMatches && severityMatches && outcomeMatches;
      }),
    [auditLogs, outcomeFilter, searchTerm, severityFilter]
  );

  const failed = auditLogs.filter((log) => log.outcome === "FAILED").length;
  const warnings = auditLogs.filter((log) => log.severity === "WARNING").length;
  const sensitiveActions = auditLogs.filter((log) => /payment|module|organization/i.test(log.action)).length;

  if (loading) return <SaasLoadingState label="Loading audit logs..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Security"
        title="Audit Log"
        description="Administrative trail for actions, outcomes, tenant access changes, and module access decisions."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Audit Log" }]}
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Audit metrics">
        <SaasStatCard label="Events" value={formatNumber(auditLogs.length)} detail="Admin and system actions" icon="activity" tone="blue" />
        <SaasStatCard label="Failures" value={formatNumber(failed)} detail="Action failures" icon="lock" tone={failed ? "amber" : "teal"} />
        <SaasStatCard label="Sensitive actions" value={formatNumber(sensitiveActions)} detail="Plan, tenant, and module changes" icon="shield" tone="amber" />
        <SaasStatCard label="Warnings" value={formatNumber(warnings)} detail="Needs review" icon="alert" tone={warnings ? "red" : "teal"} />
      </section>

      <section className="saas-toolbar" aria-label="Audit filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search audit logs">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search actor, action, organization..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select className="saas-select-field" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} aria-label="Filter by severity">
            <option value="ALL">All severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select className="saas-select-field" value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)} aria-label="Filter by outcome">
            <option value="ALL">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <span className="saas-table__muted">{formatNumber(filteredLogs.length)} events</span>
      </section>

      <section className="saas-panel">
        <div className="saas-table-wrap">
          <table className="saas-table saas-table--audit">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Target organization</th>
                <th>Target object</th>
                <th>Timestamp</th>
                <th>Outcome</th>
                <th>Severity</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="saas-identity">
                      <span className="saas-identity__avatar saas-identity__avatar--soft">{getInitials(log.actor)}</span>
                      <div className="saas-identity__content">
                        <strong>{log.actor}</strong>
                        <span>{log.role}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.targetOrganization}</td>
                  <td>{log.targetObject}</td>
                  <td>{formatDateTime(log.timestamp)}</td>
                  <td><SaasStatusBadge status={log.outcome} /></td>
                  <td><SaasStatusBadge status={log.severity} /></td>
                  <td><code>{log.ip}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default SaasAuditLogPage;
