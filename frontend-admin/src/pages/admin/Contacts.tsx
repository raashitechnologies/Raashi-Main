import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Mail, Phone, Calendar } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

const statusColors: Record<string, string> = {
  new: "bg-sky-100 text-sky-700", in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700", closed: "bg-gray-100 text-gray-600",
};

const statusOptions = ["new", "in_progress", "resolved", "closed"];

export default function Contacts() {
  const [contacts, setContacts] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { limit: 50 };
    if (statusFilter) params.status_filter = statusFilter;
    adminApi.listContacts(params)
      .then((res) => { setContacts(res.data.contacts); setTotal(res.data.total); })
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load contacts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string) => {
    if (!newStatus) return;
    try {
      await adminApi.updateContactStatus(id, newStatus, note || undefined);
      setSelectedId(null);
      setNote("");
      load();
    } catch (e) {
      alert(normalizeApiError(e).message || "Failed to update status");
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1><p className="text-sm text-gray-500 mt-1">{total} total enquiries</p></div>
      <div className="flex items-center gap-2">
        {["", ...statusOptions].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}{s === "" ? ` (${total})` : ""}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {error ? (
          <ErrorState message={error} onRetry={load} variant="admin" />
        ) : contacts.length === 0 ? (
          <EmptyState title="No Messages" message="There are no contact messages matching this filter." variant="admin" />
        ) : (
          contacts.map((c) => (
            <div key={c.id as string} className="bg-white rounded-xl border border-gray-200/80 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.full_name as string}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Mail size={10} />{c.email as string}</span>
                    {Boolean(c.phone) && <span className="flex items-center gap-1"><Phone size={10} />{c.phone as string}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[c.status as string] || "bg-gray-100 text-gray-600"}`}>
                    {(c.status as string)?.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar size={9} />{new Date(c.created_at as string).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-600 mb-1">{c.subject as string}</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">{c.message as string}</p>

              {selectedId === c.id ? (
                <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                    <option value="">Set status...</option>
                    {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <input type="text" placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  <button onClick={() => updateStatus(c.id as string)} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors">Update</button>
                  <button onClick={() => setSelectedId(null)} className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100">Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setSelectedId(c.id as string); setNewStatus(c.status as string); }}
                  className="text-xs font-semibold text-brand-blue hover:underline mt-1">Update Status</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
