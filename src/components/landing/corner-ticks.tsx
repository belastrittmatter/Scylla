/**
 * Blueprint-style corner crosshair markers (Cloudflare reference motif).
 * Purely decorative; drawn in by the landing GSAP timeline via [data-tick].
 */
export function CornerTicks() {
  return (
    <>
      <span aria-hidden="true" className="tick tick-tl" data-tick="" />
      <span aria-hidden="true" className="tick tick-tr" data-tick="" />
      <span aria-hidden="true" className="tick tick-bl" data-tick="" />
      <span aria-hidden="true" className="tick tick-br" data-tick="" />
    </>
  );
}
