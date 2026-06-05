import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SaasConfirmDialog from "../components/saas/SaasConfirmDialog";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import {
  createSaasModule,
  getSaasModuleCatalog,
  setSaasModuleActive,
  updateSaasModule,
} from "../services/saasService";
import { formatNumber, includesSearchValue } from "../utils/saasFormat";

const emptyForm = { code: "", name: "", description: "", scope: "BOTH", active: true };

function SaasModulesCatalogPage() {
  const [searchParams] = useSearchParams();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await getSaasModuleCatalog();
      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      setModules([]);
      setNotice({ tone: "danger", title: "Unable to load modules", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const filteredModules = useMemo(
    () =>
      modules.filter((module) => {
        const statusMatches =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && module.active) ||
          (statusFilter === "INACTIVE" && !module.active);
        const searchMatches = includesSearchValue(module, searchTerm, ["code", "name", "description"]);
        return statusMatches && searchMatches;
      }),
    [modules, searchTerm, statusFilter]
  );

  const available = modules.filter((module) => module.active).length;
  const disabled = modules.filter((module) => !module.active).length;
  const averageAdoption = useMemo(() => {
    if (!modules.length) return 0;
    return Math.round(
      modules.reduce((sum, module) => {
        const total = Number(module.totalOrganizations || 1);
        const usage = Number(module.organizationsUsing || 0);
        return sum + (usage / Math.max(total, 1)) * 100;
      }, 0) / modules.length
    );
  }, [modules]);

  const openCreate = () => {
    setEditingModule(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (module) => {
    setEditingModule(module);
    setForm({
      code: module.code,
      name: module.name,
      description: module.description || "",
      scope: module.scope || "BOTH",
      active: module.active,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingModule(null);
    setForm(emptyForm);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      if (editingModule) {
        await updateSaasModule(editingModule.id, form);
      } else {
        await createSaasModule(form);
      }
      closeForm();
      setNotice({ tone: "success", title: "Module saved", message: "Module changes were applied." });
      await loadModules();
    } catch (error) {
      setNotice({ tone: "danger", title: "Save failed", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!confirmation) return;
    setSaving(true);
    try {
      await setSaasModuleActive(confirmation.id, !confirmation.active);
      setConfirmation(null);
      setNotice({ tone: "success", title: "Module updated", message: "Global access setting was updated." });
      await loadModules();
    } catch (error) {
      setNotice({ tone: "danger", title: "Update failed", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SaasLoadingState label="Loading modules catalog..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Platform administration"
        title="Modules Catalog"
        description="Global module availability, rollout controls, and adoption across organizations."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Modules Catalog" }]}
        actions={
          <button type="button" className="saas-button saas-button--primary" onClick={openCreate}>
            <SaasIcon name="plus" size={16} />
            Create module
          </button>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-grid saas-grid--stats" aria-label="Module catalog metrics">
        <SaasStatCard label="Catalog modules" value={formatNumber(modules.length)} detail="Global feature catalog" icon="modules" tone="teal" />
        <SaasStatCard label="Active" value={formatNumber(available)} detail="Ready for tenant activation" icon="check" tone="blue" />
        <SaasStatCard label="Inactive" value={formatNumber(disabled)} detail="Disabled globally" icon="alert" tone="amber" />
        <SaasStatCard label="Avg adoption" value={`${averageAdoption}%`} detail="Across organizations" icon="trend" tone="blue" />
      </section>

      <section className="saas-toolbar" aria-label="Module catalog filters">
        <div className="saas-toolbar__filters">
          <label className="saas-search-field" aria-label="Search modules catalog">
            <SaasIcon name="search" size={17} />
            <input
              type="search"
              placeholder="Search module code, name, description..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
            className="saas-select-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter module status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <span className="saas-table__muted">{formatNumber(filteredModules.length)} module(s)</span>
      </section>

      <section className="saas-module-catalog-grid" aria-label="Global modules">
        {filteredModules.map((module) => {
          const usagePercent = Math.round(
            (Number(module.organizationsUsing || 0) / Math.max(Number(module.totalOrganizations || 1), 1)) * 100
          );

          return (
            <article className="saas-module-catalog-card" key={module.code}>
              <header className="saas-module-catalog-card__header">
                <span className="saas-module-catalog-card__icon">
                  <SaasIcon name={getModuleIcon(module.code)} size={22} />
                </span>
                <div>
                  <h2>{module.name}</h2>
                  <p>{module.description}</p>
                </div>
                <SaasStatusBadge status={module.active ? "ACTIVE" : "INACTIVE"} />
              </header>

              <div className="saas-meter">
                <div className="saas-meter__header">
                  <span>Adoption</span>
                  <strong>
                    {formatNumber(module.organizationsUsing || 0)} / {formatNumber(module.totalOrganizations || 0)} orgs
                  </strong>
                </div>
                <span className="saas-meter__track">
                  <span className="saas-meter__fill" style={{ width: `${usagePercent}%` }} />
                </span>
              </div>

              <div className="saas-card-meta-row">
                <span>{module.code}</span>
                <span>{module.scope || "BOTH"}</span>
                <label className="saas-toggle-row saas-toggle-row--compact">
                  <input
                    type="checkbox"
                    checked={!!module.active}
                    onChange={() => setConfirmation({ id: module.id, active: module.active, name: module.name })}
                  />
                  <span />
                  Global access
                </label>
              </div>

              <footer className="saas-module-catalog-card__actions">
                <button type="button" className="saas-button saas-button--outline" onClick={() => openEdit(module)}>
                  Manage
                </button>
              </footer>
            </article>
          );
        })}
      </section>

      {formOpen && (
        <div className="saas-modal-backdrop" role="presentation">
          <section className="saas-modal" role="dialog" aria-modal="true">
            <div className="saas-modal__header">
              <div><h2>{editingModule ? "Edit module" : "Create module"}</h2><p>Manage module code, name, and availability.</p></div>
              <button type="button" className="saas-icon-button" onClick={closeForm}><SaasIcon name="close" size={16} /></button>
            </div>
            <form className="saas-modal__body" onSubmit={submitForm}>
              <div className="saas-form__grid">
                <Field label="Code" value={form.code} onChange={(value) => setForm((prev) => ({ ...prev, code: value.toUpperCase() }))} disabled={!!editingModule} />
                <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
                <label className="saas-form__field saas-form__field--full"><span>Description</span><textarea className="saas-textarea-field" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
                <label className="saas-form__field">
                  <span>Scope</span>
                  <select
                    className="saas-select-field"
                    value={form.scope}
                    onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))}
                  >
                    <option value="FRONT_OFFICE">Front-office</option>
                    <option value="BACK_OFFICE">Back-office</option>
                    <option value="BOTH">Both</option>
                    <option value="SAAS_ONLY">SaaS only</option>
                  </select>
                </label>
                <label className="saas-toggle-row"><input type="checkbox" checked={!!form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} /><span />Module is active</label>
              </div>
              <div className="saas-form__actions">
                <button type="button" className="saas-button saas-button--ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="saas-button saas-button--primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <SaasConfirmDialog
        open={!!confirmation}
        title={confirmation?.active ? "Disable module globally?" : "Enable module globally?"}
        message={confirmation ? `${confirmation.name} will be ${confirmation.active ? "disabled" : "enabled"} globally.` : ""}
        confirmLabel={confirmation?.active ? "Disable" : "Enable"}
        tone={confirmation?.active ? "danger" : "success"}
        busy={saving}
        onConfirm={toggleActive}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}

function Field({ label, value, onChange, disabled = false }) {
  return (
    <label className="saas-form__field">
      <span>{label}</span>
      <input className="saas-input-field" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required />
    </label>
  );
}

function getModuleIcon(code) {
  const iconMap = {
    VOTE: "check",
    CONFERENCE: "requests",
    YOUTHSPACE: "users",
    EVENTS: "calendar",
    SURVEYS: "file",
    COMPLAINTS: "alert",
    NEWS: "book",
    ANALYTICS: "chart",
  };

  return iconMap[code] || "modules";
}

export default SaasModulesCatalogPage;
