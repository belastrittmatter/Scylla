import type { Metadata } from "next";
import { Missions, Teams } from "@/components/about";

export const metadata: Metadata = {
  title: "About Us | Scylla - The AI-Powered Task & Calendar Workspace",
  description:
    "Learn about Scylla's mission to eliminate calendar friction and protect deep work for modern product and engineering teams.",
};

export default function AboutPage() {
  return (
    <>
      <Missions />
      <Teams />
    </>
  );
}