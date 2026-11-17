import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CONSENT_PRIMARY_HOVER } from "./consent-shell";

export interface ConsentDecisionBarProps {
  email: string;
  grantedCount: number;
  destructiveCount: number;
  isLoading: boolean;
  error: string | null;
  onDeny: () => void;
  onAllow: () => void;
}

/**
 * Sticky decision bar: who is authorizing, what the grant includes that can
 * delete data, then Deny and Allow, all on screen while scopes are toggled.
 */
export function ConsentDecisionBar({
  email,
  grantedCount,
  destructiveCount,
  isLoading,
  error,
  onDeny,
  onAllow,
}: ConsentDecisionBarProps) {
  return (
    <div className="border-line bg-surface sticky bottom-0 z-10 rounded-b-xl border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
      {error && (
        <p
          role="alert"
          className="text-destructive mb-3 flex items-start gap-2 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <p className="text-ink-2 text-sm">
        Authorizing as{" "}
        <span className="text-ink font-medium [overflow-wrap:anywhere]">
          {email}
        </span>
      </p>

      {/* Always mounted so screen readers announce the warning when it appears. */}
      <div role="status">
        {destructiveCount > 0 && (
          <p className="text-destructive mt-2 flex items-start gap-2 text-sm text-pretty">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              Includes{" "}
              <span className="font-code tabular-nums">{destructiveCount}</span>{" "}
              {`destructive ${destructiveCount === 1 ? "scope" : "scopes"} that can permanently delete resources.`}
            </span>
          </p>
        )}
      </div>

      {/* Below sm the buttons share a row only while both labels fit; at larger text sizes each takes its own row. */}
      <div className="mt-3 flex flex-wrap gap-2 sm:grid sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={onDeny}
          className="h-10 grow px-3 text-sm"
        >
          Deny Access
        </Button>
        <Button
          type="button"
          disabled={isLoading}
          onClick={onAllow}
          className={`h-10 grow gap-2 px-3 text-sm ${CONSENT_PRIMARY_HOVER}`}
        >
          {isLoading ? (
            <>
              <Spinner aria-hidden="true" role="presentation" />
              <span>Authorizing...</span>
            </>
          ) : (
            <>
              <ShieldCheck aria-hidden="true" />
              <span>
                Allow Access{" "}
                <span className="tabular-nums">({grantedCount})</span>
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
