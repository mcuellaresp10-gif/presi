import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size = 48,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.png"
      alt="PRESI"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-[22%] shadow-lg shadow-black/30", className)}
    />
  );
}
