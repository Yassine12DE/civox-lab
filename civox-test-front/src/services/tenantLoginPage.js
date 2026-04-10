import API_BASE_URL from "./api";

export async function loginToOrganization(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to login");
  }

  localStorage.setItem("civox_access_token", data.accessToken);
  localStorage.setItem("civox_refresh_token", data.refreshToken);

  return data;
}

export async function getCurrentAuthenticatedUser() {
  const token = localStorage.getItem("civox_access_token");

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch current user");
  }

  return data;
}

export async function getCurrentOrganizationBranding() {
  const response = await fetch(`${API_BASE_URL}/public/organization`);

  if (!response.ok) {
    throw new Error("Failed to fetch organization branding");
  }

  return await response.json();
}