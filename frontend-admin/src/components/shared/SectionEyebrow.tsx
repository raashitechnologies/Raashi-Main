import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}

export function SectionEyebrow({ children, className, light = false }: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.18em] uppercase mb-3",
        light ? "text-white/70" : "text-brand-blue",
        className
      )}
    >
      {children}
    </p>
  );
}
