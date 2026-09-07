import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Explicit matcher — Next 16 Turbopack breaks the usual negative-lookahead pattern.
  matcher: ["/", "/(en|ru)/:path*", "/(en|ru)"],
};
