"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface SendoraLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  badge?: string;
}

export function SendoraIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sendora-icon.png"
      alt="Sendora Icon"
      width={size}
      height={size}
      className={clsx("object-contain shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SendoraLogo({
  className,
  iconOnly = false,
  size = "md",
  href,
  badge,
}: SendoraLogoProps) {
  const sizeMap = {
    sm: { height: 32, icon: 28, badge: "text-[9px] px-1.5 py-0.5" },
    md: { height: 42, icon: 34, badge: "text-[10px] px-2 py-0.5" },
    lg: { height: 56, icon: 46, badge: "text-[11px] px-2.5 py-0.5" },
    xl: { height: 72, icon: 58, badge: "text-xs px-3 py-1" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={clsx("inline-flex items-center gap-2 select-none transition-transform hover:opacity-95", className)}>
      {iconOnly ? (
        <SendoraIcon size={currentSize.icon} />
      ) : (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sendora-logo.png"
            alt="Sendora - High-End Messaging API"
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
