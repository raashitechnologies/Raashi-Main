import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  light?: boolean;
}

export function Breadcrumb({ items, light = true }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        to="/"
        className={`flex items-center gap-1 hover:underline transition-colors ${light ? "text-white/70 hover:text-white" : "text-brand-navy/60 hover:text-brand-navy"}`}
      >
        <Home size={13} />
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={13} className={light ? "text-white/40" : "text-brand-navy/30"} />
          {item.href ? (
            <Link
              to={item.href}
              className={`hover:underline transition-colors ${light ? "text-white/70 hover:text-white" : "text-brand-navy/60 hover:text-brand-navy"}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={light ? "text-white font-medium" : "text-brand-navy font-medium"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
