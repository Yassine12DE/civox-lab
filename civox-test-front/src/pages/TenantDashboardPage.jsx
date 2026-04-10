import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../services/authService";
import { fetchMyModules } from "../services/moduleService";
import { getModuleRoute } from "../utils/moduleNavigation";

export default function TenantDashboardPage() {
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const me = await fetchMe();
        const myModules = await fetchMyModules();
        setUser(me);
        setModules(myModules);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      }
    }

    loadData();
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleModuleClick(moduleCode) {
    navigate(getModuleRoute(moduleCode));
  }

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Tenant Dashboard</h1>
          {user && (
            <p>
              {user.firstName} {user.lastName} — {user.role} — {user.organizationSlug}
            </p>
          )}
        </div>

        <button onClick={handleLogout}>Logout</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        {modules.map((module) => (
          <div
            key={module.id}
            onClick={() => handleModuleClick(module.code)}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
              cursor: "pointer",
            }}
          >
            <h3>{module.name}</h3>
            <p>{module.description}</p>
            <small>{module.code}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
