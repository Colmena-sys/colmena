import { notFound } from "next/navigation";
import { ProjectView } from "@/components/colmena/project-view";
import { getProjectById, milestonesByProject } from "@/lib/colmena-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const milestones = milestonesByProject[id] ?? milestonesByProject["1"] ?? [];
  return <ProjectView project={project} milestones={milestones} />;
}
