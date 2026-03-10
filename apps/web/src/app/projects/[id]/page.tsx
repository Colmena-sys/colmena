import { notFound } from "next/navigation";
import { isAddress } from "viem";
import { ProjectView } from "@/components/colmena/project-view";
import { getProjectById, milestonesByProject } from "@/lib/colmena-data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ campaign?: string }>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const milestones = milestonesByProject[id] ?? milestonesByProject["1"] ?? [];
  const initialCampaignAddress =
    query.campaign && isAddress(query.campaign) ? (query.campaign as `0x${string}`) : undefined;

  return <ProjectView project={project} milestones={milestones} initialCampaignAddress={initialCampaignAddress} />;
}
