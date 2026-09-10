"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Sparkles,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "URGENT";
  targetAudience: "ALL" | "FREE" | "PAID";
  isPinned: boolean;
  isActive: boolean;
  isPopup?: boolean;
  popupActionText?: string;
  popupActionUrl?: string;
  popupImage?: string;
  popupImageRatio?: "16:9" | "1:1" | "4:3" | "AUTO";
  popupImageLayout?: "TOP" | "SIDE";
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
}

export function AnnouncementPopupModal() {
  const [mounted, setMounted] = useState(false);
  const [popup, setPopup] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchActivePopup = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Find active announcements marked as isPopup
        const popupItems: Announcement[] = json.data.filter(
          (item: Announcement) => item.isActive && item.isPopup
        );

        if (popupItems.length > 0) {
          // Find the first popup that has NOT been dismissed in localStorage
          for (const item of popupItems) {
            const dismissedKey = `waply_dismissed_popup_${item.id}`;
            const isDismissed = localStorage.getItem(dismissedKey);
            if (!isDismissed) {
              setPopup(item);
              setIsOpen(true);
              break;
            }
          }
        }
      }
    } catch {
      // Ignore network errors on background fetch
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      // Small delay to ensure smooth page transition before modal appears
      const timer = setTimeout(() => {
        fetchActivePopup();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [mounted, fetchActivePopup]);

  const handleClose = useCallback(() => {
    if (popup) {
      if (dontShowAgain) {
        localStorage.setItem(`waply_dismissed_popup_${popup.id}`, "true");
      }
      // Silently mark as read on server as well
      fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: popup.id }),
      }).catch(() => {});
    }
    setIsOpen(false);
  }, [popup, dontShowAgain]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!mounted || !isOpen || !popup) return null;

  const getTypeStyle = (type: Announcement["type"]) => {
    switch (type) {
      case "URGENT":
        return {
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />,
          label: "Pengumuman Penting",
          gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
          btnColor: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30",
        };
      case "WARNING":
        return {
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          label: "Pemberitahuan Sistem",
          gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
          btnColor: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30",
        };
      case "SUCCESS":
        return {
          badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />,
          label: "Promo & Rilis Fitur Baru",
          gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
          btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30",
        };
      default:
        return {
          badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
          label: "Informasi Resmi",
          gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
          btnColor: "bg-primary hover:bg-primary/90 text-white shadow-primary/30",
        };
    }
  };

  const style = getTypeStyle(popup.type);
  const isExternalLink = popup.popupActionUrl?.startsWith("http");
  const hasImage = Boolean(popup.popupImage);
  const isSideLayout = hasImage && popup.popupImageLayout === "SIDE";

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop with rich blur */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${
          isSideLayout ? "max-w-2xl md:max-w-3xl" : "max-w-lg md:max-w-xl"
        } bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto text-slate-800 dark:text-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div
          className={`absolute top-0 inset-x-0 h-36 bg-gradient-to-b ${style.gradient} pointer-events-none`}
        />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-lg border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {isSideLayout ? (
          /* ================= SIDE-BY-SIDE LAYOUT ================= */
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Left Column: Image Banner */}
            <div className="md:col-span-5 relative bg-slate-950 overflow-hidden flex items-center justify-center min-h-[220px] md:min-h-full border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={popup.popupImage}
                alt={popup.title}
                className="w-full h-full object-cover object-center max-h-[280px] md:max-h-none"
                onError={(e) => {
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) parent.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent md:hidden pointer-events-none" />
            </div>

            {/* Right Column: Content */}
            <div className="md:col-span-7 p-6 sm:p-7 relative flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Badge & Category */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${style.badgeBg}`}
                  >
                    {style.icon}
                    {style.label}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {popup.title}
                </h2>

                {/* Message Content */}
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto pr-1">
                  {popup.message}
                </div>
              </div>

              {/* Action Buttons & Footer */}
              <div className="pt-2 space-y-3">
                {popup.popupActionUrl && popup.popupActionText ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    {isExternalLink ? (
                      <a
                        href={popup.popupActionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClose}
                        className={`btn w-full sm:flex-1 rounded-2xl font-bold text-xs sm:text-sm shadow-lg gap-2 ${style.btnColor}`}
                      >
                        {popup.popupActionText}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        href={popup.popupActionUrl}
                        onClick={handleClose}
                        className={`btn w-full sm:flex-1 rounded-2xl font-bold text-xs sm:text-sm shadow-lg gap-2 ${style.btnColor}`}
                      >
                        {popup.popupActionText}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn btn-ghost w-full sm:w-auto rounded-2xl font-bold text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    >
                      Nanti Saja
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className={`btn w-full rounded-2xl font-bold text-xs sm:text-sm shadow-lg ${style.btnColor}`}
                  >
                    Saya Mengerti
                  </button>
                )}

                {/* "Don't show again" Checkbox */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="checkbox checkbox-primary checkbox-xs rounded"
                    />
                    <span>Jangan tampilkan pesan ini lagi</span>
                  </label>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Waply Announcement
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= TOP BANNER / STANDARD LAYOUT ================= */
          <div>
            {/* Top Promo Banner Image */}
            {hasImage && (
              <div
                className={`relative w-full overflow-hidden bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-center ${
                  popup.popupImageRatio === "1:1"
                    ? "aspect-square max-h-[300px]"
                    : popup.popupImageRatio === "4:3"
                    ? "aspect-[4/3] max-h-[320px]"
                    : popup.popupImageRatio === "AUTO"
                    ? "max-h-[360px]"
                    : "aspect-[16/9] max-h-[260px]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={popup.popupImage}
                  alt={popup.title}
                  className={`w-full h-full ${
                    popup.popupImageRatio === "AUTO" ? "object-contain max-h-[360px]" : "object-cover"
                  } object-center`}
                  onError={(e) => {
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) parent.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="p-6 sm:p-8 relative space-y-4">
              {/* Badge & Category */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${style.badgeBg}`}
                >
                  {style.icon}
                  {style.label}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {popup.title}
              </h2>

              {/* Message Content */}
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto pr-1">
                {popup.message}
              </div>

              {/* Action Buttons & Footer */}
              <div className="pt-3 space-y-3">
                {popup.popupActionUrl && popup.popupActionText ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    {isExternalLink ? (
                      <a
                        href={popup.popupActionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClose}
                        className={`btn w-full sm:flex-1 rounded-2xl font-bold text-xs sm:text-sm shadow-lg gap-2 ${style.btnColor}`}
                      >
                        {popup.popupActionText}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        href={popup.popupActionUrl}
                        onClick={handleClose}
                        className={`btn w-full sm:flex-1 rounded-2xl font-bold text-xs sm:text-sm shadow-lg gap-2 ${style.btnColor}`}
                      >
                        {popup.popupActionText}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn btn-ghost w-full sm:w-auto rounded-2xl font-bold text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    >
                      Nanti Saja
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className={`btn w-full rounded-2xl font-bold text-xs sm:text-sm shadow-lg ${style.btnColor}`}
                  >
                    Saya Mengerti
                  </button>
                )}

                {/* "Don't show again" Checkbox */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="checkbox checkbox-primary checkbox-xs rounded"
                    />
                    <span>Jangan tampilkan pesan ini lagi</span>
                  </label>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Waply Announcement
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
