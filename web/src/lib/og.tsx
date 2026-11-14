import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

// Values from docs/design/tokens.json (same as styles/tokens.css).
const COLOR = {
  bg: "#0b0f14",
  text: "#e6edf3",
  muted: "#8fa1b3",
  accent: "#2dd4bf",
  grid: "rgba(255, 255, 255, 0.035)", // grid-line #ffffff09
} as const;
const GRID = 48;

// Space Grotesk (SIL OFL 1.1), see src/assets/fonts/OFL.txt. Read once per server process.
const fontsPromise = Promise.all([
  readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Regular.woff")),
  readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Bold.woff")),
]);

type CardProps = {
  kicker: string;
  title: string;
  /** Second line under the title (authors, tagline). */
  byline?: string;
  titleSize?: number;
};

/** Dark card with the design's 48px grid; shared by the paper and default OG images. */
export async function renderOgCard({ kicker, title, byline, titleSize = 64 }: CardProps) {
  const [regular, bold] = await fontsPromise;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: COLOR.bg,
          backgroundImage: `linear-gradient(${COLOR.grid} 1px, transparent 1px), linear-gradient(90deg, ${COLOR.grid} 1px, transparent 1px)`,
          backgroundSize: `${GRID}px ${GRID}px`,
          color: COLOR.text,
          fontFamily: "Space Grotesk",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: COLOR.muted }}>
          {`// ${kicker}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "block",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              lineClamp: 3,
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          {byline ? (
            <div
              style={{
                display: "block",
                fontSize: 30,
                color: COLOR.muted,
                lineClamp: 1,
                textOverflow: "ellipsis",
              }}
            >
              {byline}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 700 }}>
          <span style={{ color: COLOR.accent, marginRight: 12 }}>{">"}</span>
          <span>QuantumPapers</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Space Grotesk", data: regular, weight: 400, style: "normal" },
        { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}

/** "A, B, C et al." with at most `max` names. */
export function formatAuthors(names: string[], max = 3): string {
  if (names.length === 0) return "";
  const shown = names.slice(0, max).join(", ");
  return names.length > max ? `${shown} et al.` : shown;
}
