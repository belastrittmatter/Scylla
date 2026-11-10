import { describe, expect, test } from "bun:test";
import { matchesQuery } from "../../src/components/ui/entity-combobox-filter";

const teams = [
  { name: "Platform", slug: "plat", description: "Infra folks" },
  { name: "Design", slug: "dsn", description: null },
];
const fields = (t: (typeof teams)[number]) => [t.name, t.slug, t.description];

describe("matchesQuery", () => {
  test("empty or whitespace query matches everything", () => {
    expect(matchesQuery(["x"], "")).toBe(true);
    expect(matchesQuery([], "   ")).toBe(true);
  });
  test("is case-insensitive and ignores nullish fields", () => {
    expect(matchesQuery([null, undefined, "Hello"], " hel ")).toBe(true);
    expect(matchesQuery([null], "a")).toBe(false);
  });
});

describe("matchesQuery over entity fields", () => {
  const match = (q: string) => teams.filter((t) => matchesQuery(fields(t), q));
  test("returns all items for empty query", () => {
    expect(match("")).toHaveLength(2);
  });
  test("matches on any field, including description", () => {
    expect(match("infra").map((t) => t.slug)).toEqual(["plat"]);
    expect(match("DSN").map((t) => t.name)).toEqual(["Design"]);
  });
  test("returns empty array when nothing matches", () => {
    expect(match("zzz")).toEqual([]);
  });
});
