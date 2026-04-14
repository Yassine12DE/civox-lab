import { formatStatus, getStatusTone } from "../../utils/saasFormat";

function SaasStatusBadge({ status, label, tone }) {
  const badgeTone = tone || getStatusTone(status);

  return (
    <span className={`saas-status-badge saas-status-badge--${badgeTone}`}>
      {label || formatStatus(status)}
    </span>
  );
}

export default SaasStatusBadge;
