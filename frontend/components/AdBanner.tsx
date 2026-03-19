// components/AdBanner.tsx – Ad placeholder slots

export function AdBannerTop() {
  return (
    /* Ad slot – top banner 728×90 */
    <div className="flex h-[90px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
      Ad · 728×90 — replace with Google AdSense or direct sponsor banner
    </div>
  );
}

export function AdCardInline() {
  return (
    /* Ad slot – between posts (native/responsive) */
    <div className="flex h-[120px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground col-span-full">
      Ad · Responsive inline — replace with AdSense responsive unit
    </div>
  );
}
