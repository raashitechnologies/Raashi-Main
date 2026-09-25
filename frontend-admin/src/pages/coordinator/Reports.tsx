import { useEffect, useState } from "react";
import { coordinatorApi } from "@/lib/api";
import { BarChart3, TrendingUp } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

export default function CoordReports() {
  const [data, setData] = useState<Record<string, Record<string, number>> | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    coordinatorApi.getReports()
      .then((res) => setData(res.data))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoading />;
  if (error) return <div className="mt-8"><ErrorState message={error} onRetry={load} variant="admin" /></div>;
  if (!data) return <div className="mt-8"><EmptyState title="No Reports" message="Failed to load dashboard stats." variant="admin" /></div>;

  const barColors: Record<string, string> = {
    submitted: "#f59e0b", under_review: "#8b5cf6", shortlisted: "#10b981",
    rejected: "#ef4444", accepted: "#059669", received: "#3b82f6", on_hold: "#6b7280",
  };

  const renderBar = (items: Record<string, number>) => {
    const total = Object.values(items).reduce((a, b) => a + b, 0) || 1;
    return (
      <div className="space-y-3">
        {Object.entries(items).map(([key, val]) => (
          <div key={key}>
            <div className="flex justify-between mb-1"><span className="text-xs font-medium text-gray-600 capitalize">{key.replace("_", " ")}</span><span className="text-xs font-bold text-gray-800">{val}</span></div>
            <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="h-2.5 rounded-full" style={{ width: `${(val / total) * 100}%`, backgroundColor: barColors[key] || "#6b7280" }} /></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-sm text-gray-500 mt-1">Application screening analytics</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={14} /> Internship by Status</h2>
          {data.internship_by_status ? renderBar(data.internship_by_status) : <p className="text-sm text-gray-400">No data</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={14} /> Career by Status</h2>
          {data.career_by_status ? renderBar(data.career_by_status) : <p className="text-sm text-gray-400">No data</p>}
        </div>
      </div>
      {data.internship_by_domain && Object.keys(data.internship_by_domain).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Internships by Domain</h2>
          {renderBar(data.internship_by_domain)}
        </div>
      )}
    </div>
  );
}
