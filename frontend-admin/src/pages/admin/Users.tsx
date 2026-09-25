import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { UserPlus, Shield, ToggleLeft, ToggleRight, Pencil, X, Save } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface UserRow { id: string; name: string; email: string; role: string; is_active: boolean; created_at?: string }

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi.listUsers()
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load users"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    try {
      await adminApi.createUser({ name: form.name, email: form.email, password: form.password, role: "coordinator" });
      setShowForm(false); setForm({ name: "", email: "", password: "" }); load();
      setMsg("Coordinator created"); setTimeout(() => setMsg(""), 3000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setMsg(err.response?.data?.detail || "Failed");
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    const data: Record<string, unknown> = {};
    if (form.name) data.name = form.name;
    if (form.email) data.email = form.email;
    if (form.password) data.password = form.password;
    try {
      await adminApi.updateUser(editId, data);
      setEditId(null); setForm({ name: "", email: "", password: "" }); load();
      setMsg("User updated"); setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(normalizeApiError(err).message || "Failed to update");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await adminApi.toggleUserActive(id, !current);
    load();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-sm text-gray-500 mt-1">Manage coordinator accounts</p></div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", email: "", password: "" }); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors">
          <UserPlus size={14} /> Add Coordinator
        </button>
      </div>

      {msg && <div className="p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">{msg}</div>}

      {/* Create/Edit form */}
      {(showForm || editId) && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">{editId ? "Edit User" : "New Coordinator"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="password" placeholder={editId ? "New password (optional)" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>
          <button onClick={editId ? handleUpdate : handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors">
            <Save size={14} /> {editId ? "Save Changes" : "Create Coordinator"}
          </button>
        </div>
      )}

      {/* Users table */}
      {error ? (
        <ErrorState message={error} onRetry={load} variant="admin" />
      ) : users.length === 0 ? (
        <EmptyState title="No Users Found" message="There are no coordinators registered yet." variant="admin" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      <Shield size={8} className="inline mr-1" />{u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => u.role !== "admin" && toggleActive(u.id, u.is_active)}
                      disabled={u.role === "admin"}
                      className={`flex items-center gap-1 text-xs font-semibold ${u.is_active ? "text-emerald-600" : "text-gray-400"} ${u.role === "admin" ? "cursor-default" : "hover:opacity-80 cursor-pointer"}`}>
                      {u.is_active ? <><ToggleRight size={16} /> Active</> : <><ToggleLeft size={16} /> Inactive</>}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3.5">
                    {u.role !== "admin" && (
                      <button onClick={() => { setEditId(u.id); setForm({ name: u.name, email: u.email, password: "" }); setShowForm(false); }}
                        className="text-xs text-brand-blue hover:underline flex items-center gap-1"><Pencil size={10} /> Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
