"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface WaplyLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  badge?: string;
  variant?: "dark" | "light" | "auto";
}

/**
 * Exact Waply Icon Emblem using /icon.png from public folder
 */
export function WaplyIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon.svg"
      alt="Waply Icon"
      width={size}
      height={size}
      className={clsx("object-contain shrink-0 select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Exact Waply Brand Logo using /waply_brand_logo_mockup.png from public folder
 */
export function WaplyLogo({
  className,
  iconOnly = false,
  size = "md",
  href,
  badge,
  variant = "auto",
}: WaplyLogoProps) {
  const sizeMap = {
    sm: { icon: 26, titleSize: "text-lg", badge: "text-[9px] px-1.5 py-0.5" },
    md: { icon: 32, titleSize: "text-xl", badge: "text-[10px] px-2 py-0.5" },
    lg: { icon: 42, titleSize: "text-2xl", badge: "text-[11px] px-2.5 py-0.5" },
    xl: { icon: 54, titleSize: "text-3xl", badge: "text-xs px-3 py-1" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={clsx("inline-flex items-center gap-2.5 select-none transition-transform hover:opacity-95", className)}>
      <WaplyIcon size={currentSize.icon} />
      {!iconOnly && (
        <div className="flex items-center gap-2">
          <span className={clsx("font-extrabold tracking-tight text-slate-900 dark:text-white leading-none", currentSize.titleSize)}>
            Waply
          </span>

          {badge && (
            <span
              className={clsx(
                "font-black uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
                currentSize.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }

  return content;
}

// Backward-compatible alias export for legacy code
export { WaplyIcon as SendoraIcon, WaplyLogo as SendoraLogo };
