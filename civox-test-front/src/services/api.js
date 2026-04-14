const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = (configuredApiBaseUrl || resolveLocalApiBaseUrl()).replace(/\/+$/, "");

function resolveLocalApiBaseUrl() {
  const { hostname } = window.location;

  if (hostname === "lvh.me") {
    return "http://localhost:8081";
  }

  return `http://${hostname}:8081`;
}

export default API_BASE_URL;
