import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/EntityPage";
import { getTopic, listTopicSlugs } from "@/lib";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

const loadTopic = cache(getTopic);

export async function generateStaticParams() {
  return (await listTopicSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadTopic(decodeURIComponent(slug));
  return { title: data ? data.topic.label : "Tema no encontrado" };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadTopic(decodeURIComponent(slug));
  if (!data) notFound();
  return (
    <EntityPage
      kind="tema"
      crumb={{ label: "papers", href: "/papers/page/1" }}
      name={data.topic.label}
      total={data.total}
      papers={data.papers}
    />
  );
}
