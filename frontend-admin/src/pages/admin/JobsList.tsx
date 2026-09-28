import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import {
  Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Save,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Loader2
} from "lucide-react";
import { PageLoading } from "@shared/ui/LoadingStates";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";

// ── Types ────────────────────────────────────────────────────────────────────

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  is_active: boolean;   // always boolean — never 0/1 from the fixed API
  posted_at?: string;
  updated_at?: string;
}

interface JobForm {
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  is_active: boolean;
}

const EMPTY_FORM: JobForm = {
  title: "",
  department: "",
  location: "",
  type: "Full-time",
  experience: "",
  description: "",
  requirements: [],
  responsibilities: [],
  is_active: true,
};

type FormMode = "idle" | "create" | "edit";

// ── Field validation ─────────────────────────────────────────────────────────

function validateForm(form: JobForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.title.trim() || form.title.trim().length < 2) e.title = "Title must be at least 2 characters.";
  if (form.title.trim().length > 200) e.title = "Title too long (max 200 chars).";
  if (!form.department.trim() || form.department.trim().length < 2) e.department = "Department required (min 2 chars).";
  if (!form.location.trim() || form.location.trim().length < 2) e.location = "Location required (min 2 chars).";
  if (!form.type.trim() || form.type.trim().length < 2) e.type = "Employment type required.";
  if (!form.description.trim() || form.description.trim().length < 10) e.description = "Description must be at least 10 characters.";
  if (form.description.trim().length > 5000) e.description = "Description too long (max 5000 chars).";
  return e;
}

// ── Reusable list editor (requirements / responsibilities) ──────────────────

function ListEditor({
  label, items, onChange,
}: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const [newItem, setNewItem] = useState("");

  const add = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setNewItem("");
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const edit = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={item}
              onChange={(e) => edit(i, e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label={`Remove ${label} item`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={`Add ${label.toLowerCase()} item…`}
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  job, onConfirm, onCancel, deleting,
}: { job: JobOpening; onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-base">Delete this job opening?</h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-semibold text-gray-700">{job.title}</span>
            </p>
            <p className="text-xs text-red-600 mt-2">
              This permanently removes the job from the database and cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status-change confirmation ───────────────────────────────────────────────

function StatusModal({
  job, targetActive, onConfirm, onCancel, saving,
}: {
  job: JobOpening; targetActive: boolean;
  onConfirm: () => void; onCancel: () => void; saving: boolean;
}) {
  const action = targetActive ? "Reopen" : "Close";
  const message = targetActive
    ? "This job will become visible again on the public Careers page."
    : "This job will no longer appear on the public Careers page.";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h3 className="font-bold text-gray-900 text-base">{action} "{job.title}"?</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
              targetActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Saving…" : action}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JobsList() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Form state
  const [mode, setMode] = useState<FormMode>("idle");
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Status modal
  const [statusTarget, setStatusTarget] = useState<{ job: JobOpening; active: boolean } | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<JobOpening | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expand/collapse job details in table
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Load list ──────────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setLoading(true);
    setListError("");
    adminApi.listJobs()
      .then((r) => setJobs(r.data.jobs ?? []))
      .catch((err) => setListError(normalizeApiError(err).message || "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Flash success ──────────────────────────────────────────────────────────

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // ── Open form for create ───────────────────────────────────────────────────

  const openCreate = () => {
    setMode("create");
    setEditingJobId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError("");
  };

  // ── Open form for edit — fetch canonical record ───────────────────────────

  const openEdit = async (jobId: string) => {
    setMode("edit");
    setEditingJobId(jobId);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError("");
    setLoadingJob(true);
    try {
      const res = await adminApi.getJob(jobId);
      const j: JobOpening = res.data.job;
      setForm({
        title: j.title ?? "",
        department: j.department ?? "",
        location: j.location ?? "",
        type: j.type ?? "Full-time",
        experience: j.experience ?? "",
        description: j.description ?? "",
        requirements: Array.isArray(j.requirements) ? j.requirements : [],
        responsibilities: Array.isArray(j.responsibilities) ? j.responsibilities : [],
        is_active: j.is_active === true,   // guard: always boolean
      });
    } catch (err) {
      setFormError(normalizeApiError(err).message || "Failed to load job details");
    } finally {
      setLoadingJob(false);
    }
  };

  // ── Close form ─────────────────────────────────────────────────────────────

  const closeForm = () => {
    setMode("idle");
    setEditingJobId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError("");
  };

  // ── Save (create or update) ────────────────────────────────────────────────

  const handleSave = async () => {
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        requirements: form.requirements.filter((r) => r.trim()),
        responsibilities: form.responsibilities.filter((r) => r.trim()),
      };

      if (mode === "edit" && editingJobId) {
        const res = await adminApi.updateJob(editingJobId, payload);
        const updated: JobOpening = res.data.job;
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        flash("Job updated successfully.");
      } else {
        const res = await adminApi.createJob(payload);
        const created: JobOpening = res.data.job;
        setJobs((prev) => [created, ...prev]);
        flash("Job created successfully.");
      }
      closeForm();
    } catch (err) {
      setFormError(normalizeApiError(err).message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  // ── Status change (close / reopen) — via PATCH /status ───────────────────

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;
    setStatusSaving(true);
    try {
      const res = await adminApi.setJobStatus(statusTarget.job.id, statusTarget.active);
      const updated: JobOpening = res.data.job;
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      flash(statusTarget.active ? "Job reopened — now visible on public Careers page." : "Job closed — no longer visible on public Careers page.");
    } catch (err) {
      flash(normalizeApiError(err).message || "Failed to update job status");
    } finally {
      setStatusSaving(false);
      setStatusTarget(null);
    }
  };

  // ── Hard delete ────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteJob(deleteTarget.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      flash(`"${deleteTarget.title}" has been permanently deleted.`);
    } catch (err) {
      flash(normalizeApiError(err).message || "Failed to delete job");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Openings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} total
            {" · "}
            {jobs.filter((j) => j.is_active === true).length} active
          </p>
        </div>
        {mode === "idle" && (
          <button
            id="add-job-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors"
          >
            <Plus size={14} /> Add Job
          </button>
        )}
      </div>

      {/* Flash message */}
      {successMsg && (
        <div className="p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      {/* Job form (create / edit) */}
      {mode !== "idle" && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              {mode === "edit" ? "Edit Job Opening" : "New Job Opening"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close form"
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {loadingJob ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading job details…
            </div>
          ) : (
            <>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="job-title"
                    type="text"
                    placeholder="e.g. IoT Solutions Developer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${fieldErrors.title ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                  />
                  {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="job-department"
                    type="text"
                    placeholder="e.g. Engineering"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${fieldErrors.department ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                  />
                  {fieldErrors.department && <p className="text-xs text-red-500 mt-1">{fieldErrors.department}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="job-location"
                    type="text"
                    placeholder="e.g. Bangalore, India"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${fieldErrors.location ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                  />
                  {fieldErrors.location && <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p>}
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="job-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Experience</label>
                  <input
                    id="job-experience"
                    type="text"
                    placeholder="e.g. 2–4 years"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>

                {/* Status toggle */}
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-700">Status</label>
                  <button
                    type="button"
                    id="job-status-toggle"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      form.is_active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {form.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {form.is_active ? "Active (visible on public Careers page)" : "Closed (hidden from public)"}
                  </button>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="job-description"
                    placeholder="Describe the role, responsibilities, and what makes it great…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm resize-none ${fieldErrors.description ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                  />
                  {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
                </div>

                {/* Requirements */}
                <div className="sm:col-span-2">
                  <ListEditor
                    label="Requirements"
                    items={form.requirements}
                    onChange={(v) => setForm({ ...form, requirements: v })}
                  />
                </div>

                {/* Responsibilities */}
                <div className="sm:col-span-2">
                  <ListEditor
                    label="Responsibilities"
                    items={form.responsibilities}
                    onChange={(v) => setForm({ ...form, responsibilities: v })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="job-save-btn"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Job"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Jobs table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden overflow-x-auto">
        {listError ? (
          <ErrorState message={listError} onRetry={load} variant="admin" />
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No Job Openings"
            message="Create your first job opening using the Add Job button above."
            variant="admin"
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.map((j) => {
                const isExpanded = expandedId === j.id;
                // Guard: is_active is always boolean from the fixed API
                const active = j.is_active === true;
                return (
                  <>
                    <tr key={j.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{j.title}</p>
                        <p className="text-xs text-gray-400">{j.location}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{j.department}</td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {j.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 w-max ${
                            active ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          {active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          {active ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          {/* Expand/collapse */}
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : j.id)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {/* Edit */}
                          <button
                            id={`edit-job-${j.id}`}
                            type="button"
                            onClick={() => openEdit(j.id)}
                            className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                          >
                            <Pencil size={10} /> Edit
                          </button>

                          {/* Close / Reopen */}
                          {active ? (
                            <button
                              id={`close-job-${j.id}`}
                              type="button"
                              onClick={() => setStatusTarget({ job: j, active: false })}
                              className="text-xs text-amber-600 hover:underline"
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              id={`reopen-job-${j.id}`}
                              type="button"
                              onClick={() => setStatusTarget({ job: j, active: true })}
                              className="text-xs text-emerald-600 hover:underline"
                            >
                              Reopen
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            id={`delete-job-${j.id}`}
                            type="button"
                            onClick={() => setDeleteTarget(j)}
                            className="text-xs text-red-500 hover:underline flex items-center gap-1"
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${j.id}-detail`} className="bg-gray-50/70">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                            {j.experience && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500 block mb-0.5">Experience</span>
                                <span>{j.experience}</span>
                              </div>
                            )}
                            {j.description && (
                              <div className="sm:col-span-2">
                                <span className="text-xs font-semibold text-gray-500 block mb-0.5">Description</span>
                                <p className="whitespace-pre-wrap text-xs leading-relaxed">{j.description}</p>
                              </div>
                            )}
                            {Array.isArray(j.requirements) && j.requirements.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500 block mb-1">Requirements</span>
                                <ul className="list-disc list-inside space-y-0.5 text-xs">
                                  {j.requirements.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                            {Array.isArray(j.responsibilities) && j.responsibilities.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500 block mb-1">Responsibilities</span>
                                <ul className="list-disc list-inside space-y-0.5 text-xs">
                                  {j.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Status change modal */}
      {statusTarget && (
        <StatusModal
          job={statusTarget.job}
          targetActive={statusTarget.active}
          onConfirm={handleStatusConfirm}
          onCancel={() => setStatusTarget(null)}
          saving={statusSaving}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          job={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
