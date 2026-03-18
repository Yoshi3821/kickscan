"use client";

type BannerSize = "leaderboard" | "medium-rect" | "large-banner";

interface AdBannerProps {
  size: BannerSize;
  label?: string;
  sponsor?: string;
  className?: string;
}

const sizeConfig: Record<BannerSize, { w: number; h: number; mobileW: number; mobileH: number; label: string }> = {
  leaderboard: { w: 728, h: 90, mobileW: 320, mobileH: 50, label: "728 × 90" },
  "medium-rect": { w: 300, h: 250, mobileW: 300, mobileH: 250, label: "300 × 250" },
  "large-banner": { w: 970, h: 250, mobileW: 320, mobileH: 100, label: "970 × 250" },
};

export default function AdBanner({ size, label, sponsor, className = "" }: AdBannerProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={`flex justify-center ${className}`}
      data-ad-slot={`${size}${label ? `-${label}` : ""}`}
    >
      {/* Desktop */}
      <div
        className="hidden sm:flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-sm"
        style={{ width: config.w, height: config.h, maxWidth: "100%" }}
      >
        <div className="text-center">
          {sponsor ? (
            <p className="text-[10px] text-gray-600 tracking-widest uppercase">
              Sponsored by <span className="text-gray-500">{sponsor}</span>
            </p>
          ) : (
            <>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">
                Advertisement
              </p>
              <p className="text-[9px] text-gray-700 mt-0.5 font-mono">
                {config.label}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div
        className="flex sm:hidden items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-sm"
        style={{ width: config.mobileW, height: config.mobileH, maxWidth: "100%" }}
      >
        <div className="text-center">
          {sponsor ? (
            <p className="text-[10px] text-gray-600 tracking-widest uppercase">
              Sponsored by <span className="text-gray-500">{sponsor}</span>
            </p>
          ) : (
            <>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">
                Advertisement
              </p>
              <p className="text-[9px] text-gray-700 mt-0.5 font-mono">
                {config.mobileW} × {config.mobileH}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
