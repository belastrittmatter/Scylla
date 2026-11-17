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

/**
 * Client identity on the consent screen: the requesting client gets its own
 * row, and because names are self-registered the Unverified note sits right
 * under it.
 */
export function ConsentClientInfo({
  client,
}: {
  client: ConsentClient | null;
}) {
  const host = hostOf(client?.uri);
  return (
    <div className="mt-4 space-y-3">
      <p className="text-ink-2 text-sm leading-relaxed text-pretty">
        <span className="block">The external AI client</span>
        <span className="my-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-ink text-lg leading-snug font-medium break-words">
            {client?.name || "Unknown client"}
          </span>
          {host && (
            <span className="font-code text-ink-2 text-xs [overflow-wrap:anywhere]">
              {host}
            </span>
          )}
        </span>
        <span className="block">
          is requesting access to interact with your Scylla workspace and tools.
        </span>
      </p>
      <div
        role="note"
        className="border-(--caution)/30 bg-(--caution-soft) text-(--caution) flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Unverified.</span> Any app can
          register itself under any name, so only continue if you started this
          connection.
        </p>
      </div>
    </div>
  );
}
