import SaasEmptyState from "../components/saas/SaasEmptyState";
import SaasPageHeader from "../components/saas/SaasPageHeader";
import SaasStatCard from "../components/saas/SaasStatCard";

function SaasPlaceholderPage({ eyebrow, title, description, icon = "settings" }) {
  return (
    <div className="saas-page-stack">
      <SaasPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[
          { label: "Dashboard", to: "/saas" },
          { label: title },
        ]}
      />

      <section className="saas-grid saas-grid--three" aria-label={`${title} roadmap`}>
        <SaasStatCard
          label="Scope"
          value="Planned"
          detail="Reserved for a future platform workflow."
          icon={icon}
          tone="teal"
        />
        <SaasStatCard
          label="Data"
          value="Next"
          detail="Waiting for production endpoints."
          icon="activity"
          tone="blue"
        />
        <SaasStatCard
          label="Access"
          value="SaaS"
          detail="Reserved for platform owner workflows."
          icon="shield"
          tone="amber"
        />
      </section>

      <SaasEmptyState
        icon={icon}
        title={`${title} is reserved for the next platform release`}
        message="Keep using the active command center sections for today: dashboard, organizations, and module requests."
      />
    </div>
  );
}

export default SaasPlaceholderPage;
