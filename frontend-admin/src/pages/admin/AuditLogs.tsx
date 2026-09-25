import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { BookOpen, Calendar } from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

interface LogEntry { id: string; user_email: string; action: string; resource: string; resource_id?: string; details?: string; timestamp: string }

const actionColors: Record<string, string> = {
  create: "text-emerald-600", update: "text-blue-600", delete: "text-red-600",
  deactivate: "text-amber-600", activated: "text-green-600", deactivated: "text-gray-500",
  published: "text-emerald-600", unpublished: "text-gray-500", add_remark: "text-purple-600",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi.listAuditLogs({ limit: 100 })
      .then((res) => { setLogs(res.data.logs); setTotal(res.data.total); })
      .catch((err) => setError(normalizeApiError(err).message || "Failed to load audit logs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1><p className="text-sm text-gray-500 mt-1">{total} system events recorded</p></div>

      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={load} variant="admin" />
        ) : logs.length === 0 ? (
          <EmptyState title="No Audit Logs" message="No system events recorded yet." variant="admin" />
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const actionBase = log.action.startsWith("status_") ? "status_update" : log.action;
              const colorClass = actionColors[actionBase] || "text-gray-600";
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen size={13} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-800">{log.user_email}</span>
                      {" "}<span className={`font-semibold ${colorClass}`}>{log.action.replace(/_/g, " ")}</span>
                      {" on "}<span className="font-medium">{log.resource.replace(/_/g, " ")}</span>
                      {log.resource_id && <span className="text-gray-400"> ({log.resource_id.slice(0, 8)}…)</span>}
                    </p>
                    {log.details && <p className="text-xs text-gray-400 mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                    <Calendar size={9} />{new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
