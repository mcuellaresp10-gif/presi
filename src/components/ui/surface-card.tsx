import * as React from "react";
import { cn } from "@/lib/utils";

export function SurfaceCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-presi-ivory/15 bg-presi-surface/95 p-4 text-white shadow-lg shadow-black/25 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
