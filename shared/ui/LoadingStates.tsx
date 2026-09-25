
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className = "w-6 h-6", text }: { className?: string, text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`animate-spin text-brand-blue ${className}`} />
      {text && <span className="text-sm font-medium text-gray-500">{text}</span>}
    </div>
  );
}

export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8" aria-busy="true">
      <LoadingSpinner className="w-8 h-8" text={text} />
    </div>
  );
}

export function SectionLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-12 w-full h-full min-h-32" aria-busy="true">
      <LoadingSpinner className="w-6 h-6" text={text} />
    </div>
  );
}

export function ButtonLoading({ text = "Please wait..." }: { text?: string }) {
  return (
    <span className="flex items-center gap-2 justify-center" aria-busy="true">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{text}</span>
    </span>
  );
}

export function OverlayLoading({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-inherit" aria-busy="true">
      <LoadingSpinner className="w-8 h-8" text={text} />
    </div>
  );
}
