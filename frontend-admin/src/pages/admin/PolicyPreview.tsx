import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { policyApi } from "@/lib/api";
import { PolicyModal, type PolicyDocument } from "@/components/shared/PolicyModal";

export default function PolicyPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    policyApi
      .getById(id)
      .then((res) => setDoc(res.data))
      .catch(() => setError("Failed to load policy document."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-navy/50 hover:text-brand-navy hover:bg-brand-surface transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Policy Preview</h1>
          <p className="text-xs text-brand-navy/50 mt-0.5">
            Exact applicant-facing rendering
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-6 text-center text-sm text-brand-red mb-4">
          {error}
        </div>
      )}

      {/* Render the exact same PolicyModal that applicants see, in preview mode */}
      <PolicyModal
        isOpen
        document={doc}
        loading={loading}
        onClose={() => navigate(-1)}
        previewMode
      />
    </div>
  );
}
