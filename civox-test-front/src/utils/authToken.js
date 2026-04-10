import { clearTokens, getAccessToken } from "./tokenStorage";

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

export function getAccessTokenPayload() {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function getTokenRole() {
  return getAccessTokenPayload()?.role || null;
}

export function isAccessTokenExpired() {
  const payload = getAccessTokenPayload();
  if (!payload?.exp) {
    return false;
  }
  return payload.exp * 1000 <= Date.now();
}

export function clearExpiredToken() {
  if (isAccessTokenExpired()) {
    clearTokens();
    return true;
  }
  return false;
}
