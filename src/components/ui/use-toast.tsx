"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
};

const ToastContext = React.createContext<{
  toast: (message: Omit<ToastMessage, "id">) => void;
} | null>(null);

export function ToastContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useCallback((message: Omit<ToastMessage, "id">) => {
    setToasts((current) => [
      ...current,
      { ...message, id: crypto.randomUUID() },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map((item) => (
          <Toast
            key={item.id}
            duration={6000}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
          >
            <div className="grid gap-1 pr-6">
              <ToastTitle>{item.title}</ToastTitle>
              {item.description ? (
                <ToastDescription>{item.description}</ToastDescription>
              ) : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastContextProvider");
  }
  return context;
}
