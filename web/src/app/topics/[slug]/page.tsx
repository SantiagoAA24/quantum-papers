import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/EntityPage";
import { getTopic, listTopicSlugs } from "@/lib";
import { pageMetadata } from "@/lib/seo";

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
  if (!data) return { title: "Tema no encontrado", robots: { index: false } };
  return pageMetadata({
    title: data.topic.label,
    description: `${data.total} papers sobre ${data.topic.label} en machine learning cuántico, con resúmenes y enlaces a arXiv.`,
    path: `/topics/${data.topic.slug}`,
  });
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
