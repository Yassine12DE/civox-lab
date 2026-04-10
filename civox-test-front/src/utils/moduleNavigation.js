const MODULE_ROUTES = {
  VOTE: "/modules/vote",
  CONFERENCE: "/modules/concertation",
  YOUTHSPACE: "/modules/youth-news",
};

const MODULE_CREATE_ROUTES = {
  VOTE: "/backoffice/create/vote",
  CONFERENCE: "/backoffice/create/concertation",
  YOUTHSPACE: "/backoffice/create/youth-news",
};

export function getModuleRoute(moduleCode) {
  return MODULE_ROUTES[moduleCode] || `/modules/${String(moduleCode || "").toLowerCase()}`;
}

export function getModuleCreateRoute(moduleCode) {
  return MODULE_CREATE_ROUTES[moduleCode] || null;
}

export function getModuleContentType(moduleCode) {
  const createRoute = getModuleCreateRoute(moduleCode);
  return createRoute?.split("/").pop() || null;
}
