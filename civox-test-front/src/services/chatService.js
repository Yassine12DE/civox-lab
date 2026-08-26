import API_BASE_URL from "./api";
import { getAccessToken } from "../utils/tokenStorage";

export async function sendChatMessage(message, history = []) {
  const token = getAccessToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(safeHttpMessage(response.status, data?.message));
  }
  if (!data?.reply) {
    throw new Error("The assistant returned an empty response. Please try again.");
  }
  return data;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function safeHttpMessage(status, serverMessage) {
  if (status === 401) return "Your session has expired. Sign in again to use CIVOX Copilot.";
  if (status === 403) return "Your current account cannot access this assistant context.";
  if (status === 400) return "The organization context could not be verified.";
  if (status >= 500) return "The assistant is temporarily unavailable. Please try again.";
  return serverMessage || "Unable to contact the assistant.";
}
