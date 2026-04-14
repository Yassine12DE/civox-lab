import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { modules as moduleCatalog } from "../data/modules";
import {
  getSaasOrganizationBySlug,
  getSaasOrganizationModules,
  grantModuleToOrganization,
  removeModuleFromOrganization,
} from "../services/saasService";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import { formatNumber, includesSearchValue } from "../utils/saasFormat";

function buildModuleRows(grantedModules) {
  return moduleCatalog.map((module) => {
    const grantedModule = grantedModules.find(
      (item) => item.moduleCode === module.code && item.grantedBySaas
    );

    return {
      ...module,
      isGranted: !!grantedModule,
      enabledByOrganization: !!grantedModule?.enabledByOrganization,
      displayOrder: grantedModule?.displayOrder,
    };
  });
}

function SaasManageModulesPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [grantedModules, setGrantedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmation, setConfirmation] = useState(null);
  const [savingCode, setSavingCode] = useState("");

  const loadData = useCallback(async () => {
    setError("");

    try {
      const org = await getSaasOrganizationBySlug(slug);
      setOrganization(org || null);

      if (org?.id) {
        const modulesData = await getSaasOrganizationModules(org.id);
        setGrantedModules(modulesData);
      } else {
        setGrantedModules([]);
      }
    } catch {
      setError("Module access could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const moduleRows = useMemo(() => buildModuleRows(grantedModules), [grantedModules]);
  const filteredModules = useMemo(
    () =>
      moduleRows.filter((module) => {
        const statusMatches =
          statusFilter === "ALL" ||
          (statusFilter === "GRANTED" && module.isGranted) ||
          (statusFilter === "NOT_GRANTED" && !module.isGranted);
        const searchMatches = includesSearchValue(module, searchTerm, [
          "name",
          "code",
          "description",
        ]);

        return statusMatches && searchMatches;
      }),
    [moduleRows, searchTerm, statusFilter]
  );

  const grantedCount = moduleRows.filter((module) => module.isGranted).length;
  const enabledCount = moduleRows.filter((module) => module.enabledByOrganization).length;

  const openConfirmation = (module) => {
    setConfirmation(module);
  };

  const handleToggleModule = async () => {
    if (!organization?.id || !confirmation) return;

    setSavingCode(confirmation.code);
    setNotice(null);

    try {
      if (confirmation.isGranted) {
        await removeModuleFromOrganization(organization.id, confirmation.code);
      } else {
        await grantModuleToOrganization(organization.id, confirmation.code);
      }

      const modulesData = await getSaasOrganizationModules(organization.id);
      setGrantedModules(modulesData);
      setNotice({
        tone: "success",
        title: confirmation.isGranted ? "Module removed" : "Module granted",
        message: `${confirmation.name} was ${
          confirmation.isGranted ? "removed from" : "granted to"
        } ${organization.name}.`,
      });
      setConfirmation(null);
    } catch {
      setNotice({
        tone: "danger",
        title: "Module update failed",
        message: "The module access change could not be saved. Please try again.",
      });
    } finally {
      setSavingCode("");
    }
  };

  if (loading) return <SaasLoadingState label="Loading module access..." />;

  if (!organization) {
    return (
      <div className="saas-page-stack">
        <SaasPageHeader
          eyebrow="Module access"
          title="Organization not found"
          breadcrumbs={[
            { label: "Dashboard", to: "/saas" },
            { label: "Organizations", to: "/saas/organizations" },
            { label: "Module Access" },
          ]}
        />
        <SaasEmptyState
          icon="modules"
          title="This organization could not be found"
          message={error || "Return to the organization directory to choose another tenant."}
          action={
            <Link to="/saas/organizations" className="saas-button saas-button--primary">
              Back to organizations
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Module access"
        title={`${organization.name} modules`}
        description="Grant or remove platform modules for this tenant while keeping tenant-side visibility separate."
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: "Organizations", to: "/saas/organizations" },
          { label: organization.name, to: `/saas/organizations/${organization.slug}` },
          { label: "Modules" },
        ]}
        actions={
          <>
            <Link
              to={`/saas/organizations/${organization.slug}`}
              className="saas-button saas-button--secondary"
            >
              Organization profile
            </Link>
            <Link to="/saas/module-requests" className="saas-button saas-button--primary">
              Review requests
            </Link>
          </>
        }
      />

      {error && (
        <SaasNotice
          tone="danger"
          title="Module access warning"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {notice && (
        <SaasNotice
          tone={notice.tone}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <section className="saas-grid saas-grid--stats" aria-label="Module access metrics">
        <SaasStatCard
          label="Catalog modules"
          value={formatNumber(moduleRows.length)}
          detail="Available in platform catalog"
          icon="modules"
          tone="teal"
        />
        <SaasStatCard
          label="Granted"
          value={formatNumber(grantedCount)}
          detail="Accessible to this tenant"
          icon="check"
          tone="blue"
        />
        <SaasStatCard
          label="Not granted"
          value={formatNumber(moduleRows.length - grantedCount)}
          detail="Hidden from this tenant"
          icon="alert"
          tone="amber"
        />
        <SaasStatCard
          label="Enabled by tenant"
          value={formatNumber(enabledCount)}
          detail="Visible inside the tenant back-office"
          icon="activity"
          tone="blue"
        />
      </section>

      <section className="saas-toolbar" aria-label="Module filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search modules">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search module name or code..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select
            className="saas-select-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by module access"
          >
            <option value="ALL">All modules</option>
            <option value="GRANTED">Granted</option>
            <option value="NOT_GRANTED">Not granted</option>
          </select>
        </div>

        <span className="saas-table__muted">
          {formatNumber(filteredModules.length)} module
          {filteredModules.length === 1 ? "" : "s"}
        </span>
      </section>

      {filteredModules.length > 0 ? (
        <section className="saas-module-card-grid" aria-label="Modules">
          {filteredModules.map((module) => (
            <article className="saas-module-card" key={module.code}>
              <div className="saas-module-card__header">
                <div>
                  <h2>{module.name}</h2>
                  <p>{module.description}</p>
                </div>
                <SaasStatusBadge
                  status={module.isGranted ? "GRANTED" : "NOT_GRANTED"}
                  label={module.isGranted ? "Granted" : "Not granted"}
                />
              </div>

              <div className="saas-module-card__meta">
                <SaasStatusBadge status={module.code} label={module.code} tone="info" />
                <SaasStatusBadge
                  status={module.enabledByOrganization ? "ENABLED" : "DISABLED"}
                  label={module.enabledByOrganization ? "Tenant enabled" : "Tenant disabled"}
                  tone={module.enabledByOrganization ? "success" : "neutral"}
                />
              </div>

              <button
                type="button"
                className={`saas-button ${module.isGranted ? "saas-button--danger" : "saas-button--primary"}`}
                onClick={() => openConfirmation(module)}
                disabled={savingCode === module.code}
              >
                {savingCode === module.code
                  ? "Saving..."
                  : module.isGranted
                    ? "Remove module"
                    : "Grant module"}
              </button>
            </article>
          ))}
        </section>
      ) : (
        <SaasEmptyState
          icon="search"
          title="No modules match these filters"
          message="Adjust the search term or access filter to find another module."
        />
      )}

      <SaasConfirmDialog
        open={!!confirmation}
        title={confirmation?.isGranted ? "Remove module access?" : "Grant module access?"}
        message={
          confirmation
            ? `${organization.name} will ${
                confirmation.isGranted ? "lose access to" : "receive access to"
              } ${confirmation.name}.`
            : ""
        }
        confirmLabel={confirmation?.isGranted ? "Remove module" : "Grant module"}
        tone={confirmation?.isGranted ? "danger" : "primary"}
        busy={!!savingCode}
        onConfirm={handleToggleModule}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}

export default SaasManageModulesPage;
