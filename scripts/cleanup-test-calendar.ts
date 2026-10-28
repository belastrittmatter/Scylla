#!/usr/bin/env bun
/**
 * Standalone cleanup script for Google Calendar test events.
 * Scans primary calendar for test-generated events (e.g. [TEST], [E2E], mock prefixes)
 * and purges them to prevent developer calendar pollution.
 *
 * Usage:
 *   bun run scripts/cleanup-test-calendar.ts [--dry-run] [--query <term>] [--token <accessToken>]
 */
import { GoogleCalendarService } from "../src/services/google-calendar";

interface CleanupOptions {
  dryRun: boolean;
  query?: string;
  token?: string;
}

function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  const options: CleanupOptions = {
    dryRun: args.includes("--dry-run"),
  };

  const queryIdx = args.indexOf("--query");
  if (queryIdx !== -1 && args[queryIdx + 1]) {
    options.query = args[queryIdx + 1];
  }

  const tokenIdx = args.indexOf("--token");
  if (tokenIdx !== -1 && args[tokenIdx + 1]) {
    options.token = args[tokenIdx + 1];
  }

  return options;
}

const TEST_PATTERNS = [/\[test\]/i, /\[e2e\]/i, /^test:/i, /mock_event/i, /automated test/i];

function isTestEvent(summary: string, description?: string, customQuery?: string): boolean {
  if (customQuery) {
    const qLower = customQuery.toLowerCase();
    return (
      summary.toLowerCase().includes(qLower) || (description || "").toLowerCase().includes(qLower)
    );
  }
  return (
    TEST_PATTERNS.some((p) => p.test(summary)) ||
    (description ? TEST_PATTERNS.some((p) => p.test(description)) : false)
  );
}

export async function runCalendarCleanup(options: CleanupOptions = { dryRun: false }): Promise<{
  totalFound: number;
  deletedCount: number;
  skippedCount: number;
  errors: string[];
}> {
  console.log(
    `[Calendar Cleanup] Mode: ${options.dryRun ? "DRY RUN (preview only)" : "LIVE PURGE"}`
  );

  const token = options.token || (await GoogleCalendarService.getAccessToken());
  if (!token) {
    console.warn(
      "[Calendar Cleanup] No Google Calendar access token found. Using mock mode if active."
    );
  }

  const now = new Date();
  const timeMin = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

  let events: Array<{
    id?: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string };
  }> = [];
  try {
    events = await GoogleCalendarService.listEvents("primary", {
      accessToken: token || undefined,
      timeMin,
      timeMax,
    });
  } catch (err) {
    console.error("[Calendar Cleanup] Failed to list events:", err);
    return { totalFound: 0, deletedCount: 0, skippedCount: 0, errors: [String(err)] };
  }

  const testEvents = events.filter(
    (e) => e.id && isTestEvent(e.summary || "", e.description, options.query)
  );

  console.log(`[Calendar Cleanup] Found ${testEvents.length} test event(s) matching filter.`);

  let deletedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const ev of testEvents) {
    const eventId = ev.id!;
    const title = ev.summary || "(untitled)";
    const startStr = ev.start?.dateTime || "unspecified time";

    if (options.dryRun) {
      console.log(`  [WOULD DELETE] id: ${eventId} | "${title}" | ${startStr}`);
      skippedCount++;
      continue;
    }

    try {
      await GoogleCalendarService.deleteEvent(eventId, "primary", token || undefined);
      console.log(`  [DELETED] id: ${eventId} | "${title}" | ${startStr}`);
      deletedCount++;
    } catch (delErr) {
      const msg = `Failed to delete ${eventId}: ${delErr instanceof Error ? delErr.message : String(delErr)}`;
      console.error(`  [ERROR] ${msg}`);
      errors.push(msg);
    }
  }

  console.log(
    `[Calendar Cleanup] Finished. Purged: ${deletedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`
  );
  return {
    totalFound: testEvents.length,
    deletedCount,
    skippedCount,
    errors,
  };
}

// Execute if run directly from CLI
if (import.meta.main) {
  const opts = parseArgs();
  runCalendarCleanup(opts)
    .then((res) => {
      if (res.errors.length > 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Calendar Cleanup] Fatal error:", err);
      process.exit(1);
    });
}
