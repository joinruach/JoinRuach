"use client";
import { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: number; title?: string; description?: string; variant?: "default"|"success"|"error" };
type ToastCtx = { toasts: Toast[]; toast: (t: Omit<Toast,"id">) => void; dismiss: (id: number) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const api = useMemo<ToastCtx>(() => ({
    toasts,
    toast: (t) => setToasts((prev) => [...prev, { id: Date.now() + Math.random(), ...t }]),
    dismiss: (id) => setToasts((prev) => prev.filter((x) => x.id !== id)),
  }), [toasts]);

  return <Ctx.Provider value={api}>{children}<ToastViewport /></Ctx.Provider>;
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto rounded-lg px-4 py-3 shadow-lg",
            t.variant === "error" ? "bg-red-600 text-white" :
            t.variant === "success" ? "bg-emerald-600 text-white" :
            "bg-black text-white"
          ].join(" ")}
          onClick={() => dismiss(t.id)}
          role="status"
          aria-live="polite"
        >
          {t.title && <div className="font-semibold">{t.title}</div>}
          {t.description && <div className="text-sm opacity-90">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
