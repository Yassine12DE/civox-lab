export function getTenantSlugFromHost() {
  const host = window.location.hostname;

  if (host === "lvh.me" || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (host.endsWith(".lvh.me")) {
    return host.split(".")[0];
  }

  return null;
}

export function isPublicHost() {
  return getTenantSlugFromHost() === null;
}