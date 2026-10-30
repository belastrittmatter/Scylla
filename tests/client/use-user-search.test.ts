import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { apiClient } from "@/lib/api-client";
import { seedDatabase } from "@/db/seed";
import { setupMockFetchRouter } from "../test-utils/mock-fetch-router";

describe("useUserSearch Logic Integration", () => {
  let restoreFetch: () => void;

  beforeAll(async () => {
    restoreFetch = setupMockFetchRouter();
    await seedDatabase();
  });

  afterAll(() => {
    restoreFetch?.();
  });

  test("apiClient.users.search returns results for empty query", async () => {
    const users = await apiClient.users.search("", 6);
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  test("apiClient.users.search returns filtered results for specific query", async () => {
    const users = await apiClient.users.search("alex", 8);
    expect(Array.isArray(users)).toBe(true);
    expect(users.some((u) => u.name.toLowerCase().includes("alex"))).toBe(true);
  });
});
