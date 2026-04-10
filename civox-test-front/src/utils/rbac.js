export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MODERATOR: "MODERATOR",
  CITIZEN: "CITIZEN",
};

const MANAGER_CREATION_MODULE_CODES = ["VOTE", "CONFERENCE", "YOUTHSPACE"];

export function isSuperAdmin(userOrRole) {
  return roleOf(userOrRole) === ROLES.SUPER_ADMIN;
}

export function canOpenBackOffice(userOrRole) {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.MODERATOR,
  ].includes(roleOf(userOrRole));
}

export function canManageUsers(userOrRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(roleOf(userOrRole));
}

export function canManageModuleVisibility(userOrRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(roleOf(userOrRole));
}

export function canCustomizeDesign(userOrRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR].includes(roleOf(userOrRole));
}

export function canRequestModules(userOrRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR].includes(roleOf(userOrRole));
}

export function canCreateTenantContent(userOrRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(roleOf(userOrRole));
}

export function canCreateFromModule(userOrRole, moduleCode) {
  return canCreateTenantContent(userOrRole) && MANAGER_CREATION_MODULE_CODES.includes(moduleCode);
}

export function canAssignTenantRole(userOrRole, targetRole) {
  const actorRole = roleOf(userOrRole);
  if (actorRole === ROLES.SUPER_ADMIN || actorRole === ROLES.ADMIN) {
    return [ROLES.ADMIN, ROLES.MANAGER, ROLES.MODERATOR, ROLES.CITIZEN].includes(targetRole);
  }
  if (actorRole === ROLES.MANAGER) {
    return targetRole === ROLES.CITIZEN;
  }
  return false;
}

function roleOf(userOrRole) {
  if (!userOrRole) return null;
  return typeof userOrRole === "string" ? userOrRole : userOrRole.role;
}
