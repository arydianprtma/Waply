"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, Zap, Calendar, Sparkles, Award } from "lucide-react";
import { Plan, getPlanDetailedFeatureList } from "@/lib/billing-types";

interface LandingPricingProps {
  plans: Plan[];
}

type PeriodTab = "month" | "day" | "year" | "all";

export default function LandingPricing({ plans }: LandingPricingProps) {
  const [activeTab, setActiveTab] = useState<PeriodTab>("month");

  const filteredPlans = plans.filter((p) => {
    if (p.isActive === false) return false;
    if (activeTab === "all") return true;
    // FREE plan can be shown in all tabs or when tab matches
    if (p.id === "FREE") return true;
    return (p.period || "month") === activeTab;
  });

  return (
    <div className="space-y-10">
      {/* Category Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-base-200/80 border border-base-300 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab("day")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "day"
                ? "bg-primary text-primary-content shadow-md shadow-primary/25 scale-[1.02]"
                : "text-base-content/70 hover:text-base-content hover:bg-base-100"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Harian
          </button>

          <button
            onClick={() => setActiveTab("month")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "month"
                ? "bg-primary text-primary-content shadow-md shadow-primary/25 scale-[1.02]"
                : "text-base-content/70 hover:text-base-content hover:bg-base-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Bulanan
          </button>

          <button
            onClick={() => setActiveTab("year")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "year"
                ? "bg-primary text-primary-content shadow-md shadow-primary/25 scale-[1.02]"
                : "text-base-content/70 hover:text-base-content hover:bg-base-100"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Tahunan
            <span className={`badge badge-xs font-black ml-1 ${activeTab === "year" ? "bg-emerald-300 text-emerald-950" : "badge-success text-white"}`}>
              Hemat 20%
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "all"
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Grid of Plans */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(
          4,
          Math.max(1, filteredPlans.length)
        )} gap-6 items-stretch`}
      >
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
              className={`card bg-base-100 p-6 rounded-3xl flex flex-col justify-between transition-all duration-200 ${
                plan.isPopular
                  ? "border-2 border-primary shadow-xl relative ring-2 ring-primary/20 scale-[1.02]"
                  : "border border-base-300 hover:shadow-lg"
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
                      <span className="text-xs text-base-content/45 line-through font-semibold">
                        Rp{plan.originalPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white shadow-xs tracking-wider shrink-0">
                        {plan.discountBadge || `HEMAT ${plan.discountPercent || Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%`}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{priceFormatted}</span>
                    <span className="text-xs text-base-content/60 font-medium">{periodLabel}</span>
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
                    ? "btn-outline border-base-300"
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
