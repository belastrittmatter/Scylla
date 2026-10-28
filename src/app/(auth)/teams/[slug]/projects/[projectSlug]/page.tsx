import { Suspense } from "react";
import { redirect } from "next/navigation";

interface ProjectRedirectPageProps {
  params: Promise<{ slug: string; projectSlug: string }>;
}

async function ProjectRedirectContent({ params }: ProjectRedirectPageProps) {
  const { slug, projectSlug } = await params;
  redirect(`/tasks/${slug}/${projectSlug}`);
  return null;
}

export default function ProjectRedirectPage(props: ProjectRedirectPageProps) {
  return (
    <Suspense fallback={null}>
      <ProjectRedirectContent params={props.params} />
    </Suspense>
  );
}
