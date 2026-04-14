import { Link } from "react-router-dom";
import SaasIcon from "./SaasIcon";

function SaasPageHeader({ eyebrow, title, description, breadcrumbs = [], actions }) {
  return (
    <header className="saas-page-header">
      {breadcrumbs.length > 0 && (
        <nav className="saas-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((breadcrumb, index) => (
            <span key={`${breadcrumb.label}-${index}`} className="saas-breadcrumbs__item">
              {breadcrumb.to ? (
                <Link to={breadcrumb.to}>{breadcrumb.label}</Link>
              ) : (
                <span>{breadcrumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <SaasIcon name="chevronRight" size={14} />}
            </span>
          ))}
        </nav>
      )}

      <div className="saas-page-header__main">
        <div>
          {eyebrow && <p className="saas-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>

        {actions && <div className="saas-page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}

export default SaasPageHeader;
