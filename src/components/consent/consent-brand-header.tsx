import Link from "next/link";
import { LandingLogo } from "@/components/landing/primitives";

/** Scylla wordmark linking home, shared by every consent state. */
export function ConsentBrandHeader() {
  return (
    <Link
      href="/"
      className="focus-visible:ring-ring/50 -mx-1 inline-flex w-fit items-center rounded-md px-1 py-1 outline-none focus-visible:ring-3"
    >
      <LandingLogo />
    </Link>
  );
}
