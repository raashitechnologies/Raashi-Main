import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useContentContext } from "@/contexts/ContentProvider";
import { FileText, Pencil, Eye, EyeOff } from "lucide-react";
import { contentMetadata } from "@/data/contentMetadata";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface ContentSection {
  id: string;
  section_key: string;
  title: string;
  is_published: boolean;
  updated_at?: string;
  updated_by?: string;
}

export default function WebsiteContent() {
  const { refresh: refreshPublicContent } = useContentContext();
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadContent = () => {
    setLoading(true);
    setError("");
    adminApi.listContent()
      .then((res) => setSections(res.data.sections || []))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load content sections"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContent(); }, []);

  const togglePublish = async (key: string, current: boolean) => {
    try {
      await adminApi.togglePublish(key, !current);
      refreshPublicContent();
      loadContent();
    } catch (e) {
      alert(normalizeApiError(e).message || "Failed to update publish status");
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Content</h1>
        <p className="text-sm text-gray-500 mt-1">Manage public website content sections. Changes appear on the website immediately.</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadContent} variant="admin" />
      ) : sections.length === 0 ? (
        <EmptyState title="No Content Sections" message="No content sections found. Run the seed script to populate default content." variant="admin" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.filter(s => contentMetadata[s.section_key]).map((s) => (
            <div key={s.section_key} className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-brand-blue" />
                  <h3 className="text-sm font-semibold text-gray-800">{s.title || s.section_key}</h3>
                </div>
                <button
                  onClick={() => togglePublish(s.section_key, s.is_published)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors ${s.is_published ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  {s.is_published ? <><Eye size={10} /> Published</> : <><EyeOff size={10} /> Draft</>}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Key: <code className="bg-gray-50 px-1 py-0.5 rounded text-[10px]">{s.section_key}</code>
                {s.updated_at && <> · Updated {new Date(s.updated_at).toLocaleDateString()}</>}
              </p>
              <Link
                to={`/admin/content/${s.section_key}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-blue bg-brand-blue/5 hover:bg-brand-blue/10 transition-colors"
              >
                <Pencil size={11} /> Edit Content
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
