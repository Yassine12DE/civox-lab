import { useEffect, useState } from "react";
import {
  approveModuleRequest,
  getAllModuleRequests,
  rejectModuleRequest,
} from "../services/saasService";
import "../styles/saasModuleRequestsPage.css";

function SaasModuleRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const data = await getAllModuleRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      await approveModuleRequest(requestId, "Approved by SaaS admin");
      await loadRequests();
    } catch (error) {
      console.error(error);
      alert("Approval failed");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectModuleRequest(requestId, "Rejected by SaaS admin");
      await loadRequests();
    } catch (error) {
      console.error(error);
      alert("Rejection failed");
    }
  };

  if (loading) return <div className="saas-module-requests-page"><h1>Loading...</h1></div>;

  return (
    <div className="saas-module-requests-page">
      <section className="saas-module-requests-hero">
        <p className="saas-module-requests-badge">Back-office SaaS</p>
        <h1>Module Requests</h1>
        <p>Review organization requests for missing modules.</p>
      </section>

      <section className="saas-module-requests-list">
        {requests.map((request) => (
          <div key={request.id} className="saas-module-request-card">
            <h2>{request.organizationName}</h2>
            <p><strong>Module:</strong> {request.moduleName}</p>
            <p><strong>Status:</strong> {request.status}</p>
            <p>{request.comment}</p>

            {request.status === "PENDING" && (
              <div className="saas-module-request-actions">
                <button onClick={() => handleApprove(request.id)}>Approve</button>
                <button onClick={() => handleReject(request.id)}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default SaasModuleRequestsPage;