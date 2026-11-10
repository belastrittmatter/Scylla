import { Badge } from "@/components/ui/badge";

export interface ConsentClient {
  name?: string | null;
  uri?: string | null;
}

function hostOf(uri: string | null | undefined): string | null {
  try {
    return uri ? new URL(uri).host : null;
  } catch {
    return null;
  }
}

/** Client identity on the consent screen; names are self-registered, so flag them unverified. */
export function ConsentClientInfo({
  client,
}: {
  client: ConsentClient | null;
}) {
  const host = hostOf(client?.uri);
  return (
    <div className="border-border bg-muted/30 rounded-xl border p-3.5 text-xs leading-relaxed">
      <p className="text-foreground">
        The external AI client{" "}
        <span className="font-semibold">
          {client?.name || "Unknown client"}
        </span>
        {host && <span className="text-muted-foreground"> ({host})</span>}{" "}
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-700 dark:text-amber-400"
        >
          Unverified
        </Badge>{" "}
        is requesting access to interact with your Scylla workspace and tools.
        Any app can register itself under any name, so only continue if you
        started this connection. Grant only the capabilities it needs.
      </p>
    </div>
  );
}
