export interface GithubMockCall {
  method: string;
  url: string;
  path: string;
  search: string;
  headers: Headers;
  body: unknown;
}

export interface GithubMockRoute {
  method: string;
  path: string | RegExp;
  status?: number;
  body?: unknown | ((call: GithubMockCall) => unknown);
}

const GITHUB_HOSTS = new Set(["api.github.com", "github.com"]);

function parseBody(raw: unknown): unknown {
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function pathMatches(route: GithubMockRoute, path: string): boolean {
  return typeof route.path === "string"
    ? route.path === path
    : route.path.test(path);
}

/** Replace globalThis.fetch with a router for GitHub hosts only. */
export function mockGithubApi(routes: GithubMockRoute[]): {
  calls: GithubMockCall[];
  restore: () => void;
} {
  const previous = globalThis.fetch;
  const calls: GithubMockCall[] = [];

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      return previous(input, init);
    }
    if (!GITHUB_HOSTS.has(url.hostname)) return previous(input, init);

    const method = (
      init?.method ??
      (typeof input === "object" && "method" in input ? input.method : "GET")
    ).toUpperCase();
    const call: GithubMockCall = {
      method,
      url: urlStr,
      path: url.pathname,
      search: url.search,
      headers: new Headers(init?.headers),
      body: parseBody(init?.body),
    };
    calls.push(call);

    const route = routes.find(
      (r) => r.method.toUpperCase() === method && pathMatches(r, url.pathname),
    );
    if (!route) {
      return new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const status = route.status ?? 200;
    if (status === 204) return new Response(null, { status });
    const result =
      typeof route.body === "function" ? route.body(call) : route.body;
    return new Response(JSON.stringify(result ?? {}), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = previous;
    },
  };
}
