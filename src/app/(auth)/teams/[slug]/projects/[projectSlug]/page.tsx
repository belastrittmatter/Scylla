import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string; projectSlug: string }>;
}

export default async function ProjectRedirectPage({ params }: Props) {
  const { slug, projectSlug } = await params;
  // Not buildTasksUrl: that module is "use client" and can't be called here.
  const qs = new URLSearchParams({
    scope: "team",
    team: slug,
    project: projectSlug,
  });
  redirect(`/tasks?${qs}`);
}
