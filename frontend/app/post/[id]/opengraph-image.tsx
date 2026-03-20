// app/post/[id]/opengraph-image.tsx – Dynamic OG image per article using Next.js ImageResponse

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "AIPulse Daily";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OGImage({ params }: Props) {
  const { id } = await params;

  let title = "AIPulse Daily — AI News";
  let source = "";

  try {
    const res = await fetch(`${BASE}/api/posts/${id}`, { cache: "no-store" });
    if (res.ok) {
      const post = await res.json();
      title = (post.title as string | undefined) ?? title;
      source = (post.source as string | undefined) ?? "";
    }
  } catch {
    // Fall back to default title
  }

  const fontSize = title.length > 90 ? "36px" : title.length > 60 ? "44px" : "52px";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #1a1a1e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              background: "#f97316",
              borderRadius: "10px",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            ⚡
          </div>
          <span style={{ color: "#ffffff", fontSize: "30px", fontWeight: 700 }}>
            AIPulse Daily
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: "#ffffff",
            fontSize,
            fontWeight: 700,
            lineHeight: 1.25,
            maxWidth: "1060px",
          }}
        >
          {title}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {source ? (
            <span style={{ color: "#888888", fontSize: "22px" }}>{source}</span>
          ) : (
            <span />
          )}
          <span style={{ color: "#f97316", fontSize: "22px" }}>
            aipulsedaily.news
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
