import API_BASE_URL from "./api";

export async function submitOrganizationRequest(formData) {
  const response = await fetch(`${API_BASE_URL}/public/organization-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error("Failed to submit organization request");
  }

  return await response.json();
}