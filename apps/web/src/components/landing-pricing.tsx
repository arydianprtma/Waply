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
    <div className="space-y-8 sm:space-y-10">
      {/* Category Tabs Container */}
      <div className="flex justify-center w-full px-2 overflow-x-auto">
        <div className="relative inline-flex p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-white/10 shadow-xs max-w-full">
          {/* Active Tab Sliding Indicator */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-slate-900 shadow-sm transition-all duration-300 ease-out"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />

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
                className={`relative z-10 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 select-none shrink-0 cursor-pointer min-h-[40px] ${
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-slate-100" : "text-slate-500"
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight ml-0.5 ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-100 text-emerald-800"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch w-full animate-in fade-in duration-300">
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
              className={`bg-white p-5 sm:p-6 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                plan.isPopular
                  ? "border-2 border-primary shadow-md relative ring-2 ring-primary/10"
                  : "border border-slate-200 hover:shadow-md"
              }`}
            >
              {plan.isPopular && (
                <div className="badge badge-primary absolute -top-3 right-5 font-bold shadow-xs text-xs">
                  Paling Populer
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-2 min-h-[28px]">
                  <h3 className={`font-bold text-base sm:text-lg leading-snug ${plan.isPopular ? "text-primary" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  {plan.period === "day" && (
                    <span className="badge badge-sm badge-warning font-bold text-[10px] shrink-0">
                      Harian
                    </span>
                  )}
                </div>

                {/* Price Section */}
                <div className="mt-3 sm:mt-4 min-h-[52px] flex flex-col justify-end">
                  {plan.originalPrice && plan.originalPrice > plan.price ? (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 line-through font-semibold">
                        Rp{plan.originalPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white tracking-tight shrink-0">
                        {plan.discountBadge || `HEMAT ${plan.discountPercent || Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%`}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">{priceFormatted}</span>
                    <span className="text-xs text-slate-500 font-medium">{periodLabel}</span>
                  </div>
                </div>

                <div className="divider my-3.5 sm:my-4"></div>

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
                className={`w-full mt-6 sm:mt-8 min-h-[44px] flex items-center justify-center rounded-xl font-semibold text-sm transition-colors ${
                  plan.isPopular
                    ? "bg-primary hover:bg-primary/90 text-white shadow-xs"
                    : isFree
                    ? "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
                    : "bg-primary hover:bg-primary/90 text-white"
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
