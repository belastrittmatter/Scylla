import { redirect } from "next/navigation";

// Google sign-in creates the account on first use, so sign-up is the same flow (#77).
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const v of [value ?? []].flat()) query.append(key, v);
  }
  const qs = query.toString();
  redirect(qs ? `/auth/sign-in?${qs}` : "/auth/sign-in");
}
