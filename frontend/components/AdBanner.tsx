// components/AdBanner.tsx – Google AdSense ad slots
// TODO: After AdSense approves your site, create ad units at console.adsense.google.com
//       → Ads → By ad unit → Display ads, then paste the slot IDs below.

"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const PUB_ID = "ca-pub-6671856937433037";

const TOP_BANNER_SLOT = "7757831081";
const INLINE_SLOT = "5969539445";

function AdUnit({
  slot,
  format = "auto",
  className = "",
}: {
  slot: string;
  format?: string;
  className?: string;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not yet loaded
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client={PUB_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

export function AdBannerTop() {
  return (
    <div className="w-full overflow-hidden rounded-lg bg-muted/20 min-h-[90px]">
      <AdUnit slot={TOP_BANNER_SLOT} />
    </div>
  );
}

export function AdCardInline() {
  return (
    <div className="col-span-full w-full overflow-hidden rounded-lg bg-muted/20 min-h-[120px]">
      <AdUnit slot={INLINE_SLOT} format="fluid" />
    </div>
  );
}
