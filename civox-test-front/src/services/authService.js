import API_BASE_URL from "./api";
import { getAccessToken, saveTokens, clearTokens } from "../utils/tokenStorage";

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function loginSaas(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/saas-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "SaaS login failed");
  }

  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function fetchMe() {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearTokens();
    }
    const data = await readJsonOrEmpty(response);
    throw new Error(data.message || "Failed to load profile");
  }

  return await response.json();
}

export async function updateMe(profile) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearTokens();
    }
    const data = await readJsonOrEmpty(response);
    throw new Error(data.message || "Failed to update profile");
  }

  return await response.json();
}

export async function logout() {
  const token = getAccessToken();
  clearTokens();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.warn("Logout request failed after local sign-out", error);
    }
  }
}

async function readJsonOrEmpty(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
