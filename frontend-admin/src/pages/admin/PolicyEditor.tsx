import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Send, Eye, ArrowLeft, CheckCircle2, AlertCircle
} from "lucide-react";
import { policyApi } from "@/lib/api";
import { PolicyModal, type PolicyDocument } from "@/components/shared/PolicyModal";

const AUDIENCE_OPTIONS = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CAREER", label: "Career" },
];

const TYPE_OPTIONS = [
  { value: "TERMS", label: "Terms & Conditions" },
  { value: "RULES", label: "Rules & Regulations" },
];

interface PublishDialogProps {
  version: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function PublishDialog({ version, onCancel, onConfirm, loading }: PublishDialogProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={20} className="text-brand-blue" />
          </div>
          <h3 className="text-base font-bold text-brand-navy mb-2">Publish Version {version}?</h3>
          <p className="text-sm text-brand-navy/60 leading-relaxed mb-5">
            Publishing this version will make it the active policy for all new applications.
            Existing applications will continue to reference the version they previously accepted.
            The current published version will be archived.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-navy/70 bg-brand-surface hover:bg-brand-navy/8 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Publish Version
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function PolicyEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  // Determine initial values from query params (new mode) or loaded doc (edit mode)
  const initialType = (searchParams.get("type") as "TERMS" | "RULES") || "TERMS";
  const initialAudience = (searchParams.get("audience") as "INTERNSHIP" | "CAREER") || "INTERNSHIP";

  const [form, setForm] = useState({
    document_type: initialType,
    audience: initialAudience,
    title: "",
    content: "",
    effective_from: "",
  });
  const [existingDoc, setExistingDoc] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isEditMode = Boolean(id);

  // Load existing doc in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      policyApi
        .getById(id)
        .then((res) => {
          const doc: PolicyDocument = res.data;
          setExistingDoc(doc);
          setForm({
            document_type: doc.document_type,
            audience: doc.audience,
            title: doc.title,
            content: doc.content,
            effective_from: doc.effective_from
              ? new Date(doc.effective_from).toISOString().slice(0, 10)
              : "",
          });
        })
        .catch(() => setError("Failed to load policy document."))
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const isDraft = !existingDoc || existingDoc.status === "DRAFT";
  const isPublished = existingDoc?.status === "PUBLISHED";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isEditMode && id) {
        // Only drafts can be edited
        if (!isDraft) {
          setError("Only draft documents can be edited. Create a new draft from this published version.");
          setSaving(false);
          return;
        }
        await policyApi.update(id, {
          title: form.title,
          content: form.content,
          effective_from: form.effective_from || undefined,
        });
        setSuccessMsg("Draft saved successfully.");
      } else {
        // Create new draft
        const res = await policyApi.create({
          document_type: form.document_type,
          audience: form.audience,
          title: form.title,
          content: form.content,
          effective_from: form.effective_from || undefined,
        });
        const newDoc: PolicyDocument = res.data;
        setSuccessMsg("Draft created successfully.");
        // Navigate to edit mode for the new doc
        setTimeout(() => navigate(`/admin/policies/edit/${newDoc.id}`), 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    setError("");
    try {
      await policyApi.publish(id);
      setShowPublishDialog(false);
      setSuccessMsg("Policy published successfully. It is now active for new applications.");
      // Reload the doc
      const res = await policyApi.getById(id);
      setExistingDoc(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to publish policy.");
    } finally {
      setPublishing(false);
    }
  };

  // Build a preview-ready PolicyDocument from the current form state
  const previewDoc: PolicyDocument | null = form.title && form.content
    ? {
        id: existingDoc?.id || "preview",
        document_type: form.document_type,
        audience: form.audience,
        version: existingDoc?.version ?? 1,
        title: form.title,
        content: form.content,
        status: existingDoc?.status || "DRAFT",
        effective_from: form.effective_from || null,
        published_at: existingDoc?.published_at || null,
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/policies")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-navy/50 hover:text-brand-navy hover:bg-brand-surface transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">
            {isEditMode ? "Edit Policy Draft" : "New Policy Draft"}
          </h1>
          {existingDoc && (
            <p className="text-xs text-brand-navy/50 mt-0.5">
              Version {existingDoc.version} — {existingDoc.status}
              {existingDoc.status === "PUBLISHED" && (
                <span className="ml-2 text-brand-orange font-semibold">
                  (Read-only — create a new draft to edit)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-brand-blue/8 border border-brand-blue/20 text-sm text-brand-blue mb-4"
        >
          <CheckCircle2 size={15} />
          {successMsg}
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-brand-red/8 border border-brand-red/20 text-sm text-brand-red mb-4"
        >
          <AlertCircle size={15} />
          {error}
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-brand-navy/[0.08] shadow-soft p-6 space-y-5">
        {/* Audience + Type selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-navy/60 mb-1.5">Audience</label>
            <select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value as "INTERNSHIP" | "CAREER" })}
              disabled={isEditMode}
              className="w-full px-3 py-2 rounded-xl border border-brand-navy/15 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-navy/60 mb-1.5">Document Type</label>
            <select
              value={form.document_type}
              onChange={(e) => setForm({ ...form, document_type: e.target.value as "TERMS" | "RULES" })}
              disabled={isEditMode}
              className="w-full px-3 py-2 rounded-xl border border-brand-navy/15 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy/60 mb-1.5">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={isPublished}
            placeholder="e.g. Terms & Conditions for Internship Applications"
            className="w-full px-3 py-2 rounded-xl border border-brand-navy/15 text-sm text-brand-navy placeholder-brand-navy/30 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Effective From */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy/60 mb-1.5">
            Effective From <span className="text-brand-navy/30 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={form.effective_from}
            onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
            disabled={isPublished}
            className="w-full px-3 py-2 rounded-xl border border-brand-navy/15 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Content editor */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy/60 mb-1.5">
            Content <span className="text-brand-navy/30 font-normal">(Markdown supported: # Heading, ## Subheading, - list, **bold**)</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            disabled={isPublished}
            rows={18}
            placeholder={"# Section 1\n\nEnter your policy content here...\n\n## Subsection\n\n- Rule one\n- Rule two\n\n**Important:** Add any critical notes here."}
            className="w-full px-3 py-2 rounded-xl border border-brand-navy/15 text-sm text-brand-navy placeholder-brand-navy/30 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-y font-mono leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!previewDoc}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-brand-navy/70 bg-brand-surface hover:bg-brand-navy/8 transition-colors disabled:opacity-40"
          >
            <Eye size={14} /> Preview
          </button>

          {!isPublished && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.title || !form.content}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 transition-colors disabled:opacity-40"
            >
              {saving ? (
                <span className="w-3 h-3 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Draft
            </button>
          )}

          {isDraft && isEditMode && (
            <button
              type="button"
              onClick={() => setShowPublishDialog(true)}
              disabled={!form.title || !form.content}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors shadow-sm disabled:opacity-40"
            >
              <Send size={14} /> Publish
            </button>
          )}
        </div>
      </div>

      {/* Publish confirmation dialog */}
      {showPublishDialog && (
        <PublishDialog
          version={(existingDoc?.version ?? 0) + 1}
          onCancel={() => setShowPublishDialog(false)}
          onConfirm={handlePublish}
          loading={publishing}
        />
      )}

      {/* Preview modal */}
      <PolicyModal
        isOpen={showPreview}
        document={previewDoc}
        onClose={() => setShowPreview(false)}
        previewMode
      />
    </div>
  );
}
