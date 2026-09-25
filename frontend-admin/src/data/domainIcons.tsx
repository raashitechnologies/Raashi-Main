/**
 * domainIcons.tsx — Single source of truth for domain SVG icons.
 *
 * Previously duplicated in DomainCard.tsx and Domains.tsx.
 * Extracted here so all three consumers (DomainCard, Domains, HoverExpandDomainTile)
 * share the same map — no third duplicate.
 *
 * Icon design: 28×28 viewBox, currentColor stroke, 2px strokeWidth.
 * Consumer sets `color` via style or className to apply accent tint.
 */

const domainIcons: Record<string, React.ReactNode> = {
  "artificial-intelligence": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="14" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <line x1="14" y1="4" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="20" x2="14" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="14" x2="8" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "research-innovation": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
      <line x1="17.5" y1="17.5" x2="24" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "iot-smart-automation": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <path d="M5 14 C5 9 9 5 14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M23 14 C23 9 19 5 14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M5 14 C5 19 9 23 14 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M23 14 C23 19 19 23 14 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  "engineering-design": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="10" x2="10" y2="24" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  "education-training": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4 L26 10 L14 16 L2 10 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M6 13 L6 20 C6 20 10 24 14 24 C18 24 22 20 22 20 L22 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="26" y1="10" x2="26" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export { domainIcons };
