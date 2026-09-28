/**
 * footerEmail.ts
 *
 * Centralised route → contextual footer email mapping.
 *
 * RULES:
 *  - Home ("/") → undefined  →  Footer preserves its existing CMS-sourced email.
 *  - Non-home routes → one of the four company addresses below.
 *  - Any unmapped route → info@raashitech.com  (safe fallback — never undefined).
 */

export const FOOTER_EMAILS = {
  hr: "hr@raashitech.com",
  info: "info@raashitech.com",
  sales: "sales@raashitech.com",
  support: "support@raashitech.com",
} as const;

export type FooterEmailKey = keyof typeof FOOTER_EMAILS;

/**
 * Returns the contextual email string for the given pathname,
 * or `undefined` for the home route (so the Footer keeps its CMS default).
 */
export function getFooterEmailForRoute(
  pathname: string
): string | undefined {
  // Normalise trailing slash
  const p = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Home → preserve existing footer behaviour (no override)
  if (p === "/") return undefined;

  // Careers & Internships → HR
  if (p === "/careers") return FOOTER_EMAILS.hr;
  if (p === "/internships") return FOOTER_EMAILS.hr;
  if (p === "/apply") return FOOTER_EMAILS.hr;

  // Contact → Support
  if (p === "/contact") return FOOTER_EMAILS.support;

  // Domains (list + detail) → Sales
  if (p === "/domains" || p.startsWith("/domains/")) return FOOTER_EMAILS.sales;

  // About / Company → Info
  if (p === "/about" || p.startsWith("/about")) return FOOTER_EMAILS.info;

  // Legal / Policy pages → Info
  if (p === "/privacy-policy" || p === "/terms") return FOOTER_EMAILS.info;

  // Catch-all fallback → Info
  return FOOTER_EMAILS.info;
}
