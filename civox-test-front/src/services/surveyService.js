import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

export async function getPublicSurveys() {
  return request(`${API_BASE_URL}/public/organization/surveys`);
}

export async function getPublicSurvey(surveyId) {
  return request(`${API_BASE_URL}/public/organization/surveys/${surveyId}`);
}

export async function getOrganizationSurveys(organizationId) {
  return request(`${API_BASE_URL}/org/${organizationId}/surveys`, {}, true);
}

export async function getOrganizationSurvey(organizationId, surveyId) {
  return request(`${API_BASE_URL}/org/${organizationId}/surveys/${surveyId}`, {}, true);
}

export async function createSurvey(organizationId, payload) {
  return request(`${API_BASE_URL}/org/${organizationId}/surveys`, jsonOptions("POST", payload), true);
}

export async function updateSurvey(organizationId, surveyId, payload) {
  return request(`${API_BASE_URL}/org/${organizationId}/surveys/${surveyId}`, jsonOptions("PUT", payload), true);
}

export async function submitSurvey(organizationId, surveyId, answers) {
  return request(
    `${API_BASE_URL}/org/${organizationId}/surveys/${surveyId}/submissions`,
    jsonOptions("POST", { answers }),
    true
  );
}

export async function getSurveyResults(organizationId, surveyId) {
  return request(`${API_BASE_URL}/org/${organizationId}/surveys/${surveyId}/results`, {}, true);
}

export async function downloadSurveyResults(organizationId, surveyId, title = "survey") {
  const response = await fetch(`${API_BASE_URL}/org/${organizationId}/surveys/${surveyId}/results.csv`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw await apiError(response, "Failed to export survey responses");
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(title)}-responses.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function request(url, options = {}, authenticated = false) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), ...(authenticated ? authHeaders() : {}) },
  });
  if (!response.ok) throw await apiError(response, "Survey request failed");
  return response.json();
}

function jsonOptions(method, body) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiError(response, fallback) {
  let payload = {};
  try { payload = await response.json(); } catch { /* non-JSON response */ }
  const fields = payload.fields ? Object.values(payload.fields).join(" ") : "";
  const error = new Error([payload.message || fallback, fields].filter(Boolean).join(" — "));
  error.status = response.status;
  return error;
}

function slugify(value) {
  return String(value || "survey").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
