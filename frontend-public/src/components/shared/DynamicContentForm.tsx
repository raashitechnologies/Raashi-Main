import { useState, useCallback, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Type,
  Hash,
  Link,
  Mail,
  AlignLeft,
  ToggleLeft,
  List,
  Layers,
  MapPin,
} from "lucide-react";
import type { SectionMeta } from "@/data/contentMetadata";

// ═══════════════════════════════════════════════════════════════════════════════
//  LABEL GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Abbreviations that should stay uppercase */
const UPPERCASE_WORDS = new Set([
  "cta", "url", "faq", "faqs", "iot", "ai", "ip", "id", "api", "html", "css",
  "seo", "ipr", "pdf", "ui", "ux",
]);

/** Convert a JSON key like "hero_heading" or "ctaPrimaryLink" into "Hero Heading" */
function keyToLabel(key: string): string {
  // Split on underscores, hyphens, or camelCase boundaries
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/);

  return words
    .map((w) => {
      const lower = w.toLowerCase();
      if (UPPERCASE_WORDS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/** Singularize a simple English plural for array item labels (features → Feature, items → Item) */
function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes"))
    return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FIELD TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "url"
  | "email"
  | "array-primitive"
  | "array-object"
  | "object";

function detectFieldType(key: string, value: unknown): FieldType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";

  if (Array.isArray(value)) {
    if (value.length === 0) {
      // Guess from key name — if key suggests objects, use object array
      const k = key.toLowerCase();
      if (
        k.includes("feature") ||
        k.includes("item") ||
        k.includes("card") ||
        k.includes("stat") ||
        k.includes("faq") ||
        k.includes("testimonial") ||
        k.includes("team") ||
        k.includes("service") ||
        k.includes("announcement")
      )
        return "array-object";
      return "array-primitive";
    }
    return typeof value[0] === "object" && value[0] !== null
      ? "array-object"
      : "array-primitive";
  }

  if (typeof value === "object" && value !== null) return "object";

  // String analysis
  if (typeof value === "string") {
    const k = key.toLowerCase();
    // URL detection
    if (
      k.includes("link") ||
      k.includes("url") ||
      k.includes("href") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/")
    )
      return "url";
    // Email detection
    if (k.includes("email") || value.includes("@")) return "email";
    // Long text → textarea
    if (value.length >= 80 || value.includes("\n")) return "textarea";
    return "text";
  }

  return "text";
}

/** Get an icon for a field type */
function fieldIcon(type: FieldType) {
  switch (type) {
    case "text":
      return <Type size={13} className="text-gray-400" />;
    case "textarea":
      return <AlignLeft size={13} className="text-gray-400" />;
    case "number":
      return <Hash size={13} className="text-gray-400" />;
    case "url":
      return <Link size={13} className="text-gray-400" />;
    case "email":
      return <Mail size={13} className="text-gray-400" />;
    case "boolean":
      return <ToggleLeft size={13} className="text-gray-400" />;
    case "array-primitive":
    case "array-object":
      return <List size={13} className="text-gray-400" />;
    case "object":
      return <Layers size={13} className="text-gray-400" />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DEEP IMMUTABLE UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

type Path = (string | number)[];

/** Set a value at a deep path in an object, returning a new reference */
function setDeep(obj: Record<string, unknown>, path: Path, value: unknown): Record<string, unknown> {
  if (path.length === 0) return value as Record<string, unknown>;

  const [head, ...tail] = path;
  const current = obj[head as string];

  if (typeof head === "number") {
    // We're inside an array context, handled by parent
    const arr = [...(obj as unknown as unknown[])];
    arr[head] =
      tail.length === 0
        ? value
        : setDeep(
            (current ?? {}) as Record<string, unknown>,
            tail,
            value
          );
    return arr as unknown as Record<string, unknown>;
  }

  return {
    ...obj,
    [head]: Array.isArray(current)
      ? (() => {
          if (tail.length === 0) return value;
          const idx = tail[0] as number;
          const rest = tail.slice(1);
          const arr = [...current];
          arr[idx] =
            rest.length === 0
              ? value
              : setDeep(
                  (arr[idx] ?? {}) as Record<string, unknown>,
                  rest,
                  value
                );
          return arr;
        })()
      : tail.length === 0
      ? value
      : setDeep(
          (current ?? {}) as Record<string, unknown>,
          tail,
          value
        ),
  };
}

/** Remove an item from an array at a deep path */
function removeAtPath(obj: Record<string, unknown>, path: Path, index: number): Record<string, unknown> {
  const arrPath = path;
  const current = getDeep(obj, arrPath);
  if (!Array.isArray(current)) return obj;
  const newArr = current.filter((_, i) => i !== index);
  return setDeep(obj, arrPath, newArr);
}

/** Get a value at a deep path */
function getDeep(obj: Record<string, unknown>, path: Path): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[key as string];
  }
  return current;
}

/** Swap two items in an array at a deep path */
function swapAtPath(obj: Record<string, unknown>, path: Path, i: number, j: number): Record<string, unknown> {
  const current = getDeep(obj, path);
  if (!Array.isArray(current) || i < 0 || j < 0 || i >= current.length || j >= current.length) return obj;
  const arr = [...current];
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return setDeep(obj, path, arr);
}

/** Create an empty item matching the shape of an existing array item */
function createEmptyItem(sample: unknown): unknown {
  if (sample === null || sample === undefined) return "";
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  if (typeof sample === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sample as Record<string, unknown>)) {
      result[k] = createEmptyItem(v);
    }
    return result;
  }
  return "";
}

/** Create a default object item from key name heuristics */
function createDefaultObjectItem(key: string): Record<string, unknown> {
  const k = key.toLowerCase();
  if (k.includes("faq")) return { question: "", answer: "" };
  if (k.includes("feature")) return { label: "", desc: "" };
  if (k.includes("stat")) return { label: "", value: "" };
  if (k.includes("testimonial")) return { name: "", quote: "", role: "" };
  if (k.includes("team")) return { name: "", role: "", bio: "" };
  if (k.includes("card")) return { title: "", description: "" };
  if (k.includes("announcement") || k.includes("item"))
    return { title: "", description: "" };
  return { title: "", description: "" };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COLLAPSIBLE SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
  headerClassName = "",
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
  headerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-white/60 bg-white/55 backdrop-blur-xl backdrop-saturate-[160%] shadow-glass overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/40 transition-colors ${headerClassName}`}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4">{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TOGGLE SWITCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? "bg-brand-blue" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTO-RESIZE TEXTAREA
// ═══════════════════════════════════════════════════════════════════════════════

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, 72) + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 text-sm text-gray-700 bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue resize-y transition-colors ${className ?? ""}`}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT: DynamicContentForm
// ═══════════════════════════════════════════════════════════════════════════════

interface DynamicContentFormProps {
  value: Record<string, unknown>;
  onChange: (updated: Record<string, unknown>) => void;
  meta?: SectionMeta;
}

export default function DynamicContentForm({
  value,
  onChange,
  meta,
}: DynamicContentFormProps) {
  const update = useCallback(
    (path: Path, val: unknown) => {
      onChange(setDeep(value, path, val));
    },
    [value, onChange]
  );

  const remove = useCallback(
    (path: Path, index: number) => {
      onChange(removeAtPath(value, path, index));
    },
    [value, onChange]
  );

  const swap = useCallback(
    (path: Path, i: number, j: number) => {
      onChange(swapAtPath(value, path, i, j));
    },
    [value, onChange]
  );

  const addItem = useCallback(
    (path: Path, sample: unknown, key: string) => {
      const arr = getDeep(value, path) as unknown[];
      const newItem = sample != null ? createEmptyItem(sample) : createDefaultObjectItem(key);
      onChange(setDeep(value, path, [...(arr || []), newItem]));
    },
    [value, onChange]
  );

  return (
    <div className="space-y-5">
      {Object.entries(value).map(([key, val]) => (
        <FieldRenderer
          key={key}
          fieldKey={key}
          value={val}
          path={[key]}
          update={update}
          remove={remove}
          swap={swap}
          addItem={addItem}
          isTopLevel
          meta={meta}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FIELD RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

interface FieldRendererProps {
  fieldKey: string;
  value: unknown;
  path: Path;
  update: (path: Path, val: unknown) => void;
  remove: (path: Path, index: number) => void;
  swap: (path: Path, i: number, j: number) => void;
  addItem: (path: Path, sample: unknown, key: string) => void;
  isTopLevel?: boolean;
  meta?: SectionMeta;
}

function FieldRenderer({
  fieldKey,
  value,
  path,
  update,
  remove,
  swap,
  addItem,
  isTopLevel,
  meta,
}: FieldRendererProps) {
  // Convert path array to string matching our metadata schema format (e.g. "features.*.label" or "features")
  const pathString = path
    .filter((p) => typeof p === "string")
    .join(".");
  
  const fieldMeta = meta?.fields?.[pathString];
  const label = fieldMeta?.label || keyToLabel(fieldKey);
  const type = detectFieldType(fieldKey, value);
  const icon = fieldIcon(type);

  // Helper to render the location context badge
  const renderLocationContext = () => {
    if (!fieldMeta?.location || !meta) return null;
    return (
      <div className="flex items-start gap-1 mt-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit border border-gray-100">
        <MapPin size={11} className="mt-0.5 text-brand-blue shrink-0" />
        <span>
          Appears on: <strong className="font-medium text-gray-700">{meta.pageName}</strong> →{" "}
          {meta.sectionName} → {fieldMeta.location}
        </span>
      </div>
    );
  };

  // ── BOOLEAN ───────────────────────────────────────────────────────────────
  if (type === "boolean") {
    return (
      <div className={isTopLevel ? "" : ""}>
        <ToggleSwitch
          checked={value as boolean}
          onChange={(v) => update(path, v)}
          label={label}
        />
        {renderLocationContext()}
      </div>
    );
  }

  // ── NUMBER ────────────────────────────────────────────────────────────────
  if (type === "number") {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          {icon} {label}
        </label>
        <input
          type="number"
          value={value as number}
          onChange={(e) => update(path, Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 text-sm text-gray-700 bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
        />
        {renderLocationContext()}
      </div>
    );
  }

  // ── URL ────────────────────────────────────────────────────────────────────
  if (type === "url") {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          {icon} {label}
        </label>
        <input
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          placeholder="https://... or /path"
          className="w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 text-sm text-gray-700 bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors font-mono text-xs"
        />
        {renderLocationContext()}
      </div>
    );
  }

  // ── EMAIL ─────────────────────────────────────────────────────────────────
  if (type === "email") {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          {icon} {label}
        </label>
        <input
          type="email"
          value={(value as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          placeholder="email@example.com"
          className="w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 text-sm text-gray-700 bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
        />
        {renderLocationContext()}
      </div>
    );
  }

  // ── TEXTAREA ──────────────────────────────────────────────────────────────
  if (type === "textarea") {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          {icon} {label}
        </label>
        <AutoTextarea
          value={(value as string) ?? ""}
          onChange={(v) => update(path, v)}
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
        {renderLocationContext()}
      </div>
    );
  }

  // ── TEXT ───────────────────────────────────────────────────────────────────
  if (type === "text") {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          {icon} {label}
        </label>
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}…`}
          className="w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 text-sm text-gray-700 bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
        />
        {renderLocationContext()}
      </div>
    );
  }

  // ── ARRAY OF PRIMITIVES ───────────────────────────────────────────────────
  if (type === "array-primitive") {
    const arr = (value as string[]) || [];
    const singularLabel = singularize(label);

    return (
      <CollapsibleSection
        title={label}
        icon={icon}
        badge={
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {arr.length} {arr.length === 1 ? "item" : "items"}
          </span>
        }
      >
        {renderLocationContext()}
        <div className="space-y-2.5">
          {arr.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => update([...path, idx], e.target.value)}
                placeholder={`${singularLabel} ${idx + 1}`}
                className="flex-1 px-3 py-2 rounded-xl border border-brand-navy/10 text-sm text-gray-700 bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
              />
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => swap(path, idx, idx - 1)}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                )}
                {idx < arr.length - 1 && (
                  <button
                    type="button"
                    onClick={() => swap(path, idx, idx + 1)}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(path, idx)}
                  className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addItem(path, "", fieldKey)}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-blue bg-brand-blue/5 hover:bg-brand-blue/10 transition-colors"
        >
          <Plus size={13} />
          Add {singularLabel}
        </button>
      </CollapsibleSection>
    );
  }

  // ── ARRAY OF OBJECTS ──────────────────────────────────────────────────────
  if (type === "array-object") {
    const arr = (value as Record<string, unknown>[]) || [];
    const singularLabel = singularize(label);

    return (
      <CollapsibleSection
        title={label}
        icon={icon}
        badge={
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {arr.length} {arr.length === 1 ? "item" : "items"}
          </span>
        }
      >
        {renderLocationContext()}
        <div className="space-y-3">
          {arr.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/60 bg-white/40 overflow-hidden group/card shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/50 border-b border-white/60">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-300" />
                  <span className="text-xs font-semibold text-gray-600">
                    {singularLabel} {idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => swap(path, idx, idx - 1)}
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-400 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                  )}
                  {idx < arr.length - 1 && (
                    <button
                      type="button"
                      onClick={() => swap(path, idx, idx + 1)}
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-400 transition-colors"
                      title="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(path, idx)}
                    className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title={`Remove ${singularLabel} ${idx + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {/* Card body */}
              <div className="px-4 py-3 space-y-3">
                {Object.entries(item).map(([k, v]) => (
                  <FieldRenderer
                    key={k}
                    fieldKey={k}
                    value={v}
                    path={[...path, idx, k]}
                    update={update}
                    remove={remove}
                    swap={swap}
                    addItem={addItem}
                    meta={meta}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addItem(path, arr[0] ?? null, fieldKey)}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-blue bg-brand-blue/5 hover:bg-brand-blue/10 transition-colors"
        >
          <Plus size={13} />
          Add {singularLabel}
        </button>
      </CollapsibleSection>
    );
  }

  // ── NESTED OBJECT ─────────────────────────────────────────────────────────
  if (type === "object") {
    const obj = (value as Record<string, unknown>) || {};

    return (
      <CollapsibleSection title={label} icon={icon}>
        {renderLocationContext()}
        {Object.entries(obj).map(([k, v]) => (
          <FieldRenderer
            key={k}
            fieldKey={k}
            value={v}
            path={[...path, k]}
            update={update}
            remove={remove}
            swap={swap}
            addItem={addItem}
            meta={meta}
          />
        ))}
      </CollapsibleSection>
    );
  }

  return null;
}
