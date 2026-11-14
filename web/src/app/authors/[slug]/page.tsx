import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/EntityPage";
import { getAuthor, listAuthorSlugs } from "@/lib";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

const loadAuthor = cache(getAuthor);

export async function generateStaticParams() {
  return (await listAuthorSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadAuthor(decodeURIComponent(slug));
  if (!data) return { title: "Autor no encontrado", robots: { index: false } };
  return pageMetadata({
    title: data.author.name,
    description: `${data.total} papers de ${data.author.name} sobre machine learning cuántico, con resúmenes y enlaces a arXiv.`,
    path: `/authors/${data.author.slug}`,
  });
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadAuthor(decodeURIComponent(slug));
  if (!data) notFound();
  return (
    <EntityPage
      kind="autor"
      crumb={{ label: "papers", href: "/papers/page/1" }}
      name={data.author.name}
      total={data.total}
      papers={data.papers}
    />
  );
}
