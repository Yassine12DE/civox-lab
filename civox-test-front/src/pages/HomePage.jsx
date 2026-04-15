import { Link } from "react-router-dom";
import CivoxHeroIllustration from "../components/CivoxHeroIllustration";
import "../styles/homePage.css";

function HomePage() {
  const heroPoints = [
    "Professional organization profile",
    "Clear communication with your audience",
    "Better visibility for your mission and initiatives",
    "A more trusted and engaging digital presence",
  ];

  const featureCards = [
    {
      title: "Professional digital presence",
      text: "Give your organization a clear and modern online space that reflects its identity and makes information easier to access.",
    },
    {
      title: "Stronger community engagement",
      text: "Encourage people to stay informed, respond, and take part in your initiatives through a more structured experience.",
    },
    {
      title: "Clearer communication",
      text: "Publish updates, announcements, and key information in one organized environment that feels professional and easy to follow.",
    },
  ];

  const statsCards = [
    {
      title: "Visibility",
      text: "Present your organization in a clear, accessible, and credible way.",
    },
    {
      title: "Engagement",
      text: "Create more opportunities for your audience to stay informed and involved.",
    },
    {
      title: "Trust",
      text: "Offer a professional and organized experience that builds confidence.",
    },
    {
      title: "Growth",
      text: "Adopt a digital space that can evolve with your organization’s needs.",
    },
  ];

  const valueCards = [
    {
      title: "A stronger public image",
      text: "Show your organization through a polished and coherent digital experience that inspires confidence from the first visit.",
    },
    {
      title: "Better communication",
      text: "Make announcements, updates, and key information easier to publish, discover, and understand.",
    },
    {
      title: "More meaningful participation",
      text: "Help your audience feel more connected to your initiatives through a clearer and more engaging experience.",
    },
    {
      title: "Long-term digital value",
      text: "Build a reliable digital foundation that supports your organization as it grows and evolves.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Request your organization space",
      text: "Start with a structured onboarding process designed to help your organization join with clarity and confidence.",
    },
    {
      number: "02",
      title: "Present your identity professionally",
      text: "Create a digital presence that reflects your mission, values, and priorities in a more polished way.",
    },
    {
      number: "03",
      title: "Engage your audience better",
      text: "Use a clearer and more organized environment to strengthen communication and connection with your community.",
    },
  ];

  return (
    <div className="home-page">
      <div className="home-page-background" aria-hidden="true">
        <span className="bg-orb bg-orb--purple"></span>
        <span className="bg-orb bg-orb--orange"></span>
        <span className="bg-orb bg-orb--small"></span>
        <span className="bg-mesh"></span>
      </div>

      <section className="home-hero">
        <div className="home-left">
          <p className="home-badge">Modern digital platform for organizations</p>

          <h1 className="home-title">
            Build a trusted digital presence for your organization
          </h1>

          <p className="home-description">
            Civox helps organizations communicate clearly, strengthen their image,
            and create a more engaging experience for the people they serve.
          </p>

          <div className="home-actions">
            <Link to="/request-organization" className="primary-button">
              Join Civox
            </Link>

            <Link to="/organizations" className="secondary-button">
              Explore organizations
            </Link>
          </div>

          <div className="home-proof-list">
            {heroPoints.map((point) => (
              <div key={point} className="home-proof-item">
                <span className="home-proof-dot" aria-hidden="true"></span>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="home-card">
          <div className="home-visual">
            <CivoxHeroIllustration />
          </div>

          <div className="home-card-header">
            <h2>A professional experience from the first visit</h2>
            <p>
              Help your organization look more credible, communicate more clearly,
              and offer a more organized digital experience to its audience.
            </p>
          </div>

          <div className="home-features">
            {featureCards.map((feature) => (
              <div key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-section">
        {statsCards.map((card) => (
          <div key={card.title} className="stats-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </div>
        ))}
      </section>

      <section className="home-value-section">
        <div className="home-section-header">
          <p className="home-badge">Why organizations choose Civox</p>
          <h2>A digital experience designed to inspire confidence</h2>
          <p>
            Civox is built to help organizations present themselves more clearly,
            communicate more effectively, and create stronger connections with their audience.
          </p>
        </div>

        <div className="home-value-grid">
          {valueCards.map((card) => (
            <div key={card.title} className="home-value-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-process-section">
        <div className="home-section-header">
          <p className="home-badge">How it works</p>
          <h2>A simple path to a stronger digital presence</h2>
          <p>
            From onboarding to communication and engagement, Civox helps organizations
            move toward a clearer, more modern, and more trusted digital experience.
          </p>
        </div>

        <div className="home-process-grid">
          {steps.map((step) => (
            <div key={step.number} className="home-process-card">
              <span className="home-process-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta-section">
        <div className="home-cta-content">
          <p className="home-badge">Ready to join</p>
          <h2>Bring your organization into Civox</h2>
          <p>
            Take the next step toward a more professional, visible, and engaging
            digital experience for your organization.
          </p>
        </div>

        <div className="home-cta-actions">
          <Link
            to="/request-organization"
            className="primary-button primary-button--orange"
          >
            Join us now
          </Link>

          <Link
            to="/organizations"
            className="secondary-button secondary-button--light"
          >
            Explore organizations
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;