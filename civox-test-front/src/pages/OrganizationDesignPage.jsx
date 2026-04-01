import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrganizationBySlug } from "../services/organizationService";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "../services/orgBackOfficeService";
import "../styles/organizationDesignPage.css";

function OrganizationDesignPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const org = await getOrganizationBySlug(slug);
        setOrganization(org);

        if (org?.id) {
          const settings = await getOrganizationSettings(org.id);
          setFormData(settings);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, [slug]);

  if (!organization || !formData) {
    return (
      <div className="org-design-not-found">
        <h1>Loading...</h1>
      </div>
    );
  }

  const pageStyle = {
    "--org-primary": formData.primaryColor || "#2563eb",
    "--org-secondary": formData.secondaryColor || "#7c3aed",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await updateOrganizationSettings(organization.id, formData);
      alert("Design saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save design");
    }
  };

  return (
    <div className="org-design-page" style={pageStyle}>
      <section className="org-design-hero">
        <p className="org-design-badge">Front-office Design</p>
        <h1>Customize {organization.name}</h1>
        <p>Update the branding and content of your organization front-office.</p>
      </section>

      <div className="org-design-grid">
        <form className="org-design-form-card" onSubmit={handleSubmit}>
          <h2>Design Settings</h2>

          <label>Logo URL</label>
          <input
            type="text"
            name="logoUrl"
            value={formData.logoUrl || ""}
            onChange={handleChange}
          />

          <label>Primary Color</label>
          <input
            type="color"
            name="primaryColor"
            value={formData.primaryColor || "#2563eb"}
            onChange={handleChange}
          />

          <label>Secondary Color</label>
          <input
            type="color"
            name="secondaryColor"
            value={formData.secondaryColor || "#7c3aed"}
            onChange={handleChange}
          />

          <label>Home Title</label>
          <input
            type="text"
            name="homeTitle"
            value={formData.homeTitle || ""}
            onChange={handleChange}
          />

          <label>Welcome Text</label>
          <textarea
            name="welcomeText"
            rows="4"
            value={formData.welcomeText || ""}
            onChange={handleChange}
          />

          <label>Footer Text</label>
          <input
            type="text"
            name="footerText"
            value={formData.footerText || ""}
            onChange={handleChange}
          />

          <button type="submit">Save Design</button>
        </form>

        <div className="org-design-preview-card">
          <h2>Live Preview</h2>

          <div className="org-design-preview-box">
            <div className="org-design-preview-header">
              <div className="org-design-preview-logo">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt={organization.name}
                    className="org-design-preview-logo-image"
                  />
                ) : (
                  organization.name?.charAt(0)
                )}
              </div>
              <div>
                <h3>{organization.name}</h3>
                <p>{formData.welcomeText}</p>
              </div>
            </div>

            <div className="org-design-preview-hero">
              <p className="org-design-preview-badge">Organization Home</p>
              <h1>{formData.homeTitle}</h1>
              <p>{formData.welcomeText}</p>
            </div>

            <div className="org-design-preview-footer">
              {formData.footerText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationDesignPage;