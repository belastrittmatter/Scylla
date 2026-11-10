import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TeamProjectsRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/teams/${slug}?tab=projects`);
}
