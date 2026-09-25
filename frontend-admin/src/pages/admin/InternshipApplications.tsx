import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Search, Filter, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { SectionLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  domain_slug: string;
  status: string;
  created_at: string;
  college?: string;
  mode?: string;
}

const statusColors: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700",
  under_review: "bg-purple-100 text-purple-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-800",
  on_hold: "bg-gray-100 text-gray-600",
};

export default function InternshipApplications() {
  const [apps, setApps] = useState<Application[]>([]);
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
    adminApi.listInternshipApps(params)
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
      await adminApi.deleteInternshipApp(id);
      loadApps();
    } catch (err) {
      alert(normalizeApiError(err).message || "Failed to delete application.");
    }
  };

  const filtered = search
    ? apps.filter((a) => a.full_name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))
    : apps;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Internship Applications</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-white">
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        {loading ? (
          <SectionLoading text="Loading applications..." />
        ) : error ? (
          <div className="p-8"><ErrorState message={error} onRetry={loadApps} variant="admin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="No Applications Found" message={search || statusFilter ? "Try adjusting your filters to find what you're looking for." : "There are no applications available."} variant="admin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Applicant</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Domain</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Mode</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{app.full_name}</p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 capitalize">{app.domain_slug?.replace(/-/g, " ")}</td>
                    <td className="px-5 py-3.5 text-gray-600">{app.mode || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-600"}`}>
                        {app.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/internship-applications/${app.id}`} className="text-xs font-semibold text-brand-blue hover:underline">View</Link>
                        <button onClick={() => handleDelete(app.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete application">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
