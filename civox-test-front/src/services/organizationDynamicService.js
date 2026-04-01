import API_BASE_URL from "./api";

export async function getOrganizationSettingsBySlug(slug) {
  const response = await fetch(`${API_BASE_URL}/public/organizations/${slug}/settings`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization settings");
  }

  return await response.json();
}

export async function getVisibleModulesBySlug(slug) {
  const response = await fetch(`${API_BASE_URL}/public/organizations/${slug}/modules`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization modules");
  }

  return await response.json();
}