import { Link } from "react-router-dom";
import "../styles/forbiddenPage.css";

function ForbiddenPage() {
  return (
    <div className="forbidden-page">
      <section className="forbidden-panel">
        <p className="forbidden-badge">Access restricted</p>
        <h1>This space is not available for your role.</h1>
        <p>
          Continue from an area that belongs to your organization and your current permissions.
        </p>
        <Link to="/" className="forbidden-link">Go to home</Link>
      </section>
    </div>
  );
}

export default ForbiddenPage;
