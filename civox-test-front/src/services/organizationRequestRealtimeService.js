import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";
import { connectSse } from "./sseClient";

export function subscribeToSaasOrganizationRequestEvents(onEvent, onError) {
  const token = getAccessToken();
  return connectSse(`${API_BASE_URL}/saas/organization-requests/events`, {
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onMessage: (message) => {
      if (message.event === "organization-request-payment") {
        onEvent?.(message.data);
      }
    },
    onError,
  });
}

export function subscribeToPublicOrganizationRequestEvents(paymentToken, onEvent, onError) {
  if (!paymentToken) {
    throw new Error("Payment token is required to subscribe to organization request events");
  }

  return connectSse(`${API_BASE_URL}/public/organization-requests/${encodeURIComponent(paymentToken)}/events`, {
    headers: {
      Accept: "text/event-stream",
    },
    onMessage: (message) => {
      if (message.event === "organization-request-payment") {
        onEvent?.(message.data);
      }
    },
    onError,
  });
}
