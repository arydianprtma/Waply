"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { AlertTriangle, Info, CheckCircle2, Trash2 } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

type DialogVariant = "danger" | "warning" | "info" | "primary" | "success";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: DialogVariant;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  showAlert: (options: AlertOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Konfirmasi",
    cancelText: "Batal",
    variant: "danger",
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setIsAlertMode(false);
      if (typeof opts === "string") {
        setOptions({
          title: "Konfirmasi Tindakan",
          message: opts,
          confirmText: "Lanjutkan",
          cancelText: "Batal",
          variant: "danger",
        });
      } else {
        setOptions({
          title: opts.title || (opts.variant === "danger" ? "Konfirmasi Hapus" : "Konfirmasi Tindakan"),
          message: opts.message,
          confirmText: opts.confirmText || (opts.variant === "danger" ? "Ya, Hapus" : "Konfirmasi"),
          cancelText: opts.cancelText || "Batal",
          variant: opts.variant || "danger",
        });
      }
      setIsOpen(true);
    });
  }, []);

  const showAlert = useCallback((opts: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current = () => resolve();
      setIsAlertMode(true);
      if (typeof opts === "string") {
        setOptions({
          title: "Pemberitahuan",
          message: opts,
          confirmText: "Mengerti",
          cancelText: "",
          variant: "info",
        });
      } else {
        setOptions({
          title: opts.title || "Pemberitahuan",
          message: opts.message,
          confirmText: opts.confirmText || "Mengerti",
          cancelText: "",
          variant: opts.variant || "info",
        });
      }
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const getIcon = () => {
    switch (options.variant) {
      case "danger":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/80 shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/80 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case "primary":
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80 shadow-inner">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (options.variant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-200";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm shadow-amber-200";
      case "primary":
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-200";
      case "info":
      default:
        return "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-sm";
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, showAlert }}>
      {children}
      {isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 transition-opacity"
              onClick={isAlertMode ? handleConfirm : handleCancel}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 z-10 scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                {getIcon()}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {options.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
                    {options.message}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-end gap-3">
                {!isAlertMode && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
                  >
                    {options.cancelText || "Batal"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${getConfirmButtonClass()}`}
                >
                  {options.confirmText}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function useConfirm() {
  const { confirm } = useDialog();
  return confirm;
}

export function useAlert() {
  const { showAlert } = useDialog();
  return showAlert;
}
