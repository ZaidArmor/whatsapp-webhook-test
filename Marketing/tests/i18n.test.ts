import { describe, expect, it } from "vitest";
import { translate, type Messages } from "@/lib/i18n";
import arJson from "@/messages/ar.json";
import enJson from "@/messages/en.json";

type Tree = Record<string, unknown>;
const ar = arJson as Messages;
const en = enJson as unknown as Messages;

function flatten(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? flatten(value as Tree, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

describe("i18n dictionaries", () => {
  it("ar and en expose exactly the same keys", () => {
    const arKeys = flatten(ar as unknown as Tree).sort();
    const enKeys = flatten(en as unknown as Tree).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it("translate resolves dot paths", () => {
    expect(translate(ar, "common.save")).toBe("حفظ");
    expect(translate(en, "common.save")).toBe("Save");
  });

  it("translate interpolates variables", () => {
    const result = translate(en, "connections.followersCount", { count: "12K" });
    expect(result).toContain("12K");
  });

  it("translate falls back to the key when missing", () => {
    expect(translate(ar, "not.a.real.key")).toBe("not.a.real.key");
  });

  it("every {placeholder} in ar has a matching en counterpart", () => {
    const keys = flatten(ar as unknown as Tree);
    for (const key of keys) {
      const arVal = translate(ar, key);
      const enVal = translate(en, key);
      const arVars = [...arVal.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      const enVars = [...enVal.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(arVars, `placeholder mismatch at ${key}`).toEqual(enVars);
    }
  });
});
