import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardList, Briefcase, Mail, Globe, Users, GraduationCap,
  TrendingUp, ArrowRight, Upload, FileText, CheckCircle, AlertCircle,
  Inbox,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface DashboardStats {
  totals: {
    internship_applications: number;
    career_applications: number;
    contacts: number;
    domains: number;
    active_jobs: number;
    coordinators: number;
  };
  internship_status: { submitted: number; shortlisted: number; rejected: number };
  career_status: { received: number; shortlisted: number; rejected: number };
  contacts_new: number;
  recent_internship_applications: Array<{ full_name: string; email: string; domain_slug: string; status: string; created_at: string }>;
  recent_career_applications: Array<{ full_name: string; email: string; position: string; status: string; created_at: string }>;
}

interface BrochureStatus {
  available: boolean;
  filename?: string;
  size_bytes?: number;
  uploaded_by?: string;
  uploaded_at?: string;
}

const statusColors: Record<string, string> = {
  submitted: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  received: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  shortlisted: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  under_review: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
  accepted: "bg-green-50 text-green-800 ring-1 ring-green-200/60",
  new: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
};

const MAX_BROCHURE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Brochure state
  const [brochure, setBrochure] = useState<BrochureStatus | null>(null);
  const [brochureLoading, setBrochureLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    adminApi.getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load dashboard stats"))
      .finally(() => setLoading(false));

    // Load brochure status
    adminApi.getBrochureStatus()
      .then((res) => setBrochure(res.data))
      .catch(() => setBrochure({ available: false }));
  };

  useEffect(() => {
    loadData();

    // Load brochure status
    adminApi.getBrochureStatus()
      .then((res) => setBrochure(res.data))
      .catch(() => setBrochure({ available: false }));
  }, []);

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file works
    e.target.value = "";

    // Frontend validation — type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadMsg({ type: "error", text: "Only PDF files are allowed." });
      return;
    }

    // Frontend validation — size
    if (file.size > MAX_BROCHURE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadMsg({ type: "error", text: `File is too large (${sizeMb} MB). Maximum allowed: 50 MB.` });
      return;
    }

    setBrochureLoading(true);
    setUploadMsg(null);

    try {
      const res = await adminApi.uploadBrochure(file);
      setBrochure({
        available: true,
        filename: res.data.filename,
        size_bytes: res.data.size_bytes,
        uploaded_at: res.data.uploaded_at,
      });
      setUploadMsg({ type: "success", text: `Brochure "${res.data.filename}" uploaded successfully.` });
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to upload brochure. Please try again.";
      setUploadMsg({ type: "error", text: detail });
    } finally {
      setBrochureLoading(false);
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <div className="mt-8"><ErrorState message={error} onRetry={loadData} variant="admin" /></div>;
  if (!stats) return <p className="text-gray-500 text-center py-10">Failed to load dashboard.</p>;

  const cards = [
    { label: "Internship Applications", value: stats.totals.internship_applications, icon: ClipboardList, bg: "bg-blue-50", iconColor: "text-blue-600", href: "/admin/internship-applications" },
    { label: "Career Applications", value: stats.totals.career_applications, icon: Briefcase, bg: "bg-indigo-50", iconColor: "text-indigo-600", href: "/admin/career-applications" },
    { label: "Contact Messages", value: stats.totals.contacts, icon: Mail, bg: "bg-amber-50", iconColor: "text-amber-600", href: "/admin/contacts" },
    { label: "Domains", value: stats.totals.domains, icon: Globe, bg: "bg-emerald-50", iconColor: "text-emerald-600", href: "/admin/domains" },
    { label: "Active Jobs", value: stats.totals.active_jobs, icon: GraduationCap, bg: "bg-rose-50", iconColor: "text-rose-600", href: "/admin/jobs" },
    { label: "Coordinators", value: stats.totals.coordinators, icon: Users, bg: "bg-violet-50", iconColor: "text-violet-600", href: "/admin/users" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-[28px] font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your platform activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, bg, iconColor, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link to={href} className="dashboard-card block p-5 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-gray-500">{label}</p>
                  <p className="text-[32px] font-bold text-gray-900 mt-1 leading-tight">{value}</p>
                </div>
                <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={iconColor} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3.5 text-xs font-medium text-gray-400 group-hover:text-brand-blue transition-colors duration-200">
                View all <ArrowRight size={11} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Brochure Management */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-brand-blue/10 w-10 h-10 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-brand-blue" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Brochure Management</h2>
                <p className="text-xs text-gray-400">Upload or replace the company brochure (PDF, max 50 MB)</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={brochureLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white text-sm font-medium rounded-xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {brochureLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {brochure?.available ? "Replace Brochure" : "Upload Brochure"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleBrochureUpload}
              className="hidden"
            />
          </div>

          {/* Current brochure status */}
          {brochure?.available && (
            <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-3 mb-3">
              <FileText size={16} className="text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{brochure.filename}</p>
                <p className="text-xs text-gray-400">
                  {brochure.size_bytes ? `${(brochure.size_bytes / (1024 * 1024)).toFixed(2)} MB` : ""}
                  {brochure.uploaded_at ? ` · Uploaded ${new Date(brochure.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}
                  {brochure.uploaded_by ? ` · by ${brochure.uploaded_by}` : ""}
                </p>
              </div>
            </div>
          )}

          {!brochure?.available && !uploadMsg && (
            <div className="empty-state py-6">
              <div className="empty-state-icon">
                <Upload size={20} className="text-gray-400" />
              </div>
              <p className="empty-state-title">No brochure uploaded</p>
              <p className="empty-state-desc">Upload a PDF to make it available on the public website.</p>
            </div>
          )}

          {/* Upload feedback */}
          {uploadMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              uploadMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {uploadMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {uploadMsg.text}
            </div>
          )}
        </div>
      </motion.div>

      {/* Status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Internship status */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Internship Applications</h2>
            <TrendingUp size={14} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(stats.internship_status).map(([key, val]) => (
              <div key={key} className="text-center p-3.5 rounded-xl bg-gray-50/80">
                <p className="text-[26px] font-bold text-gray-900">{val}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{key.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Career status */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Career Applications</h2>
            <TrendingUp size={14} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(stats.career_status).map(([key, val]) => (
              <div key={key} className="text-center p-3.5 rounded-xl bg-gray-50/80">
                <p className="text-[26px] font-bold text-gray-900">{val}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{key.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New contacts alert */}
      {stats.contacts_new > 0 && (
        <Link to="/admin/contacts" className="block bg-amber-50 border border-amber-200/80 rounded-2xl p-4 hover:bg-amber-100/70 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-800">
              You have <span className="font-bold">{stats.contacts_new}</span> new contact {stats.contacts_new === 1 ? "message" : "messages"} to review
            </p>
            <ArrowRight size={14} className="ml-auto text-amber-600" />
          </div>
        </Link>
      )}

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent internship apps */}
        <div className="dashboard-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Internship Applications</h2>
            <Link to="/admin/internship-applications" className="text-xs font-medium text-brand-blue hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_internship_applications.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon">
                  <Inbox size={20} className="text-gray-400" />
                </div>
                <p className="empty-state-title">No applications yet</p>
                <p className="empty-state-desc">New internship applications will appear here.</p>
              </div>
            ) : (
              stats.recent_internship_applications.map((app, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors duration-150">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.full_name}</p>
                    <p className="text-xs text-gray-400">{app.domain_slug?.replace(/-/g, " ")}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-600"}`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent career apps */}
        <div className="dashboard-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Career Applications</h2>
            <Link to="/admin/career-applications" className="text-xs font-medium text-brand-blue hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_career_applications.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon">
                  <Inbox size={20} className="text-gray-400" />
                </div>
                <p className="empty-state-title">No applications yet</p>
                <p className="empty-state-desc">New career applications will appear here.</p>
              </div>
            ) : (
              stats.recent_career_applications.map((app, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors duration-150">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.full_name}</p>
                    <p className="text-xs text-gray-400">{app.position}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-600"}`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
