import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

export async function getSaasOrganizations() {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organizations`);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to fetch SaaS organizations"));
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
    throw new Error(await parseApiError(response, "Failed to fetch organization modules"));
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
    throw new Error(await parseApiError(response, "Failed to grant module"));
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
    throw new Error(await parseApiError(response, "Failed to remove module"));
  }

  return await response.text();
}

export async function updateSaasOrganization(organizationId, organization) {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organizations/${organizationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(organization),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to update organization"));
  }

  return await response.json();
}

export async function toggleSaasOrganizationStatus(organizationId) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/saas/organizations/${organizationId}/toggle-status`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to update organization status"));
  }

  return await response.json();
}

export async function getAllModuleRequests() {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/module-requests`);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to fetch module requests"));
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
    throw new Error(await parseApiError(response, "Failed to approve module request"));
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
    throw new Error(await parseApiError(response, "Failed to reject module request"));
  }

  return await response.json();
}

export async function getOrganizationAccessRequests({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search) params.set("search", search);

  const query = params.toString();
  const response = await fetchWithAuth(
    `${API_BASE_URL}/saas/organization-requests${query ? `?${query}` : ""}`
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to fetch organization requests"));
  }

  return await response.json();
}

export async function getOrganizationAccessRequest(requestId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organization-requests/${requestId}`);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to fetch organization request"));
  }

  return await response.json();
}

export async function sendOrganizationAccessQuote(requestId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organization-requests/${requestId}/quote`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to generate quote"));
  }

  return await response.json();
}

export async function approveOrganizationAccessRequest(requestId, notes = "") {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organization-requests/${requestId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to approve request"));
  }

  return await response.json();
}

export async function declineOrganizationAccessRequest(requestId, reason = "") {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organization-requests/${requestId}/decline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to decline request"));
  }

  return await response.json();
}

export async function markOrganizationAccessRequestPaid(requestId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organization-requests/${requestId}/mark-paid`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to mark payment completed"));
  }

  return await response.json();
}

export async function resendOrganizationAccessEmail(requestId, type) {
  const response = await fetchWithAuth(`${API_BASE_URL}/saas/organization-requests/${requestId}/resend-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to resend email"));
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
