import Link from "next/link";

export interface ResultRowProps {
  rank: string;
  title: string;
  /** Tema sin el "#". */
  topic: string;
  /** Similitud de 0 a 1; solo dibuja la barra. */
  similarity: number;
  /** Si se indica, el título es un enlace a este destino. */
  href?: string;
}

export function ResultRow({ rank, title, topic, similarity, href }: ResultRowProps) {
  const s = Math.max(0, Math.min(1, similarity || 0));
  return (
    <li className="qp-result">
      <span className="qp-result__rank">{rank}</span>
      <span className="qp-result__title">{href ? <Link href={href}>{title}</Link> : title}</span>
      <span className="qp-result__topic">{"#" + topic}</span>
      <span className="qp-result__bar" aria-hidden="true">
        <span className="qp-result__fill" style={{ width: Math.round(s * 100) + "%" }} />
      </span>
    </li>
  );
}
