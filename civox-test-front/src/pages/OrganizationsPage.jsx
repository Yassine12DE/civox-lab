import { useEffect, useState } from "react";
import { getPublicOrganizations } from "../services/organizationService";
import "../styles/organizationsPage.css";

function OrganizationsPage() {
 const [organizations, setOrganizations] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 useEffect(() => {
  const loadOrganizations = async () => {
   try {
    const data = await getPublicOrganizations();
    setOrganizations(data);
   } catch (err) {
    setError("Failed to load organizations.");
   } finally {
    setLoading(false);
   }
  };

  loadOrganizations();
 }, []);

 if (loading) return <div className="organizations-page"><p>Loading organizations...</p></div>;
 if (error) return <div className="organizations-page"><p>{error}</p></div>;

 return (
  <div className="organizations-page">
   <div className="organizations-container">
    <div className="organizations-header">
     <p className="organizations-badge">Civox Directory</p>
     <h1 className="organizations-title">Explore Registered Organizations</h1>
     <p className="organizations-description">
      Discover organizations that joined Civox and access their public space.
     </p>
    </div>

    <div className="organizations-grid">
     {organizations.map((org) => (
      <div key={org.id} className="organization-card">
       <div className="organization-avatar">
        {org.name?.charAt(0)}
       </div>

       <h2 className="organization-name">{org.name}</h2>
       <p className="organization-text">{org.description}</p>
       <p className="organization-slug">
        <strong>Slug:</strong> {org.slug}
       </p>

       <a
        href={`http://${org.slug}.lvh.me:5173`}
        className="organization-link"
       >
        View organization
       </a>
      </div>
     ))}
    </div>
   </div>
  </div>
 );
}

export default OrganizationsPage;