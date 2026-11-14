import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "QuantumPapers · búsqueda semántica de papers de ML cuántico";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    kicker: "búsqueda semántica sobre papers de arXiv",
    title: "Pregunta con tus palabras. Obtén los papers más cercanos.",
    byline: "Machine learning cuántico",
    titleSize: 72,
  });
}
