import { Link } from "react-router-dom";
import CivoxHeroIllustration from "../components/CivoxHeroIllustration";
import "../styles/homePage.css";

function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-left">
          <p className="home-badge">Civox civic SaaS platform</p>

          <h1 className="home-title">Give every organization a clear digital home</h1>

          <p className="home-description">
            Civox brings public organizations into one professional platform while
            keeping each tenant workspace, user base, and module access organized.
          </p>

          <div className="home-actions">
            <Link to="/organizations" className="primary-button">
              Explore organizations
            </Link>

            <Link to="/request-organization" className="secondary-button">
              Join us now
            </Link>
          </div>
        </div>

        <div className="home-card">
          <div className="home-visual">
            <CivoxHeroIllustration />
          </div>

          <div className="home-card-header">
            <h2>One platform. Many secure spaces.</h2>
            <p>
              Public pages, tenant modules, and platform administration stay
              separated without making the experience feel fragmented.
            </p>
          </div>

          <div className="home-features">
            <div className="feature-card">
              <h3>Organization onboarding</h3>
              <p>Collect structured access requests and prepare each tenant for review.</p>
            </div>

            <div className="feature-card">
              <h3>Public organization directory</h3>
              <p>Help visitors find registered organizations and open their public spaces.</p>
            </div>

            <div className="feature-card">
              <h3>Tenant separation</h3>
              <p>Keep users, modules, and data scoped to the right organization.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-card">
          <h3>Public</h3>
          <p>Clear public entry points for citizens, guests, and organizations.</p>
        </div>

        <div className="stats-card">
          <h3>Review</h3>
          <p>Structured organization requests before platform activation.</p>
        </div>

        <div className="stats-card">
          <h3>Tenant</h3>
          <p>Organization spaces designed for isolated users and modules.</p>
        </div>

        <div className="stats-card">
          <h3>SaaS</h3>
          <p>Platform-level control for super admins and product owners.</p>
        </div>
      </section>

      <section className="home-cta-section">
        <div>
          <p className="home-badge">Ready to join</p>
          <h2>Bring your organization into Civox</h2>
          <p>Submit a request and give your team a structured, secure digital workspace.</p>
        </div>
        <Link to="/request-organization" className="primary-button primary-button--orange">
          Join us now
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
