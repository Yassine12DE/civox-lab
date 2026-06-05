import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getSaasModuleCatalog,
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

function buildModuleRows(moduleCatalog, grantedModules) {
  const grantedByCode = new Map(
    grantedModules.map((module) => [module.moduleCode, module])
  );

  return moduleCatalog.map((module) => {
    const grantedModule = grantedByCode.get(module.code);

    return {
      id: module.id,
      code: module.code,
      name: module.name,
      description: module.description,
      scope: module.scope || "BOTH",
      isGranted: !!grantedModule?.grantedBySaas,
      enabledByOrganization: !!grantedModule?.enabledByOrganization,
      displayOrder: grantedModule?.displayOrder ?? null,
    };
  });
}

function SaasManageModulesPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [grantedModules, setGrantedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmation, setConfirmation] = useState(null);
  const [savingModuleId, setSavingModuleId] = useState(null);

  const refreshGrantedModules = useCallback(async (organizationId) => {
    const modulesData = await getSaasOrganizationModules(organizationId);
    setGrantedModules(Array.isArray(modulesData) ? modulesData : []);
    setDataReady(true);
    return modulesData;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice(null);
    setDataReady(false);

    try {
      const [org, catalog] = await Promise.all([
        getSaasOrganizationBySlug(slug),
        getSaasModuleCatalog(),
      ]);

      setOrganization(org || null);
      setModuleCatalog(Array.isArray(catalog) ? catalog : []);

      if (!org) {
        setGrantedModules([]);
        return;
      }

      await refreshGrantedModules(org.id);
    } catch (loadError) {
      setGrantedModules([]);
      setError(loadError.message || "Module access could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [refreshGrantedModules, slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const moduleRows = useMemo(
    () => buildModuleRows(moduleCatalog, grantedModules),
    [grantedModules, moduleCatalog]
  );
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
    if (!dataReady || savingModuleId) return;
    setConfirmation(module);
  };

  const handleToggleModule = async () => {
    if (!organization?.id || !confirmation?.id) return;

    setSavingModuleId(confirmation.id);
    setNotice(null);

    try {
      const updatedModules = confirmation.isGranted
        ? await removeModuleFromOrganization(organization.id, confirmation.id)
        : await grantModuleToOrganization(organization.id, confirmation.id);

      setGrantedModules(Array.isArray(updatedModules) ? updatedModules : []);
      setDataReady(true);
      setNotice({
        tone: "success",
        title: confirmation.isGranted ? "Module disabled" : "Module enabled",
        message: `${confirmation.name} was ${
          confirmation.isGranted ? "removed from" : "granted to"
        } ${organization.name}.`,
      });
      setConfirmation(null);
    } catch (actionError) {
      try {
        await refreshGrantedModules(organization.id);
      } catch {
        setDataReady(false);
      }

      setNotice({
        tone: "danger",
        title: "Module update failed",
        message:
          actionError.message ||
          "The module access change could not be saved. Please try again.",
      });
    } finally {
      setSavingModuleId(null);
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
          title="This organization could not be loaded"
          message={error || "Return to the organization directory to choose another tenant."}
          action={
            <Link to="/saas/organizations" className="saas-button saas-button--outline">
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
              className="saas-button saas-button--outline"
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
          title="Module access unavailable"
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

      {!dataReady ? (
        <SaasEmptyState
          icon="alert"
          title="Module access could not be verified"
          message="Retry loading this tenant before changing its module assignments."
          action={
            <button type="button" className="saas-button saas-button--primary" onClick={loadData}>
              Retry
            </button>
          }
        />
      ) : (
        <>
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
                    <SaasStatusBadge status={module.scope} label={module.scope} tone="neutral" />
                    <SaasStatusBadge
                      status={module.enabledByOrganization ? "ENABLED" : "DISABLED"}
                      label={module.enabledByOrganization ? "Tenant enabled" : "Tenant disabled"}
                      tone={module.enabledByOrganization ? "success" : "neutral"}
                    />
                  </div>

                  <button
                    type="button"
                    className={`saas-button ${module.isGranted ? "saas-button--danger" : "saas-button--success"}`}
                    onClick={() => openConfirmation(module)}
                    disabled={savingModuleId !== null}
                  >
                    {savingModuleId === module.id
                      ? "Saving..."
                      : module.isGranted
                        ? "Disable module"
                        : "Enable module"}
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
        </>
      )}

      <SaasConfirmDialog
        open={!!confirmation}
        title={confirmation?.isGranted ? "Disable module access?" : "Enable module access?"}
        message={
          confirmation
            ? `${organization.name} will ${
                confirmation.isGranted ? "lose access to" : "receive access to"
              } ${confirmation.name}.`
            : ""
        }
        confirmLabel={confirmation?.isGranted ? "Disable module" : "Enable module"}
        tone={confirmation?.isGranted ? "danger" : "success"}
        busy={savingModuleId !== null}
        onConfirm={handleToggleModule}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}

export default SaasManageModulesPage;
