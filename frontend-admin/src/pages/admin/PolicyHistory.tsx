import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, Archive } from "lucide-react";
import { policyApi } from "@/lib/api";
import type { PolicyDocument } from "@/components/shared/PolicyModal";

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusIcon(status: string) {
  if (status === "PUBLISHED") return <CheckCircle size={14} className="text-brand-blue" />;
  if (status === "DRAFT") return <Clock size={14} className="text-brand-orange" />;
  return <Archive size={14} className="text-brand-navy/40" />;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-brand-blue/10 text-brand-blue",
    DRAFT: "bg-brand-orange/10 text-brand-orange",
    ARCHIVED: "bg-brand-navy/10 text-brand-navy/50",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

export default function PolicyHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const docType = searchParams.get("type") as "TERMS" | "RULES" | null;
  const audience = searchParams.get("audience") as "INTERNSHIP" | "CAREER" | null;

  const [history, setHistory] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!docType || !audience) {
      setError("Missing document type or audience query parameters.");
      setLoading(false);
      return;
    }
    policyApi
      .getHistory(docType, audience)
      .then((res) => setHistory(res.data ?? []))
      .catch(() => setError("Failed to load version history."))
      .finally(() => setLoading(false));
  }, [docType, audience]);

  const typeLabel = docType === "TERMS" ? "Terms & Conditions" : "Rules & Regulations";
  const audienceLabel = audience === "INTERNSHIP" ? "Internship" : "Career";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/policies")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-navy/50 hover:text-brand-navy hover:bg-brand-surface transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Version History</h1>
          <p className="text-xs text-brand-navy/50 mt-0.5">
            {audienceLabel} — {typeLabel}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-brand-surface animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-6 text-center text-sm text-brand-red">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-navy/[0.08] p-12 text-center">
          <p className="text-sm text-brand-navy/50">No versions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-brand-navy/[0.08] p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {statusIcon(doc.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-navy text-sm">
                        Version {doc.version}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-navy/50 mt-0.5">{doc.title}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-brand-navy/40 shrink-0">
                  {doc.published_at && (
                    <p>Published: {formatDate(doc.published_at)}</p>
                  )}
                  {doc.created_at && (
                    <p>Created: {formatDate(doc.created_at)}</p>
                  )}
                  {doc.created_by && (
                    <p className="mt-0.5">By: {doc.created_by}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => navigate(`/admin/policies/preview/${doc.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-navy/60 bg-brand-surface hover:bg-brand-navy/8 transition-colors"
                >
                  View
                </button>
                {doc.status === "DRAFT" && (
                  <button
                    onClick={() => navigate(`/admin/policies/edit/${doc.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-blue bg-brand-blue/8 hover:bg-brand-blue/15 transition-colors"
                  >
                    Edit Draft
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
