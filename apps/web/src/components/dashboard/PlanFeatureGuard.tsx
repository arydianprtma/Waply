"use client";

import Link from "next/link";
import { Lock, ShieldAlert, CheckCircle2, ArrowLeft, CreditCard } from "lucide-react";
import { PlanFeatureAccess } from "@/lib/billing-types";
import { useBillingPlan } from "@/lib/use-billing-plan";
import { PageLoadingSkeleton } from "@/components/ui/SkeletonLoaders";

interface PlanFeatureGuardProps {
  feature: keyof PlanFeatureAccess;
  featureName: string;
  minPlanName: string;
  description?: string;
  children: React.ReactNode;
}

export function PlanFeatureGuard({
  feature,
  featureName,
  minPlanName: fallbackMinPlanName,
  description,
  children,
}: PlanFeatureGuardProps) {
  const { planAccess, currentPlanName, getRecommendedUpgradePlan, isLoading, isMounted } =
    useBillingPlan();

  const hasAccess = Boolean(planAccess[feature]);

  // Don't flash locked state while checking user's package upon page refresh
  if (isLoading && !isMounted) {
    return <PageLoadingSkeleton />;
  }

  const recommendedPlan = getRecommendedUpgradePlan ? getRecommendedUpgradePlan(feature) : null;
  const targetPlanName = recommendedPlan?.name || fallbackMinPlanName || "Paket Lebih Tinggi";

  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
        {/* Navigation Breadcrumb / Return */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Overview
          </Link>
        </div>

        {/* Feature Lock Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 text-center shadow-xs">
          {/* Lock Icon */}
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Terkunci pada Paket {currentPlanName}
          </div>

          {/* Title & Description */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Fitur {featureName}
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
            {description ||
              `Fitur ${featureName} tersedia mulai dari paket ${targetPlanName}. Upgrade paket Anda untuk membuka fitur ini dan meningkatkan kapasitas pengiriman.`}
          </p>

          {/* Feature Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto my-6">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">Akses Penuh {featureName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Buka kemampuan penuh tanpa batasan fitur</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">Kapasitas Pesan Lebih Besar</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tingkatkan kuota pengiriman & batas device</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={recommendedPlan ? `/order?plan=${recommendedPlan.id}` : "/dashboard/billing"}
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold px-6 text-xs sm:text-sm h-10 w-full sm:w-auto gap-2 transition-colors shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              Upgrade ke {targetPlanName}
            </Link>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl font-semibold px-5 text-xs sm:text-sm h-10 w-full sm:w-auto transition-colors shadow-xs"
            >
              Lihat Perbandingan Paket
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
