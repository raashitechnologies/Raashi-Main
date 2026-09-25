import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Search, Filter, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { SectionLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-700", under_review: "bg-purple-100 text-purple-700",
  shortlisted: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-800", on_hold: "bg-gray-100 text-gray-600",
};

export default function CareerApplications() {
  const [apps, setApps] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const limit = 20;

  const loadApps = () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { skip: page * limit, limit };
    if (statusFilter) params.status_filter = statusFilter;
    adminApi.listCareerApps(params)
      .then((res) => { setApps(res.data.applications); setTotal(res.data.total); })
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load applications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApps();
  }, [page, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application? This cannot be undone.")) return;
    try {
      await adminApi.deleteCareerApp(id);
      loadApps();
    } catch (err) {
      alert(normalizeApiError(err).message || "Failed to delete application.");
    }
  };

  const filtered = search
    ? apps.filter((a) => (a.full_name as string)?.toLowerCase().includes(search.toLowerCase()) || (a.email as string)?.toLowerCase().includes(search.toLowerCase()))
    : apps;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Career Applications</h1><p className="text-sm text-gray-500 mt-1">{total} total applications</p></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
            <option value="">All Status</option>
            <option value="received">Received</option><option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option><option value="accepted">Accepted</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        {loading ? <SectionLoading text="Loading applications..." />
        : error ? <div className="p-8"><ErrorState message={error} onRetry={loadApps} variant="admin" /></div>
        : filtered.length === 0 ? <div className="p-8"><EmptyState title="No Applications Found" message={search || statusFilter ? "Try adjusting your filters." : "There are no applications available."} variant="admin" /></div>
        : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left">
          <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Applicant</th>
          <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Position</th>
          <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
          <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
          <th className="px-5 py-3"></th>
        </tr></thead><tbody className="divide-y divide-gray-50">
          {filtered.map((app) => (
            <tr key={app.id as string} className="hover:bg-gray-50/50">
              <td className="px-5 py-3.5"><p className="font-medium text-gray-800">{app.full_name as string}</p><p className="text-xs text-gray-400">{app.email as string}</p></td>
              <td className="px-5 py-3.5 text-gray-600">{app.position as string}</td>
              <td className="px-5 py-3.5"><span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[app.status as string] || "bg-gray-100 text-gray-600"}`}>{(app.status as string)?.replace("_", " ")}</span></td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(app.created_at as string).toLocaleDateString()}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Link to={`/admin/career-applications/${app.id}`} className="text-xs font-semibold text-brand-blue hover:underline">View</Link>
                  <button onClick={() => handleDelete(app.id as string)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete application">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody></table></div>}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page + 1} of {Math.ceil(total / limit)}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
