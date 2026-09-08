"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, Zap, Calendar, Sparkles, Layers, PackageX } from "lucide-react";
import { Plan, getPlanDetailedFeatureList } from "@/lib/billing-types";

interface LandingPricingProps {
  plans: Plan[];
}

type PeriodTab = "month" | "day" | "year" | "all";

export default function LandingPricing({ plans }: LandingPricingProps) {
  const [activeTab, setActiveTab] = useState<PeriodTab>("month");

  const tabs: { id: PeriodTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "month", label: "Bulanan", icon: Calendar },
    { id: "day", label: "Harian", icon: Zap },
    { id: "year", label: "Tahunan", icon: Sparkles, badge: "Hemat 20%" },
    { id: "all", label: "Semua", icon: Layers },
  ];

  const filteredPlans = plans.filter((p) => {
    if (p.isActive === false) return false;
    if (activeTab === "all") return true;
    if (p.id === "FREE") return true;
    return (p.period || "month") === activeTab;
  });

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Responsive Segmented Control Tab Filter */}
      <div className="flex justify-center w-full px-2">
        <div
          role="tablist"
          aria-label="Filter periode paket langganan"
          className="inline-flex items-center justify-center flex-wrap sm:flex-nowrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/90 shadow-xs max-w-full"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 select-none shrink-0 cursor-pointer min-h-[42px] sm:min-h-[38px] ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-primary font-bold" : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight ml-0.5 shrink-0 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-emerald-100/70 text-emerald-800"
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

      {/* Empty State when no plans match active tab */}
      {filteredPlans.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <PackageX className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak Ada Paket Tersedia</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Belum ada paket aktif untuk periode ini. Silakan pilih periode langganan lainnya.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className="btn btn-sm btn-outline rounded-xl mt-2 text-xs font-semibold"
          >
            Lihat Semua Paket
          </button>
        </div>
      ) : (
        /* Grid of Plans */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch w-full">
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
                    <h3
                      className={`font-bold text-base sm:text-lg leading-snug ${
                        plan.isPopular ? "text-primary" : "text-slate-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    {plan.period === "day" && (
                      <span className="badge badge-sm badge-warning font-bold text-[10px] shrink-0">
                        Harian
                      </span>
                    )}
                    {plan.period === "year" && (
                      <span className="badge badge-sm badge-success text-white font-bold text-[10px] shrink-0">
                        Tahunan
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
                          {plan.discountBadge ||
                            `HEMAT ${
                              plan.discountPercent ||
                              Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
                            }%`}
                        </span>
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
