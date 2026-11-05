import { describe, expect, test } from "bun:test";
import { formatPersonName, isFullEmail } from "@/lib/format-person-name";

describe("formatPersonName", () => {
  test("title-cases a lowercase name without reordering", () => {
    expect(formatPersonName("rivera alex")).toBe("Rivera Alex");
  });

  test("leaves an already formatted name unchanged", () => {
    expect(formatPersonName("Alex Rivera")).toBe("Alex Rivera");
  });

  test("swaps Last, First into First Last", () => {
    expect(formatPersonName("Rivera, Alex")).toBe("Alex Rivera");
  });

  test("derives a name from the email local part when the name is empty", () => {
    expect(formatPersonName(null, "alex.rivera@x.com")).toBe("Alex Rivera");
  });

  test("derives a name when the name itself is an email", () => {
    expect(formatPersonName("alex_rivera@x.com")).toBe("Alex Rivera");
  });

  test("collapses surrounding and internal whitespace", () => {
    expect(formatPersonName("  mia   wong ")).toBe("Mia Wong");
  });

  test("preserves internal capitals", () => {
    expect(formatPersonName("McDonald")).toBe("McDonald");
  });

  test("returns an empty string only when both inputs are empty", () => {
    expect(formatPersonName(null, null)).toBe("");
    expect(formatPersonName("   ", "")).toBe("");
  });
});

describe("isFullEmail", () => {
  test("accepts a complete address", () => {
    expect(isFullEmail("test.user@example.com")).toBe(true);
  });

  test("rejects a fragment without a domain", () => {
    expect(isFullEmail("test.user@")).toBe(false);
    expect(isFullEmail("alex")).toBe(false);
  });

  test("rejects an empty string", () => {
    expect(isFullEmail("")).toBe(false);
  });
});
