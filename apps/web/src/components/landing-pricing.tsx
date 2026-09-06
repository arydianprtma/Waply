"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, X, Zap, Calendar, Award } from "lucide-react";
import { Plan, getPlanDetailedFeatureList } from "@/lib/billing-types";

interface LandingPricingProps {
  plans: Plan[];
}

type PeriodTab = "day" | "month" | "year" | "all";

export default function LandingPricing({ plans }: LandingPricingProps) {
  const [activeTab, setActiveTab] = useState<PeriodTab>("month");

  const tabs: { id: PeriodTab; label: string; icon?: React.ElementType; badge?: string }[] = [
    { id: "day", label: "Harian", icon: Zap },
    { id: "month", label: "Bulanan", icon: Calendar },
    { id: "year", label: "Tahunan", icon: Award, badge: "Hemat 20%" },
    { id: "all", label: "Semua" },
  ];

  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = () => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const activeEl = tabsRef.current[activeIndex];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  const filteredPlans = plans.filter((p) => {
    if (p.isActive === false) return false;
    if (activeTab === "all") return true;
    if (p.id === "FREE") return true;
    return (p.period || "month") === activeTab;
  });

  return (
    <div className="space-y-10">
      {/* Category Tabs with Ultra Liquid Glass 3D Fluid Morph Animation */}
      <div className="flex justify-center w-full px-2">
        <div className="relative inline-flex p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 border border-slate-300/60 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_-4px_rgba(0,0,0,0.04)] backdrop-blur-md">
          {/* Midnight Obsidian Liquid Glass Fluid Pill */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1.5px_2px_rgba(0,0,0,0.5),0_8px_20px_-3px_rgba(15,23,42,0.5)] border-t border-white/25 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          >
            {/* Top Gloss Specular Reflex Overlay (Liquid Glass Glare) */}
            <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/25 via-white/10 to-transparent rounded-t-xl pointer-events-none" />
            {/* Ambient Base Bloom */}
            <div className="absolute -bottom-2 inset-x-0 h-4 bg-slate-700/30 blur-xs pointer-events-none" />
          </div>

          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabsRef.current[idx] = el;
                }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center gap-1.5 select-none shrink-0 cursor-pointer active:scale-95 ${
                  isActive
                    ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isActive ? "scale-115 -rotate-3 text-slate-100" : "text-slate-500 group-hover:scale-105"
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-black tracking-wide ml-0.5 transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-2xs scale-105"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch w-full animate-in fade-in duration-300">
        {filteredPlans.map((plan) => {
          const isFree = plan.price === 0;
          const priceFormatted = isFree ? "Rp0" : `Rp${plan.price.toLocaleString("id-ID")}`;
          const periodLabel =
            plan.period === "day"
              ? " / hari"
              : plan.period === "week"
              ? " / minggu"
              : plan.period === "year"
              ? " / tahun"
              : " / bulan";

          const detailedFeatures = getPlanDetailedFeatureList(plan);

          return (
            <div
              key={plan.id}
              className={`card bg-white p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                plan.isPopular
                  ? "border-2 border-primary shadow-xl relative ring-2 ring-primary/20 scale-[1.02]"
                  : "border border-slate-200 hover:shadow-lg"
              }`}
            >
              {plan.isPopular && (
                <div className="badge badge-primary absolute -top-3 right-6 font-bold shadow-sm">
                  Paling Populer
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-2 min-h-[28px]">
                  <h3 className={`font-bold text-lg leading-snug ${plan.isPopular ? "text-primary" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  {plan.period === "day" && (
                    <span className="badge badge-sm badge-warning font-bold text-[10px] shrink-0">
                      Harian
                    </span>
                  )}
                </div>

                {/* Price Section */}
                <div className="mt-4 min-h-[58px] flex flex-col justify-end">
                  {plan.originalPrice && plan.originalPrice > plan.price ? (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 line-through font-semibold">
                        Rp{plan.originalPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white shadow-xs tracking-wider shrink-0">
                        {plan.discountBadge || `HEMAT ${plan.discountPercent || Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%`}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{priceFormatted}</span>
                    <span className="text-xs text-slate-500 font-medium">{periodLabel}</span>
                  </div>
                </div>

                <div className="divider my-4"></div>

                <ul className="space-y-2.5 text-xs">
                  {detailedFeatures.map((feat, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 ${
                        feat.included ? "text-slate-800 font-medium" : "text-slate-400 opacity-50"
                      }`}
                    >
                      {feat.included ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={feat.included ? "" : "line-through"}>{feat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={isFree ? `/register?plan=FREE` : `/order?plan=${encodeURIComponent(plan.id)}`}
                prefetch={true}
                className={`btn btn-block mt-8 rounded-xl ${
                  plan.isPopular
                    ? "btn-primary shadow-lg shadow-primary/25 text-white"
                    : isFree
                    ? "btn-outline border-slate-300 text-slate-800 hover:bg-slate-100"
                    : "btn-primary"
                }`}
              >
                {isFree ? "Daftar Gratis" : `Pilih ${plan.name}`}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
