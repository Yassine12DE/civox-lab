import { formatStatus } from "./saasFormat";

const PLAN_PRICE_BY_YEAR = {
  Starter: 1200,
  Professional: 3200,
  Enterprise: 6800,
};

const PLAN_MRR = {
  Starter: 100,
  Professional: 267,
  Enterprise: 567,
};

export function resolvePlan(usersCount = 0) {
  if (usersCount >= 300) return "Enterprise";
  if (usersCount >= 120) return "Professional";
  return "Starter";
}

export function resolveSubscriptionStatus(organizationStatus, usersCount = 0) {
  const status = String(organizationStatus || "").toUpperCase();
  if (status === "PENDING") return "TRIAL";
  if (status === "INACTIVE") return "PAST_DUE";
  if (usersCount === 0) return "TRIAL";
  return "ACTIVE";
}

export function buildSubscriptions(organizations = []) {
  return organizations.map((organization) => {
    const usersCount = Number(organization.usersCount || 0);
    const plan = resolvePlan(usersCount);
    const status = resolveSubscriptionStatus(organization.status, usersCount);

    return {
      organizationId: organization.id,
      organization: organization.name,
      slug: organization.slug,
      users: usersCount,
      plan,
      mrr: PLAN_MRR[plan] || 100,
      status,
      trial: status === "TRIAL",
      lifecycle: status === "PAST_DUE" ? "Payment follow-up" : status === "TRIAL" ? "Trial onboarding" : "Healthy",
      renewalDate: buildRenewalDate(organization.createdAt),
      createdAt: organization.createdAt || null,
    };
  });
}

export function buildOrganizationGrowth(organizations = [], points = 7) {
  const months = buildRecentMonths(points);
  let cumulative = 0;

  return months.map((month) => {
    const monthCount = organizations.filter((organization) => inMonth(organization.createdAt, month)).length;
    cumulative += monthCount;
    return {
      label: month.label,
      value: cumulative,
    };
  });
}

export function buildRevenueTrendFromSubscriptions(subscriptions = [], points = 7) {
  const months = buildRecentMonths(points);

  return months.map((month) => {
    const monthEndTimestamp = new Date(month.year, month.month + 1, 1).getTime();
    const monthMrr = subscriptions.reduce((sum, subscription) => {
      const createdAt = toTimestamp(subscription.createdAt);
      if (createdAt && createdAt >= monthEndTimestamp) return sum;
      if (String(subscription.status || "").toUpperCase() === "PAST_DUE") return sum;
      return sum + Number(subscription.mrr || 0);
    }, 0);

    return {
      label: month.label,
      value: Math.round(monthMrr),
    };
  });
}

export function buildSubscriptionDistribution(subscriptions = []) {
  const counts = subscriptions.reduce(
    (acc, subscription) => {
      acc[subscription.plan] = (acc[subscription.plan] || 0) + 1;
      return acc;
    },
    {}
  );

  return [
    { label: "Starter", value: counts.Starter || 0, color: "#7B2CBF" },
    { label: "Professional", value: counts.Professional || 0, color: "#9D4EDD" },
    { label: "Enterprise", value: counts.Enterprise || 0, color: "#FF6B35" },
  ];
}

export function buildModuleDemand(moduleRequests = []) {
  const demand = moduleRequests.reduce((acc, request) => {
    const key = request.moduleName || request.moduleCode || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(demand)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 7);
}

export function buildInvoices(organizationRequests = [], organizations = []) {
  return organizationRequests
    .filter((request) => Number(request.quoteTotal || 0) > 0)
    .map((request) => {
      const matchingOrganization = organizations.find(
        (organization) => organization.slug === request.desiredSlug || organization.name === request.organizationName
      );
      const plan = resolvePlan(Number(request.expectedNumberOfUsers || 0));
      const dueDate = request.approvedAt || request.quoteSentAt || request.createdAt;

      return {
        id: `INV-${String(request.id).padStart(5, "0")}`,
        requestId: request.id,
        organization: request.organizationName,
        slug: request.desiredSlug,
        plan,
        amount: Number(request.quoteTotal || PLAN_PRICE_BY_YEAR[plan]),
        dueDate,
        paidDate: request.paidAt,
        status: resolveInvoiceStatus(request),
        tenantActive: Boolean(request.organizationCreatedId || matchingOrganization?.id),
      };
    })
    .sort((left, right) => toTimestamp(right.dueDate) - toTimestamp(left.dueDate));
}

export function buildQuotesPayments(organizationRequests = []) {
  return organizationRequests
    .filter((request) => Number(request.quoteTotal || 0) > 0 || request.quoteStatus)
    .map((request) => ({
      id: `QTE-${String(request.id).padStart(5, "0")}`,
      requestId: request.id,
      organization: request.organizationName,
      slug: request.desiredSlug,
      owner: request.contactPersonName,
      amount: Number(request.quoteTotal || 0),
      status: resolveQuotePipelineStatus(request),
      paymentStatus: String(request.paymentStatus || "NOT_STARTED").toUpperCase(),
      expiresAt: request.quoteSentAt || request.createdAt,
      modules: (request.requestedModuleCodes || []).length,
      paymentUrl: request.paymentUrl || "",
    }))
    .sort((left, right) => toTimestamp(right.expiresAt) - toTimestamp(left.expiresAt));
}

export function buildAuditLogs({ organizations = [], organizationRequests = [], moduleRequests = [], users = [] }) {
  const events = [];
  const usersByEmail = new Map(
    users
      .filter((user) => user?.email)
      .map((user) => [String(user.email).toLowerCase(), String(user.role || "SYSTEM").toUpperCase()])
  );

  organizationRequests.forEach((request) => {
    if (request.createdAt) {
      events.push(
        makeEvent({
          action: "Onboarding request created",
          organization: request.organizationName,
          actor: request.contactEmail || request.contactPersonName || "System",
          timestamp: request.createdAt,
          outcome: "SUCCESS",
          severity: "INFO",
          targetObject: request.desiredSlug || request.organizationName,
          usersByEmail,
        })
      );
    }
    if (request.quoteSentAt) {
      events.push(
        makeEvent({
          action: "Quote sent",
          organization: request.organizationName,
          actor: request.processedBy || "SUPER_ADMIN",
          timestamp: request.quoteSentAt,
          outcome: "SUCCESS",
          severity: "INFO",
          targetObject: `QTE-${String(request.id).padStart(5, "0")}`,
          usersByEmail,
        })
      );
    }
    if (request.approvedAt) {
      events.push(
        makeEvent({
          action: "Payment link approved",
          organization: request.organizationName,
          actor: request.reviewedBy || request.processedBy || "SUPER_ADMIN",
          timestamp: request.approvedAt,
          outcome: "SUCCESS",
          severity: "WARNING",
          targetObject: request.paymentStatus || "AWAITING_PAYMENT",
          usersByEmail,
        })
      );
    }
    if (request.paidAt) {
      events.push(
        makeEvent({
          action: "Payment completed",
          organization: request.organizationName,
          actor: request.processedBy || "System",
          timestamp: request.paidAt,
          outcome: "SUCCESS",
          severity: "INFO",
          targetObject: request.paymentStatus || "PAID",
          usersByEmail,
        })
      );
    }
    if (request.declinedAt) {
      events.push(
        makeEvent({
          action: "Request declined",
          organization: request.organizationName,
          actor: request.reviewedBy || request.processedBy || "SUPER_ADMIN",
          timestamp: request.declinedAt,
          outcome: "FAILED",
          severity: "WARNING",
          targetObject: request.declineReason || "Decline",
          usersByEmail,
        })
      );
    }
  });

  moduleRequests.forEach((request) => {
    const normalizedStatus = String(request.status || "").toUpperCase();
    events.push(
      makeEvent({
        action: `Module request ${formatStatus(request.status)}`,
        organization: request.organizationName,
        actor: request.reviewedBy || request.requestedBy || "Tenant admin",
        timestamp: request.reviewedDate || request.requestDate,
        outcome: normalizedStatus === "REJECTED" ? "FAILED" : "SUCCESS",
        severity: normalizedStatus === "PENDING" ? "WARNING" : "INFO",
        targetObject: request.moduleCode || request.moduleName || "Module",
        usersByEmail,
      })
    );
  });

  users.forEach((user) => {
    if (user.archived) {
      events.push(
        makeEvent({
          action: "User archived",
          organization: user.organization || "Platform",
          actor: user.email || "SUPER_ADMIN",
          timestamp: user.createdAt,
          outcome: "SUCCESS",
          severity: "WARNING",
          targetObject: user.email || "User",
          usersByEmail,
        })
      );
    }
  });

  organizations.forEach((organization) => {
    if (String(organization.status || "").toUpperCase() === "INACTIVE") {
      events.push(
        makeEvent({
          action: "Organization set inactive",
          organization: organization.name,
          actor: "SUPER_ADMIN",
          timestamp: organization.createdAt,
          outcome: "SUCCESS",
          severity: "WARNING",
          targetObject: organization.slug || organization.name,
          usersByEmail,
        })
      );
    }
  });

  return events
    .filter((item) => !!item.timestamp)
    .sort((left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp));
}

export function buildMonitoringData({ organizations = [], moduleRequests = [], organizationRequests = [], auditLogs = [] }) {
  const totalAuditEvents = auditLogs.length;
  const failedEvents = auditLogs.filter((log) => log.outcome === "FAILED").length;
  const pendingOnboarding = organizationRequests.filter((request) =>
    ["PENDING", "UNDER_REVIEW", "QUOTE_SENT", "AWAITING_PAYMENT"].includes(
      String(request.requestStatus || "").toUpperCase()
    )
  ).length;
  const pendingModules = moduleRequests.filter(
    (request) => String(request.status || "").toUpperCase() === "PENDING"
  ).length;
  const inactiveOrganizations = organizations.filter((organization) => String(organization.status || "").toUpperCase() === "INACTIVE").length;
  const organizationReviewHours = averageReviewHours(
    organizationRequests.map((request) => ({
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt || request.approvedAt || request.declinedAt || request.paidAt,
    }))
  );
  const moduleReviewHours = averageReviewHours(
    moduleRequests.map((request) => ({
      createdAt: request.requestDate,
      reviewedAt: request.reviewedDate,
    }))
  );

  const auditSuccessRate = totalAuditEvents
    ? ((totalAuditEvents - failedEvents) / totalAuditEvents) * 100
    : 100;
  const tenantAvailability = organizations.length
    ? ((organizations.length - inactiveOrganizations) / organizations.length) * 100
    : 100;

  const services = [
    {
      name: "API Health",
      key: "api",
      status: failedEvents > 0 ? "DEGRADED" : "OPERATIONAL",
      uptime: round(auditSuccessRate),
      responseTime: Math.max(35, Math.round(40 + failedEvents * 6)),
      errorRate: round(totalAuditEvents ? (failedEvents / totalAuditEvents) * 100 : 0),
    },
    {
      name: "Onboarding Pipeline",
      key: "onboarding",
      status: pendingOnboarding > 5 ? "DEGRADED" : "OPERATIONAL",
      uptime: round(Math.max(0, 100 - pendingOnboarding * 2.5)),
      responseTime: Math.round(Math.max(20, organizationReviewHours || 20) * 60),
      errorRate: round((pendingOnboarding / Math.max(organizationRequests.length || 1, 1)) * 100),
    },
    {
      name: "Module Approvals",
      key: "modules",
      status: pendingModules > 4 ? "DEGRADED" : "OPERATIONAL",
      uptime: round(Math.max(0, 100 - pendingModules * 3)),
      responseTime: Math.round(Math.max(15, moduleReviewHours || 15) * 60),
      errorRate: round((pendingModules / Math.max(moduleRequests.length || 1, 1)) * 100),
    },
    {
      name: "Tenant Availability",
      key: "tenants",
      status: inactiveOrganizations > 0 ? "DEGRADED" : "OPERATIONAL",
      uptime: round(tenantAvailability),
      responseTime: 50 + inactiveOrganizations * 10,
      errorRate: round((inactiveOrganizations / Math.max(organizations.length || 1, 1)) * 100),
    },
  ];

  const backendErrors = auditLogs
    .filter((log) => log.outcome === "FAILED")
    .slice(0, 5)
    .map((log) => ({
      service: log.targetObject || "Platform",
      message: log.action,
      count: 1,
      timestamp: log.timestamp,
      severity: log.severity,
    }));

  const failedEmails = organizationRequests
    .filter((request) => request.emailDeliveryWarning)
    .slice(0, 5)
    .map((request) => ({
      recipient: request.contactEmail,
      subject: "Onboarding communication",
      reason: request.emailDeliveryWarning,
      timestamp: request.updatedAt || request.createdAt,
    }));

  return {
    services,
    backendErrors,
    failedEmails,
  };
}

export function buildSystemAlerts({ organizationRequests = [], moduleRequests = [], invoices = [] }) {
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const pendingOnboarding = organizationRequests.filter((request) => String(request.requestStatus || "").toUpperCase() === "PENDING").length;
  const pendingModules = moduleRequests.filter((request) => String(request.status || "").toUpperCase() === "PENDING").length;

  const alerts = [];
  if (pendingOnboarding > 0) {
    alerts.push({ tone: "warning", title: "Onboarding SLA", message: `${pendingOnboarding} onboarding requests are waiting for review.`, action: "Review requests" });
  }
  if (pendingModules > 0) {
    alerts.push({ tone: "info", title: "Module demand", message: `${pendingModules} module requests are waiting for decision.`, action: "Open module requests" });
  }
  if (overdueInvoices > 0) {
    alerts.push({ tone: "danger", title: "Billing follow-up", message: `${overdueInvoices} invoices are overdue and need action.`, action: "Open billing" });
  }

  return alerts;
}

function makeEvent({ action, organization, actor, timestamp, outcome, severity, targetObject, usersByEmail }) {
  const actorLabel = actor || "SYSTEM";
  const matchedRole = usersByEmail.get(String(actorLabel).toLowerCase());
  const role = matchedRole || inferRoleFromActor(actorLabel);

  return {
    id: `${action}-${organization}-${timestamp}-${actorLabel}`,
    actor: actorLabel,
    role,
    action,
    targetOrganization: organization,
    targetObject: targetObject || action,
    timestamp,
    outcome,
    severity,
    ip: "n/a",
  };
}

function resolveInvoiceStatus(request) {
  const paymentStatus = String(request.paymentStatus || "").toUpperCase();
  const requestStatus = String(request.requestStatus || "").toUpperCase();
  const dueDate = request.approvedAt || request.quoteSentAt || request.createdAt;

  if (paymentStatus === "PAID" || requestStatus === "APPROVED") return "PAID";
  if (paymentStatus === "AWAITING_PAYMENT" || requestStatus === "AWAITING_PAYMENT") return "PENDING";
  if (requestStatus === "DECLINED" || requestStatus === "REJECTED" || paymentStatus === "FAILED") return "OVERDUE";
  if (dueDate && toTimestamp(dueDate) < Date.now()) return "OVERDUE";
  return "PENDING";
}

function resolveQuotePipelineStatus(request) {
  const paymentStatus = String(request.paymentStatus || "").toUpperCase();
  const quoteStatus = String(request.quoteStatus || "").toUpperCase();
  const requestStatus = String(request.requestStatus || "").toUpperCase();

  if (paymentStatus === "PAID" || requestStatus === "APPROVED" || requestStatus === "TENANT_ACTIVATED") {
    return "PAID";
  }
  if (paymentStatus === "AWAITING_PAYMENT" || requestStatus === "AWAITING_PAYMENT" || quoteStatus === "ACCEPTED") {
    return "ACCEPTED";
  }
  if (quoteStatus === "SENT" || requestStatus === "QUOTE_SENT") {
    return "SENT";
  }
  return "NOT_CREATED";
}

function buildRenewalDate(createdAt) {
  const date = new Date(createdAt || Date.now());
  if (Number.isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

function buildRecentMonths(points) {
  const now = new Date();
  const months = [];

  for (let index = points - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      label: date.toLocaleString(undefined, { month: "short" }),
      year: date.getFullYear(),
      month: date.getMonth(),
    });
  }

  return months;
}

function inMonth(value, month) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === month.year && date.getMonth() === month.month;
}

function toTimestamp(value) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function round(value) {
  return Number(Number(value).toFixed(2));
}

function inferRoleFromActor(actor) {
  const normalized = String(actor || "").toLowerCase();
  if (!normalized) return "SYSTEM";
  if (normalized.includes("super_admin") || normalized.includes("super admin")) return "SUPER_ADMIN";
  if (normalized.includes("admin")) return "ADMIN";
  if (normalized.includes("manager")) return "MANAGER";
  if (normalized.includes("moderator")) return "MODERATOR";
  return "SYSTEM";
}

function averageReviewHours(items = []) {
  const durations = items
    .map((item) => {
      const createdAt = toTimestamp(item.createdAt);
      const reviewedAt = toTimestamp(item.reviewedAt);
      if (!createdAt || !reviewedAt || reviewedAt < createdAt) return null;
      return (reviewedAt - createdAt) / (1000 * 60 * 60);
    })
    .filter((value) => value !== null);

  if (!durations.length) return 0;
  return durations.reduce((sum, value) => sum + value, 0) / durations.length;
}