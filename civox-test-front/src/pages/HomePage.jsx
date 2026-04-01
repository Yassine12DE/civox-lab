import { Link } from "react-router-dom";
import "../styles/homePage.css";

function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-left">
          <p className="home-badge">Welcome to Civox</p>

          <h1 className="home-title">
            A modern multi-tenant platform for organizations
          </h1>

          <p className="home-description">
            Civox helps organizations join one shared platform while keeping
            each organization’s space, users, and future data clearly separated
            and secure.
          </p>

          <div className="home-actions">
            <Link to="/organizations" className="primary-button">
              Explore organizations
            </Link>

            <Link to="/request-organization" className="secondary-button">
              Request access
            </Link>
          </div>
        </div>

        <div className="home-card">
          <div className="home-card-header">
            <h2>One platform, multiple organizations</h2>
            <p>
              Each organization can have its own public presence and later its
              own dedicated tenant space on Civox.
            </p>
          </div>

          <div className="home-features">
            <div className="feature-card">
              <h3>Organization onboarding</h3>
              <p>
                Organizations can request to join the platform through a public
                registration flow.
              </p>
            </div>

            <div className="feature-card">
              <h3>Public organization directory</h3>
              <p>
                Guests can browse public organizations and access their public
                pages.
              </p>
            </div>

            <div className="feature-card">
              <h3>Future tenant separation</h3>
              <p>
                Each organization will later access its own secure space with
                isolated users and data.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-card">
          <h3>01</h3>
          <p>Public Civox homepage for guests and organizations</p>
        </div>

        <div className="stats-card">
          <h3>02</h3>
          <p>Organization request flow before approval</p>
        </div>

        <div className="stats-card">
          <h3>03</h3>
          <p>Directory of organizations visible to the public</p>
        </div>

        <div className="stats-card">
          <h3>04</h3>
          <p>Preparation for future organization-specific spaces</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;