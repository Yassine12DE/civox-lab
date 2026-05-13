import { useEffect, useState } from "react";
import SaasIcon from "../components/saas/SaasIcon";
import SaasLoadingState from "../components/saas/SaasLoadingState";
import SaasNotice from "../components/saas/SaasNotice";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatusBadge from "../components/saas/SaasStatusBadge";
import { getSaasSettings, updateSaasSettings } from "../services/saasService";

function SaasSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSaasSettings();
      setSettings(data);
      setOriginal(data);
    } catch (error) {
      setSettings(null);
      setOriginal(null);
      setNotice({ tone: "danger", title: "Unable to load settings", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveAll = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateSaasSettings(settings);
      setSettings(updated);
      setOriginal(updated);
      setNotice({ tone: "success", title: "Settings saved", message: "Platform settings were updated." });
    } catch (error) {
      setNotice({ tone: "danger", title: "Save failed", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const resetKeys = (keys) => {
    if (!settings || !original) return;
    setSettings((current) => {
      const next = { ...current };
      keys.forEach((key) => {
        next[key] = original[key];
      });
      return next;
    });
  };

  if (loading) return <SaasLoadingState label="Loading platform settings..." />;

  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow="Platform administration"
        title="Settings"
        description="Global defaults for branding, tenant creation, email, security, modules, maintenance, and notifications."
        breadcrumbs={[{ label: "Dashboard", to: "/saas" }, { label: "Settings" }]}
        actions={
          <button type="button" className="saas-button saas-button--primary" onClick={saveAll} disabled={saving}>
            <SaasIcon name="save" size={16} />
            {saving ? "Saving..." : "Save all"}
          </button>
        }
      />

      {notice && <SaasNotice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <section className="saas-settings-layout">
        <aside className="saas-settings-nav" aria-label="Settings sections">
          {[
            "General",
            "Branding",
            "Email",
            "Security",
            "Tenant defaults",
            "Notifications",
          ].map((item, index) => (
            <a href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className={index === 0 ? "active" : ""} key={item}>
              {item}
            </a>
          ))}
        </aside>

        <div className="saas-settings-stack">
          <SettingsCard id="general" icon="globe" title="General platform settings" badge="Production" onReset={() => resetKeys(["platformName", "supportEmail", "publicDomain", "defaultLocale", "platformDescription", "maintenanceMode", "allowOnboardingRequests", "autoApproveModuleRequests"])} onSave={saveAll}>
            <div className="saas-form__grid">
              <Field label="Platform name" value={settings?.platformName || ""} onChange={(value) => setSettings((prev) => ({ ...prev, platformName: value }))} />
              <Field label="Support email" value={settings?.supportEmail || ""} onChange={(value) => setSettings((prev) => ({ ...prev, supportEmail: value }))} />
              <Field label="Public domain" value={settings?.publicDomain || ""} onChange={(value) => setSettings((prev) => ({ ...prev, publicDomain: value }))} />
              <Field label="Default locale" value={settings?.defaultLocale || ""} onChange={(value) => setSettings((prev) => ({ ...prev, defaultLocale: value }))} />
              <label className="saas-form__field saas-form__field--full"><span>Platform description</span><textarea className="saas-textarea-field" value={settings?.platformDescription || ""} onChange={(event) => setSettings((prev) => ({ ...prev, platformDescription: event.target.value }))} /></label>
            </div>
            <div className="saas-toggle-grid">
              <Toggle label="Maintenance mode" detail="Temporarily block tenant and public access." checked={!!settings?.maintenanceMode} onChange={(value) => setSettings((prev) => ({ ...prev, maintenanceMode: value }))} />
              <Toggle label="Allow onboarding requests" detail="Public organizations can submit access requests." checked={!!settings?.allowOnboardingRequests} onChange={(value) => setSettings((prev) => ({ ...prev, allowOnboardingRequests: value }))} />
              <Toggle label="Auto-approve module requests" detail="Bypass manual SaaS review for selected modules." checked={!!settings?.autoApproveModuleRequests} onChange={(value) => setSettings((prev) => ({ ...prev, autoApproveModuleRequests: value }))} />
            </div>
          </SettingsCard>

          <SettingsCard id="branding" icon="palette" title="CIVOX branding" badge="Brand" onReset={() => resetKeys(["brandPrimaryColor", "brandSecondaryColor", "logoUrl", "faviconUrl"])} onSave={saveAll}>
            <div className="saas-form__grid">
              <ColorField label="Primary color" value={settings?.brandPrimaryColor || ""} onChange={(value) => setSettings((prev) => ({ ...prev, brandPrimaryColor: value }))} />
              <ColorField label="Secondary color" value={settings?.brandSecondaryColor || ""} onChange={(value) => setSettings((prev) => ({ ...prev, brandSecondaryColor: value }))} />
              <Field label="Logo asset URL" value={settings?.logoUrl || ""} onChange={(value) => setSettings((prev) => ({ ...prev, logoUrl: value }))} />
              <Field label="Favicon URL" value={settings?.faviconUrl || ""} onChange={(value) => setSettings((prev) => ({ ...prev, faviconUrl: value }))} />
            </div>
          </SettingsCard>

          <SettingsCard id="email" icon="mail" title="SMTP and email templates" badge="Email" onReset={() => resetKeys(["smtpHost", "smtpPort", "emailFromAddress", "emailFromName", "smtpUsername", "smtpPassword"])} onSave={saveAll}>
            <div className="saas-form__grid">
              <Field label="SMTP host" value={settings?.smtpHost || ""} onChange={(value) => setSettings((prev) => ({ ...prev, smtpHost: value }))} />
              <Field label="SMTP port" value={String(settings?.smtpPort || "")} onChange={(value) => setSettings((prev) => ({ ...prev, smtpPort: Number(value || 0) }))} />
              <Field label="From email" value={settings?.emailFromAddress || ""} onChange={(value) => setSettings((prev) => ({ ...prev, emailFromAddress: value }))} />
              <Field label="From name" value={settings?.emailFromName || ""} onChange={(value) => setSettings((prev) => ({ ...prev, emailFromName: value }))} />
              <Field label="SMTP username" value={settings?.smtpUsername || ""} onChange={(value) => setSettings((prev) => ({ ...prev, smtpUsername: value }))} />
              <Field label="SMTP password" value={settings?.smtpPassword || ""} onChange={(value) => setSettings((prev) => ({ ...prev, smtpPassword: value }))} type="password" />
            </div>
          </SettingsCard>

          <SettingsCard id="security" icon="shield" title="Security policies" badge="Security" onReset={() => resetKeys(["requireMfaSuperAdmin", "requireMfaTenantAdmin", "ipAllowListEnabled", "auditSensitiveExports", "sessionTimeoutMinutes", "passwordMinLength"])} onSave={saveAll}>
            <div className="saas-toggle-grid">
              <Toggle label="Require MFA for super admins" detail="Enforced for all SUPER_ADMIN accounts." checked={!!settings?.requireMfaSuperAdmin} onChange={(value) => setSettings((prev) => ({ ...prev, requireMfaSuperAdmin: value }))} />
              <Toggle label="Require MFA for tenant admins" detail="Recommended for organization ADMIN users." checked={!!settings?.requireMfaTenantAdmin} onChange={(value) => setSettings((prev) => ({ ...prev, requireMfaTenantAdmin: value }))} />
              <Toggle label="IP allowlist for SaaS access" detail="Restrict global back-office access by source IP." checked={!!settings?.ipAllowListEnabled} onChange={(value) => setSettings((prev) => ({ ...prev, ipAllowListEnabled: value }))} />
              <Toggle label="Audit sensitive exports" detail="Log billing, users, and tenant data exports." checked={!!settings?.auditSensitiveExports} onChange={(value) => setSettings((prev) => ({ ...prev, auditSensitiveExports: value }))} />
            </div>
            <div className="saas-form__grid">
              <Field label="Session timeout (minutes)" value={String(settings?.sessionTimeoutMinutes || "")} onChange={(value) => setSettings((prev) => ({ ...prev, sessionTimeoutMinutes: Number(value || 0) }))} />
              <Field label="Password minimum length" value={String(settings?.passwordMinLength || "")} onChange={(value) => setSettings((prev) => ({ ...prev, passwordMinLength: Number(value || 0) }))} />
            </div>
          </SettingsCard>

          <SettingsCard id="tenant-defaults" icon="database" title="Default tenant settings" badge="Defaults" onReset={() => resetKeys(["tenantDefaultTimezone", "tenantDefaultLanguage", "tenantUrlPattern", "tenantStorageQuota", "defaultEnabledModulesCsv"])} onSave={saveAll}>
            <div className="saas-form__grid">
              <Field label="Default timezone" value={settings?.tenantDefaultTimezone || ""} onChange={(value) => setSettings((prev) => ({ ...prev, tenantDefaultTimezone: value }))} />
              <Field label="Default language" value={settings?.tenantDefaultLanguage || ""} onChange={(value) => setSettings((prev) => ({ ...prev, tenantDefaultLanguage: value }))} />
              <Field label="Default tenant URL pattern" value={settings?.tenantUrlPattern || ""} onChange={(value) => setSettings((prev) => ({ ...prev, tenantUrlPattern: value }))} />
              <Field label="Default storage quota" value={settings?.tenantStorageQuota || ""} onChange={(value) => setSettings((prev) => ({ ...prev, tenantStorageQuota: value }))} />
              <label className="saas-form__field saas-form__field--full"><span>Default enabled modules (CSV codes)</span><input className="saas-input-field" value={settings?.defaultEnabledModulesCsv || ""} onChange={(event) => setSettings((prev) => ({ ...prev, defaultEnabledModulesCsv: event.target.value }))} /></label>
            </div>
          </SettingsCard>

          <SettingsCard id="notifications" icon="bell" title="Notification settings" badge="Alerts" onReset={() => resetKeys(["notifyNewOrganizationRequests", "notifyModuleRequests", "notifyPaymentReceived", "notifyOverdueInvoices", "notifySystemErrors", "notifyWeeklyDigest"])} onSave={saveAll}>
            <div className="saas-toggle-grid">
              <Toggle label="New organization requests" detail="Notify super admins on onboarding intake." checked={!!settings?.notifyNewOrganizationRequests} onChange={(value) => setSettings((prev) => ({ ...prev, notifyNewOrganizationRequests: value }))} />
              <Toggle label="Module requests" detail="Notify on tenant module access demand." checked={!!settings?.notifyModuleRequests} onChange={(value) => setSettings((prev) => ({ ...prev, notifyModuleRequests: value }))} />
              <Toggle label="Payment received" detail="Notify when payments are confirmed." checked={!!settings?.notifyPaymentReceived} onChange={(value) => setSettings((prev) => ({ ...prev, notifyPaymentReceived: value }))} />
              <Toggle label="Overdue invoices" detail="Daily overdue billing digest." checked={!!settings?.notifyOverdueInvoices} onChange={(value) => setSettings((prev) => ({ ...prev, notifyOverdueInvoices: value }))} />
              <Toggle label="System errors" detail="Critical platform monitoring alerts." checked={!!settings?.notifySystemErrors} onChange={(value) => setSettings((prev) => ({ ...prev, notifySystemErrors: value }))} />
              <Toggle label="Weekly executive digest" detail="Operational summary for platform supervisors." checked={!!settings?.notifyWeeklyDigest} onChange={(value) => setSettings((prev) => ({ ...prev, notifyWeeklyDigest: value }))} />
            </div>
          </SettingsCard>
        </div>
      </section>
    </div>
  );
}

function SettingsCard({ id, icon, title, badge, onReset, onSave, children }) {
  return (
    <section className="saas-settings-card" id={id}>
      <header>
        <span><SaasIcon name={icon} size={18} /></span>
        <div>
          <h2>{title}</h2>
        </div>
        <SaasStatusBadge status={badge} label={badge} tone="info" />
      </header>
      <div className="saas-settings-card__body">{children}</div>
      <footer>
        <button type="button" className="saas-button saas-button--outline" onClick={onReset}>Reset</button>
        <button type="button" className="saas-button saas-button--primary" onClick={onSave}>
          <SaasIcon name="save" size={15} />
          Save section
        </button>
      </footer>
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="saas-form__field">
      <span>{label}</span>
      <input className="saas-input-field" value={value} onChange={(event) => onChange(event.target.value)} type={type} />
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="saas-form__field">
      <span>{label}</span>
      <div className="saas-color-field">
        <i style={{ background: value }} />
        <input className="saas-input-field" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}

function Toggle({ label, detail, checked, onChange }) {
  return (
    <label className="saas-settings-toggle">
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span />
    </label>
  );
}

export default SaasSettingsPage;
