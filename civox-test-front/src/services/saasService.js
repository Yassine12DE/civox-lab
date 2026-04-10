import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

export async function getSaasOrganizations() {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organizations`);

  if (!response.ok) {
    throw new Error("Failed to fetch SaaS organizations");
  }

  return await response.json();
}

export async function getSaasOrganizationBySlug(slug) {
  const organizations = await getSaasOrganizations();
  return organizations.find((org) => org.slug === slug);
}

export async function getSaasOrganizationModules(organizationId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organizations/${organizationId}/modules`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization modules");
  }

  return await response.json();
}

export async function grantModuleToOrganization(organizationId, moduleCode) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/modules/${moduleCode}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to grant module");
  }

  return await response.json();
}

export async function removeModuleFromOrganization(organizationId, moduleCode) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/modules/${moduleCode}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove module");
  }

  return await response.text();
}

export async function getAllModuleRequests() {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/module-requests`);

  if (!response.ok) {
    throw new Error("Failed to fetch module requests");
  }

  return await response.json();
}

export async function approveModuleRequest(requestId, comment = "") {
  const query = comment ? `?comment=${encodeURIComponent(comment)}` : "";
  const response = await fetchWithAuth(
    `${API_BASE_URL}/saas/module-requests/${requestId}/approve${query}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to approve module request");
  }

  return await response.json();
}

export async function rejectModuleRequest(requestId, comment = "") {
  const query = comment ? `?comment=${encodeURIComponent(comment)}` : "";
  const response = await fetchWithAuth(
    `${API_BASE_URL}/saas/module-requests/${requestId}/reject${query}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to reject module request");
  }

  return await response.json();
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
