const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Normalize a person's display name to "First Last".
 * Falls back to the email local part when the name is missing or is an email.
 */
export function formatPersonName(
  name?: string | null,
  email?: string | null,
): string {
  const trimmedName = (name ?? "").trim();
  let source = trimmedName;

  if (!source || EMAIL_RE.test(source)) {
    const mail = EMAIL_RE.test(source) ? source : (email ?? "").trim();
    source = EMAIL_RE.test(mail) ? mail.split("@")[0] : "";
  }

  if (!source) return "";

  if (source.includes(",")) {
    const [last, ...rest] = source.split(",");
    source = `${rest.join(" ")} ${last}`;
  }

  return source
    .split(/[\s._]+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

/** Two-letter initials for an avatar fallback. */
export function getPersonInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}
