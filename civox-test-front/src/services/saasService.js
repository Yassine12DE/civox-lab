import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

export async function getSaasOrganizations() {
  return fetchJsonWithAuth(`${API_BASE_URL}/saas/organizations`, {}, "Failed to fetch SaaS organizations");
}

export async function getSaasOrganizationBySlug(slug) {
  const organizations = await getSaasOrganizations();
  return organizations.find((organization) => organization.slug === slug) || null;
}

export async function createSaasOrganization(organization) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(organization),
    },
    "Failed to create organization"
  );
}

export async function updateSaasOrganization(organizationId, organization) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(organization),
    },
    "Failed to update organization"
  );
}

export async function toggleSaasOrganizationStatus(organizationId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/toggle-status`,
    {
      method: "PATCH",
    },
    "Failed to update organization status"
  );
}

export async function getSaasOrganizationUsers(organizationId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/users`,
    {},
    "Failed to fetch organization users"
  );
}

export async function getSaasOrganizationModules(organizationId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/modules`,
    {},
    "Failed to fetch organization modules"
  );
}

export async function getSaasOrganizationSettings(organizationId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/org/${organizationId}/settings`,
    {},
    "Failed to fetch organization settings"
  );
}

export async function updateSaasOrganizationSettings(organizationId, settings) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/org/${organizationId}/settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    },
    "Failed to update organization settings"
  );
}

export async function grantModuleToOrganization(organizationId, moduleIdOrCode) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/modules/${moduleIdOrCode}`,
    {
      method: "POST",
    },
    "Failed to grant module"
  );
}

export async function removeModuleFromOrganization(organizationId, moduleIdOrCode) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/modules/${moduleIdOrCode}`,
    {
      method: "DELETE",
    },
    "Failed to remove module"
  );
}

export async function getSaasModuleCatalog() {
  return fetchJsonWithAuth(`${API_BASE_URL}/saas/modules`, {}, "Failed to fetch module catalog");
}

export async function createSaasModule(modulePayload) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/modules`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modulePayload),
    },
    "Failed to create module"
  );
}

export async function updateSaasModule(moduleId, modulePayload) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/modules/${moduleId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modulePayload),
    },
    "Failed to update module"
  );
}

export async function setSaasModuleActive(moduleId, active) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/modules/${moduleId}/active?active=${encodeURIComponent(Boolean(active))}`,
    {
      method: "PATCH",
    },
    "Failed to update module status"
  );
}

export async function getSaasUsers() {
  return fetchJsonWithAuth(`${API_BASE_URL}/saas/users`, {}, "Failed to fetch SaaS users");
}

export async function createSaasUser(userPayload) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userPayload),
    },
    "Failed to create user"
  );
}

export async function updateSaasUser(userId, userPayload) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/users/${userId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userPayload),
    },
    "Failed to update user"
  );
}

export async function archiveSaasUser(userId, archived) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/users/${userId}/archive?archived=${encodeURIComponent(Boolean(archived))}`,
    {
      method: "PATCH",
    },
    "Failed to archive user"
  );
}

export async function resetSaasUserPassword(userId, newPassword = "") {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/users/${userId}/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPassword }),
    },
    "Failed to reset password"
  );
}

export async function getSaasSettings() {
  return fetchJsonWithAuth(`${API_BASE_URL}/saas/settings`, {}, "Failed to fetch SaaS settings");
}

export async function updateSaasSettings(payload) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Failed to update SaaS settings"
  );
}

export async function getAllModuleRequests() {
  return fetchJsonWithAuth(`${API_BASE_URL}/saas/module-requests`, {}, "Failed to fetch module requests");
}

export async function approveModuleRequest(requestId, comment = "") {
  const query = comment ? `?comment=${encodeURIComponent(comment)}` : "";
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/module-requests/${requestId}/approve${query}`,
    {
      method: "POST",
    },
    "Failed to approve module request"
  );
}

export async function rejectModuleRequest(requestId, comment = "") {
  const query = comment ? `?comment=${encodeURIComponent(comment)}` : "";
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/module-requests/${requestId}/reject${query}`,
    {
      method: "POST",
    },
    "Failed to reject module request"
  );
}

export async function getOrganizationAccessRequests({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search) params.set("search", search);

  const query = params.toString();
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests${query ? `?${query}` : ""}`,
    {},
    "Failed to fetch organization requests"
  );
}

export async function getOrganizationAccessRequest(requestId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests/${requestId}`,
    {},
    "Failed to fetch organization request"
  );
}

export async function sendOrganizationAccessQuote(requestId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests/${requestId}/quote`,
    {
      method: "POST",
    },
    "Failed to generate quote"
  );
}

export async function approveOrganizationAccessRequest(requestId, notes = "") {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests/${requestId}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes }),
    },
    "Failed to approve request"
  );
}

export async function declineOrganizationAccessRequest(requestId, reason = "") {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests/${requestId}/decline`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
    "Failed to decline request"
  );
}

export async function markOrganizationAccessRequestPaid(requestId) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests/${requestId}/mark-paid`,
    {
      method: "POST",
    },
    "Failed to mark payment completed"
  );
}

export async function resendOrganizationAccessEmail(requestId, type) {
  return fetchJsonWithAuth(
    `${API_BASE_URL}/saas/organization-requests/${requestId}/resend-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    },
    "Failed to resend email"
  );
}

function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

async function fetchJsonWithAuth(url, options, fallbackMessage) {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    throw new Error(await parseApiError(response, fallbackMessage));
  }

  if (response.status === 204) return null;
  return response.json();
}

async function parseApiError(response, fallbackMessage) {
  try {
    const data = await response.json();
    if (data?.fields) {
      return Object.values(data.fields).join(". ");
    }
    return data?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
