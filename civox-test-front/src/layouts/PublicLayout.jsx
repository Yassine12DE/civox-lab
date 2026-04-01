import { Link, Outlet } from "react-router-dom";
import "../styles/publicLayout.css";

function PublicLayout() {
  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="public-header-container">
          <Link to="/" className="public-brand">
            <span className="public-brand-logo">C</span>
            <span className="public-brand-text">Civox</span>
          </Link>

          <nav className="public-nav">
            <Link to="/" className="public-nav-link">
              Home
            </Link>
            <Link to="/organizations" className="public-nav-link">
              Organizations
            </Link>
            <Link to="/request-organization" className="public-nav-cta">
              Request Access
            </Link>
          </nav>
        </div>
      </header>

      <main className="public-content">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;