"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, Zap, Calendar, Sparkles } from "lucide-react";
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
    { id: "year", label: "Tahunan", badge: "Hemat 20%" },
    { id: "all", label: "Semua" },
  ];

  const filteredPlans = plans.filter((p) => {
    if (p.isActive === false) return false;
    if (activeTab === "all") return true;
    if (p.id === "FREE") return true;
    return (p.period || "month") === activeTab;
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Crisp Segmented Control Tabs (antislop-ui compliant) */}
      <div className="flex justify-center w-full px-2">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 max-w-full overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 select-none shrink-0 cursor-pointer min-h-[36px] ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-slate-800" : "text-slate-500"
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight ml-0.5 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-emerald-50/80 text-emerald-700 border border-emerald-200/80"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch w-full animate-in fade-in duration-200">
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
