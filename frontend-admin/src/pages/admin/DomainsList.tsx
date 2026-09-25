import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useDomains } from "@/contexts/DomainsProvider";
import { Plus, Pencil, Trash2, X, Save, LayoutTemplate } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface DomainRow { id: string; slug: string; name: string; short_name: string; order: number; accent_color: string; tagline?: string; description?: string; }

export default function DomainsList() {
  const { refresh: refreshPublicDomains } = useDomains();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", short_name: "", order: 1, tagline: "", description: "", accent_color: "#0560DF" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => { 
    setLoading(true);
    setError("");
    adminApi.listDomains()
      .then((r) => setDomains(r.data.domains))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load domains"))
      .finally(() => setLoading(false)); 
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editId) {
        await adminApi.updateDomain(editId, form);
      } else {
        await adminApi.createDomain({ ...form, overview_paragraphs: [], what_we_offer: [], technologies: [], applications: [], faqs: [] });
      }
      refreshPublicDomains();
      setShowForm(false); setEditId(null); load();
      setMsg(editId ? "Domain updated" : "Domain created"); setTimeout(() => setMsg(""), 3000);
    } catch (err: any) { 
      const detail = err.response?.data?.detail;
      setMsg(Array.isArray(detail) ? detail[0]?.msg : (detail || "Failed to save")); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;
    await adminApi.deleteDomain(id);
    refreshPublicDomains();
    load();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Domains</h1><p className="text-sm text-gray-500 mt-1">{domains.length} domains</p></div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ slug: "", name: "", short_name: "", order: domains.length + 1, tagline: "", description: "", accent_color: "#0560DF" }); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors">
          <Plus size={14} /> Add Domain
        </button>
      </div>
      {msg && <div className="p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">{msg}</div>}
      {(showForm || editId) && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
          <div className="flex justify-between"><h2 className="text-sm font-semibold text-gray-800">{editId ? "Edit Domain" : "New Domain"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={16} className="text-gray-400" /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Slug (e.g. artificial-intelligence)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!!editId}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50" />
            <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Short name" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm col-span-full" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm col-span-full resize-none" />
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
              <span className="text-xs text-gray-500">{form.accent_color}</span>
            </div>
          </div>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors">
            <Save size={14} /> {editId ? "Save" : "Create"}
          </button>
        </div>
      )}
      {error ? (
        <ErrorState message={error} onRetry={load} variant="admin" />
      ) : domains.length === 0 ? (
        <EmptyState title="No Domains" message="Create your first domain to get started." variant="admin" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Domain</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Slug</th>
            <th className="px-5 py-3"></th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {domains.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-gray-400">{d.order}</td>
                <td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.accent_color }} /><span className="font-medium text-gray-800">{d.short_name || d.name}</span></div></td>
                <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{d.slug}</td>
                <td className="px-5 py-3.5 flex items-center gap-2 justify-end">
                  <Link to={`/admin/domains/${d.id}/edit`}
                    className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                    <LayoutTemplate size={10} /> Edit Content
                  </Link>
                  <button onClick={() => { setEditId(d.id); setForm({ slug: d.slug, name: d.name, short_name: d.short_name, order: d.order, tagline: d.tagline || "", description: d.description || "", accent_color: d.accent_color }); setShowForm(false); }}
                    className="text-xs text-gray-500 hover:underline flex items-center gap-1"><Pencil size={10} /> Meta
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 size={10} /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
