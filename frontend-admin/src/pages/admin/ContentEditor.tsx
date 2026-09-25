import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useContentContext } from "@/contexts/ContentProvider";
import { Save, ArrowLeft, Loader } from "lucide-react";
import DynamicContentForm from "@/components/shared/DynamicContentForm";
import { contentMetadata } from "@/data/contentMetadata";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

export default function ContentEditor() {
  const { sectionKey } = useParams<{ sectionKey: string }>();
  const navigate = useNavigate();
  const { refresh: refreshPublicContent } = useContentContext();
  const [title, setTitle] = useState("");
  const [contentData, setContentData] = useState<Record<string, unknown>>({});
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadContent = () => {
    if (!sectionKey) return;
    setLoading(true);
    setError("");
    adminApi.getContent(sectionKey)
      .then((res) => {
        const data = res.data;
        setTitle(data.title || "");
        setContentData(data.content || {});
        setIsPublished(data.is_published ?? true);
      })
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load content"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContent();
  }, [sectionKey]);

  const handleSave = async () => {
    if (!sectionKey) return;
    setSaving(true);
    setMessage("");
    try {
      await adminApi.updateContent(sectionKey, {
        title,
        content: contentData,
        is_published: isPublished,
      });
      refreshPublicContent();
      setMessage("Content saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(normalizeApiError(err).message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={loadContent} variant="admin" /></div>;

  const meta = sectionKey ? contentMetadata[sectionKey] : undefined;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/content")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit: {title || sectionKey}</h1>
          <p className="text-sm text-gray-500">Section key: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{sectionKey}</code></p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("success") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message}
        </div>
      )}


      <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Content Fields</h2>
          <DynamicContentForm value={contentData} onChange={setContentData} meta={meta} />
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
            />
            <span className="text-sm font-medium text-gray-700">Published</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={() => navigate("/admin/content")} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
