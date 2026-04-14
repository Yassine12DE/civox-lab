import SaasIcon from "./SaasIcon";

function SaasStatCard({ label, value, detail, icon = "dashboard", tone = "teal" }) {
  return (
    <article className={`saas-stat-card saas-stat-card--${tone}`}>
      <span className="saas-stat-card__icon">
        <SaasIcon name={icon} size={20} />
      </span>
      <div>
        <p className="saas-stat-card__label">{label}</p>
        <strong className="saas-stat-card__value">{value}</strong>
        {detail && <span className="saas-stat-card__detail">{detail}</span>}
      </div>
    </article>
  );
}

export default SaasStatCard;
