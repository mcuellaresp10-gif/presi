"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function getProgressRingMetrics(size: number, stroke: number) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return { radius, circumference };
}

/** Yellow → coral, same as login CTA. */
const GRADIENT_FROM = "#F5F147";
const GRADIENT_TO = "#F57847";

export function ProgressRing({
  size,
  stroke = 5,
  progress,
  gradientId,
  className,
  trackClassName,
  arcClassName,
  children,
  badge,
}: {
  size: number;
  stroke?: number;
  progress: number;
  gradientId?: string;
  className?: string;
  trackClassName?: string;
  arcClassName?: string;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const autoId = useId();
  const id = gradientId ?? `progressRing-${autoId}`;
  const { radius, circumference } = getProgressRingMetrics(size, stroke);
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            arcClassName
          )}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GRADIENT_FROM} />
            <stop offset="100%" stopColor={GRADIENT_TO} />
          </linearGradient>
        </defs>
      </svg>
      {children}
      {badge}
    </div>
  );
}
