import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Briefcase, Mail, ArrowRight } from "lucide-react";
import { coordinatorApi } from "@/lib/api";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

const statusColors: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700", received: "bg-blue-100 text-blue-700",
  shortlisted: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700",
  under_review: "bg-purple-100 text-purple-700",
};

export default function CoordinatorDashboard() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    coordinatorApi.getDashboard()
      .then((res) => setStats(res.data))
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <PageLoading />;
  if (error) return <div className="mt-8"><ErrorState message={error} onRetry={loadData} variant="admin" /></div>;
  if (!stats) return <p className="text-gray-500 text-center py-10">Failed to load</p>;

  const totals = stats.totals as Record<string, number>;
  const cards = [
    { label: "Internship Applications", value: totals.internship_applications, icon: ClipboardList, color: "bg-blue-500", href: "/coordinator/internship-applications" },
    { label: "Career Applications", value: totals.career_applications, icon: Briefcase, color: "bg-purple-500", href: "/coordinator/career-applications" },
    { label: "Contact Messages", value: totals.contacts, icon: Mail, color: "bg-amber-500", href: "/coordinator/contacts" },
  ];

  const recentIntern = (stats.recent_internship_applications as Array<Record<string, string>>) || [];
  const recentCareer = (stats.recent_career_applications as Array<Record<string, string>>) || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1><p className="text-sm text-gray-500 mt-1">Your screening and coordination overview</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, href }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={href} className="block bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="text-3xl font-bold text-gray-900 mt-1">{value}</p></div>
                <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white`}><Icon size={20} /></div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium text-gray-400 group-hover:text-brand-blue transition-colors">View all <ArrowRight size={11} /></div>
            </Link>
          </motion.div>
        ))}
      </div>

      {(stats.contacts_new as number) > 0 && (
        <Link to="/coordinator/contacts" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-amber-600" />
            <p className="text-sm font-medium text-amber-800">{stats.contacts_new as number} new contact messages</p>
            <ArrowRight size={14} className="ml-auto text-amber-600" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Internship Applications</h2>
            <Link to="/coordinator/internship-applications" className="text-xs text-brand-blue hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentIntern.length === 0 ? <p className="text-sm text-gray-400 px-5 py-6 text-center">None yet</p> :
              recentIntern.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div><p className="text-sm font-medium text-gray-800">{a.full_name}</p><p className="text-xs text-gray-400">{a.domain_slug?.replace(/-/g, " ")}</p></div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[a.status] || "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                </div>
              ))
            }
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Career Applications</h2>
            <Link to="/coordinator/career-applications" className="text-xs text-brand-blue hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCareer.length === 0 ? <p className="text-sm text-gray-400 px-5 py-6 text-center">None yet</p> :
              recentCareer.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div><p className="text-sm font-medium text-gray-800">{a.full_name}</p><p className="text-xs text-gray-400">{a.position}</p></div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[a.status] || "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
