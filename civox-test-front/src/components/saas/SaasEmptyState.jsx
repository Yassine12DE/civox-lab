import SaasIcon from "./SaasIcon";

function SaasEmptyState({ icon = "search", title, message, action }) {
  return (
    <div className="saas-empty-state">
      <span className="saas-empty-state__icon">
        <SaasIcon name={icon} size={24} />
      </span>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action && <div className="saas-empty-state__action">{action}</div>}
    </div>
  );
}

export default SaasEmptyState;
