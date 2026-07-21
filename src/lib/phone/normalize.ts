import { parsePhoneNumberFromString } from "libphonenumber-js";

export type PhoneValidity = "VALID" | "INVALID" | "UNKNOWN";

export interface NormalizedPhone {
  original: string;
  normalized: string | null;
  countryCode: string | null;
  validity: PhoneValidity;
}

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  // Eastern Arabic (Farsi) variants sometimes seen in exports
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

/** Converts Arabic-Indic / Eastern Arabic digits to Western (0-9) digits. */
export function toWesternDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (char) => ARABIC_INDIC_DIGITS[char] ?? char);
}

/** Strips spaces, dashes, parentheses, dots and any other non `+`/digit characters. */
function stripNonPhoneChars(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

const SAUDI_MOBILE_REGEX = /^\+9665\d{8}$/;

/**
 * Normalizes a raw phone number string, targeting Saudi mobile numbers first
 * (the primary market for this platform), with a fallback to libphonenumber-js
 * for other international numbers. Never discards the original input.
 */
export function normalizePhone(rawInput: string): NormalizedPhone {
  const original = rawInput;
  const asciiDigits = toWesternDigits(rawInput ?? "");
  let cleaned = stripNonPhoneChars(asciiDigits);

  if (!cleaned) {
    return { original, normalized: null, countryCode: null, validity: "INVALID" };
  }

  // 00 prefix -> +
  if (cleaned.startsWith("00")) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  // Saudi-specific normalization paths
  if (cleaned.startsWith("+966")) {
    // already prefixed
  } else if (cleaned.startsWith("966")) {
    cleaned = `+${cleaned}`;
  } else if (cleaned.startsWith("05")) {
    cleaned = `+966${cleaned.slice(1)}`;
  } else if (/^5\d{8}$/.test(cleaned)) {
    cleaned = `+966${cleaned}`;
  } else if (cleaned.startsWith("0") && !cleaned.startsWith("00")) {
    // Other local-format numbers (e.g. Saudi landlines starting with 01) -> assume Saudi country code
    cleaned = `+966${cleaned.slice(1)}`;
  }

  if (SAUDI_MOBILE_REGEX.test(cleaned)) {
    return { original, normalized: cleaned, countryCode: "SA", validity: "VALID" };
  }

  // Saudi number but not a valid mobile shape (e.g. landline, wrong length) -> invalid
  if (cleaned.startsWith("+966")) {
    return { original, normalized: null, countryCode: "SA", validity: "INVALID" };
  }

  // Fall back to general international parsing for non-Saudi numbers
  if (cleaned.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(cleaned);
    if (parsed?.isValid()) {
      return {
        original,
        normalized: parsed.number,
        countryCode: parsed.country ?? null,
        validity: "VALID",
      };
    }
    return { original, normalized: null, countryCode: null, validity: "INVALID" };
  }

  return { original, normalized: null, countryCode: null, validity: "INVALID" };
}

/** True when the given string, once normalized, is a valid Saudi mobile number. */
export function isValidSaudiMobile(rawInput: string): boolean {
  const result = normalizePhone(rawInput);
  return result.validity === "VALID" && result.countryCode === "SA";
}
