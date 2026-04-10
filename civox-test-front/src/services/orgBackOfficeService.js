import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

export async function getOrganizationBackOfficeModules(organizationId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/modules`);

  if (!response.ok) {
    throw new Error("Failed to fetch back-office modules");
  }

  return await response.json();
}

export async function updateOrganizationModuleVisibility(organizationId, moduleCode, enabled) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/org/${organizationId}/modules/${moduleCode}/visibility?enabled=${enabled}`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update module visibility");
  }

  return await response.json();
}

export async function getOrganizationSettings(organizationId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/settings`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization settings");
  }

  return await response.json();
}

export async function updateOrganizationSettings(organizationId, payload) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update organization settings");
  }

  return await response.json();
}

export async function createModuleRequest(organizationId, moduleCode, comment = "") {
  const query = comment ? `?comment=${encodeURIComponent(comment)}` : "";
  const response = await fetchWithAuth(
    `${API_BASE_URL}/org/${organizationId}/module-requests/${moduleCode}${query}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create module request");
  }

  return await response.json();
}

export async function getOrganizationModuleRequests(organizationId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/module-requests`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization module requests");
  }

  return await response.json();
}

export async function getOrganizationUsers(organizationId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/users`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization users");
  }

  return await response.json();
}

export async function createOrganizationUser(organizationId, payload) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await readJsonOrEmpty(response);
    throw new Error(data.message || "Failed to create organization user");
  }

  return await response.json();
}

export async function setOrganizationUserArchived(organizationId, userId, archived) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/org/${organizationId}/users/${userId}/archive?archived=${archived}`,
    { method: "PATCH" }
  );

  if (!response.ok) {
    const data = await readJsonOrEmpty(response);
    throw new Error(data.message || "Failed to update organization user");
  }

  return await response.json();
}

export async function getOrganizationContent(organizationId, contentType) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/content/${contentType}`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization content");
  }

  return await response.json();
}

export async function createOrganizationContent(organizationId, contentType, payload) {
  const response = await fetchWithAuth(`${API_BASE_URL}/org/${organizationId}/content/${contentType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await readJsonOrEmpty(response);
    throw new Error(data.message || "Failed to create organization content");
  }

  return await response.json();
}

export async function saveOrganizationContentResponse(organizationId, contentType, contentId, payload) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/org/${organizationId}/content/${contentType}/${contentId}/response`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const data = await readJsonOrEmpty(response);
    throw new Error(data.message || "Failed to save content response");
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

async function readJsonOrEmpty(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
