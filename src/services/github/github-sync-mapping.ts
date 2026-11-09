export interface LinkedPrInfo {
  number: number;
  url: string;
  title: string;
  state: "open" | "closed" | "merged" | "draft";
  branch?: string;
}

export function buildBranchMap(
  branchList: Array<{ name: string }>,
): Map<number, string> {
  const branchMap = new Map<number, string>();
  if (Array.isArray(branchList)) {
    for (const b of branchList) {
      if (!b?.name) continue;
      const match = b.name.match(
        /(?:^|\/|[#\-_])(?:#?)(?:issue[\-_]?)?(\d+)(?:[#\-_]|$)/i,
      );
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && !branchMap.has(num)) {
          branchMap.set(num, b.name);
        }
      }
    }
  }
  return branchMap;
}

export function buildPrMap(
  pullList: Array<{
    number: number;
    html_url: string;
    title: string;
    body?: string | null;
    state: "open" | "closed" | string;
    draft?: boolean;
    merged_at?: string | null;
    head?: { ref?: string };
  }>,
  branchMap: Map<number, string>,
): Map<number, LinkedPrInfo> {
  const prMap = new Map<number, LinkedPrInfo>();
  if (Array.isArray(pullList)) {
    for (const pr of pullList) {
      if (!pr?.number) continue;
      const prState: "open" | "closed" | "merged" | "draft" = pr.merged_at
        ? "merged"
        : pr.draft
          ? "draft"
          : pr.state === "closed"
            ? "closed"
            : "open";

      const prInfo: LinkedPrInfo = {
        number: pr.number,
        url: pr.html_url,
        title: pr.title || "",
        state: prState,
        branch: pr.head?.ref,
      };

      if (pr.head?.ref) {
        const branchMatch = pr.head.ref.match(
          /(?:^|\/|[#\-_])(?:#|issue[\-_]?)?(\d+)(?:[#\-_]|$)/i,
        );
        if (branchMatch) {
          const num = parseInt(branchMatch[1], 10);
          if (!isNaN(num) && num !== pr.number) {
            if (!prMap.has(num)) {
              prMap.set(num, prInfo);
            }
            if (!branchMap.has(num)) {
              branchMap.set(num, pr.head.ref);
            }
          }
        }
      }

      const rawText = `${pr.title || ""} ${pr.body || ""}`;
      const sanitizedText = rawText
        .replace(/\bpull\s+request\s+#\d+\b/gi, "")
        .replace(/\bpr\s+#\d+\b/gi, "");

      const issueMatches = sanitizedText.matchAll(
        /(?:(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?|issues?|for)\s*:?\s*|[\(\[]\s*)#(\d+)\b/gi,
      );
      for (const m of issueMatches) {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num !== pr.number && !prMap.has(num)) {
          prMap.set(num, prInfo);
        }
      }
    }
  }
  return prMap;
}
