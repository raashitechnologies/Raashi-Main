import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, FileText } from "lucide-react";
import { PolicyDocumentViewer } from "./PolicyDocumentViewer";

export interface PolicyDocument {
  id: string;
  document_type: "TERMS" | "RULES";
  audience: "INTERNSHIP" | "CAREER";
  version: number;
  title: string;
  content: string;
  status: string;
  effective_from?: string | null;
  published_at?: string | null;
  created_by?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PolicyModalProps {
  isOpen: boolean;
  document: PolicyDocument | null;
  onClose: () => void;
  /** Called when user clicks "I Agree". Not shown in admin preview mode. */
  onAgree?: (doc: PolicyDocument) => void;
  /** In preview mode the "I Agree" button is hidden */
  previewMode?: boolean;
  /** Whether the document is still loading */
  loading?: boolean;
}

export function PolicyModal({
  isOpen,
  document,
  onClose,
  onAgree,
  previewMode = false,
  loading = false,
}: PolicyModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const agreeRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap: when modal opens, move focus to close button
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document && (window.__policyScrollY = window.scrollY);
      window.document.body.style.overflow = "hidden";
    } else {
      window.document.body.style.overflow = "";
    }
    return () => {
      window.document.body.style.overflow = "";
    };
  }, [isOpen, document]);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap: Tab / Shift+Tab cycles between close and agree buttons
      if (e.key === "Tab") {
        const focusable = [closeRef.current, agreeRef.current].filter(Boolean) as HTMLElement[];
        if (focusable.length < 2) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (window.document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (window.document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleAgree = () => {
    if (document && onAgree) {
      onAgree(document);
    }
    onClose();
  };

  const typeLabel =
    document?.document_type === "TERMS"
      ? "Terms & Conditions"
      : "Rules & Regulations";

  const TypeIcon = document?.document_type === "TERMS" ? FileText : Shield;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Modal panel */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="policy-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — sticky */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-navy/[0.08] shrink-0 bg-white rounded-t-2xl">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/8 flex items-center justify-center shrink-0">
                  <TypeIcon size={16} className="text-brand-blue" strokeWidth={1.8} />
                </div>
                <h2
                  id="policy-modal-title"
                  className="flex-1 text-base font-bold text-brand-navy"
                >
                  {document?.title || typeLabel}
                  {previewMode && (
                    <span className="ml-2 text-xs font-normal text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                      Preview
                    </span>
                  )}
                </h2>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close policy document"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-navy/40 hover:text-brand-navy hover:bg-brand-surface transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable content area */}
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto px-6 py-5"
                tabIndex={-1}
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
                    <p className="text-sm text-brand-navy/50">
                      Loading {typeLabel}…
                    </p>
                  </div>
                ) : document ? (
                  <PolicyDocumentViewer content={document.content} />
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-sm text-brand-navy/50">
                      Document not available. Please try again.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer — sticky */}
              <div className="shrink-0 border-t border-brand-navy/[0.08] px-6 py-4 bg-brand-surface/50 rounded-b-2xl">
                <div className="flex items-center justify-end gap-4 flex-wrap">
                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-navy/60 hover:text-brand-navy hover:bg-brand-surface transition-colors"
                    >
                      Close
                    </button>

                    {!previewMode && onAgree && (
                      <button
                        ref={agreeRef}
                        onClick={handleAgree}
                        disabled={loading || !document}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        I Agree
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Augment window for scroll-locking helper
declare global {
  interface Window {
    __policyScrollY?: number;
  }
}
