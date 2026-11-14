import { getPaper } from "@/lib";
import { formatAuthors, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Paper en QuantumPapers";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(decodeURIComponent(id));
  if (!paper) {
    return renderOgCard({ kicker: "paper no encontrado", title: "Este paper no está en el índice" });
  }
  return renderOgCard({
    kicker: `paper · ${paper.primaryCategory}`,
    title: paper.title,
    byline: formatAuthors(paper.authors.map((a) => a.name)),
  });
}
