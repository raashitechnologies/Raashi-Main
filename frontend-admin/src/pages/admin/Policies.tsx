import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Shield, CheckCircle, Clock, Archive,
  Plus, Eye, History, Edit3, ChevronRight,
} from "lucide-react";
import { policyApi } from "@/lib/api";

interface PolicyDocument {
  id: string;
  document_type: "TERMS" | "RULES";
  audience: "INTERNSHIP" | "CAREER";
  version: number;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  effective_from?: string | null;
  published_at?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-brand-blue/10 text-brand-blue",
    DRAFT: "bg-brand-orange/10 text-brand-orange",
    ARCHIVED: "bg-brand-navy/10 text-brand-navy/50",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface PolicyCardProps {
  audience: "INTERNSHIP" | "CAREER";
  docType: "TERMS" | "RULES";
  doc?: PolicyDocument;
  onCreateDraft: () => void;
}

function PolicyCard({ audience, docType, doc, onCreateDraft }: PolicyCardProps) {
  const Icon = docType === "TERMS" ? FileText : Shield;
  const label = docType === "TERMS" ? "Terms & Conditions" : "Rules & Regulations";

  return (
    <div className="bg-white rounded-2xl border border-brand-navy/[0.08] p-5 shadow-soft">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-blue/8 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-brand-blue" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-navy text-sm">{label}</h3>
          {doc ? (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
                {doc.status}
              </span>
              <span className="text-xs text-brand-navy/50">v{doc.version}</span>
              {doc.published_at && (
                <span className="text-xs text-brand-navy/40">
                  Published {formatDate(doc.published_at)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-brand-navy/40 mt-1">No published version yet</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {doc ? (
          <>
            <Link
              to={`/admin/policies/edit/${doc.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-blue bg-brand-blue/8 hover:bg-brand-blue/15 transition-colors"
            >
              <Edit3 size={12} /> Edit
            </Link>
            <Link
              to={`/admin/policies/preview/${doc.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-navy/60 bg-brand-surface hover:bg-brand-navy/8 transition-colors"
            >
              <Eye size={12} /> Preview
            </Link>
            <Link
              to={`/admin/policies/history?type=${docType}&audience=${audience}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-navy/60 bg-brand-surface hover:bg-brand-navy/8 transition-colors"
            >
              <History size={12} /> History
            </Link>
          </>
        ) : (
          <button
            onClick={onCreateDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-blue hover:bg-brand-royal transition-colors"
          >
            <Plus size={12} /> Create First Version
          </button>
        )}
        <Link
          to={`/admin/policies/new?type=${docType}&audience=${audience}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 transition-colors"
        >
          <Plus size={12} /> New Draft
        </Link>
      </div>
    </div>
  );
}

interface AudienceSectionProps {
  audience: "INTERNSHIP" | "CAREER";
  policies: PolicyDocument[];
}

function AudienceSection({ audience, policies }: AudienceSectionProps) {
  const getActive = (type: "TERMS" | "RULES") =>
    policies
      .filter((p) => p.audience === audience && p.document_type === type)
      .sort((a, b) => {
        // Prefer PUBLISHED, then DRAFT (latest version)
        if (a.status === "PUBLISHED") return -1;
        if (b.status === "PUBLISHED") return 1;
        return b.version - a.version;
      })[0];

  const terms = getActive("TERMS");
  const rules = getActive("RULES");

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-bold text-brand-navy uppercase tracking-widest">
          {audience === "INTERNSHIP" ? "Internship" : "Career"}
        </h2>
        <ChevronRight size={14} className="text-brand-navy/30" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PolicyCard
          audience={audience}
          docType="TERMS"
          doc={terms}
          onCreateDraft={() => {
            window.location.href = `/admin/policies/new?type=TERMS&audience=${audience}`;
          }}
        />
        <PolicyCard
          audience={audience}
          docType="RULES"
          doc={rules}
          onCreateDraft={() => {
            window.location.href = `/admin/policies/new?type=RULES&audience=${audience}`;
          }}
        />
      </div>
    </div>
  );
}

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    policyApi
      .getAll()
      .then((res) => setPolicies(res.data ?? []))
      .catch(() => setError("Failed to load policies."))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    published: policies.filter((p) => p.status === "PUBLISHED").length,
    drafts: policies.filter((p) => p.status === "DRAFT").length,
    archived: policies.filter((p) => p.status === "ARCHIVED").length,
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Application Policies</h1>
          <p className="text-sm text-brand-navy/50 mt-0.5">
            Manage Terms & Conditions and Rules & Regulations for each application type.
          </p>
        </div>
        <Link
          to="/admin/policies/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors shadow-sm"
        >
          <Plus size={15} /> New Policy Draft
        </Link>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Published", value: stats.published, icon: CheckCircle, color: "text-brand-blue" },
            { label: "Drafts", value: stats.drafts, icon: Clock, color: "text-brand-orange" },
            { label: "Archived", value: stats.archived, icon: Archive, color: "text-brand-navy/40" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-brand-navy/[0.08] p-4 shadow-soft"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={color} />
                <span className="text-xs font-semibold text-brand-navy/50">{label}</span>
              </div>
              <p className="text-2xl font-bold text-brand-navy">{value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-brand-surface animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-6 text-center text-sm text-brand-red">
          {error}
        </div>
      ) : (
        <>
          <AudienceSection audience="INTERNSHIP" policies={policies} />
          <AudienceSection audience="CAREER" policies={policies} />
        </>
      )}
    </div>
  );
}
