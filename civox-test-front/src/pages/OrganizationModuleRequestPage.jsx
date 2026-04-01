import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { modules } from "../data/modules";
import { getOrganizationBySlug } from "../services/organizationService";
import {
  createModuleRequest,
  getOrganizationBackOfficeModules,
  getOrganizationModuleRequests,
} from "../services/orgBackOfficeService";
import "../styles/organizationModuleRequestPage.css";

function OrganizationModuleRequestPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [grantedModules, setGrantedModules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const org = await getOrganizationBySlug(slug);
      setOrganization(org);

      if (org?.id) {
        const [modulesData, requestsData] = await Promise.all([
          getOrganizationBackOfficeModules(org.id),
          getOrganizationModuleRequests(org.id),
        ]);

        setGrantedModules(modulesData);
        setRequests(requestsData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!organization?.id || !selectedModule) return;

    try {
      await createModuleRequest(organization.id, selectedModule, comment);
      setSelectedModule("");
      setComment("");
      await loadData();
      alert("Module request submitted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to submit request");
    }
  };

  if (loading) return <div className="org-module-request-page"><h1>Loading...</h1></div>;
  if (!organization) return <div className="org-module-request-page"><h1>Organization not found</h1></div>;

  const grantedCodes = grantedModules.map((item) => item.moduleCode);
  const requestableModules = modules.filter((module) => !grantedCodes.includes(module.code));

  return (
    <div className="org-module-request-page">
      <section className="org-module-request-hero">
        <p className="org-module-request-badge">Extra Module Requests</p>
        <h1>{organization.name}</h1>
        <p>Request missing modules from the Back-office SaaS.</p>
      </section>

      <div className="org-module-request-grid">
        <div className="org-module-request-card">
          <h2>Request a module</h2>

          <form onSubmit={handleSubmit} className="org-module-request-form">
            <label>Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">Select a module</option>
              {requestableModules.map((module) => (
                <option key={module.code} value={module.code}>
                  {module.name}
                </option>
              ))}
            </select>

            <label>Comment</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Why do you need this module?"
            />

            <button type="submit">Submit Request</button>
          </form>
        </div>

        <div className="org-module-request-card">
          <h2>Previous requests</h2>

          <div className="org-module-request-list">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="org-module-request-item">
                  <h3>{request.moduleName}</h3>
                  <p>Status: <strong>{request.status}</strong></p>
                  <p>{request.comment}</p>
                </div>
              ))
            ) : (
              <p>No requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationModuleRequestPage;