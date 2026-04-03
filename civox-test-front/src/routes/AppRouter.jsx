import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import OrganizationRequestPage from "../pages/OrganizationRequestPage";
import OrganizationsPage from "../pages/OrganizationsPage";
import OrganizationDetailsPage from "../pages/OrganizationDetailsPage";
import PublicLayout from "../layouts/PublicLayout";
import OrganizationLayout from "../layouts/OrganizationLayout";
import SaasDashboardPage from "../pages/SaasDashboardPage";
import SaasOrganizationDetailsPage from "../pages/SaasOrganizationDetailsPage";
import SaasManageModulesPage from "../pages/SaasManageModulesPage";
import OrganizationBackOfficePage from "../pages/OrganizationBackOfficePage";
import OrganizationManageModulesPage from "../pages/OrganizationManageModulesPage";
import OrganizationDesignPage from "../pages/OrganizationDesignPage";
import OrganizationModuleRequestPage from "../pages/OrganizationModuleRequestPage";
import SaasModuleRequestsPage from "../pages/SaasModuleRequestsPage";
import { getTenantSlugFromHost } from "../utils/tenant";

function AppRouter() {
  const tenantSlug = getTenantSlugFromHost();
  const isTenant = !!tenantSlug;

  return (
    <BrowserRouter>
      <Routes>
        {!isTenant ? (
          <>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/request-organization" element={<OrganizationRequestPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
            </Route>

            <Route path="/saas" element={<SaasDashboardPage />} />
            <Route path="/saas/organizations/:slug" element={<SaasOrganizationDetailsPage />} />
            <Route path="/saas/organizations/:slug/modules" element={<SaasManageModulesPage />} />
            <Route path="/saas/module-requests" element={<SaasModuleRequestsPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<OrganizationLayout />}>
              <Route index element={<OrganizationDetailsPage />} />
            </Route>

            <Route path="/backoffice" element={<OrganizationBackOfficePage />} />
            <Route path="/backoffice/modules" element={<OrganizationManageModulesPage />} />
            <Route path="/backoffice/design" element={<OrganizationDesignPage />} />
            <Route path="/backoffice/module-requests" element={<OrganizationModuleRequestPage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;