import { modules } from "../data/modules";

export function getEnabledModulesForOrganization(organization) {
  if (!organization || !organization.enabledModules) {
    return [];
  }

  return modules.filter((module) =>
    organization.enabledModules.includes(module.code)
  );
}