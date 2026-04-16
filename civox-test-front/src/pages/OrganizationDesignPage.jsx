import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationLoadingState,
  OrganizationLogoMark,
  OrganizationNotice,
} from "../components/organization/OrganizationUi";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "../services/orgBackOfficeService";

const colorPresets = [
  { name: "CIVOX Purple", primary: "#7B2CBF", secondary: "#FF6B35" },
  { name: "Ocean Blue", primary: "#0077BE", secondary: "#00D4FF" },
  { name: "Forest Green", primary: "#2D6A4F", secondary: "#52B788" },
  { name: "Sunset Orange", primary: "#E63946", secondary: "#F77F00" },
];

function OrganizationDesignPage() {
  const { organization, settings: layoutSettings, setSettings } = useOutletContext();
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) return;

      try {
        setFormData(layoutSettings);
        const settings = await getOrganizationSettings(organization.id);
        setFormData(settings);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError.message || "Failed to load design settings");
      }
    };

    loadData();
  }, [organization?.id, layoutSettings]);

  if (!organization || !formData) {
    return (
      <div className="premium-empty-center">
        <OrganizationLoadingState
          title="Loading brand studio"
          message="Preparing tenant identity settings."
        />
      </div>
    );
  }

  const pageStyle = {
    "--org-primary": formData.primaryColor || "#7B2CBF",
    "--org-secondary": formData.secondaryColor || "#FF6B35",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMessage("");
    setUnsavedChanges(true);
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const applyPreset = (preset) => {
    setMessage("");
    setUnsavedChanges(true);
    setFormData((current) => ({
      ...current,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const updatedSettings = await updateOrganizationSettings(organization.id, formData);
      setFormData(updatedSettings);
      setSettings?.(updatedSettings);
      setUnsavedChanges(false);
      setMessage("Design saved successfully.");
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Failed to save design");
    }
  };

  return (
    <div className="premium-admin-page" style={pageStyle}>
      <header className="premium-admin-page-header">
        <div>
          <h1>Branding & Settings</h1>
          <p>Customize your organization&apos;s appearance and identity</p>
        </div>
        {unsavedChanges && (
          <div className="premium-row-actions">
            <button
              type="button"
              className="premium-soft-button"
              onClick={() => {
                setFormData(layoutSettings);
                setUnsavedChanges(false);
              }}
            >
              <OrgIcon name="rotate" size={16} />
              Discard
            </button>
            <button type="button" className="premium-gradient-button" onClick={handleSubmit}>
              <OrgIcon name="save" size={18} />
              Save Changes
            </button>
          </div>
        )}
      </header>

      {(message || error) && (
        <>
          {message && <OrganizationNotice tone="success">{message}</OrganizationNotice>}
          {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
        </>
      )}

      <form className="premium-settings-grid" onSubmit={handleSubmit}>
        <div className="premium-list">
          <section className="premium-form-card">
            <div className="premium-detail-header__badges">
              <span className="premium-activity__icon">
                <OrgIcon name="type" size={20} />
              </span>
              <h2>Organization Identity</h2>
            </div>

            <div className="premium-field">
              <label>Organization Name</label>
              <input value={organization.name} readOnly />
            </div>

            <div className="premium-field">
              <label>Home Title</label>
              <input
                type="text"
                name="homeTitle"
                value={formData.homeTitle || ""}
                onChange={handleChange}
                placeholder="Your Voice Shapes Our Future"
              />
            </div>

            <div className="premium-field">
              <label>Welcome Text</label>
              <textarea
                name="welcomeText"
                rows="4"
                value={formData.welcomeText || ""}
                onChange={handleChange}
                placeholder="Join thousands of engaged citizens making a real difference."
              />
            </div>

            <div className="premium-field">
              <label>Footer Text</label>
              <input
                type="text"
                name="footerText"
                value={formData.footerText || ""}
                onChange={handleChange}
                placeholder="Empowering civic engagement through modern technology."
              />
            </div>

            <div className="premium-field">
              <label>Organization Logo</label>
              <div className="premium-upload-box">
                <span className="premium-activity__icon">
                  <OrgIcon name="upload" size={28} />
                </span>
                <strong>Click to upload logo</strong>
                <span>PNG, JPG or SVG (max. 2MB)</span>
              </div>
              <input
                type="text"
                name="logoUrl"
                value={formData.logoUrl || ""}
                onChange={handleChange}
                placeholder="https://..."
              />
              <div className="premium-current-logo">
                <OrganizationLogoMark organization={organization} logoUrl={formData.logoUrl} size="md" />
                <div>
                  <strong>Current Logo</strong>
                  <p>{formData.logoUrl ? "Custom image" : "Generated initial"}</p>
                </div>
              </div>
            </div>

            <div className="premium-field">
              <label>Hero Banner Image</label>
              <div className="premium-upload-box">
                <span className="premium-activity__icon">
                  <OrgIcon name="image" size={28} />
                </span>
                <strong>Upload banner image</strong>
                <span>Recommended: 1920x600px (max. 5MB)</span>
              </div>
              <input
                type="text"
                name="bannerImageUrl"
                value={formData.bannerImageUrl || ""}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </section>

          <section className="premium-form-card">
            <div className="premium-detail-header__badges">
              <span className="premium-activity__icon">
                <OrgIcon name="palette" size={20} />
              </span>
              <h2>Color Scheme</h2>
            </div>

            <div className="premium-field-grid">
              <div className="premium-field">
                <label>Primary Color</label>
                <input
                  className="premium-color-input"
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor || "#7B2CBF"}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={formData.primaryColor || "#7B2CBF"}
                  onChange={handleChange}
                />
              </div>

              <div className="premium-field">
                <label>Secondary Color</label>
                <input
                  className="premium-color-input"
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor || "#FF6B35"}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={formData.secondaryColor || "#FF6B35"}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="premium-field">
              <label>Quick Presets</label>
              <div className="premium-color-presets">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="premium-color-preset"
                    onClick={() => applyPreset(preset)}
                  >
                    <span className="premium-color-preset__swatches">
                      <span style={{ backgroundColor: preset.primary }} />
                      <span style={{ backgroundColor: preset.secondary }} />
                    </span>
                    <strong>{preset.name}</strong>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="premium-preview-card">
          <div className="premium-detail-header__badges">
            <OrgIcon name="eye" size={20} />
            <h2>Live Preview</h2>
          </div>

          <div className="premium-preview-mini">
            <div
              className="premium-preview-mini__hero"
              style={{
                background: `linear-gradient(135deg, ${formData.primaryColor || "#7B2CBF"}, ${formData.secondaryColor || "#FF6B35"})`,
              }}
            >
              <div className="premium-brand">
                <OrganizationLogoMark organization={organization} logoUrl={formData.logoUrl} size="sm" />
                <span>
                  <strong>{organization.name}</strong>
                  <span>Powered by CIVOX</span>
                </span>
              </div>
            </div>
            <div className="premium-preview-mini__body">
              <span className="premium-skeleton-line" />
              <span className="premium-skeleton-line premium-skeleton-line--short" />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              className="premium-gradient-button"
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${formData.primaryColor || "#7B2CBF"}, ${formData.secondaryColor || "#FF6B35"})`,
              }}
            >
              Primary Button
            </button>
            <button
              type="button"
              className="premium-soft-button"
              style={{
                width: "100%",
                marginTop: 10,
                borderColor: formData.primaryColor || "#7B2CBF",
                color: formData.primaryColor || "#7B2CBF",
              }}
            >
              Outline Button
            </button>
          </div>

          <div className="premium-panel" style={{ marginTop: 18 }}>
            <div className="premium-detail-header__badges">
              <span
                className="premium-activity__icon"
                style={{ backgroundColor: formData.primaryColor || "#7B2CBF", color: "#fff" }}
              >
                <OrgIcon name="check" size={18} />
              </span>
              <strong>Card Component</strong>
            </div>
            <span className="premium-skeleton-line" />
            <span className="premium-skeleton-line premium-skeleton-line--short" />
          </div>

          <div className="premium-card-stats" style={{ marginTop: 18 }}>
            <div>
              <span>Primary</span>
              <strong>{formData.primaryColor || "#7B2CBF"}</strong>
            </div>
            <div>
              <span>Secondary</span>
              <strong>{formData.secondaryColor || "#FF6B35"}</strong>
            </div>
            <div>
              <span>Banner</span>
              <strong>{formData.bannerImageUrl ? "Image" : "Gradient"}</strong>
            </div>
          </div>

          <button type="submit" className="premium-gradient-button" style={{ width: "100%" }}>
            Save Design
          </button>
        </aside>
      </form>
    </div>
  );
}

export default OrganizationDesignPage;
