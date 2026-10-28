import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { safeRedirectPath } from "./auth";

describe("safeRedirectPath", () => {
  it("allows same-site paths", () => {
    expect(safeRedirectPath("/billing?checkout=success")).toBe("/billing?checkout=success");
    expect(safeRedirectPath("/business")).toBe("/business");
  });

  it("falls back for anything that could leave the site", () => {
    for (const value of ["https://evil.com", "//evil.com", "/\\evil.com", "evil.com", "", null, undefined, 42]) {
      expect(safeRedirectPath(value)).toBe("/dashboard");
    }
  });

  it("uses the provided fallback", () => {
    expect(safeRedirectPath(null, "/business")).toBe("/business");
  });
});
