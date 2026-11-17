import { AlertTriangle } from "lucide-react";

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
    <div className="mt-4 space-y-4 leading-relaxed">
      <p className="text-ink-2 text-sm text-pretty">
        The external AI client{" "}
        <span className="text-ink font-medium break-words">
          {client?.name || "Unknown client"}
        </span>
        {host && (
          <>
            {" "}
            <span className="font-code text-ink-2 text-xs [overflow-wrap:anywhere]">
              ({host})
            </span>
          </>
        )}{" "}
        is requesting access to interact with your Scylla workspace and tools.
      </p>
      <div
        role="note"
        className="flex gap-2.5 rounded-lg border border-amber-600/30 bg-amber-500/[0.07] px-3.5 py-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/[0.06] dark:text-amber-200"
      >
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <p>
          <span className="font-semibold">Unverified.</span> Any app can
          register itself under any name, so only continue if you started this
          connection.
        </p>
      </div>
      <p className="text-ink-2 text-sm">
        Grant only the capabilities it needs.
      </p>
    </div>
  );
}
