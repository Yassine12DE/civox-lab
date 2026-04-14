import { modules } from "../data/modules";
import { getAccessToken } from "../utils/tokenStorage";
import API_BASE_URL from "./api";

export function getEnabledModulesForOrganization(organization) {
  if (!organization || !organization.enabledModules) {
    return [];
  }

  return modules.filter((module) =>
    organization.enabledModules.includes(module.code)
  );
}
export async function fetchMyModules() {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/modules/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load modules");
  }

  return data;
}
