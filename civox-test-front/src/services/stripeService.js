import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

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

export async function createPublicStripeCheckoutSession(payload) {
  return postJson(`${API_BASE_URL}/public/stripe/checkout-sessions`, payload, "Failed to create Stripe checkout session");
}

export async function createSaasStripeCheckoutSession(payload) {
  return postJson(`${API_BASE_URL}/saas/stripe/checkout-sessions`, payload, "Failed to create Stripe checkout session");
}

export async function getStripeCheckoutSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/public/stripe/checkout-sessions/${encodeURIComponent(sessionId)}`);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Stripe checkout session could not be loaded"));
  }

  return response.json();
}

export async function refreshStripeCheckoutSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/public/stripe/checkout-sessions/${encodeURIComponent(sessionId)}/refresh`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Stripe checkout session could not be refreshed"));
  }

  return response.json();
}

async function postJson(url, payload, fallbackMessage) {
  const response = await fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, fallbackMessage));
  }

  return response.json();
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
