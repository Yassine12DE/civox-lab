import API_BASE_URL from "./api";

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

export async function submitOrganizationRequest(formData) {
  const response = await fetch(`${API_BASE_URL}/public/organization-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to submit organization request"));
  }

  return await response.json();
}

export async function getPublicModules() {
  const response = await fetch(`${API_BASE_URL}/public/modules`);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Failed to load available modules"));
  }

  return await response.json();
}

export async function getPaymentSummary(token) {
  const response = await fetch(`${API_BASE_URL}/public/organization-requests/payment/${token}`);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Payment link could not be loaded"));
  }

  return await response.json();
}

export async function completePayment(token) {
  const response = await fetch(`${API_BASE_URL}/public/organization-requests/payment/${token}/success`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Payment could not be completed"));
  }

  return await response.json();
}
