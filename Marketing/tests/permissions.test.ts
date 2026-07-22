import { describe, expect, it } from "vitest";
import { PERMISSION_KEYS, ROLE_PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";

describe("RBAC matrix", () => {
  it("gives OWNER every permission", () => {
    for (const permission of PERMISSION_KEYS) {
      expect(roleHasPermission("OWNER", permission)).toBe(true);
    }
  });

  it("keeps VIEWER read-only", () => {
    expect(roleHasPermission("VIEWER", "view_dashboard")).toBe(true);
    expect(roleHasPermission("VIEWER", "create_posts")).toBe(false);
    expect(roleHasPermission("VIEWER", "manage_ads")).toBe(false);
    expect(roleHasPermission("VIEWER", "manage_team")).toBe(false);
  });

  it("lets EDITOR create but not approve or publish", () => {
    expect(roleHasPermission("EDITOR", "create_posts")).toBe(true);
    expect(roleHasPermission("EDITOR", "approve_posts")).toBe(false);
  });

  it("lets MANAGER approve posts", () => {
    expect(roleHasPermission("MANAGER", "approve_posts")).toBe(true);
  });

  it("only grants known permission keys in the matrix", () => {
    const known = new Set<string>(PERMISSION_KEYS);
    for (const perms of Object.values(ROLE_PERMISSIONS)) {
      for (const p of perms) expect(known.has(p)).toBe(true);
    }
  });
});
