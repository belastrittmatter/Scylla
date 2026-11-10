import { redirect } from "next/navigation";

/** Projects live under their team now. */
export default function ProjectsPage() {
  redirect("/teams");
}
