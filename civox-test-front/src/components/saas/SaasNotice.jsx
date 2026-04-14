import SaasIcon from "./SaasIcon";

function SaasNotice({ tone = "info", title, message, onDismiss }) {
  if (!title && !message) return null;

  const iconName = tone === "success" ? "check" : tone === "danger" ? "alert" : "bell";

  return (
    <div className={`saas-notice saas-notice--${tone}`} role="status">
      <span className="saas-notice__icon">
        <SaasIcon name={iconName} size={18} />
      </span>
      <div>
        {title && <strong>{title}</strong>}
        {message && <p>{message}</p>}
      </div>
      {onDismiss && (
        <button type="button" className="saas-icon-button" onClick={onDismiss} aria-label="Dismiss">
          <SaasIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

export default SaasNotice;
