import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluir assets estáticos y HMR — si el middleware los toca,
     * la página carga sin CSS (HTML crudo).
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|manifest.json|sw.js|workbox-|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2?)$).*)",
  ],
};
