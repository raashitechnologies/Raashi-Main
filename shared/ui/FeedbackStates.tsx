import type { ReactNode } from "react";
import { AlertTriangle, WifiOff, FileX, RotateCw } from "lucide-react";

interface FeedbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "public" | "admin";
  icon?: ReactNode;
  children?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this information.",
  onRetry,
  retryLabel = "Try Again",
  variant = "public",
  icon = <AlertTriangle size={24} />
}: FeedbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" role="alert">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 
        ${variant === "admin" ? "bg-red-50 text-red-500 border border-red-100" : "bg-gray-100 text-gray-400"}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-brand-blue text-white hover:bg-brand-royal transition-colors"
        >
          <RotateCw size={14} /> {retryLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No data available",
  message = "There's nothing to display right now.",
  variant = "public",
  icon = <FileX size={24} />,
  children
}: FeedbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 
        ${variant === "admin" ? "bg-white text-gray-400 shadow-sm border border-gray-100" : "text-gray-300"}`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{message}</p>
      {children}
    </div>
  );
}

export function SectionError({
  title = "Couldn't load section",
  onRetry
}: Omit<FeedbackProps, "message">) {
  return (
    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-left">
        <AlertTriangle size={18} className="text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-bold text-brand-blue hover:text-brand-royal whitespace-nowrap"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function ServiceUnavailableState({
  variant = "public",
  onRetry
}: Pick<FeedbackProps, "variant" | "onRetry">) {
  return (
    <ErrorState
      title={variant === "admin" ? "Server Unavailable" : "We're having trouble"}
      message={variant === "admin" 
        ? "The server is temporarily unavailable. No changes have been saved."
        : "We're having trouble loading some information right now."}
      icon={<WifiOff size={24} />}
      onRetry={onRetry}
      variant={variant}
    />
  );
}
