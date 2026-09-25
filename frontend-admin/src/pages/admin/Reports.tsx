import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { BarChart3, TrendingUp } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

export default function Reports() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi.getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoading />;
  if (error) return <div className="mt-8"><ErrorState message={error} onRetry={load} variant="admin" /></div>;
  if (!stats) return <div className="mt-8"><EmptyState title="No Reports" message="Failed to load dashboard stats." variant="admin" /></div>;

  const totals = stats.totals as Record<string, number>;
  const internStatus = stats.internship_status as Record<string, number>;
  const careerStatus = stats.career_status as Record<string, number>;

  const internTotal = Object.values(internStatus).reduce((a, b) => a + b, 0) || 1;
  const careerTotal = Object.values(careerStatus).reduce((a, b) => a + b, 0) || 1;

  const barColors: Record<string, string> = {
    submitted: "#f59e0b", under_review: "#8b5cf6", shortlisted: "#10b981",
    rejected: "#ef4444", accepted: "#059669", received: "#3b82f6",
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-sm text-gray-500 mt-1">Platform-wide application and engagement analytics</p></div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(totals).map(([key, val]) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200/80 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{val}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{key.replace(/_/g, " ")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Internship breakdown */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={14} /> Internship Application Status</h2>
          <div className="space-y-3">
            {Object.entries(internStatus).map(([key, val]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 capitalize">{key.replace("_", " ")}</span>
                  <span className="text-xs font-bold text-gray-800">{val}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${(val / internTotal) * 100}%`, backgroundColor: barColors[key] || "#6b7280" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career breakdown */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={14} /> Career Application Status</h2>
          <div className="space-y-3">
            {Object.entries(careerStatus).map(([key, val]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 capitalize">{key.replace("_", " ")}</span>
                  <span className="text-xs font-bold text-gray-800">{val}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${(val / careerTotal) * 100}%`, backgroundColor: barColors[key] || "#6b7280" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
