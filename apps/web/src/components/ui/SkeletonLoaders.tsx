"use client";

import clsx from "clsx";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={clsx("skeleton rounded-xl bg-base-300/70", className)} {...props} />;
}

export function PageHeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>
      {hasAction && <Skeleton className="h-10 w-36 rounded-xl shrink-0" />}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={clsx(
        "grid gap-4",
        count === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : count === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4"
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-base-200 flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="border-b border-base-200 bg-base-200/40">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-3 px-4">
                  <Skeleton className="h-3.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-base-200/70">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-3.5 px-4">
                    {c === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-16" />
                        </div>
                      </div>
                    ) : c === cols - 1 ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                      </div>
                    ) : (
                      <Skeleton className="h-3.5 w-24" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="pt-2 border-t border-base-200 flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80 sm:w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Quota Card */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-sm">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 lg:max-w-2xl">
            <div className="bg-base-200/50 border border-base-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>

            <div className="bg-base-200/50 border border-base-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <StatCardsSkeleton count={4} />

      {/* Traffic Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chart Column (8 cols) */}
        <div className="lg:col-span-8 bg-base-100 border border-base-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Skeleton className="h-7 w-12 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        {/* Recent Activity (4 cols) */}
        <div className="lg:col-span-4 bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="space-y-3 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-base-200/40">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-5 w-14 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links Bar */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BillingSkeleton() {
  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Active Plan Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-6 sm:p-7 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-8 w-52" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-base-200">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>

      {/* Metered Usage Monitor */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-3.5 w-80" />
          </div>
          <Skeleton className="h-8 w-40 rounded-lg shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-xl bg-base-200/50 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-base-200/50 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card bg-base-100 border border-base-200 p-6 rounded-2xl space-y-5 shadow-xs">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-36" />
            </div>
            <div className="space-y-2.5 pt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-xl pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="space-y-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-80 sm:w-96" />
      </div>
      <div className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="pt-3 flex justify-end gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-60" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-base-200">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

