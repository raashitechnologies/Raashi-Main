import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { PolicyDocument } from "./PolicyModal";

export interface ConsentState {
  accepted: boolean;
  documentId: string | null;
  version: number | null;
}

interface PolicyConsentBoxProps {
  audience: "INTERNSHIP" | "CAREER";
  /** The active Terms document from API */
  termsDoc: PolicyDocument | null;
  /** The active Rules document from API */
  rulesDoc: PolicyDocument | null;
  /** Whether policies are still being fetched */
  loading: boolean;
  /** Whether there was a fetch error */
  error: string;
  termsConsent: ConsentState;
  rulesConsent: ConsentState;
  onOpenTerms: () => void;
  onOpenRules: () => void;
  onRevokeTerms: () => void;
  onRevokeRules: () => void;
}

function ConsentRow({
  label,
  doc,
  consent,
  loading,
  onOpen,
  onRevoke,
  id,
}: {
  label: string;
  doc: PolicyDocument | null;
  consent: ConsentState;
  loading: boolean;
  onOpen: () => void;
  onRevoke: () => void;
  id: string;
}) {
  const isAccepted = consent.accepted;

  // Clicking the checkbox:
  // - If not yet accepted → open the modal (user must read and click I Agree)
  // - If already accepted → revoke / uncheck
  const handleCheckboxChange = () => {
    if (isAccepted) {
      onRevoke();
    } else {
      // Open modal so user can explicitly agree
      onOpen();
    }
  };

  // Clicking the label text → always open modal
  const handleLabelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpen();
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors duration-200 ${
        isAccepted
          ? "border-brand-blue/30 bg-brand-blue/4"
          : "border-brand-navy/10 bg-white"
      }`}
    >
      {/* Custom accessible checkbox */}
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={isAccepted}
          onChange={handleCheckboxChange}
          disabled={loading || !doc}
          aria-describedby={`${id}-desc`}
          className="sr-only peer"
        />
        <label
          htmlFor={id}
          className="flex items-center justify-center w-5 h-5 rounded cursor-pointer"
          aria-hidden="true"
        >
          {isAccepted ? (
            <CheckCircle2
              size={20}
              className="text-brand-blue"
              strokeWidth={2}
            />
          ) : (
            <Circle
              size={20}
              className="text-brand-navy/25 hover:text-brand-navy/50 transition-colors"
              strokeWidth={1.5}
            />
          )}
        </label>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div id={`${id}-desc`} className="text-sm text-brand-navy/75 leading-relaxed">
          I have read and agree to the{" "}
          {loading ? (
            <span className="text-brand-navy/40 italic">Loading…</span>
          ) : !doc ? (
            <span className="text-brand-red text-xs">
              <AlertCircle size={12} className="inline mr-1" />
              Could not load {label}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleLabelClick}
              onKeyDown={handleLabelKeyDown}
              className="font-semibold text-brand-blue underline underline-offset-2 hover:text-brand-royal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1 rounded"
              aria-label={`Read ${label} — opens in a dialog`}
            >
              {label}
            </button>
          )}
        </div>

        {isAccepted && consent.version !== null && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-brand-blue/70 mt-0.5"
          >
            ✓ Accepted
          </motion.p>
        )}

        {!isAccepted && doc && (
          <p className="text-xs text-brand-navy/40 mt-0.5">
            Click the link above to read and accept
          </p>
        )}
      </div>
    </div>
  );
}

export function PolicyConsentBox({
  termsDoc,
  rulesDoc,
  loading,
  error,
  termsConsent,
  rulesConsent,
  onOpenTerms,
  onOpenRules,
  onRevokeTerms,
  onRevokeRules,
}: PolicyConsentBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3 pt-1"
    >
      <p className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide">
        Required Agreements
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-red/5 border border-brand-red/20 text-sm text-brand-red">
          <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ConsentRow
        id="consent-terms"
        label="Terms & Conditions"
        doc={termsDoc}
        consent={termsConsent}
        loading={loading}
        onOpen={onOpenTerms}
        onRevoke={onRevokeTerms}
      />

      <ConsentRow
        id="consent-rules"
        label="Rules & Regulations"
        doc={rulesDoc}
        consent={rulesConsent}
        loading={loading}
        onOpen={onOpenRules}
        onRevoke={onRevokeRules}
      />
    </motion.div>
  );
}
