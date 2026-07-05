import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * No ejecutar middleware en assets de Next ni estáticos.
     * Si el middleware los toca, la página carga sin CSS (HTML crudo).
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|map)$).*)",
  ],
};
