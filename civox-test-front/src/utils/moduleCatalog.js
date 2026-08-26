const MODULE_METADATA = {
  VOTE: {
    route: "/modules/vote",
    createRoute: "/backoffice/create/vote",
    contentType: "vote",
    icon: "vote",
    tone: "primary",
    category: "Civic Decision",
    responseLabel: "Vote",
    scope: "BOTH",
  },
  CONFERENCE: {
    route: "/modules/concertation",
    createRoute: "/backoffice/create/concertation",
    contentType: "concertation",
    icon: "message",
    tone: "secondary",
    category: "Consultation",
    responseLabel: "Attend",
    scope: "BOTH",
  },
  YOUTHSPACE: {
    route: "/modules/youth-news",
    createRoute: "/backoffice/create/youth-news",
    contentType: "youth-news",
    icon: "file",
    tone: "primary",
    category: "Community News",
    responseLabel: "React",
    scope: "BOTH",
  },
  EVENTS: {
    route: "/modules/events",
    icon: "calendar",
    tone: "secondary",
    category: "Events",
    responseLabel: "View",
    scope: "BOTH",
  },
  SURVEYS: {
    route: "/modules/surveys",
    createRoute: "/backoffice/surveys/new",
    icon: "file",
    tone: "primary",
    category: "Surveys",
    responseLabel: "Respond",
    scope: "BOTH",
  },
  COMPLAINTS: {
    route: "/modules/complaints",
    icon: "alert",
    tone: "secondary",
    category: "Service Tracking",
    responseLabel: "Track",
    scope: "BOTH",
  },
  NEWS: {
    route: "/modules/news",
    icon: "book",
    tone: "primary",
    category: "Announcements",
    responseLabel: "Read",
    scope: "BOTH",
  },
  ANALYTICS: {
    route: "/modules/analytics",
    icon: "barChart",
    tone: "secondary",
    category: "Insights",
    responseLabel: "Analyze",
    scope: "BACK_OFFICE",
  },
};

const MODULE_SCOPE = {
  FRONT_OFFICE: "FRONT_OFFICE",
  BACK_OFFICE: "BACK_OFFICE",
  BOTH: "BOTH",
  SAAS_ONLY: "SAAS_ONLY",
};

export function getModuleMeta(moduleCode) {
  return MODULE_METADATA[moduleCode] || null;
}

export function getModuleRoute(moduleCode) {
  const meta = getModuleMeta(moduleCode);
  return meta?.route || `/modules/${String(moduleCode || "").toLowerCase()}`;
}

export function getModuleCreateRoute(moduleCode) {
  return getModuleMeta(moduleCode)?.createRoute || null;
}

export function getModuleContentType(moduleCode) {
  return getModuleMeta(moduleCode)?.contentType || null;
}

export function getModuleCategory(moduleCode) {
  return getModuleMeta(moduleCode)?.category || "Organization Module";
}

export function getModuleIcon(moduleCode, fallback = "layers") {
  return getModuleMeta(moduleCode)?.icon || fallback;
}

export function getModuleTone(moduleCode, fallback = "primary") {
  return getModuleMeta(moduleCode)?.tone || fallback;
}

export function getModuleResponseLabel(moduleCode) {
  return getModuleMeta(moduleCode)?.responseLabel || "View";
}

export function normalizeModuleScope(scope) {
  const normalized = String(scope || "").trim().toUpperCase();
  if (Object.values(MODULE_SCOPE).includes(normalized)) {
    return normalized;
  }
  return MODULE_SCOPE.BOTH;
}

export function getModuleScope(moduleCode, fallback = MODULE_SCOPE.BOTH) {
  const metaScope = getModuleMeta(moduleCode)?.scope;
  return normalizeModuleScope(metaScope || fallback);
}

export function isFrontOfficeScope(scope) {
  const normalized = normalizeModuleScope(scope);
  return normalized === MODULE_SCOPE.FRONT_OFFICE || normalized === MODULE_SCOPE.BOTH;
}

export function isBackOfficeScope(scope) {
  const normalized = normalizeModuleScope(scope);
  return normalized === MODULE_SCOPE.BACK_OFFICE || normalized === MODULE_SCOPE.BOTH;
}

export function isModuleFrontOfficeVisible(module) {
  const scope = module?.moduleScope || module?.scope || getModuleScope(module?.moduleCode);
  return isFrontOfficeScope(scope);
}

export function isModuleBackOfficeVisible(module) {
  const scope = module?.moduleScope || module?.scope || getModuleScope(module?.moduleCode);
  return isBackOfficeScope(scope);
}
