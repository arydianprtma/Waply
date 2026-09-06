"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";
import { PlanFeatureAccess } from "@/lib/billing-types";
import { useBillingPlan } from "@/lib/use-billing-plan";

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
  minPlanName,
  description,
  children,
}: PlanFeatureGuardProps) {
  const { planAccess, currentPlanName } = useBillingPlan();

  const hasAccess = Boolean(planAccess[feature]);

  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-amber-200 shadow-xl shadow-amber-500/5 p-8 md:p-10 text-center space-y-6 relative overflow-hidden">
          {/* Top Decorative Banner */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-100 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-100 rounded-full blur-2xl pointer-events-none" />

          {/* Hero Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>

          {/* Badge & Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Terkunci pada Paket {currentPlanName}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              Fitur {featureName}
            </h2>
            <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              {description ||
                `Fitur ${featureName} hanya tersedia mulai dari paket ${minPlanName}. Upgrade paket Anda untuk membuka fitur ini dan mendapatkan kuota pengiriman yang lebih besar.`}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto py-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Akses Penuh {featureName}</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kuota Pesan & Device Lebih Banyak</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/billing"
              className="btn btn-primary px-8 rounded-2xl font-bold shadow-lg shadow-primary/25 gap-2 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade ke {minPlanName}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-ghost rounded-2xl font-bold text-slate-600 hover:text-slate-900 w-full sm:w-auto"
            >
              Kembali ke Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
