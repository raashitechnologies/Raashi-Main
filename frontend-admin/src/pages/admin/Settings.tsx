import { Settings as SettingsIcon, Info } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-1">Platform configuration</p></div>

      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
            <SettingsIcon size={18} className="text-brand-blue" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Platform Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Configure platform behavior, email notifications, and general settings.</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info size={14} className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700">
                Settings management is coming soon. Currently, configuration is managed through environment variables.
                Refer to the <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px]">.env</code> file in the backend directory.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Current Configuration</h2>
        <div className="space-y-2">
          {[
            { label: "JWT Token Expiry", value: "8 hours (480 minutes)" },
            { label: "Rate Limit - Contact Form", value: "5 requests / minute" },
            { label: "Rate Limit - Applications", value: "3 requests / minute" },
            { label: "File Upload Limit", value: "5 MB" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
