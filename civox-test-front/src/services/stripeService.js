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

export async function createPublicStripePaymentIntent(payload) {
  return postJson(`${API_BASE_URL}/public/stripe/payment-intents`, payload, "Failed to prepare secure payment");
}

export async function syncPublicStripePaymentIntent(paymentIntentId) {
  return postJson(
    `${API_BASE_URL}/public/stripe/payment-intents/${encodeURIComponent(paymentIntentId)}/sync`,
    {},
    "Failed to verify Stripe payment"
  );
}

export async function createSaasStripeCheckoutSession(payload) {
  return postJson(`${API_BASE_URL}/saas/stripe/checkout-sessions`, payload, "Failed to create Stripe checkout session");
}

export async function createSaasStripePaymentIntent(payload) {
  return postJson(`${API_BASE_URL}/saas/stripe/payment-intents`, payload, "Failed to prepare secure payment");
}

export async function syncSaasStripePaymentIntent(paymentIntentId) {
  return postJson(
    `${API_BASE_URL}/saas/stripe/payment-intents/${encodeURIComponent(paymentIntentId)}/sync`,
    {},
    "Failed to verify Stripe payment"
  );
}

export async function createTenantModuleStripePaymentIntent(organizationId, moduleCode, billingCycle) {
  const query = billingCycle ? `?billingCycle=${encodeURIComponent(billingCycle)}` : "";
  return postJson(
    `${API_BASE_URL}/org/${organizationId}/module-purchases/${encodeURIComponent(moduleCode)}/payment-intents${query}`,
    {},
    "Failed to prepare module payment"
  );
}

export async function syncTenantStripePaymentIntent(organizationId, paymentIntentId) {
  return postJson(
    `${API_BASE_URL}/org/${organizationId}/stripe/payment-intents/${encodeURIComponent(paymentIntentId)}/sync`,
    {},
    "Failed to verify Stripe payment"
  );
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
