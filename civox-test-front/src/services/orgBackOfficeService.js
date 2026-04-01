import API_BASE_URL from "./api";

export async function getOrganizationBackOfficeModules(organizationId) {
  const response = await fetch(`${API_BASE_URL}/org/${organizationId}/modules`);

  if (!response.ok) {
    throw new Error("Failed to fetch back-office modules");
  }

  return await response.json();
}

export async function updateOrganizationModuleVisibility(organizationId, moduleCode, enabled) {
  const response = await fetch(
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
  const response = await fetch(`${API_BASE_URL}/org/${organizationId}/settings`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization settings");
  }

  return await response.json();
}

export async function updateOrganizationSettings(organizationId, payload) {
  const response = await fetch(`${API_BASE_URL}/org/${organizationId}/settings`, {
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
  const response = await fetch(
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
  const response = await fetch(`${API_BASE_URL}/org/${organizationId}/module-requests`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization module requests");
  }

  return await response.json();
}