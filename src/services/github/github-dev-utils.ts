import { slugify } from "@/lib/utils";

export function generateBranchName(
  issueNumber: number | null | undefined,
  title: string,
  prefix: "feat" | "fix" | "chore" = "feat",
): string {
  const slug = slugify(title).slice(0, 40).replace(/-+$/, "") || "task";
  return issueNumber == null
    ? `${prefix}/${slug}`
    : `${prefix}/${issueNumber}-${slug}`;
}

export function buildCheckoutCommand(branch: string): string {
  return `git fetch origin && git checkout ${branch}`;
}

export function isValidBranchName(name: string): boolean {
  if (!/^[A-Za-z0-9._/-]{1,200}$/.test(name)) return false;
  if (/^[/.-]/.test(name)) return false;
  if (/[/.]$/.test(name) || name.endsWith(".lock")) return false;
  return !name.includes("..") && !name.includes("//") && !name.includes("@{");
}
