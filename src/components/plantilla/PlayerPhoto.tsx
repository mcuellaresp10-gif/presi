import Image from "next/image";
import { getPlayerInitials } from "@/lib/game/player-display";
import { cn } from "@/lib/utils";

export function PlayerPhoto({
  nombre,
  photoUrl,
  className,
  initialsClassName,
  sizes = "80px",
}: {
  nombre: string;
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
  sizes?: string;
}) {
  if (photoUrl) {
    return (
      <div className="player-photo-duotone relative h-full w-full overflow-hidden">
        <Image
          src={photoUrl}
          alt={nombre}
          fill
          sizes={sizes}
          className={cn("object-cover object-[center_12%]", className)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-presi-cyan/80 to-presi-bg",
        initialsClassName
      )}
    >
      <span className="text-lg font-bold text-white">
        {getPlayerInitials(nombre)}
      </span>
    </div>
  );
}
