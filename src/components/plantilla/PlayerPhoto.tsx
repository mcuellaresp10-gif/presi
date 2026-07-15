import { getPlayerInitials } from "@/lib/game/player-display";
import { cn } from "@/lib/utils";

/**
 * Avatar genérico (iniciales). No mostramos fotos reales de jugadores
 * por derechos de imagen / posibles reclamaciones.
 */
export function PlayerPhoto({
  nombre,
  photoUrl: _photoUrl,
  className,
  initialsClassName,
  sizes: _sizes,
}: {
  nombre: string;
  /** Ignorado: las fotos reales no se muestran. */
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
  sizes?: string;
}) {
  void _photoUrl;
  void _sizes;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-presi-gold/80 to-presi-bg",
        initialsClassName,
        className
      )}
    >
      <span className="text-lg font-bold text-white">
        {getPlayerInitials(nombre)}
      </span>
    </div>
  );
}
