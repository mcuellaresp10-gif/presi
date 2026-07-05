import Image from "next/image";
import { getPlayerInitials } from "@/lib/game/player-display";
import { cn } from "@/lib/utils";

// Desactivado temporalmente por riesgo de derechos de imagen de jugadores
// reales. Reactivar solo después de confirmar licencia con el titular de
// derechos.
const USE_REAL_PHOTOS = false;

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
  if (USE_REAL_PHOTOS && photoUrl) {
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
