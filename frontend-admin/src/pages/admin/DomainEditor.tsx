import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Save, Upload, Trash2, Plus, X, Loader2, CheckCircle,
  AlertCircle, Image as ImageIcon, Settings2, Sparkles, AlignLeft,
  LayoutGrid, Cpu, Briefcase, Star, GraduationCap, Zap, HelpCircle,
  Search, ChevronUp, ChevronDown, Monitor, Tablet,
  Smartphone,
} from "lucide-react";
import { DomainDetailRenderer } from "@shared/domain/DomainDetailRenderer";
import type { Domain } from "@shared/domain/types";
import { adminApi } from "@/lib/api";
import { useDomains } from "@/contexts/DomainsProvider";
import { MobileDomainPreviewFrame } from "@/components/domain-preview/MobileDomainPreviewFrame";
import type { MobileDomainPreviewFrameRef } from "@/components/domain-preview/MobileDomainPreviewFrame";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface OfferCard  { title: string; description: string; }
interface WhyCard    { title: string; description: string; icon: string; order: number; enabled: boolean; }
interface FaqItem    { question: string; answer: string; }

interface DomainEditorState {
  // General (editable)
  general_name: string;
  general_short_name: string;
  general_tagline: string;
  general_order: number;
  general_accent_color: string;
  // Hero
  hero_eyebrow: string;
  hero_heading: string;
  hero_heading_highlight: string;
  hero_description: string;
  // Overview
  overview_eyebrow: string;
  overview_heading: string;
  overview_paragraphs: string[];
  // Offer
  offer_eyebrow: string;
  offer_heading: string;
  offer_cards: OfferCard[];
  // Tech
  tech_eyebrow: string;
  tech_heading: string;
  tech_items: string[];
  // Apps
  apps_eyebrow: string;
  apps_heading: string;
  apps_description: string;
  apps_items: string[];
  // Why
  why_eyebrow: string;
  why_heading: string;
  why_cards: WhyCard[];
  // Internship
  internship_heading: string;
  internship_checklist: string[];
  internship_cta_label: string;
  internship_cta_link: string;
  // Future services
  future_enabled: boolean;
  future_heading: string;
  future_description: string;
  // FAQ
  faq_eyebrow: string;
  faq_contact_heading: string;
  faq_contact_description: string;
  faq_contact_cta_label: string;
  faq_contact_cta_link: string;
  faq_items: FaqItem[];
  // Image
  current_image_url: string | null;
  current_image_gridfs_id: string | null;
  // SEO
  seo_title: string;
  seo_description: string;
  seo_image: string;
}

type SectionId =
  | "general" | "hero" | "overview" | "what-we-offer" | "technologies"
  | "applications" | "why-choose" | "internship" | "future-services" | "faq" | "seo";

type PreviewDevice = "desktop" | "tablet" | "mobile";
type PreviewZoom   = "fit" | "50" | "75" | "100";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ICON_OPTIONS = ["Users", "Wrench", "Lightbulb", "Shield", "Award", "Check", "Zap", "Star"];

const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet:   768,
  mobile:   390,
};

interface SectionCfg {
  id: SectionId;
  label: string;
  shortLabel?: string;
  Icon: React.ElementType;
  previewId?: string; // maps to #preview-{previewId} in renderer
  getBadge?: (f: DomainEditorState) => string | null;
}

const SECTIONS: SectionCfg[] = [
  { id: "general",         label: "General",         Icon: Settings2 },
  { id: "hero",            label: "Hero",            Icon: Sparkles,     previewId: "hero" },
  { id: "overview",        label: "Overview",        Icon: AlignLeft,    previewId: "overview" },
  { id: "what-we-offer",   label: "What We Offer",   shortLabel: "Offers",    Icon: LayoutGrid,   previewId: "what-we-offer",   getBadge: (f) => f.offer_cards.length ? String(f.offer_cards.length) : null },
  { id: "technologies",    label: "Technologies",    shortLabel: "Tech",      Icon: Cpu,          previewId: "technologies",    getBadge: (f) => f.tech_items.length   ? String(f.tech_items.length)   : null },
  { id: "applications",    label: "Applications",    shortLabel: "Apps",      Icon: Briefcase,    previewId: "applications",    getBadge: (f) => f.apps_items.length   ? String(f.apps_items.length)   : null },
  { id: "why-choose",      label: "Why Choose",      Icon: Star,         previewId: "why-choose",     getBadge: (f) => f.why_cards.length    ? String(f.why_cards.length)    : null },
  { id: "internship",      label: "Internship",      Icon: GraduationCap, previewId: "internship" },
  { id: "future-services", label: "Future Services", shortLabel: "Future",    Icon: Zap,          previewId: "future-services" },
  { id: "faq",             label: "FAQ",             Icon: HelpCircle,   previewId: "faq",            getBadge: (f) => f.faq_items.length    ? String(f.faq_items.length)    : null },
  { id: "seo",             label: "SEO Settings",    shortLabel: "SEO",       Icon: Search },
];

const ACCENT_CLASS_MAP: Record<string, string> = {
  "artificial-intelligence": "domain-border-ai",
  "research-innovation":     "domain-border-rd",
  "iot-smart-automation":    "domain-border-iot",
  "engineering-design":      "domain-border-eng",
  "education-training":      "domain-border-edu",
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fromApi(d: any): DomainEditorState {
  const h  = d.hero             ?? {};
  const ov = d.overview         ?? {};
  const of_ = d.offer_section   ?? {};
  const tc = d.tech_section     ?? {};
  const ap = d.apps_section     ?? {};
  const wh = d.why_section      ?? {};
  const ix = d.internship       ?? {};
  const fs = d.future_services  ?? {};
  const fq = d.faq_section      ?? {};
  return {
    general_name:          d.name          ?? "",
    general_short_name:    d.short_name    ?? "",
    general_tagline:       d.tagline       ?? "",
    general_order:         d.order         ?? 0,
    general_accent_color:  d.accent_color  ?? "#0560DF",
    hero_eyebrow:           h.eyebrow            ?? "OUR DOMAIN",
    hero_heading:           h.heading            ?? "",
    hero_heading_highlight: h.heading_highlight  ?? "",
    hero_description:       h.description        ?? d.tagline ?? "",
    overview_eyebrow:       ov.eyebrow           ?? "OVERVIEW",
    overview_heading:       ov.heading           ?? "",
    overview_paragraphs:    ov.paragraphs        ?? d.overview_paragraphs ?? [],
    current_image_url:      ov.image_url         ?? null,
    current_image_gridfs_id: ov.image_gridfs_id  ?? null,
    offer_eyebrow:          of_.eyebrow          ?? "WHAT WE OFFER",
    offer_heading:          of_.heading          ?? "",
    offer_cards:  (of_.cards ?? d.what_we_offer ?? []).map((c: any) => ({ title: c.title ?? "", description: c.description ?? "" })),
    tech_eyebrow:           tc.eyebrow           ?? "TECHNOLOGIES WE USE",
    tech_heading:           tc.heading           ?? "Tools & Frameworks",
    tech_items:             tc.items             ?? d.technologies ?? [],
    apps_eyebrow:           ap.eyebrow           ?? "APPLICATIONS",
    apps_heading:           ap.heading           ?? "Industries We Serve",
    apps_description:       ap.description       ?? "",
    apps_items:             ap.items             ?? d.applications ?? [],
    why_eyebrow:            wh.eyebrow           ?? "WHY CHOOSE RAASHI?",
    why_heading:            wh.heading           ?? "Your Trusted Technology Partner",
    why_cards:  (wh.cards ?? []).map((c: any) => ({ title: c.title ?? "", description: c.description ?? "", icon: c.icon ?? "Check", order: c.order ?? 0, enabled: c.enabled !== false })),
    internship_heading:     ix.heading           ?? "Internship Opportunities",
    internship_checklist:   ix.checklist         ?? [],
    internship_cta_label:   ix.cta_label         ?? "Apply for Internship",
    internship_cta_link:    ix.cta_link          ?? "/apply",
    future_enabled:         fs.enabled !== false,
    future_heading:         fs.heading           ?? "Expanding Capabilities",
    future_description:     fs.description       ?? "",
    faq_eyebrow:            fq.eyebrow           ?? "FAQ",
    faq_contact_heading:    fq.contact_heading   ?? "Have more questions?",
    faq_contact_description: fq.contact_description ?? "",
    faq_contact_cta_label:  fq.contact_cta_label ?? "Contact Us",
    faq_contact_cta_link:   fq.contact_cta_link  ?? "/contact",
    faq_items:  (fq.items ?? d.faqs ?? []).map((f: any) => ({ question: f.question ?? "", answer: f.answer ?? "" })),
    seo_title:       d.seo_title       ?? "",
    seo_description: d.seo_description ?? "",
    seo_image:       d.seo_image       ?? "",
  };
}

function toPayload(s: DomainEditorState) {
  return {
    name:        s.general_name,
    short_name:  s.general_short_name,
    tagline:     s.general_tagline,
    order:       s.general_order,
    accent_color: s.general_accent_color,
    hero: { eyebrow: s.hero_eyebrow, heading: s.hero_heading, heading_highlight: s.hero_heading_highlight, description: s.hero_description },
    overview: { eyebrow: s.overview_eyebrow, heading: s.overview_heading, paragraphs: s.overview_paragraphs, image_url: s.current_image_url || null, image_gridfs_id: s.current_image_gridfs_id || null },
    offer_section: { eyebrow: s.offer_eyebrow, heading: s.offer_heading, cards: s.offer_cards },
    tech_section:  { eyebrow: s.tech_eyebrow,  heading: s.tech_heading,  items: s.tech_items  },
    apps_section:  { eyebrow: s.apps_eyebrow,  heading: s.apps_heading,  description: s.apps_description, items: s.apps_items },
    why_section:   { eyebrow: s.why_eyebrow,   heading: s.why_heading,   cards: s.why_cards   },
    internship:    { heading: s.internship_heading, checklist: s.internship_checklist, cta_label: s.internship_cta_label, cta_link: s.internship_cta_link },
    future_services: { enabled: s.future_enabled, heading: s.future_heading, description: s.future_description },
    faq_section: { eyebrow: s.faq_eyebrow, contact_heading: s.faq_contact_heading, contact_description: s.faq_contact_description, contact_cta_label: s.faq_contact_cta_label, contact_cta_link: s.faq_contact_cta_link, items: s.faq_items },
    // legacy flat fields for backward-compat
    overview_paragraphs: s.overview_paragraphs,
    what_we_offer: s.offer_cards,
    technologies:  s.tech_items,
    applications:  s.apps_items,
    faqs:          s.faq_items,
    seo_title:       s.seo_title       || null,
    seo_description: s.seo_description || null,
    seo_image:       s.seo_image       || null,
  };
}

function buildPreviewDomain(
  form: DomainEditorState,
  meta: { slug: string; name: string; short_name: string; accent_color: string },
): Domain {
  const accentColor = form.general_accent_color || meta.accent_color;
  return {
    slug:       meta.slug,
    order:      form.general_order,
    name:       form.general_name      || meta.name,
    shortName:  form.general_short_name || meta.short_name || form.general_name || meta.name,
    tagline:    form.general_tagline   || form.hero_description,
    description: form.hero_description,
    accentColor,
    accentClass: ACCENT_CLASS_MAP[meta.slug] || "",
    overviewParagraphs: form.overview_paragraphs,
    whatWeOffer: form.offer_cards,
    technologies: form.tech_items,
    applications: form.apps_items,
    faqs: form.faq_items,
    hero: { eyebrow: form.hero_eyebrow, heading: form.hero_heading, heading_highlight: form.hero_heading_highlight, description: form.hero_description },
    overview: { eyebrow: form.overview_eyebrow, heading: form.overview_heading, paragraphs: form.overview_paragraphs, image_url: form.current_image_url, image_gridfs_id: form.current_image_gridfs_id },
    offerSection: { eyebrow: form.offer_eyebrow, heading: form.offer_heading, cards: form.offer_cards },
    techSection:  { eyebrow: form.tech_eyebrow,  heading: form.tech_heading,  items: form.tech_items  },
    appsSection:  { eyebrow: form.apps_eyebrow,  heading: form.apps_heading,  description: form.apps_description, items: form.apps_items },
    whySection:   { eyebrow: form.why_eyebrow,   heading: form.why_heading,   cards: form.why_cards   },
    internship:   { heading: form.internship_heading, checklist: form.internship_checklist, cta_label: form.internship_cta_label, cta_link: form.internship_cta_link },
    futureServices: { enabled: form.future_enabled, heading: form.future_heading, description: form.future_description },
    faqSection: { eyebrow: form.faq_eyebrow, contact_heading: form.faq_contact_heading, contact_description: form.faq_contact_description, contact_cta_label: form.faq_contact_cta_label, contact_cta_link: form.faq_contact_cta_link, items: form.faq_items },
    seo_title:       form.seo_title,
    seo_description: form.seo_description,
    seo_image:       form.seo_image,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{children}</label>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5 normal-case font-normal">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, className = "", type = "text", readOnly = false }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  className?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue ${readOnly ? "bg-gray-50 text-gray-400 border-gray-100 cursor-default select-none" : "border-gray-200 bg-white"} ${className}`}
    />
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors resize-none"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-brand-blue" : "bg-gray-200"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-100">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIP TAG EDITOR
// ─────────────────────────────────────────────────────────────────────────────

function ChipTagEditor({ items, onChange, placeholder = "Add item…" }: {
  items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const t = input.trim();
    if (!t || items.includes(t)) return;
    onChange([...items, t]);
    setInput("");
    inputRef.current?.focus();
  };

  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !input && items.length > 0) remove(items.length - 1);
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue/8 text-brand-blue text-xs font-medium border border-brand-blue/15">
              {item}
              <button onClick={() => remove(i)} aria-label={`Remove ${item}`} className="rounded-full hover:bg-brand-blue/20 p-0.5 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-brand-blue hover:bg-brand-royal transition-colors disabled:opacity-40"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT CHECKLIST EDITOR
// ─────────────────────────────────────────────────────────────────────────────

function CompactChecklistEditor({ items, onChange, placeholder = "Checklist item…" }: {
  items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addItem = () => {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput("");
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="group flex items-center gap-2 rounded-xl px-3 py-2.5 bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="w-4 h-4 rounded-full border-2 border-brand-blue/30 flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/50" />
          </div>
          <span className="flex-1 text-sm text-gray-700 truncate">{item || <span className="italic text-gray-400">Empty</span>}</span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-1 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"><ChevronUp size={12} /></button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="p-1 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"><ChevronDown size={12} /></button>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="p-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors"
        />
        <button onClick={addItem} disabled={!input.trim()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-brand-blue hover:bg-brand-royal disabled:opacity-40 transition-colors">
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE PANEL (with instant local preview + cleanup)
// ─────────────────────────────────────────────────────────────────────────────

function ImagePanel({ domainId, domainSlug, accentColor, imageUrl, onImageChange }: {
  domainId: string; domainSlug: string; accentColor: string;
  imageUrl: string | null; onImageChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [imgError,  setImgError]  = useState("");
  const inputRef    = useRef<HTMLInputElement>(null);
  const localUrlRef = useRef<string | null>(null);

  useEffect(() => () => { if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current); }, []);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setImgError("Image must be under 5 MB"); return; }
    if (!file.type.startsWith("image/")) { setImgError("Only image files accepted"); return; }
    setImgError("");

    // Show local preview immediately — no save needed
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    localUrlRef.current = objectUrl;
    onImageChange(objectUrl);

    setUploading(true);
    try {
      const res = await adminApi.uploadDomainImage(domainId, file);
      const serverUrl = res.data.image_url ?? null;
      URL.revokeObjectURL(objectUrl);
      localUrlRef.current = null;
      onImageChange(serverUrl);
    } catch (err: any) {
      setImgError(err.response?.data?.detail ?? "Upload failed");
      onImageChange(null);
      localUrlRef.current = null;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove the overview image?")) return;
    setDeleting(true);
    try {
      await adminApi.deleteDomainImage(domainId);
      onImageChange(null);
      if (localUrlRef.current) { URL.revokeObjectURL(localUrlRef.current); localUrlRef.current = null; }
    } catch (err: any) {
      setImgError(err.response?.data?.detail ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // Determine which URL to display
  const resolveAdminDisplayUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) return url;
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "/api/v1";
    if (url.startsWith("/api/v1/")) {
      return apiBase.startsWith("http") ? `${apiBase}${url.slice(7)}` : url;
    }
    if (url.startsWith("/domains/")) {
      return apiBase.startsWith("http") ? `${apiBase}${url}` : `/api/v1${url}`;
    }
    if (domainSlug && !url.includes("/")) {
      return apiBase.startsWith("http") ? `${apiBase}/domains/${domainSlug}/image` : `/api/v1/domains/${domainSlug}/image`;
    }
    return url;
  };
  const displayUrl = resolveAdminDisplayUrl(imageUrl);

  return (
    <div>
      <input type="file" accept="image/*" ref={inputRef} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <div
        className="relative rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden aspect-video flex items-center justify-center bg-gray-50 cursor-pointer hover:border-brand-blue/40 transition-colors"
        onClick={() => !uploading && !deleting && inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onDragOver={e => e.preventDefault()}
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="Domain overview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Click to replace</span>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${accentColor}12`, color: accentColor }}>
              <ImageIcon size={24} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Drop image here or click to upload</p>
            <p className="text-xs text-gray-400">PNG, JPG, WebP — max 5 MB</p>
          </div>
        )}
        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-blue" /></div>}
      </div>
      {imgError && <p className="mt-2 text-xs text-red-500">{imgError}</p>}
      {displayUrl && !uploading && (
        <div className="mt-2 flex gap-3">
          <button onClick={() => inputRef.current?.click()} className="text-xs text-brand-blue flex items-center gap-1 hover:underline"><Upload size={11} /> Replace</button>
          <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-500 flex items-center gap-1 hover:underline disabled:opacity-50">
            {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED EDITOR PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface EditorProps {
  form: DomainEditorState;
  set: <K extends keyof DomainEditorState>(key: K, value: DomainEditorState[K]) => void;
  domainId: string;
  domainSlug: string;
  accentColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST + SELECTED-ITEM EDITORS
// ─────────────────────────────────────────────────────────────────────────────

function ItemControls({ idx, total, onMoveUp, onMoveDown, onDelete }: {
  idx: number; total: number;
  onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button onClick={onMoveUp}   disabled={idx === 0}          aria-label="Move up"   className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"><ChevronUp   size={12} /></button>
      <button onClick={onMoveDown} disabled={idx === total - 1}  aria-label="Move down" className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"><ChevronDown size={12} /></button>
      <button onClick={onDelete}                                  aria-label="Delete"    className="p-1.5 rounded-lg border border-red-100 bg-white text-red-400 hover:text-red-600 transition-colors"><Trash2      size={12} /></button>
    </div>
  );
}

function ListPicker<T extends { title?: string; question?: string }>({
  items, selIdx, setSelIdx, label, onAdd,
  getLabel,
  getBadge,
}: {
  items: T[];
  selIdx: number | null;
  setSelIdx: (i: number | null) => void;
  label: string;
  onAdd: () => void;
  getLabel: (item: T, i: number) => string;
  getBadge?: (item: T) => string | undefined;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
        {items.length === 0 && (
          <p className="px-4 py-3 text-xs text-gray-400 italic">No {label.toLowerCase()} yet.</p>
        )}
        {items.map((item, i) => {
          const isActive = selIdx === i;
          return (
            <button
              key={i}
              onClick={() => setSelIdx(isActive ? null : i)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${isActive ? "bg-brand-blue/6 text-brand-blue font-medium" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="text-[10px] font-mono text-gray-400 w-6 shrink-0">{i + 1}</span>
              <span className="flex-1 truncate">{getLabel(item, i) || <span className="italic text-gray-400">Untitled</span>}</span>
              {getBadge?.(item) && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{getBadge(item)}</span>}
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0" />}
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        <button onClick={onAdd} className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline font-medium">
          <Plus size={12} /> Add {label}
        </button>
      </div>
    </div>
  );
}

function SelectedItemPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/[0.03] p-4 space-y-4">
      <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

// ── Offer ─────────────────────────────────────────────────────────────────────
function OfferSectionEditor({ form, set }: EditorProps) {
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const cards = form.offer_cards;

  const addCard = () => {
    const next = [...cards, { title: "", description: "" }];
    set("offer_cards", next);
    setSelIdx(next.length - 1);
  };
  const removeCard = (i: number) => {
    set("offer_cards", cards.filter((_, j) => j !== i));
    setSelIdx(prev => prev === i ? null : prev !== null && prev > i ? prev - 1 : prev);
  };
  const moveCard = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards]; [next[i], next[j]] = [next[j], next[i]];
    set("offer_cards", next); setSelIdx(j);
  };
  const update = (i: number, k: keyof OfferCard, v: string) =>
    set("offer_cards", cards.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const sel = selIdx !== null ? cards[selIdx] : null;

  return (
    <div className="space-y-6">
      <SectionHeader title="What We Offer" description="Services and capabilities offered in this domain." />
      <Grid2>
        <div><FieldLabel>Eyebrow</FieldLabel><Input value={form.offer_eyebrow} onChange={v => set("offer_eyebrow", v)} /></div>
        <div><FieldLabel>Heading</FieldLabel><Input value={form.offer_heading} onChange={v => set("offer_heading", v)} /></div>
      </Grid2>
      <div>
        <FieldLabel>Service Cards</FieldLabel>
        <ListPicker items={cards} selIdx={selIdx} setSelIdx={setSelIdx} label="Service" onAdd={addCard} getLabel={(c) => c.title} />
      </div>
      {sel !== null && selIdx !== null && (
        <SelectedItemPanel title={`Editing Card #${selIdx + 1}`}>
          <div className="flex justify-end -mt-2">
            <ItemControls idx={selIdx} total={cards.length} onMoveUp={() => moveCard(selIdx, -1)} onMoveDown={() => moveCard(selIdx, 1)} onDelete={() => removeCard(selIdx)} />
          </div>
          <div><FieldLabel>Title</FieldLabel><Input value={sel.title} onChange={v => update(selIdx, "title", v)} placeholder="Service title" /></div>
          <div><FieldLabel>Description</FieldLabel><Textarea value={sel.description} onChange={v => update(selIdx, "description", v)} rows={3} placeholder="Service description" /></div>
        </SelectedItemPanel>
      )}
    </div>
  );
}

// ── Why Choose ────────────────────────────────────────────────────────────────
function WhySectionEditor({ form, set }: EditorProps) {
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const cards = form.why_cards;

  const addCard = () => {
    const next = [...cards, { title: "", description: "", icon: "Check", order: cards.length, enabled: true }];
    set("why_cards", next); setSelIdx(next.length - 1);
  };
  const removeCard = (i: number) => {
    set("why_cards", cards.filter((_, j) => j !== i));
    setSelIdx(prev => prev === i ? null : prev !== null && prev > i ? prev - 1 : prev);
  };
  const moveCard = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards]; [next[i], next[j]] = [next[j], next[i]];
    set("why_cards", next); setSelIdx(j);
  };
  const update = (i: number, k: keyof WhyCard, v: any) =>
    set("why_cards", cards.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const sel = selIdx !== null ? cards[selIdx] : null;

  return (
    <div className="space-y-6">
      <SectionHeader title="Why Choose Raashi" description="Value propositions and differentiators." />
      <Grid2>
        <div><FieldLabel>Eyebrow</FieldLabel><Input value={form.why_eyebrow} onChange={v => set("why_eyebrow", v)} /></div>
        <div><FieldLabel>Heading</FieldLabel><Input value={form.why_heading} onChange={v => set("why_heading", v)} /></div>
      </Grid2>
      <div>
        <FieldLabel>Why Cards</FieldLabel>
        <ListPicker
          items={cards} selIdx={selIdx} setSelIdx={setSelIdx} label="Card" onAdd={addCard}
          getLabel={(c) => c.title}
          getBadge={(c) => !c.enabled ? "hidden" : undefined}
        />
      </div>
      {sel !== null && selIdx !== null && (
        <SelectedItemPanel title={`Editing Card #${selIdx + 1}`}>
          <div className="flex items-center justify-between -mt-2">
            <Toggle checked={sel.enabled} onChange={v => update(selIdx, "enabled", v)} label="Visible" />
            <ItemControls idx={selIdx} total={cards.length} onMoveUp={() => moveCard(selIdx, -1)} onMoveDown={() => moveCard(selIdx, 1)} onDelete={() => removeCard(selIdx)} />
          </div>
          <Grid2>
            <div><FieldLabel>Title</FieldLabel><Input value={sel.title} onChange={v => update(selIdx, "title", v)} placeholder="Card title" /></div>
            <div>
              <FieldLabel>Icon</FieldLabel>
              <select value={sel.icon} onChange={e => update(selIdx, "icon", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue bg-white">
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </Grid2>
          <div><FieldLabel>Description</FieldLabel><Textarea value={sel.description} onChange={v => update(selIdx, "description", v)} rows={3} placeholder="Card description" /></div>
        </SelectedItemPanel>
      )}
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FaqSectionEditor({ form, set }: EditorProps) {
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const items = form.faq_items;

  const addItem = () => {
    const next = [...items, { question: "", answer: "" }];
    set("faq_items", next); setSelIdx(next.length - 1);
  };
  const removeItem = (i: number) => {
    set("faq_items", items.filter((_, j) => j !== i));
    setSelIdx(prev => prev === i ? null : prev !== null && prev > i ? prev - 1 : prev);
  };
  const moveItem = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]];
    set("faq_items", next); setSelIdx(j);
  };
  const update = (i: number, k: keyof FaqItem, v: string) =>
    set("faq_items", items.map((f, j) => j === i ? { ...f, [k]: v } : f));
  const sel = selIdx !== null ? items[selIdx] : null;

  return (
    <div className="space-y-6">
      <SectionHeader title="FAQ Section" description="Questions, answers, and contact sidebar settings." />
      <div><FieldLabel>Eyebrow</FieldLabel><Input value={form.faq_eyebrow} onChange={v => set("faq_eyebrow", v)} /></div>
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Contact Sidebar</p>
        <Grid2>
          <div><FieldLabel>Heading</FieldLabel><Input value={form.faq_contact_heading} onChange={v => set("faq_contact_heading", v)} /></div>
          <div><FieldLabel>CTA Label</FieldLabel><Input value={form.faq_contact_cta_label} onChange={v => set("faq_contact_cta_label", v)} /></div>
          <div className="sm:col-span-2"><FieldLabel>Description</FieldLabel><Input value={form.faq_contact_description} onChange={v => set("faq_contact_description", v)} /></div>
          <div><FieldLabel>CTA Link</FieldLabel><Input value={form.faq_contact_cta_link} onChange={v => set("faq_contact_cta_link", v)} /></div>
        </Grid2>
      </div>
      <div>
        <FieldLabel>FAQ Items</FieldLabel>
        <ListPicker items={items} selIdx={selIdx} setSelIdx={setSelIdx} label="FAQ" onAdd={addItem} getLabel={(f) => (f as FaqItem).question} />
      </div>
      {sel !== null && selIdx !== null && (
        <SelectedItemPanel title={`Editing Q${selIdx + 1}`}>
          <div className="flex justify-end -mt-2">
            <ItemControls idx={selIdx} total={items.length} onMoveUp={() => moveItem(selIdx, -1)} onMoveDown={() => moveItem(selIdx, 1)} onDelete={() => removeItem(selIdx)} />
          </div>
          <div><FieldLabel>Question</FieldLabel><Input value={sel.question} onChange={v => update(selIdx, "question", v)} placeholder="FAQ question" /></div>
          <div><FieldLabel>Answer</FieldLabel><Textarea value={sel.answer} onChange={v => update(selIdx, "answer", v)} rows={4} placeholder="FAQ answer" /></div>
        </SelectedItemPanel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE SECTION EDITOR — renders the single active section
// ─────────────────────────────────────────────────────────────────────────────

function ActiveSectionEditor({ activeSection, ...props }: { activeSection: SectionId } & EditorProps) {
  const { form, set, domainId, domainSlug, accentColor } = props;

  switch (activeSection) {
    case "general":
      return (
        <div className="space-y-5">
          <SectionHeader title="General" description="Core domain metadata. Slug is read-only for existing domains." />
          <div><FieldLabel>Domain Name</FieldLabel><Input value={form.general_name} onChange={v => set("general_name", v)} placeholder="Artificial Intelligence" /></div>
          <Grid2>
            <div><FieldLabel>Short Name</FieldLabel><Input value={form.general_short_name} onChange={v => set("general_short_name", v)} placeholder="AI" /></div>
            <div><FieldLabel>Display Order</FieldLabel><Input value={String(form.general_order)} onChange={v => set("general_order", parseInt(v) || 0)} type="number" /></div>
          </Grid2>
          <div><FieldLabel hint="Short tagline shown in listings and hero fallback.">Tagline</FieldLabel><Input value={form.general_tagline} onChange={v => set("general_tagline", v)} placeholder="A short domain tagline" /></div>
          <div>
            <FieldLabel hint="Used for borders, highlights, badges, and accent text across the page.">Accent Color</FieldLabel>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.general_accent_color} onChange={e => set("general_accent_color", e.target.value)} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white" aria-label="Pick accent color" />
              <Input value={form.general_accent_color} onChange={v => set("general_accent_color", v)} placeholder="#0560DF" className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <FieldLabel hint="URL slug — read-only for existing domains.">Slug</FieldLabel>
            <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              <span className="px-3 text-xs text-gray-400 font-mono whitespace-nowrap">/domains/</span>
              <input value={domainSlug} readOnly className="flex-1 px-2 py-2.5 text-sm font-mono text-gray-400 bg-transparent focus:outline-none cursor-default" />
            </div>
          </div>
        </div>
      );

    case "hero":
      return (
        <div className="space-y-5">
          <SectionHeader title="Hero Section" description="Main banner at the top of the domain page." />
          <div><FieldLabel>Eyebrow Label</FieldLabel><Input value={form.hero_eyebrow} onChange={v => set("hero_eyebrow", v)} placeholder="OUR DOMAIN" /></div>
          <div><FieldLabel>Heading</FieldLabel><Input value={form.hero_heading} onChange={v => set("hero_heading", v)} placeholder="Artificial Intelligence &" /></div>
          <div><FieldLabel hint="Rendered in the domain accent color.">Heading Highlight</FieldLabel><Input value={form.hero_heading_highlight} onChange={v => set("hero_heading_highlight", v)} placeholder="Data Intelligence" /></div>
          <div><FieldLabel>Description</FieldLabel><Textarea value={form.hero_description} onChange={v => set("hero_description", v)} rows={3} placeholder="Hero description below the headline" /></div>
        </div>
      );

    case "overview":
      return (
        <div className="space-y-5">
          <SectionHeader title="Overview Section" description="Domain overview with paragraphs and a feature image." />
          <Grid2>
            <div><FieldLabel>Eyebrow</FieldLabel><Input value={form.overview_eyebrow} onChange={v => set("overview_eyebrow", v)} /></div>
            <div><FieldLabel>Heading</FieldLabel><Input value={form.overview_heading} onChange={v => set("overview_heading", v)} /></div>
          </Grid2>
          <div>
            <FieldLabel>Paragraphs</FieldLabel>
            <div className="space-y-2">
              {form.overview_paragraphs.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea value={p} onChange={v => set("overview_paragraphs", form.overview_paragraphs.map((x, j) => j === i ? v : x))} rows={3} placeholder={`Paragraph ${i + 1}`} />
                  <button onClick={() => set("overview_paragraphs", form.overview_paragraphs.filter((_, j) => j !== i))} aria-label="Remove paragraph" className="p-2.5 h-fit mt-0.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 transition-colors"><X size={13} /></button>
                </div>
              ))}
              <button onClick={() => set("overview_paragraphs", [...form.overview_paragraphs, ""])} className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline mt-1"><Plus size={12} /> Add paragraph</button>
            </div>
          </div>
          <div>
            <FieldLabel>Overview Image</FieldLabel>
            <ImagePanel
              domainId={domainId}
              domainSlug={domainSlug}
              accentColor={accentColor}
              imageUrl={form.current_image_url}
              onImageChange={url => {
                set("current_image_url", url);
                if (!url) set("current_image_gridfs_id", null);
              }}
            />
          </div>
        </div>
      );

    case "what-we-offer":
      return <OfferSectionEditor form={form} set={set} domainId={domainId} domainSlug={domainSlug} accentColor={accentColor} />;

    case "technologies":
      return (
        <div className="space-y-5">
          <SectionHeader title="Technologies" description="Tools, frameworks, and technologies used in this domain." />
          <Grid2>
            <div><FieldLabel>Eyebrow</FieldLabel><Input value={form.tech_eyebrow} onChange={v => set("tech_eyebrow", v)} /></div>
            <div><FieldLabel>Heading</FieldLabel><Input value={form.tech_heading} onChange={v => set("tech_heading", v)} /></div>
          </Grid2>
          <div><FieldLabel>Technologies</FieldLabel><ChipTagEditor items={form.tech_items} onChange={v => set("tech_items", v)} placeholder="e.g. Python, MATLAB, ROS…" /></div>
        </div>
      );

    case "applications":
      return (
        <div className="space-y-5">
          <SectionHeader title="Applications / Industries" description="Sectors and use cases where this domain applies." />
          <Grid2>
            <div><FieldLabel>Eyebrow</FieldLabel><Input value={form.apps_eyebrow} onChange={v => set("apps_eyebrow", v)} /></div>
            <div><FieldLabel>Heading</FieldLabel><Input value={form.apps_heading} onChange={v => set("apps_heading", v)} /></div>
            <div className="sm:col-span-2"><FieldLabel>Sub-description</FieldLabel><Input value={form.apps_description} onChange={v => set("apps_description", v)} /></div>
          </Grid2>
          <div><FieldLabel>Industries</FieldLabel><ChipTagEditor items={form.apps_items} onChange={v => set("apps_items", v)} placeholder="e.g. Healthcare, Finance, Manufacturing…" /></div>
        </div>
      );

    case "why-choose":
      return <WhySectionEditor form={form} set={set} domainId={domainId} domainSlug={domainSlug} accentColor={accentColor} />;

    case "internship":
      return (
        <div className="space-y-5">
          <SectionHeader title="Internship Panel" description="Internship opportunities shown alongside Why Choose section." />
          <div><FieldLabel>Panel Heading</FieldLabel><Input value={form.internship_heading} onChange={v => set("internship_heading", v)} /></div>
          <Grid2>
            <div><FieldLabel>CTA Button Label</FieldLabel><Input value={form.internship_cta_label} onChange={v => set("internship_cta_label", v)} /></div>
            <div><FieldLabel>CTA Link</FieldLabel><Input value={form.internship_cta_link} onChange={v => set("internship_cta_link", v)} /></div>
          </Grid2>
          <div><FieldLabel>Checklist Items</FieldLabel><CompactChecklistEditor items={form.internship_checklist} onChange={v => set("internship_checklist", v)} placeholder="e.g. Certificate on Completion" /></div>
        </div>
      );

    case "future-services":
      return (
        <div className="space-y-5">
          <SectionHeader title="Future Services Notice" description="Optional notice about upcoming or expanding capabilities." />
          <Toggle checked={form.future_enabled} onChange={v => set("future_enabled", v)} label="Show expanding capabilities notice" />
          {form.future_enabled && (
            <>
              <div><FieldLabel>Heading</FieldLabel><Input value={form.future_heading} onChange={v => set("future_heading", v)} /></div>
              <div><FieldLabel>Description</FieldLabel><Textarea value={form.future_description} onChange={v => set("future_description", v)} rows={3} /></div>
            </>
          )}
        </div>
      );

    case "faq":
      return <FaqSectionEditor form={form} set={set} domainId={domainId} domainSlug={domainSlug} accentColor={accentColor} />;

    case "seo":
      return (
        <div className="space-y-5">
          <SectionHeader title="SEO Settings" description="Metadata for search engines and social sharing. Leave empty to use domain defaults." />
          <div><FieldLabel hint="Keep under 60 characters. Overrides the default meta title.">SEO Title</FieldLabel><Input value={form.seo_title} onChange={v => set("seo_title", v)} placeholder="Overrides default meta title" /></div>
          <div><FieldLabel hint="Keep under 160 characters. Overrides the meta description.">SEO Description</FieldLabel><Textarea value={form.seo_description} onChange={v => set("seo_description", v)} rows={3} placeholder="Overrides default meta description" /></div>
          <div><FieldLabel hint="Full URL for og:image (social sharing image).">SEO Image URL</FieldLabel><Input value={form.seo_image} onChange={v => set("seo_image", v)} placeholder="https://example.com/image.jpg" /></div>
        </div>
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION NAVIGATOR — vertical compact list (≥1800px sidebar)
// ─────────────────────────────────────────────────────────────────────────────

function SectionNav({ activeSection, onSelect, form }: {
  activeSection: SectionId; onSelect: (id: SectionId) => void; form: DomainEditorState;
}) {
  return (
    <nav aria-label="Section navigation" className="flex flex-col gap-px p-3">
      {SECTIONS.map(({ id, label, Icon, getBadge }) => {
        const isActive = id === activeSection;
        const badge = getBadge?.(form);
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-label={`Go to ${label}`}
            aria-current={isActive ? "page" : undefined}
            className={[
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all",
              "border-l-2",
              isActive
                ? "bg-brand-blue/8 text-brand-blue border-brand-blue"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent",
            ].join(" ")}
          >
            <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-brand-blue" : "text-gray-400"} />
            <span className="flex-1 truncate text-[13px]">{label}</span>
            {badge && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md tabular-nums ${isActive ? "bg-brand-blue/15 text-brand-blue" : "bg-gray-100 text-gray-500"}`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TAB STRIP — scrollable horizontal strip (<1800px)
// ─────────────────────────────────────────────────────────────────────────────

function SectionTabStrip({ activeSection, onSelect, form }: {
  activeSection: SectionId; onSelect: (id: SectionId) => void; form: DomainEditorState;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = scrollRef.current?.querySelector('[aria-current="page"]') as HTMLElement | null;
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10 flex-none">
      <div ref={scrollRef} className="flex gap-1 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {SECTIONS.map(({ id, label, shortLabel, Icon, getBadge }) => {
          const isActive = id === activeSection;
          const badge = getBadge?.(form);
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0",
                isActive ? "bg-brand-blue text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
              ].join(" ")}
            >
              <Icon size={12} strokeWidth={2} />
              {shortLabel || label}
              {badge && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${isActive ? "bg-white/20" : "bg-gray-200 text-gray-500"}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW STAGE
// ─────────────────────────────────────────────────────────────────────────────

const ZOOM_LABELS: Record<PreviewZoom, string> = { fit: "Fit", "50": "50%", "75": "75%", "100": "100%" };

interface PreviewStageProps {
  domain: Domain;
  previewDevice: PreviewDevice;
  
  setPreviewDevice: (d: PreviewDevice) => void;
  previewZoom: PreviewZoom;
  setPreviewZoom: (z: PreviewZoom) => void;
  /** The outer scrollable container — used by DomainEditor to scroll-to-section */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  /** The DomainDetailRenderer wrapper — used by DomainEditor to query #preview-* */
  viewportRef: React.RefObject<HTMLDivElement | null>;
  /** The mobile iframe ref — used for section scrolling inside iframe */
  mobileFrameRef: React.RefObject<MobileDomainPreviewFrameRef | null>;
}

function PreviewStage({ domain, previewDevice, setPreviewDevice, previewZoom, setPreviewZoom, scrollerRef, viewportRef, mobileFrameRef }: PreviewStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth]       = useState(700);
  const [stageHeight, setStageHeight]     = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Single ResizeObserver ref for the viewport — ensures we always disconnect
  // before attaching to a new element (no leaks on zoom/device mode switches).
  const viewportRoRef = useRef<ResizeObserver | null>(null);

  const logicalWidth = DEVICE_WIDTHS[previewDevice];
  // Padding inside the scroller — leaves breathing room around the viewport card
  const STAGE_PAD = 16;

  // Measure available stage width and height for fit-scale.
  // Runs once and updates when the column is resized.
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(entries => {
      setStageWidth(entries[0]?.contentRect.width ?? 700);
      setStageHeight(entries[0]?.contentRect.height ?? 0);
    });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Callback ref shared between scaled and native render paths.
  // Sets the parent viewportRef AND tracks content height via ResizeObserver.
  // Always disconnects the previous observer before creating a new one.
  const assignViewport = useCallback((el: HTMLDivElement | null) => {
    viewportRoRef.current?.disconnect();
    viewportRoRef.current = null;
    (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    const ro = new ResizeObserver(entries =>
      setContentHeight(entries[0]?.contentRect.height ?? 0)
    );
    ro.observe(el);
    viewportRoRef.current = ro;
  }, [viewportRef]);

  // Guard: ensure the viewport observer is cleaned up when the component unmounts.
  useEffect(() => () => { viewportRoRef.current?.disconnect(); }, []);

  // Assign scrollerRef (used by parent for section scroll-to navigation).
  const assignScroller = useCallback((el: HTMLDivElement | null) => {
    (scrollerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [scrollerRef]);

  // ── Scale computation ──────────────────────────────────────────────────────
  // usableWidth: available pixels for the viewport card (stage minus padding).
  const usableWidth = Math.max(stageWidth - STAGE_PAD * 2, 100);
  const fitScale  = Math.min(1, usableWidth / logicalWidth);
  const scale = previewZoom === "fit"  ? fitScale
              : previewZoom === "50"   ? 0.5
              : previewZoom === "75"   ? 0.75
              : 1;

  const isNative = previewZoom === "100";

  // Visual (scaled) dimensions of the viewport card.
  // These become the layout dimensions of the size-placeholder.
  const visualWidth  = Math.round(logicalWidth * scale);
  const visualHeight = contentHeight > 0 ? Math.round(contentHeight * scale) : undefined;

  const scalePercent = Math.round(scale * 100);
  const deviceLabel  = { desktop: "Desktop", tablet: "Tablet", mobile: "Mobile" }[previewDevice];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#111216]">

      {/* ── Controls bar ────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] bg-[#18191f] flex-wrap gap-y-1.5">
        {/* Device picker */}
        <div className="flex rounded-lg bg-white/[0.07] p-0.5 gap-0.5">
          {([ ["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"] ] as const).map(([d, Icon, lbl]) => (
            <button key={d} onClick={() => setPreviewDevice(d as PreviewDevice)} aria-label={lbl} aria-pressed={previewDevice === d}
              className={`p-1.5 rounded-md transition-all ${previewDevice === d ? "bg-white/15 text-white" : "text-white/35 hover:text-white/70"}`}>
              <Icon size={14} strokeWidth={1.8} />
            </button>
          ))}
        </div>

        {/* Zoom picker */}
        <div className="flex rounded-lg bg-white/[0.07] p-0.5 gap-0.5">
          {(["fit", "50", "75", "100"] as PreviewZoom[]).map(z => (
            <button key={z} onClick={() => setPreviewZoom(z)} aria-pressed={previewZoom === z}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all ${previewZoom === z ? "bg-white/15 text-white" : "text-white/35 hover:text-white/70"}`}>
              {ZOOM_LABELS[z]}
            </button>
          ))}
        </div>

        <span className="hidden sm:block text-[10px] text-white/25 font-mono">
          {deviceLabel} · {logicalWidth}px · {scalePercent}%
        </span>

        <div className="flex-1" />
      </div>

      {/* ── Stage ───────────────────────────────────────────────────────── */}
      {/*
        stageRef is measured (via ResizeObserver) for fit-scale calculation.
        overflow:hidden here ensures the stage NEVER expands the admin layout
        regardless of the logical preview width.
        min-w-0 / min-h-0: prevents flex children from accidentally growing.
      */}
      <div ref={stageRef} className="flex-1 min-w-0 min-h-0 overflow-hidden">

        {/*
          Scroller — the ONLY scroll container for the preview.
          Architecture:
            • Plain block element (w-full h-full) — NOT a flex container.
              Flex + justify-center has a well-known overflow bug where items
              centered past the left edge become unreachable by scrolling.
            • overflow-auto: clips content that exceeds stage dimensions and
              adds a scrollbar. All scrolling is INTERNAL — no global page scroll.
            • Centering: child uses margin:auto, which correctly centers when
              the child is narrower, and left-aligns (scrollable) when wider.
        */}
        <div
          ref={assignScroller}
          className="w-full h-full overflow-auto bg-[#111216]"
        >
          {previewDevice === "mobile" ? (
            <MobileDomainPreviewFrame
              ref={mobileFrameRef}
              domain={domain}
              scale={scale}
              stageHeight={stageHeight}
            />
          ) : isNative ? (
            /*
             * 100% zoom — no CSS transform.
             * Viewport rendered at its true logical width.
             * When logicalWidth > stageWidth the scroller scrolls horizontally
             * (internal only). margin:auto centers when it fits.
             */
            <div
              ref={assignViewport}
              className="bg-white shadow-[0_0_60px_rgba(0,0,0,0.55)] rounded-t-xl overflow-hidden"
              style={{
                width: logicalWidth,
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: STAGE_PAD,
              }}
            >
              <DomainDetailRenderer domain={domain} previewMode />
            </div>
          ) : (
            /*
             * Scaled zoom (Fit / 50% / 75%).
             *
             * Layout strategy:
             *   1. size-placeholder occupies VISUAL dimensions (logical × scale).
             *      This is the element that participates in layout and scroll.
             *   2. viewport is absolute-positioned inside the placeholder at
             *      full logical size, then shrunk with CSS transform: scale.
             *   3. overflow:hidden on the placeholder CONTAINS the absolute child
             *      within its visual bounds. Without this, the absolute child
             *      (logicalWidth px) would expand the scroller's scrollWidth to
             *      logicalWidth even though it visually occupies only visualWidth.
             *      That is the root cause of the horizontal page overflow bug.
             *   4. Shadow and rounded corners are on the placeholder so they
             *      are not clipped by its own overflow:hidden (elements clip
             *      their children's overflow, not their own decoration).
             */
            <div
              className="relative overflow-hidden rounded-t-xl shadow-[0_0_60px_rgba(0,0,0,0.55)]"
              style={{
                width: visualWidth,
                height: visualHeight,
                minHeight: Math.round(200 * scale),
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: STAGE_PAD,
              }}
            >
              <div
                ref={assignViewport}
                className="absolute top-0 left-0 bg-white overflow-hidden"
                style={{
                  width: logicalWidth,
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                }}
              >
                <DomainDetailRenderer domain={domain} previewMode />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOMAIN EDITOR
// ─────────────────────────────────────────────────────────────────────────────

export default function DomainEditor() {
  const { id } = useParams<{ id: string }>();
  const { refresh: refreshPublicDomains } = useDomains();

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [domainMeta, setDomainMeta] = useState<{ name: string; short_name: string; slug: string; accent_color: string } | null>(null);
  const [form,       setForm]       = useState<DomainEditorState | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMsg,    setSaveMsg]    = useState("");

  // Dirty tracking — explicit flag, no JSON.stringify on every render
  const [isDirty, setIsDirty] = useState(false);

  const [activeSection,  setActiveSection]  = useState<SectionId>("hero");
  const [previewDevice,  setPreviewDevice]  = useState<PreviewDevice>("desktop");
  const [previewZoom,    setPreviewZoom]    = useState<PreviewZoom>("fit");

  // Refs for scroll-to-section
  const scrollerRef  = useRef<HTMLDivElement | null>(null);
  const viewportRef  = useRef<HTMLDivElement | null>(null);
  const mobileFrameRef = useRef<MobileDomainPreviewFrameRef | null>(null);

  // Detect reduced-motion preference once
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // ── Load domain ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    adminApi.getDomain(id)
      .then(res => {
        const d = res.data;
        setDomainMeta({ name: d.name, short_name: d.short_name, slug: d.slug, accent_color: d.accent_color });
        setForm(fromApi(d));
        setIsDirty(false);
      })
      .catch(() => setSaveMsg("Failed to load domain"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── set() — marks dirty on every field change ──────────────────────────────
  const set = useCallback(<K extends keyof DomainEditorState>(key: K, value: DomainEditorState[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
    setIsDirty(true);
  }, []);

  // ── Section select + preview scroll-to + highlight ────────────────────────
  const handleSectionSelect = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);

    const cfg = SECTIONS.find(s => s.id === sectionId);
    if (!cfg?.previewId) return;

    const previewId = `preview-${cfg.previewId}`;

    // Use requestAnimationFrame to let React state update settle first
    requestAnimationFrame(() => {
      // Mobile handling via iframe
      if (mobileFrameRef.current) {
        mobileFrameRef.current.scrollToSection(previewId, prefersReducedMotion);
        return;
      }

      // Desktop/Tablet inline handling
      const scroller = scrollerRef.current;
      const viewport = viewportRef.current;
      if (!scroller || !viewport) return;

      const el = viewport.querySelector(`#${previewId}`) as HTMLElement | null;
      if (!el) return;

      // getBoundingClientRect accounts for CSS transforms automatically
      const scrollerRect = scroller.getBoundingClientRect();
      const elRect       = el.getBoundingClientRect();
      const scrollTarget = elRect.top - scrollerRect.top + scroller.scrollTop;

      scroller.scrollTo({
        top:      Math.max(0, scrollTarget - 16), // 16px breathing room
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });

      // Trigger highlight after scroll begins
      const HIGHLIGHT_DELAY = prefersReducedMotion ? 0 : 280;
      setTimeout(() => {
        const target = viewport.querySelector(`#${previewId}`) as HTMLElement | null;
        if (!target) return;
        target.classList.remove("preview-section-highlight");
        void target.offsetWidth; // force reflow so animation restarts
        target.classList.add("preview-section-highlight");
        setTimeout(() => target.classList.remove("preview-section-highlight"), 1600);
      }, HIGHLIGHT_DELAY);
    });
  }, [prefersReducedMotion]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!id || !form) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      await adminApi.updateDomain(id, toPayload(form));
      refreshPublicDomains();
      setSaveStatus("success");
      setSaveMsg("All changes saved.");
      setIsDirty(false);
      // Sync domainMeta with any general-section edits
      setDomainMeta(prev => prev ? {
        ...prev,
        name:         form.general_name         || prev.name,
        short_name:   form.general_short_name   || prev.short_name,
        accent_color: form.general_accent_color || prev.accent_color,
      } : prev);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setSaveStatus("error");
      setSaveMsg(Array.isArray(detail) ? detail[0]?.msg : (detail ?? "Save failed."));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3500);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-brand-blue/50" />
      </div>
    );
  }
  if (!form || !domainMeta) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
        <p className="text-sm text-gray-500">{saveMsg || "Domain not found"}</p>
        <Link to="/admin/domains" className="mt-4 inline-block text-sm text-brand-blue hover:underline">Back to Domains</Link>
      </div>
    );
  }

  const ac            = form.general_accent_color || domainMeta.accent_color || "#0560DF";
  const displayName   = form.general_short_name || form.general_name || domainMeta.name;
  const previewDomain = buildPreviewDomain(form, domainMeta);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden -mx-6 -mt-6">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <header className="flex-none flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white z-20">
        <Link to="/admin/domains" aria-label="Back to Domains" className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
          <ArrowLeft size={18} />
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow" style={{ backgroundColor: ac }} />
          <h1 className="text-sm font-bold text-gray-900 truncate">{displayName}</h1>
          <span className="hidden md:block text-gray-300 text-xs font-mono">/domains/{domainMeta.slug}</span>
        </div>

        <div className="flex-1" />

        {/* Save status */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && saveStatus === "idle" && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}
          {saveStatus === "success" && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium max-w-[200px] truncate">
              <AlertCircle size={13} /> {saveMsg}
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            aria-label="Save changes"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* ── Workspace ───────────────────────────────────────────────────── */}
      {/*
        Breakpoints (based on available width):
          < 1200px  → flex-col  (tabs → editor → preview stacked)
          1200–1799px → flex-row (editor+tabs | preview)
          ≥ 1800px  → flex-row (sidebar nav | editor | preview)
      */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col [@media(min-width:1200px)]:flex-row overflow-hidden">

        {/* LEFT: Compact section navigator — only at ≥1800px */}
        <aside
          aria-label="Section navigator"
          className="hidden [@media(min-width:1800px)]:flex flex-col shrink-0 w-52 border-r border-gray-100 bg-white overflow-y-auto"
        >
          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sections</p>
          </div>
          <SectionNav activeSection={activeSection} onSelect={handleSectionSelect} form={form} />
        </aside>

        {/* CENTER: Editor column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/40">
          {/* Tab strip — shown below 1800px (both 2-col and stacked) */}
          <div className="[@media(min-width:1800px)]:hidden">
            <SectionTabStrip activeSection={activeSection} onSelect={handleSectionSelect} form={form} />
          </div>

          {/* Editor scroll area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 max-w-2xl mx-auto pb-16">
              <ActiveSectionEditor
                activeSection={activeSection}
                form={form}
                set={set}
                domainId={id!}
                domainSlug={domainMeta.slug}
                accentColor={ac}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Live preview panel */}
        {/*
          At < 1200px: stacked below editor, fixed height 400px
          At ≥ 1200px: side panel, full height, 48% width
          At ≥ 1800px: 42% width (because sidebar nav takes 208px)
        */}
        {/*
          Preview column:
          • flex: 0 0 auto (flex-none) + explicit percentage width — does not
            grow/shrink based on content, so the 1280px logical viewport inside
            can NEVER push this column (or the workspace) wider.
          • min-w-0 — required on any flex item that should not expand its parent.
          • overflow-hidden — clips any accidental child overflow at this boundary.
        */}
        <div className={[
          "flex-none flex flex-col min-w-0 overflow-hidden",
          "border-t border-gray-200",
          "h-[400px]",
          "[@media(min-width:1200px)]:h-full",
          "[@media(min-width:1200px)]:w-[48%]",
          "[@media(min-width:1200px)]:border-t-0",
          "[@media(min-width:1200px)]:border-l",
          "[@media(min-width:1800px)]:w-[42%]",
        ].join(" ")}
        >
          <PreviewStage
            domain={previewDomain}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            previewZoom={previewZoom}
            setPreviewZoom={setPreviewZoom}
            scrollerRef={scrollerRef}
            viewportRef={viewportRef}
            mobileFrameRef={mobileFrameRef}
          />
        </div>

      </div>
    </div>
  );
}
