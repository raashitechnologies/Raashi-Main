import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Plus, Pencil, X, Save } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface ListingRow { id: string; title: string; domain_slug: string; duration?: string; mode: string; positions: number; is_active: boolean }

export default function InternshipsList() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ domain_slug: "", title: "", description: "", eligibility: "", duration: "", mode: "Online", positions: 10, is_active: true });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi.listInternships()
      .then((r) => setListings(r.data.listings))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load internships"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editId) { await adminApi.updateInternship(editId, form); }
      else { await adminApi.createInternship(form); }
      setShowForm(false); setEditId(null); load();
      setMsg(editId ? "Updated" : "Created"); setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(normalizeApiError(err).message || "Failed to save");
    }
  };

  const toggleActive = async (id: string) => { await adminApi.deleteInternship(id); load(); };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Internship Listings</h1><p className="text-sm text-gray-500 mt-1">{listings.length} listings</p></div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ domain_slug: "", title: "", description: "", eligibility: "", duration: "", mode: "Online", positions: 10, is_active: true }); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors"><Plus size={14} /> Add Listing</button>
      </div>
      {msg && (
        <div className={`p-3 rounded-xl text-sm border ${msg.startsWith("Failed") || msg.startsWith("Validation") ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          {msg}
        </div>
      )}
      {(showForm || editId) && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
          <div className="flex justify-between"><h2 className="text-sm font-semibold text-gray-800">{editId ? "Edit Listing" : "New Internship"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={16} className="text-gray-400" /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Domain slug" value={form.domain_slug} onChange={(e) => setForm({ ...form, domain_slug: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Duration (e.g. 3 months)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option>Online</option><option>Offline</option><option>Hybrid</option>
            </select>
            <input type="number" placeholder="Positions" value={form.positions} onChange={(e) => setForm({ ...form, positions: +e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm col-span-full resize-none" />
          </div>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors"><Save size={14} /> {editId ? "Save" : "Create"}</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden overflow-x-auto">
        {error ? (
          <ErrorState message={error} onRetry={load} variant="admin" />
        ) : listings.length === 0 ? (
          <EmptyState title="No Internships" message="There are no internship listings created yet." variant="admin" />
        ) : (
          <table className="w-full text-sm"><thead><tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Domain</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mode</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Positions</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-5 py-3"></th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5 font-medium text-gray-800">{l.title}</td>
                <td className="px-5 py-3.5 text-gray-500 capitalize">{l.domain_slug?.replace(/-/g, " ")}</td>
                <td className="px-5 py-3.5 text-gray-600">{l.mode}</td>
                <td className="px-5 py-3.5 text-gray-600">{l.positions}</td>
                <td className="px-5 py-3.5"><span className={`text-xs font-semibold ${l.is_active ? "text-emerald-600" : "text-gray-400"}`}>{l.is_active ? "Active" : "Closed"}</span></td>
                <td className="px-5 py-3.5 flex items-center gap-2 justify-end">
                  <button onClick={() => { setEditId(l.id); setForm({ ...form, title: l.title, domain_slug: l.domain_slug, mode: l.mode, positions: l.positions }); }}
                    className="text-xs text-brand-blue hover:underline"><Pencil size={10} /></button>
                  {l.is_active && <button onClick={() => toggleActive(l.id)} className="text-xs text-red-500 hover:underline">Close</button>}
                </td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
    </div>
  );
}
