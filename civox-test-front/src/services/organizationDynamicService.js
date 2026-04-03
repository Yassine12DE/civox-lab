import API_BASE_URL from "./api";

export async function getCurrentOrganizationSettings() {
  const response = await fetch(`${API_BASE_URL}/public/organization/settings`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization settings");
  }

  return await response.json();
}

export async function getCurrentOrganizationModules() {
  const response = await fetch(`${API_BASE_URL}/public/organization/modules`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization modules");
  }

  return await response.json();
}