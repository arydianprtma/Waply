"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, X, Zap, Calendar, Sparkles, Layers, PackageX, Timer } from "lucide-react";
import { Plan, getPlanDetailedFeatureList, getPlanDiscountStatus } from "@/lib/billing-types";
import { PromoCountdownTimer } from "@/components/ui/PromoCountdownTimer";

interface LandingPricingProps {
  plans: Plan[];
}

type PeriodTab = "month" | "day" | "year" | "all";

export default function LandingPricing({ plans }: LandingPricingProps) {
  const [activeTab, setActiveTab] = useState<PeriodTab>("month");
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate highest discount for each tab dynamically from plans
  const getTabDiscountBadge = (tabId: PeriodTab): string | undefined => {
    if (tabId === "all") return undefined;
    const periodPlans = plans.filter(
      (p) => p.isActive !== false && p.id !== "FREE" && (p.period || "month") === tabId
    );
    if (periodPlans.length === 0) return undefined;

    let maxPercent = 0;
    let badgeText = "";

    for (const p of periodPlans) {
      const disc = getPlanDiscountStatus(p, nowMs);
      if (disc.isDiscountActive && disc.discountPercent && disc.discountPercent > maxPercent) {
        maxPercent = disc.discountPercent;
        badgeText = disc.discountBadge || `Hemat ${maxPercent}%`;
      }
    }

    if (maxPercent > 0) {
      return badgeText || `Hemat ${maxPercent}%`;
    }
    return undefined;
  };

  const tabs: { id: PeriodTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "month", label: "Bulanan", icon: Calendar, badge: getTabDiscountBadge("month") },
    { id: "day", label: "Harian", icon: Zap, badge: getTabDiscountBadge("day") },
    { id: "year", label: "Tahunan", icon: Sparkles, badge: getTabDiscountBadge("year") },
    { id: "all", label: "Semua", icon: Layers },
  ];

  const filteredPlans = plans.filter((p) => {
    if (p.isActive === false) return false;
    if (activeTab === "all") return true;
    if (p.id === "FREE") return true;
    return (p.period || "month") === activeTab;
  });

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 max-w-full justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="badge badge-error badge-xs text-white font-extrabold text-[9px] px-1.5">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
          <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">Belum Ada Paket</h3>
          <p className="text-xs text-slate-400 mt-1">
            Paket untuk periode ini belum dikonfigurasi.
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-6 sm:gap-8 items-stretch ${
            filteredPlans.length === 1
              ? "max-w-md mx-auto"
              : filteredPlans.length === 2
              ? "sm:grid-cols-2 max-w-4xl mx-auto"
              : filteredPlans.length === 3
              ? "sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
              : "sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
          }`}
        >
          {filteredPlans.map((plan) => {
            const discStatus = getPlanDiscountStatus(plan, nowMs);
            const isFree = plan.price === 0 || plan.id === "FREE";
            const priceFormatted = isFree
              ? "Gratis"
              : `Rp${discStatus.effectivePrice.toLocaleString("id-ID")}`;
            const periodLabel = isFree
              ? "selamanya"
              : plan.period === "day"
              ? "/hari"
              : plan.period === "week"
              ? "/minggu"
              : plan.period === "year"
              ? "/tahun"
              : "/bulan";

            const detailedFeatures = getPlanDetailedFeatureList(plan);

            return (
              <div
                key={plan.id}
                className={`card bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  plan.isPopular
                    ? "border-2 border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5"
                    : "border border-slate-200 hover:shadow-md"
                }`}
              >
                {plan.isPopular && (
                  <div className="badge badge-primary absolute -top-3.5 right-6 font-bold shadow-xs text-xs">
                    Paling Populer
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 min-h-[28px]">
                    <h3
                      className={`font-bold text-base sm:text-lg leading-snug ${
                        plan.isPopular ? "text-primary" : "text-slate-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price Section */}
                  <div className="mt-3 sm:mt-4 min-h-[52px] flex flex-col justify-end space-y-1.5">
                    {discStatus.isDiscountActive && discStatus.originalPrice && discStatus.originalPrice > discStatus.effectivePrice ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-slate-400 line-through font-semibold">
                            Rp{discStatus.originalPrice.toLocaleString("id-ID")}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 tracking-tight shrink-0">
                            {discStatus.discountBadge || `HEMAT ${discStatus.discountPercent}%`}
                          </span>
                        </div>
                        {discStatus.hasTimer && (
                          <div>
                            <PromoCountdownTimer status={discStatus} variant="badge" />
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {priceFormatted}
                      </span>
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
      )}
    </div>
  );
}
