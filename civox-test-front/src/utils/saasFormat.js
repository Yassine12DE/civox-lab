export function formatNumber(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "0";
  return new Intl.NumberFormat().format(numericValue);
}

export function formatMoney(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "$0.00";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(numericValue);
}

export function formatDate(value) {
  return formatTemporalValue(value, { dateStyle: "medium" });
}

export function formatDateTime(value) {
  return formatTemporalValue(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatStatus(value) {
  if (!value) return "Unknown";

  return String(value)
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getInitials(value) {
  if (!value) return "C";

  const words = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "C";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function isActiveStatus(status) {
  return String(status || "").toUpperCase() === "ACTIVE";
}

export function isPendingStatus(status) {
  return String(status || "").toUpperCase() === "PENDING";
}

export function getStatusTone(status) {
  const normalizedStatus = String(status || "").toUpperCase();

  if (["ACTIVE", "APPROVED", "GRANTED", "ENABLED", "PAID"].includes(normalizedStatus)) {
    return "success";
  }

  if (["PENDING", "IN_REVIEW", "DRAFT", "QUOTE_SENT", "AWAITING_PAYMENT", "SENT"].includes(normalizedStatus)) {
    return "warning";
  }

  if (["REJECTED", "DECLINED", "CANCELLED", "FAILED", "INACTIVE", "DISABLED", "SUSPENDED", "NOT_GRANTED"].includes(normalizedStatus)) {
    return "danger";
  }

  return "neutral";
}

export function includesSearchValue(record, searchTerm, fields) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return fields.some((field) =>
    String(record?.[field] || "")
      .toLowerCase()
      .includes(normalizedSearch)
  );
}

function formatTemporalValue(value, options) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(undefined, options).format(date);
}
