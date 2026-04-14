function SaasLoadingState({ label = "Loading workspace..." }) {
  return (
    <div className="saas-loading-state" role="status" aria-live="polite">
      <div className="saas-skeleton saas-skeleton--header" />
      <div className="saas-skeleton-grid">
        <div className="saas-skeleton saas-skeleton--card" />
        <div className="saas-skeleton saas-skeleton--card" />
        <div className="saas-skeleton saas-skeleton--card" />
      </div>
      <span>{label}</span>
    </div>
  );
}

export default SaasLoadingState;
