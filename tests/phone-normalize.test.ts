import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/phone/normalize";

describe("normalizePhone — Saudi numbers", () => {
  it("normalizes local format with leading zero (05XXXXXXXX)", () => {
    const result = normalizePhone("0512345678");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("normalizes local format without leading zero (5XXXXXXXX)", () => {
    const result = normalizePhone("512345678");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("normalizes country-code-prefixed format without plus (9665XXXXXXXX)", () => {
    const result = normalizePhone("966512345678");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("normalizes numbers with a leading double zero (009665XXXXXXXX)", () => {
    const result = normalizePhone("00966512345678");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("normalizes an already-correct +966 number with spaces", () => {
    const result = normalizePhone("+966 51 234 5678");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("strips dashes and parentheses", () => {
    const result = normalizePhone("(05) 12-345-678");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("converts Arabic-Indic digits before normalizing", () => {
    const result = normalizePhone("٠٥١٢٣٤٥٦٧٨");
    expect(result.normalized).toBe("+966512345678");
    expect(result.validity).toBe("VALID");
  });

  it("classifies a number that is too short or too long as invalid", () => {
    expect(normalizePhone("05123456").validity).toBe("INVALID");
    expect(normalizePhone("051234567890").validity).toBe("INVALID");
  });

  it("does not classify a Saudi landline as a valid mobile number", () => {
    // Riyadh landline area code (01) — not a mobile number
    const result = normalizePhone("0112345678");
    expect(result.validity).toBe("INVALID");
    expect(result.normalized).toBeNull();
  });

  it("preserves the original phone value regardless of validity", () => {
    const raw = "  05-1234-5678 ";
    const result = normalizePhone(raw);
    expect(result.original).toBe(raw);
  });

  it("normalizes a valid international number using its country code", () => {
    const result = normalizePhone("+14155552671");
    expect(result.validity).toBe("VALID");
    expect(result.countryCode).toBe("US");
    expect(result.normalized).toBe("+14155552671");
  });

  it("classifies garbage input as invalid without throwing", () => {
    expect(() => normalizePhone("abc-not-a-phone")).not.toThrow();
    expect(normalizePhone("abc-not-a-phone").validity).toBe("INVALID");
  });

  it("classifies empty input as invalid", () => {
    expect(normalizePhone("").validity).toBe("INVALID");
  });
});
