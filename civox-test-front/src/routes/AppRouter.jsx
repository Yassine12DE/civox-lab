import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "../pages/HomePage";
import OrganizationRequestPage from "../pages/OrganizationRequestPage";
import PaymentPage from "../pages/PaymentPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import OrganizationsPage from "../pages/OrganizationsPage";
import OrganizationDetailsPage from "../pages/OrganizationDetailsPage";
import PublicLayout from "../layouts/PublicLayout";
import OrganizationLayout from "../layouts/OrganizationLayout";
import SaasLayout from "../layouts/SaasLayout";
import SaasDashboardPage from "../pages/SaasDashboardPage";
import SaasOrganizationsPage from "../pages/SaasOrganizationsPage";
import SaasOrganizationDetailsPage from "../pages/SaasOrganizationDetailsPage";
import SaasManageModulesPage from "../pages/SaasManageModulesPage";
import OrganizationBackOfficePage from "../pages/OrganizationBackOfficePage";
import OrganizationManageModulesPage from "../pages/OrganizationManageModulesPage";
import OrganizationDesignPage from "../pages/OrganizationDesignPage";
import OrganizationModuleRequestPage from "../pages/OrganizationModuleRequestPage";
import SaasModuleRequestsPage from "../pages/SaasModuleRequestsPage";
import SaasOrganizationRequestsPage from "../pages/SaasOrganizationRequestsPage";
import SaasLoginPage from "../pages/SaasLoginPage";
import TenantLoginPage from "../pages/TenantLoginPage";
import TenantMyInfoPage from "../pages/TenantMyInfoPage";
import TenantEditProfilePage from "../pages/TenantEditProfilePage";
import ForbiddenPage from "../pages/ForbiddenPage";
import OrganizationUserManagementPage from "../pages/OrganizationUserManagementPage";
import OrganizationModulePage from "../pages/OrganizationModulePage";
import OrganizationModulesPage from "../pages/OrganizationModulesPage";
import OrganizationContentCreatePage from "../pages/OrganizationContentCreatePage";
import SaasAuditLogPage from "../pages/SaasAuditLogPage";
import SaasBillingInvoicesPage from "../pages/SaasBillingInvoicesPage";
import SaasGlobalUsersPage from "../pages/SaasGlobalUsersPage";
import SaasModulesCatalogPage from "../pages/SaasModulesCatalogPage";
import SaasPlatformMonitoringPage from "../pages/SaasPlatformMonitoringPage";
import SaasPlansSubscriptionsPage from "../pages/SaasPlansSubscriptionsPage";
import SaasQuotesPaymentsPage from "../pages/SaasQuotesPaymentsPage";
import SaasSettingsPage from "../pages/SaasSettingsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import { getTenantSlugFromHost } from "../utils/tenant";
import { getAccessToken } from "../utils/tokenStorage";
import { ROLES } from "../utils/rbac";

function AppRouter() {
  const tenantSlug = getTenantSlugFromHost();
  const isTenant = !!tenantSlug;
  const token = getAccessToken();
  const saasRoles = [ROLES.SUPER_ADMIN];
  const tenantBackOfficeRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.MODERATOR];
  const userManagementRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER];
  const adminOnlyRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
  const designRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR];
  const createContentRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER];

  useEffect(() => {
    if (!isTenant) {
      document.title = "CIVOX";
    }
  }, [isTenant]);

  return (
    <BrowserRouter>
      <Routes>
        {!isTenant ? (
          <>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/request-organization" element={<OrganizationRequestPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/payment/:token" element={<PaymentPage />} />
              <Route path="/payment/:token/success" element={<PaymentSuccessPage />} />
            </Route>

            <Route path="/saas/login" element={<SaasLoginPage />} />
            <Route path="/login" element={<Navigate to="/saas/login" replace />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route
              path="/saas"
              element={
                <ProtectedRoute allowedRoles={saasRoles} loginPath="/saas/login">
                  <SaasLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SaasDashboardPage />} />
              <Route path="organizations" element={<SaasOrganizationsPage />} />
              <Route path="organizations/:slug" element={<SaasOrganizationDetailsPage />} />
              <Route path="organizations/:slug/modules" element={<SaasManageModulesPage />} />
              <Route path="requests" element={<SaasOrganizationRequestsPage />} />
              <Route path="module-requests" element={<SaasModuleRequestsPage />} />
              <Route path="modules-catalog" element={<SaasModulesCatalogPage />} />
              <Route path="plans" element={<SaasPlansSubscriptionsPage />} />
              <Route path="billing" element={<SaasBillingInvoicesPage />} />
              <Route path="quotes-payments" element={<SaasQuotesPaymentsPage />} />
              <Route path="users" element={<SaasGlobalUsersPage />} />
              <Route path="activity" element={<SaasAuditLogPage />} />
              <Route path="monitoring" element={<SaasPlatformMonitoringPage />} />
              <Route path="settings" element={<SaasSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/login"
              element={token ? <Navigate to="/" replace /> : <TenantLoginPage />}
            />

            <Route
              path="/"
              element={<OrganizationLayout />}
            >
              <Route index element={<OrganizationDetailsPage />} />
              <Route path="forbidden" element={<ForbiddenPage />} />
              <Route path="modules" element={<OrganizationModulesPage />} />
              <Route path="modules/:moduleSlug" element={<OrganizationModulePage />} />
              <Route
                path="me"
                element={
                  <ProtectedRoute>
                    <TenantMyInfoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile/edit"
                element={
                  <ProtectedRoute>
                    <TenantEditProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice"
                element={
                  <ProtectedRoute allowedRoles={tenantBackOfficeRoles}>
                    <OrganizationBackOfficePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/users"
                element={
                  <ProtectedRoute allowedRoles={userManagementRoles}>
                    <OrganizationUserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/modules"
                element={
                  <ProtectedRoute allowedRoles={adminOnlyRoles}>
                    <OrganizationManageModulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/content"
                element={
                  <ProtectedRoute allowedRoles={adminOnlyRoles}>
                    <OrganizationManageModulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/design"
                element={
                  <ProtectedRoute allowedRoles={designRoles}>
                    <OrganizationDesignPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/settings"
                element={
                  <ProtectedRoute allowedRoles={designRoles}>
                    <OrganizationDesignPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/module-requests"
                element={
                  <ProtectedRoute allowedRoles={designRoles}>
                    <OrganizationModuleRequestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backoffice/create/:contentType"
                element={
                  <ProtectedRoute allowedRoles={createContentRoles}>
                    <OrganizationContentCreatePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
