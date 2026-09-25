import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminApi, getResumeUrl } from "@/lib/api";
import { ArrowLeft, Download, Send, User, Mail, Phone, BookOpen, Calendar, MapPin, MessageSquare, ShieldCheck, FileText } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

const statusOptions = ["submitted", "under_review", "shortlisted", "rejected", "accepted", "on_hold"];
const statusColors: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700", under_review: "bg-purple-100 text-purple-700",
  shortlisted: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-800", on_hold: "bg-gray-100 text-gray-600",
};

export default function ApplicationDetail({ type = "internship" }: { type?: "internship" | "career" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [error, setError] = useState("");

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    const fetcher = type === "internship" ? adminApi.getInternshipApp : adminApi.getCareerApp;
    fetcher(id)
      .then((res) => { setApp(res.data); setNewStatus((res.data.status as string) || ""); })
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load application details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id, type]);

  const updateStatus = async () => {
    if (!id || !newStatus) return;
    setSaving(true);
    try {
      const updater = type === "internship" ? adminApi.updateInternshipAppStatus : adminApi.updateCareerAppStatus;
      await updater(id, newStatus);
      setApp((prev) => prev ? { ...prev, status: newStatus } : prev);
      setMsg("Status updated");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) { setMsg(normalizeApiError(err).message || "Failed to update"); }
    finally { setSaving(false); }
  };

  const addRemark = async () => {
    if (!id || !remark.trim()) return;
    setSaving(true);
    try {
      const adder = type === "internship" ? adminApi.addInternshipRemark : adminApi.addCareerRemark;
      await adder(id, remark);
      setRemark("");
      // Reload
      const fetcher = type === "internship" ? adminApi.getInternshipApp : adminApi.getCareerApp;
      const res = await fetcher(id);
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

  const basePath = type === "internship" ? "/admin/internship-applications" : "/admin/career-applications";

  if (loading) return <PageLoading />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={loadData} variant="admin" /></div>;
  if (!app) return <div className="p-8"><EmptyState title="Application Not Found" message="The requested application details could not be found." variant="admin" /></div>;

  const remarks = (app.screening_remarks as Array<{ remark: string; user_name: string; created_at: string }>) || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(basePath)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.full_name as string}</h1>
          <p className="text-sm text-gray-500">
            {type === "internship" ? `Domain: ${(app.domain_slug as string)?.replace(/-/g, " ")}` : `Position: ${app.position as string}`}
          </p>
        </div>
        <span className={`ml-auto text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${statusColors[app.status as string] || "bg-gray-100 text-gray-600"}`}>
          {(app.status as string)?.replace("_", " ")}
        </span>
      </div>

      {msg && <div className="p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Applicant Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={User} label="Full Name" value={app.full_name as string} />
            <InfoRow icon={Mail} label="Email" value={app.email as string} />
            <InfoRow icon={Phone} label="Phone" value={app.phone as string} />
            {type === "internship" && (
              <>
                <InfoRow icon={BookOpen} label="College" value={app.college as string} />
                <InfoRow icon={BookOpen} label="Course / Year" value={app.course_year as string} />
                <InfoRow icon={MapPin} label="Mode" value={app.mode as string} />
              </>
            )}
            {type === "career" && (
              <InfoRow icon={BookOpen} label="Portfolio" value={app.portfolio_url as string} link />
            )}
            <InfoRow icon={Calendar} label="Applied" value={app.created_at ? new Date(app.created_at as string).toLocaleString() : "—"} />
          </div>
          {Boolean(app.message) && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">Message</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{app.message as string}</p>
            </div>
          )}
          {(Boolean(app.resume_url) || Boolean(app.resume_object_key)) && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={async () => {
                  try {
                    const fetcher = type === "internship" ? adminApi.getInternshipResumeUrl : adminApi.getCareerResumeUrl;
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

          {/* Consent Audit Trail */}
          {(() => {
            const termsDocId = app.terms_document_id as string | undefined;
            const rulesDocId = app.rules_document_id as string | undefined;
            const termsVersion = app.terms_version as number | undefined;
            const rulesVersion = app.rules_version as number | undefined;
            const termsAgreedAt = app.terms_agreed_at as string | undefined;
            const rulesAgreedAt = app.rules_agreed_at as string | undefined;
            if (!termsDocId && !rulesDocId) return null;
            return (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-brand-blue" />
                  Policy Consent Record
                </p>
                <div className="space-y-2">
                  {termsDocId && (
                    <div className="flex items-start gap-3 bg-brand-blue/4 rounded-xl p-3 border border-brand-blue/12">
                      <FileText size={14} className="text-brand-blue shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-brand-navy">Terms & Conditions Accepted</p>
                        <p className="text-xs text-brand-navy/50 mt-0.5">
                          Version {termsVersion} &nbsp;·&nbsp;
                          {termsAgreedAt
                            ? new Date(termsAgreedAt).toLocaleString("en-IN")
                            : "Timestamp unavailable"}
                        </p>
                      </div>
                      <Link
                        to={`/admin/policies/preview/${termsDocId}`}
                        className="text-xs text-brand-blue underline shrink-0"
                      >
                        View v{termsVersion}
                      </Link>
                    </div>
                  )}
                  {rulesDocId && (
                    <div className="flex items-start gap-3 bg-brand-blue/4 rounded-xl p-3 border border-brand-blue/12">
                      <ShieldCheck size={14} className="text-brand-blue shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-brand-navy">Rules & Regulations Accepted</p>
                        <p className="text-xs text-brand-navy/50 mt-0.5">
                          Version {rulesVersion} &nbsp;·&nbsp;
                          {rulesAgreedAt
                            ? new Date(rulesAgreedAt).toLocaleString("en-IN")
                            : "Timestamp unavailable"}
                        </p>
                      </div>
                      <Link
                        to={`/admin/policies/preview/${rulesDocId}`}
                        className="text-xs text-brand-blue underline shrink-0"
                      >
                        View v{rulesVersion}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Actions card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Update Status</h2>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-white">
              {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
            </select>
            <button onClick={updateStatus} disabled={saving || newStatus === app.status}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal disabled:opacity-40 transition-colors">
              {saving ? "Updating..." : "Update Status"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Add Screening Remark</h2>
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="Add your assessment..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none" />
            <button onClick={addRemark} disabled={saving || !remark.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors">
              <Send size={13} /> Add Remark
            </button>
          </div>
        </div>
      </div>

      {/* Screening remarks history */}
      {remarks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={14} /> Screening Remarks</h2>
          <div className="space-y-3">
            {remarks.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-600">{r.user_name}</p>
                  <p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-700">{r.remark}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, link }: { icon: React.ComponentType<{ size: number; className?: string }>; label: string; value?: string | null; link?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        {link && value ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-sm text-brand-blue hover:underline">{value}</a>
        ) : (
          <p className="text-sm text-gray-700">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}
