import { useEffect, useState } from "react";
import { submitOrganizationRequest } from "../services/organizationRequestService";
import "../styles/organizationRequestPage.css";

function OrganizationRequestPage() {
  const [formData, setFormData] = useState({
    organizationName: "",
    desiredSlug: "",
    contactPersonName: "",
    contactEmail: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await submitOrganizationRequest(formData);

    if (response.success) {
      setMessage(response.message);
      setFormData({
        organizationName: "",
        desiredSlug: "",
        contactPersonName: "",
        contactEmail: "",
        description: "",
      });
    }

    setLoading(false);
  };

  return (
    <div className="organization-request-page">
      {message && <div className="request-alert-success">{message}</div>}

      <div className="organization-request-card">
        <div className="organization-request-left">
          <p className="organization-request-badge">Join Civox</p>
          <h1>Bring your organization to the platform</h1>
          <p className="organization-request-intro">
            Submit your request to join Civox. After review, your organization
            can get its own dedicated space and manage its users securely.
          </p>

          <div className="organization-request-benefits">
            <div className="organization-request-benefit">Dedicated organization space</div>
            <div className="organization-request-benefit">Secure tenant separation</div>
            <div className="organization-request-benefit">Simple onboarding process</div>
          </div>
        </div>

        <div className="organization-request-right">
          <h2>Organization Request</h2>
          <p className="organization-request-subtitle">
            Fill in the form below and our team will review your request.
          </p>

          <form onSubmit={handleSubmit} className="organization-request-form">
            <div>
              <label>Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label>Desired Slug</label>
              <input
                type="text"
                name="desiredSlug"
                value={formData.desiredSlug}
                onChange={handleChange}
                placeholder="example-org"
              />
            </div>

            <div>
              <label>Contact Person Name</label>
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="name@organization.com"
              />
            </div>

            <div>
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us a little about your organization"
                rows="5"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrganizationRequestPage;