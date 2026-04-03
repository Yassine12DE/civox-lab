import API_BASE_URL from "./api";

export async function getPublicOrganizations() {
  const response = await fetch(`${API_BASE_URL}/public/organizations`);

  if (!response.ok) {
    throw new Error("Failed to fetch public organizations");
  }

  return await response.json();
}

export async function getCurrentOrganization() {
  const response = await fetch(`${API_BASE_URL}/public/organization`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization details");
  }

  return await response.json();
}