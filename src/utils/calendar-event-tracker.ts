/**
 * Tracks Google Calendar events created during tests or automated sessions
 * to facilitate automated cleanup in teardown hooks.
 */
export class CalendarEventTracker {
  private static trackedEventIds = new Set<string>();

  public static track(eventId: string): void {
    if (eventId && typeof eventId === "string") {
      this.trackedEventIds.add(eventId);
    }
  }

  public static untrack(eventId: string): void {
    this.trackedEventIds.delete(eventId);
  }

  public static getTracked(): string[] {
    return Array.from(this.trackedEventIds);
  }

  public static getTrackedIds(): string[] {
    return this.getTracked();
  }

  public static clear(): void {
    this.trackedEventIds.clear();
  }

  /**
   * Purges all tracked events using a deleter callback or clears tracked IDs.
   * If deleteFn is omitted, tracked event IDs are simply cleared from memory
   * and reported as cleared (not deleted).
   */
  public static async cleanupAll(
    deleteFn?: (eventId: string) => Promise<unknown>
  ): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];
    const eventIds = Array.from(this.trackedEventIds);

    if (!deleteFn) {
      this.clear();
      return { deleted: [], failed: [] };
    }

    for (const id of eventIds) {
      try {
        await deleteFn(id);
        deleted.push(id);
        this.trackedEventIds.delete(id);
      } catch {
        failed.push(id);
      }
    }

    return { deleted, failed };
  }
}
