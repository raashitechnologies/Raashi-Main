import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Save } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface JobRow { id: string; title: string; department: string; location: string; type: string; is_active: boolean; posted_at?: string }

export default function JobsList() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", department: "", location: "", type: "Full-time", description: "", is_active: true });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi.listJobs()
      .then((r) => setJobs(r.data.jobs))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load jobs"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editId) { await adminApi.updateJob(editId, form); }
      else { await adminApi.createJob(form); }
      setShowForm(false); setEditId(null); load();
      setMsg(editId ? "Job updated" : "Job created"); setTimeout(() => setMsg(""), 3000);
    } catch (err) { setMsg(normalizeApiError(err).message || "Failed to save"); }
  };

  const toggleActive = async (id: string) => {
    await adminApi.deleteJob(id); load();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Job Openings</h1><p className="text-sm text-gray-500 mt-1">{jobs.length} jobs</p></div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", department: "", location: "", type: "Full-time", description: "", is_active: true }); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors"><Plus size={14} /> Add Job</button>
      </div>
      {msg && <div className="p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">{msg}</div>}
      {(showForm || editId) && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
          <div className="flex justify-between"><h2 className="text-sm font-semibold text-gray-800">{editId ? "Edit Job" : "New Job Opening"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={16} className="text-gray-400" /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option>
            </select>
            <textarea placeholder="Job description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm col-span-full resize-none" />
          </div>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors"><Save size={14} /> {editId ? "Save" : "Create"}</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden overflow-x-auto">
        {error ? (
          <ErrorState message={error} onRetry={load} variant="admin" />
        ) : jobs.length === 0 ? (
          <EmptyState title="No Jobs" message="There are no job openings created yet." variant="admin" />
        ) : (
          <table className="w-full text-sm"><thead><tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-5 py-3"></th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5"><p className="font-medium text-gray-800">{j.title}</p><p className="text-xs text-gray-400">{j.location}</p></td>
                <td className="px-5 py-3.5 text-gray-600">{j.department}</td>
                <td className="px-5 py-3.5"><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{j.type}</span></td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${j.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                    {j.is_active ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Closed</>}
                  </span>
                </td>
                <td className="px-5 py-3.5 flex items-center gap-2 justify-end">
                  <button onClick={() => { setEditId(j.id); setForm({ title: j.title, department: j.department, location: j.location, type: j.type, description: "", is_active: j.is_active }); setShowForm(false); }}
                    className="text-xs text-brand-blue hover:underline flex items-center gap-1"><Pencil size={10} /> Edit</button>
                  {j.is_active && <button onClick={() => toggleActive(j.id)} className="text-xs text-red-500 hover:underline">Close</button>}
                </td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
    </div>
  );
}
