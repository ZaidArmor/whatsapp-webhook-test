/** Masks the middle digits of a phone number for users without full visibility rights. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•".repeat(phone.length);
  const visibleStart = phone.slice(0, phone.length - digits.length + 4);
  const visibleEnd = phone.slice(-2);
  return `${visibleStart}••••${visibleEnd}`;
}

/** Roles allowed to see full, unmasked customer phone numbers. */
const FULL_PHONE_VISIBILITY_ROLES = new Set([
  "SUPER_ADMIN",
  "EXECUTIVE_MANAGER",
  "MARKETING_MANAGER",
  "SALES_MANAGER",
]);

export function canViewFullPhone(roles: readonly string[]): boolean {
  return roles.some((role) => FULL_PHONE_VISIBILITY_ROLES.has(role));
}

export function displayPhone(phone: string | null | undefined, canViewFull: boolean): string {
  if (!phone) return "—";
  return canViewFull ? phone : maskPhone(phone);
}
