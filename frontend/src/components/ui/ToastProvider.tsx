import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = (kind: ToastKind, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[2000] flex w-80 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={[
              "rounded-xl border px-4 py-3 text-sm shadow-card backdrop-blur",
              item.kind === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              item.kind === "error" && "border-rose-200 bg-rose-50 text-rose-800",
              item.kind === "info" && "border-slate-200 bg-white text-slate-700"
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
