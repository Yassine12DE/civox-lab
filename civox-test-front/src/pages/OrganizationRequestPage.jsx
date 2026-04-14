import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { modules as fallbackModules } from "../data/modules";
import { getPublicModules, submitOrganizationRequest } from "../services/organizationRequestService";
import "../styles/organizationRequestPage.css";

const initialFormData = {
  organizationName: "",
  desiredSlug: "",
  contactPersonName: "",
  contactEmail: "",
  phone: "",
  address: "",
  description: "",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminTemporaryPassword: "",
  expectedNumberOfUsers: "50",
  requestedModuleCodes: [],
  requestedPrimaryColor: "#7B2CBF",
  requestedSecondaryColor: "#FF6B35",
  brandingNotes: "",
  additionalNotes: "",
  publicVisibilityRequested: true,
};

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateForm(formData) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.organizationName.trim()) errors.organizationName = "Organization name is required.";
  if (!formData.desiredSlug.trim()) errors.desiredSlug = "Preferred slug is required.";
  if (formData.desiredSlug.trim() && !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/i.test(formData.desiredSlug.trim())) {
    errors.desiredSlug = "Use 3 to 60 letters, numbers, or hyphens.";
  }
  if (!formData.contactPersonName.trim()) errors.contactPersonName = "Contact person name is required.";
  if (!emailPattern.test(formData.contactEmail)) errors.contactEmail = "Enter a valid contact email.";
  if (!formData.adminFirstName.trim()) errors.adminFirstName = "Admin first name is required.";
  if (!formData.adminLastName.trim()) errors.adminLastName = "Admin last name is required.";
  if (!emailPattern.test(formData.adminEmail)) errors.adminEmail = "Enter a valid admin email.";
  if (formData.adminTemporaryPassword.length < 8) {
    errors.adminTemporaryPassword = "Use at least 8 characters.";
  }
  if (Number(formData.expectedNumberOfUsers) < 1) {
    errors.expectedNumberOfUsers = "Expected users must be at least 1.";
  }
  if (!formData.requestedModuleCodes.length) {
    errors.requestedModuleCodes = "Select at least one module.";
  }

  return errors;
}

function OrganizationRequestPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [availableModules, setAvailableModules] = useState(fallbackModules);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    let active = true;

    getPublicModules()
      .then((modules) => {
        if (!active || !Array.isArray(modules) || modules.length === 0) return;
        setAvailableModules(modules);
      })
      .catch(() => {
        if (active) setAvailableModules(fallbackModules);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedModuleNames = useMemo(
    () =>
      availableModules
        .filter((module) => formData.requestedModuleCodes.includes(module.code))
        .map((module) => module.name),
    [availableModules, formData.requestedModuleCodes]
  );

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    updateField(name, type === "checkbox" ? checked : value);

    if (name === "organizationName" && !formData.desiredSlug.trim()) {
      updateField("desiredSlug", slugify(value));
    }
  };

  const handleModuleToggle = (moduleCode) => {
    setFormData((prev) => {
      const selected = prev.requestedModuleCodes.includes(moduleCode)
        ? prev.requestedModuleCodes.filter((code) => code !== moduleCode)
        : [...prev.requestedModuleCodes, moduleCode];

      return {
        ...prev,
        requestedModuleCodes: selected,
      };
    });
    setFieldErrors((prev) => ({
      ...prev,
      requestedModuleCodes: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmittedRequest(null);

    const errors = validateForm(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    try {
      const payload = {
        ...formData,
        desiredSlug: slugify(formData.desiredSlug),
        expectedNumberOfUsers: Number(formData.expectedNumberOfUsers),
      };
      const response = await submitOrganizationRequest(payload);
      setSubmittedRequest(response);
      setFormData(initialFormData);
    } catch (requestError) {
      setError(requestError.message || "The request could not be submitted. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedRequest) {
    return (
      <div className="organization-request-page">
        <section className="organization-request-success">
          <p className="organization-request-badge">Request received</p>
          <h1>Thank you, {submittedRequest.contactPersonName}</h1>
          <p>
            The request for {submittedRequest.organizationName} is now in the Civox review queue.
            {submittedRequest.emailDeliveryWarning
              ? ` We could not send the confirmation email to ${submittedRequest.contactEmail} yet.`
              : ` A confirmation email has been sent to ${submittedRequest.contactEmail}.`}
          </p>
          {submittedRequest.emailDeliveryWarning && (
            <div className="organization-request-error">{submittedRequest.emailDeliveryWarning}</div>
          )}
          <div className="organization-request-success__meta">
            <span>Reference #{submittedRequest.id}</span>
            <span>Preferred slug: {submittedRequest.desiredSlug}</span>
            <span>Status: {submittedRequest.requestStatus}</span>
          </div>
          <div className="organization-request-actions">
            <button type="button" onClick={() => setSubmittedRequest(null)}>
              Submit another request
            </button>
            <Link to="/">Back to Civox</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="organization-request-page">
      <div className="organization-request-shell">
        <section className="organization-request-intro-panel">
          <p className="organization-request-badge">Join Civox</p>
          <h1>Start your organization workspace request</h1>
          <p>
            Share your organization details, preferred modules, and first admin account.
            The Civox team will review the request and prepare a custom quote.
          </p>

          <div className="organization-request-benefits">
            <div>
              <strong>Tenant-ready launch</strong>
              <span>A dedicated subdomain, roles, settings, and module access after approval.</span>
            </div>
            <div>
              <strong>Clear quote basis</strong>
              <span>Pricing starts with expected users and the modules your team needs.</span>
            </div>
            <div>
              <strong>Guided activation</strong>
              <span>A secure payment link activates the tenant and sends the welcome email.</span>
            </div>
          </div>

          <div className="organization-request-summary">
            <span>Selected modules</span>
            <strong>{selectedModuleNames.length ? selectedModuleNames.join(", ") : "None yet"}</strong>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="organization-request-form" noValidate>
          {error && <div className="organization-request-error">{error}</div>}

          <section className="organization-request-form-section">
            <div className="organization-request-form-heading">
              <span>1</span>
              <div>
                <h2>Organization</h2>
                <p>Core public and tenant identity.</p>
              </div>
            </div>

            <div className="organization-request-grid">
              <Field label="Organization name" error={fieldErrors.organizationName}>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="City of North Harbor"
                />
              </Field>
              <Field label="Preferred slug" error={fieldErrors.desiredSlug} hint="Example: north-harbor">
                <input
                  type="text"
                  name="desiredSlug"
                  value={formData.desiredSlug}
                  onChange={(event) => updateField("desiredSlug", slugify(event.target.value))}
                  placeholder="north-harbor"
                />
              </Field>
              <Field label="Contact email" error={fieldErrors.contactEmail}>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@organization.gov"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 555 0182"
                />
              </Field>
              <Field label="Address" full>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="100 Civic Plaza, North Harbor"
                />
              </Field>
              <Field label="Organization description" full>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your organization, civic programs, and expected use cases."
                  rows="4"
                />
              </Field>
            </div>
          </section>

          <section className="organization-request-form-section">
            <div className="organization-request-form-heading">
              <span>2</span>
              <div>
                <h2>Contact and first admin</h2>
                <p>The first admin will be created after payment.</p>
              </div>
            </div>

            <div className="organization-request-grid">
              <Field label="Contact person" error={fieldErrors.contactPersonName}>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  placeholder="Avery Morgan"
                />
              </Field>
              <Field label="Admin email" error={fieldErrors.adminEmail}>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@organization.gov"
                />
              </Field>
              <Field label="Admin first name" error={fieldErrors.adminFirstName}>
                <input
                  type="text"
                  name="adminFirstName"
                  value={formData.adminFirstName}
                  onChange={handleChange}
                  placeholder="Avery"
                />
              </Field>
              <Field label="Admin last name" error={fieldErrors.adminLastName}>
                <input
                  type="text"
                  name="adminLastName"
                  value={formData.adminLastName}
                  onChange={handleChange}
                  placeholder="Morgan"
                />
              </Field>
              <Field
                label="Temporary password"
                error={fieldErrors.adminTemporaryPassword}
                hint="Stored securely and used only when the admin account is created."
                full
              >
                <input
                  type="password"
                  name="adminTemporaryPassword"
                  value={formData.adminTemporaryPassword}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                />
              </Field>
            </div>
          </section>

          <section className="organization-request-form-section">
            <div className="organization-request-form-heading">
              <span>3</span>
              <div>
                <h2>Scope and branding</h2>
                <p>Your quote is based on expected users and selected modules.</p>
              </div>
            </div>

            <div className="organization-request-grid">
              <Field label="Expected users" error={fieldErrors.expectedNumberOfUsers}>
                <input
                  type="number"
                  min="1"
                  name="expectedNumberOfUsers"
                  value={formData.expectedNumberOfUsers}
                  onChange={handleChange}
                />
              </Field>
              <label className="organization-request-checkbox">
                <input
                  type="checkbox"
                  name="publicVisibilityRequested"
                  checked={formData.publicVisibilityRequested}
                  onChange={handleChange}
                />
                <span>List this organization publicly after activation</span>
              </label>

              <div className="organization-request-module-field">
                <span>Requested modules</span>
                {fieldErrors.requestedModuleCodes && <small>{fieldErrors.requestedModuleCodes}</small>}
                <div className="organization-request-modules">
                  {availableModules.map((module) => (
                    <button
                      type="button"
                      className={
                        formData.requestedModuleCodes.includes(module.code)
                          ? "organization-request-module organization-request-module--selected"
                          : "organization-request-module"
                      }
                      key={module.code}
                      onClick={() => handleModuleToggle(module.code)}
                    >
                      <strong>{module.name}</strong>
                      <span>{module.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Primary color">
                <input
                  type="color"
                  name="requestedPrimaryColor"
                  value={formData.requestedPrimaryColor}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Secondary color">
                <input
                  type="color"
                  name="requestedSecondaryColor"
                  value={formData.requestedSecondaryColor}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Branding preferences" full>
                <textarea
                  name="brandingNotes"
                  value={formData.brandingNotes}
                  onChange={handleChange}
                  placeholder="Logo notes, tone, color preferences, or launch guidance."
                  rows="3"
                />
              </Field>
              <Field label="Additional notes" full>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  placeholder="Procurement notes, timeline, requested support, or special constraints."
                  rows="3"
                />
              </Field>
            </div>
          </section>

          <div className="organization-request-submit">
            <p>
              After submission, Civox will email the contact person and place this request in
              the SUPER_ADMIN review queue.
            </p>
            <button type="submit" disabled={loading}>
              {loading ? "Submitting request..." : "Submit access request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, hint, full = false, children }) {
  return (
    <label className={full ? "organization-request-field organization-request-field--full" : "organization-request-field"}>
      <span>{label}</span>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && <small className="organization-request-field__error">{error}</small>}
    </label>
  );
}

export default OrganizationRequestPage;
