/** Project colour dot; `color` is user data, so it is applied inline. */
export function ProjectDot({ color }: { color?: string | null }) {
  return (
    <span
      className="bg-muted-foreground size-2.5 shrink-0 rounded-full"
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
