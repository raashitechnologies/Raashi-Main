import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coordinatorApi, getResumeUrl } from "@/lib/api";
import { ArrowLeft, Download, Send, User, Mail, Phone, BookOpen, Calendar, MapPin, MessageSquare } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

const statusOptions = ["submitted", "under_review", "shortlisted", "rejected", "accepted", "on_hold"];
const statusColors: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700", under_review: "bg-purple-100 text-purple-700",
  shortlisted: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-800", on_hold: "bg-gray-100 text-gray-600",
  received: "bg-blue-100 text-blue-700",
};

export default function CoordApplicationDetail({ type = "internship" }: { type?: "internship" | "career" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const api = type === "internship"
    ? { get: coordinatorApi.getInternshipApp, updateStatus: coordinatorApi.updateInternshipAppStatus, addRemark: coordinatorApi.addInternshipRemark }
    : { get: coordinatorApi.getCareerApp, updateStatus: coordinatorApi.updateCareerAppStatus, addRemark: coordinatorApi.addCareerRemark };

  const [error, setError] = useState("");

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    api.get(id)
      .then((res) => { setApp(res.data); setNewStatus(res.data.status || ""); })
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load application details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id, type]);

  const updateStatus = async () => {
    if (!id || !newStatus) return;
    setSaving(true);
    try { await api.updateStatus(id, newStatus); setApp((p) => p ? { ...p, status: newStatus } : p); setMsg("Updated"); setTimeout(() => setMsg(""), 2000); }
    catch (err) { setMsg(normalizeApiError(err).message || "Failed"); } finally { setSaving(false); }
  };

  const addRemarkFn = async () => {
    if (!id || !remark.trim()) return;
    setSaving(true);
    try { 
      await api.addRemark(id, remark); 
      setRemark(""); 
      const res = await api.get(id); 
      setApp(res.data); 
      setMsg("Remark added"); 
      setTimeout(() => setMsg(""), 2000); 
    } catch (err: any) { 
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setMsg(detail[0].msg || "Failed to add remark");
      } else {
        setMsg(detail || "Failed to add remark");
      }
    } finally { setSaving(false); }
  };

  const basePath = type === "internship" ? "/coordinator/internship-applications" : "/coordinator/career-applications";
  if (loading) return <PageLoading />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={loadData} variant="admin" /></div>;
  if (!app) return <div className="p-8"><EmptyState title="Application Not Found" message="The requested application details could not be found." variant="admin" /></div>;

  const remarks = (app.screening_remarks as Array<{ remark: string; user_name: string; created_at: string }>) || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(basePath)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.full_name as string}</h1>
          <p className="text-sm text-gray-500">{type === "internship" ? `Domain: ${(app.domain_slug as string)?.replace(/-/g, " ")}` : `Position: ${app.position}`}</p>
        </div>
        <span className={`ml-auto text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${statusColors[app.status as string] || "bg-gray-100 text-gray-600"}`}>{(app.status as string)?.replace("_", " ")}</span>
      </div>

      {msg && <div className="p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Applicant Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info icon={User} label="Name" value={app.full_name as string} />
            <Info icon={Mail} label="Email" value={app.email as string} />
            <Info icon={Phone} label="Phone" value={app.phone as string} />
            {type === "internship" && <><Info icon={BookOpen} label="College" value={app.college as string} /><Info icon={MapPin} label="Mode" value={app.mode as string} /></>}
            {type === "career" && Boolean(app.portfolio_url) && <Info icon={BookOpen} label="Portfolio" value={app.portfolio_url as string} />}
            <Info icon={Calendar} label="Applied" value={app.created_at ? new Date(app.created_at as string).toLocaleString() : "—"} />
          </div>
          {Boolean(app.message) && <div className="pt-3 border-t border-gray-100"><p className="text-xs font-semibold text-gray-500 mb-1">Message</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{app.message as string}</p></div>}
          {(Boolean(app.resume_url) || Boolean(app.resume_object_key)) && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={async () => {
                  try {
                    const fetcher = type === "internship" ? coordinatorApi.getInternshipResumeUrl : coordinatorApi.getCareerResumeUrl;
                    const res = await fetcher(id as string);
                    if (res.data.legacy) {
                      window.open(getResumeUrl(res.data.url), "_blank");
                    } else {
                      window.location.href = res.data.url;
                    }
                  } catch (err: any) {
                    setMsg(normalizeApiError(err).message || "Failed to download resume");
                    setTimeout(() => setMsg(""), 3000);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-brand-blue bg-brand-blue/5 hover:bg-brand-blue/10 transition-colors">
                <Download size={14} /> Download Resume
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Update Status</h2>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
            </select>
            <button onClick={updateStatus} disabled={saving || newStatus === app.status}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal disabled:opacity-40 transition-colors">{saving ? "Updating..." : "Update"}</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Screening Remark</h2>
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="Your assessment..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
            <button onClick={addRemarkFn} disabled={saving || !remark.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"><Send size={13} /> Add Remark</button>
          </div>
        </div>
      </div>

      {remarks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={14} /> Screening Remarks</h2>
          <div className="space-y-3">
            {remarks.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1"><p className="text-xs font-semibold text-gray-600">{r.user_name}</p><p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleString()}</p></div>
                <p className="text-sm text-gray-700">{r.remark}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ size: number; className?: string }>; label: string; value?: string | null }) {
  return <div className="flex items-start gap-2"><Icon size={14} className="text-gray-400 mt-0.5 shrink-0" /><div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p><p className="text-sm text-gray-700">{value || "—"}</p></div></div>;
}
