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
      src="/icon.png"
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
    sm: { height: 32, icon: 28, badge: "text-[9px] px-1.5 py-0.5" },
    md: { height: 42, icon: 36, badge: "text-[10px] px-2 py-0.5" },
    lg: { height: 56, icon: 46, badge: "text-[11px] px-2.5 py-0.5" },
    xl: { height: 72, icon: 58, badge: "text-xs px-3 py-1" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={clsx("inline-flex items-center gap-2 select-none transition-transform hover:opacity-95", className)}>
      {iconOnly ? (
        <WaplyIcon size={currentSize.icon} />
      ) : (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/waply_brand_logo_mockup.png"
            alt="Waply - WhatsApp Gateway & API"
            className="object-contain"
            style={{ height: currentSize.height, width: "auto" }}
          />

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

// Backward-compatible re-exports
export * from "./WaplyLogo";
