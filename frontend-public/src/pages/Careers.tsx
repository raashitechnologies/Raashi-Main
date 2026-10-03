import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, Briefcase, MapPin, Clock, Lightbulb, TrendingUp, Users, BookOpen, FileText, Edit3, X, ChevronLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import FoldText from "@/components/shared/FoldText";
import { FadeInView } from "@/components/shared/FadeInView";
import { MotionCard } from "@/components/shared/MotionCard";
import { MotionSection } from "@/components/shared/MotionSection";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { getApiUrl, publicApi } from "@/lib/api";
import {
  AnimatedFormContainer,
  AnimatedInput,
  AnimatedTextarea,
  AnimatedFileUpload,
  AnimatedSubmitButton,
  ApplicationSuccessModal,
} from "@/components/shared/form";
import { PolicyConsentBox, type ConsentState } from "@/components/shared/PolicyConsentBox";
import { PolicyModal, type PolicyDocument } from "@/components/shared/PolicyModal";
import { Button } from "@/components/shared/Button";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";
import {
  validatePersonName,
  validateEmail,
  validatePhone,
  validateJobPosition,
  validateURL,
  validateFreeText,
} from "@/lib/formValidation";

interface JobOpening {
  _id?: string;
  id?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  posted_at: string;
  // Extended JD fields (may not exist in all records)
  reporting_to?: string;
  role_purpose?: string;
  key_responsibilities?: string[];
  key_skills?: string[];
  education_experience?: string;
}

const whyWorkCards = [
  { icon: Lightbulb, label: "Innovation Driven", desc: "Work on meaningful problems with cutting-edge technology." },
  { icon: TrendingUp, label: "Growth Opportunities", desc: "Clear pathways to grow your skills and your career." },
  { icon: Users, label: "Collaborative Culture", desc: "A team that learns together and wins together." },
  { icon: BookOpen, label: "Learning First", desc: "Continuous training and upskilling are in our DNA." },
];

const EMPTY_CONSENT: ConsentState = { accepted: false, documentId: null, version: null };

export default function Careers() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'choice' | 'jd' | 'form'>('choice');
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedJobObj, setSelectedJobObj] = useState<JobOpening | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", position: "", portfolio_url: "", message: "" });
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false); // true after success — prevents re-submission
  const [successOpen, setSuccessOpen] = useState(false); // controls the success popup overlay
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    full_name: "", email: "", phone: "", position: "",
    portfolio_url: "", message: "", resume: ""
  });

  // Policy state
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesError, setPoliciesError] = useState("");
  const [termsDoc, setTermsDoc] = useState<PolicyDocument | null>(null);
  const [rulesDoc, setRulesDoc] = useState<PolicyDocument | null>(null);
  const [termsConsent, setTermsConsent] = useState<ConsentState>(EMPTY_CONSENT);
  const [rulesConsent, setRulesConsent] = useState<ConsentState>(EMPTY_CONSENT);
  const [openModal, setOpenModal] = useState<"terms" | "rules" | null>(null);

  const location = useLocation();

  // Load active career policies on mount
  useEffect(() => {
    setPoliciesLoading(true);
    setPoliciesError("");
    publicApi
      .getActivePolicies("CAREER")
      .then((res) => {
        const docs: PolicyDocument[] = res.data ?? [];
        setTermsDoc(docs.find((d) => d.document_type === "TERMS") ?? null);
        setRulesDoc(docs.find((d) => d.document_type === "RULES") ?? null);
      })
      .catch(() => {
        setPoliciesError("Terms & Conditions and Rules & Regulations could not be loaded.");
      })
      .finally(() => setPoliciesLoading(false));
  }, []);

  // Fetch active jobs from MongoDB — re-fetches on every navigation to this page
  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError("");
    publicApi
      .getActiveJobs()
      .then((res) => {
        const jobsData = res.data?.jobs ?? [];
        setJobs(jobsData);
      })
      .catch((err) => {
        const apiError = normalizeApiError(err);
        setError(apiError.message || "Unable to load job openings. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [location.key, fetchJobs]);

  const openApply = (jobTitle = "General Application", jobObj: JobOpening | null = null) => {
    const title = jobTitle || "General Application";
    setSelectedJob(title);
    setSelectedJobObj(jobObj);
    setForm(f => ({ ...f, position: title }));
    setFieldErrors(prev => ({ ...prev, position: "" }));
    // Reset consent each time a new application is opened
    setTermsConsent(EMPTY_CONSENT);
    setRulesConsent(EMPTY_CONSENT);
    setOpenModal(null);
    setModalStep('choice');
    setApplyOpen(true);
  };

  const closeApply = () => {
    setApplyOpen(false);
    if (window.location.hash === "#apply-general") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  useEffect(() => {
    if (location.hash === "#apply-general") {
      openApply("General Application");
    }
  }, [location.hash]);

  const canSubmit =
    !validatePersonName(form.full_name) &&
    !validateEmail(form.email) &&
    !validatePhone(form.phone, true) &&
    !validateJobPosition(form.position) &&
    !validateURL(form.portfolio_url, false) &&
    !validateFreeText(form.message, 0, 1000, false) &&
    resume !== null &&
    termsConsent.accepted &&
    rulesConsent.accepted &&
    !submitLoading &&
    !submitted && // prevent re-submission after success
    !policiesLoading &&
    !policiesError;

  const handleAgreeTerms = (doc: PolicyDocument) => {
    setTermsConsent({ accepted: true, documentId: doc.id, version: doc.version });
  };

  const handleAgreeRules = (doc: PolicyDocument) => {
    setRulesConsent({ accepted: true, documentId: doc.id, version: doc.version });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError("");

    // Frontend validation
    const errors = {
      full_name: validatePersonName(form.full_name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone, true),
      position: validateJobPosition(form.position),
      portfolio_url: validateURL(form.portfolio_url, false),
      message: validateFreeText(form.message, 0, 1000, false),
      resume: !resume ? "Please upload a resume." : (resume.size > 5 * 1024 * 1024 ? "Resume file is too large. Maximum allowed: 5MB." : "")
    };

    setFieldErrors(errors);

    if (Object.values(errors).some(err => err !== "")) {
      setSubmitLoading(false);
      return;
    }

    // Consent guard
    if (!termsConsent.accepted || !termsConsent.documentId) {
      setSubmitError("You must accept the Terms & Conditions before submitting.");
      setSubmitLoading(false);
      return;
    }
    if (!rulesConsent.accepted || !rulesConsent.documentId) {
      setSubmitError("You must accept the Rules & Regulations before submitting.");
      setSubmitLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (resume) fd.append("resume", resume);
      // Consent references — backend generates authoritative timestamps
      fd.append("terms_document_id", termsConsent.documentId);
      fd.append("terms_version", String(termsConsent.version ?? 0));
      fd.append("rules_document_id", rulesConsent.documentId!);
      fd.append("rules_version", String(rulesConsent.version ?? 0));

      const res = await fetch(getApiUrl("/careers/apply"), { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Submission failed. Please try again.");
      }
      setSubmitted(true);
      setSuccessOpen(true);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const activeModalDoc = openModal === "terms" ? termsDoc : rulesDoc;

  return (
    <Layout
      prefooter={{
        headline: "Don't See the Right Role?",
        subtext: "We're always looking for great talent. Send us your resume anytime.",
        buttonLabel: "Send General Application",
        buttonHref: "#apply-general",
        onButtonClick: () => openApply("General Application"),
      }}
    >
      <SEO 
        title="Careers | Raashi Cognitive Technologies" 
        description="Join Raashi Cognitive Technologies. We're looking for curious, driven individuals to build intelligent solutions in AI, IoT, and Engineering."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://raashitech.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Careers",
                "item": "https://raashitech.com/careers"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Careers | Raashi Cognitive Technologies",
            "description": "Join Raashi Cognitive Technologies. We're looking for curious, driven individuals to build intelligent solutions in AI, IoT, and Engineering.",
            "url": "https://raashitech.com/careers"
          })}
        </script>
      </SEO>
      {/* 1. Hero */}
      <section className="bg-brand-navy section-py relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse 60% 50% at 60% 50%, #0560DF, transparent)" }} />
        <div className="section-container relative z-10">
          <Breadcrumb items={[{ label: "Careers" }]} />
          <div className="mt-8 max-w-2xl">
            <h1 className="text-[clamp(1.75rem,5vw,3.5rem)] font-bold text-white leading-tight mb-5">
              <FoldText 
                text="Careers at Raashi —" 
                splitBy="char"
                hinge="top"
                trigger="scroll"
                duration={0.65}
                stagger={0.035}
                ease="power3.out"
                perspective={700}
                creaseShading={0.45}
                fontSize="clamp(2rem, 4vw, 4rem)"
                color="white"
              />{" "}
              <span className="text-brand-orange">
                <FoldText 
                  text="Build Your Career With Us" 
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  duration={0.65}
                  stagger={0.035}
                  ease="power3.out"
                  perspective={700}
                  creaseShading={0.45}
                  fontSize="clamp(2rem, 4vw, 4rem)"
                />
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              Join a growing technology company where innovation, collaboration, and continuous learning
              are at the core of everything we do. We're looking for curious, driven individuals who want
              to make a real difference.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Why Work With Us */}
      <section className="section-py bg-[#F5F0E6]">
        <div className="section-container">
          <MotionSection className="text-center mb-10">
            <SectionEyebrow>Why Work With Us</SectionEyebrow>
            <h2 className="text-3xl font-bold text-brand-navy">A Place to Grow</h2>
          </MotionSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyWorkCards.map(({ icon: Icon, label, desc }, i) => (
              <MotionCard key={label} index={i} total={whyWorkCards.length}>
                <div className="warm-tile flex flex-col h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#4A90D9]/10 flex items-center justify-center mb-3">
                    <Icon size={21} style={{ color: '#4A90D9' }} strokeWidth={1.8} />
                  </div>
                  <h4 className="font-bold mb-1.5" style={{ color: '#174A7E' }}>{label}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(23,74,126,0.6)' }}>{desc}</p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Open Positions */}
      <section id="openings" className="section-py bg-background">
        <div className="section-container max-w-5xl">
          <MotionSection className="text-center mb-10">
            <SectionEyebrow>Join Our Team</SectionEyebrow>
            <h2 className="text-3xl font-bold text-brand-navy">Open Positions</h2>
          </MotionSection>

          {/* Loading state */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-[#F1F1EE] animate-pulse border border-[#E98A3A]/15" />
              ))}
            </div>
          ) : error ? (
            /* Error state */
            <FadeInView>
              <ErrorState 
                message={error} 
                onRetry={fetchJobs}
                variant="public"
              />
            </FadeInView>
          ) : jobs.length > 0 ? (
            /* Jobs list */
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <MotionCard key={job._id || job.id} index={i} total={jobs.length} variant="panel">
                  <div className="bg-[#F1F1EE] rounded-2xl border border-[#E98A3A]/20 p-6 shadow-warm-card hover:shadow-warm-hover transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                      <div>
                        <h3 className="font-bold text-brand-navy text-lg mb-1 break-words">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-brand-navy/55">
                          <span className="flex items-center gap-1"><Briefcase size={13} />{job.department}</span>
                          <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>
                          <span className="flex items-center gap-1"><Clock size={13} />{job.type}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => openApply(job.title, job)}
                        variant="primary"
                        size="md"
                        className="shrink-0 shadow-sm w-full sm:w-auto"
                      >
                        <span className="flex items-center gap-2">
                          View &amp; Apply <ArrowRight size={14} />
                        </span>
                      </Button>
                    </div>
                  </div>
                </MotionCard>
              ))}
            </div>
          ) : (
            /* Empty state */
            <FadeInView>
              <EmptyState 
                title="No open positions right now"
                message="But we're always looking for great talent! Send us your resume and we'll reach out when a suitable role opens up."
                variant="public"
              >
                <Button
                  onClick={() => openApply("General Application")}
                  variant="primary"
                  size="md"
                  className="shadow-sm mx-auto mt-6"
                >
                  <span className="flex items-center gap-2">
                    Send Your Resume <ArrowRight size={14} />
                  </span>
                </Button>
              </EmptyState>
            </FadeInView>
          )}
        </div>
      </section>

      {/* Apply Modal — Two-step: choice → JD or form */}
      {applyOpen && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-[160%] border border-white/60 rounded-3xl shadow-glass w-full max-w-lg flex flex-col max-h-[calc(100dvh-2rem)]">

            {/* ── Modal Header ── */}
            <div className="shrink-0 border-b border-white/60 px-6 py-4 flex items-start justify-between rounded-t-3xl bg-white/40">
              <div className="flex items-center gap-2 min-w-0">
                {modalStep !== 'choice' && (
                  <button
                    onClick={() => setModalStep('choice')}
                    aria-label="Back to options"
                    className="shrink-0 text-brand-navy/50 hover:text-brand-navy transition-colors mr-1"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-0.5">
                    {modalStep === 'choice' ? 'Apply for' : modalStep === 'jd' ? 'Job Description' : 'Apply for'}
                  </p>
                  <h2 className="text-lg font-bold text-brand-navy leading-snug truncate">{selectedJob || "General Application"}</h2>
                </div>
              </div>
              <button
                onClick={closeApply}
                aria-label="Close application form"
                className="ml-4 mt-0.5 shrink-0 text-brand-navy/50 hover:text-brand-navy transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Step: Choice ── */}
            {modalStep === 'choice' && (
              <div className="p-6 space-y-4">
                <p className="text-sm text-brand-navy/60 text-center mb-2">What would you like to do?</p>
                <button
                  onClick={() => setModalStep('jd')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border border-brand-navy/10 bg-white/60 hover:bg-white/80 hover:border-brand-blue/30 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0 group-hover:bg-brand-blue/15 transition-colors">
                    <FileText size={22} className="text-brand-blue" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy text-sm">Job Description</p>
                    <p className="text-xs text-brand-navy/50 mt-0.5">View role details, responsibilities & requirements</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-brand-navy/30 group-hover:text-brand-blue transition-colors shrink-0" />
                </button>
                <button
                  onClick={() => setModalStep('form')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border border-brand-navy/10 bg-white/60 hover:bg-white/80 hover:border-brand-orange/30 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/15 transition-colors">
                    <Edit3 size={22} className="text-brand-orange" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy text-sm">Fill Details</p>
                    <p className="text-xs text-brand-navy/50 mt-0.5">Submit your application with resume & cover note</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-brand-navy/30 group-hover:text-brand-orange transition-colors shrink-0" />
                </button>
              </div>
            )}

            {/* ── Step: Job Description ── */}
            {modalStep === 'jd' && (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
                {/* Description */}
                {selectedJobObj?.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-2">Overview</h3>
                    <p className="text-sm text-brand-navy/70 leading-relaxed whitespace-pre-line">{selectedJobObj.description}</p>
                  </div>
                )}
                {/* Role Purpose */}
                {selectedJobObj?.role_purpose && (
                  <div>
                    <h3 className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-2">Role Purpose</h3>
                    <p className="text-sm text-brand-navy/70 leading-relaxed whitespace-pre-line">{selectedJobObj.role_purpose}</p>
                  </div>
                )}
                {/* Reporting To */}
                {selectedJobObj?.reporting_to && (
                  <div>
                    <h3 className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-2">Reporting To</h3>
                    <p className="text-sm text-brand-navy/70">{selectedJobObj.reporting_to}</p>
                  </div>
                )}
                {/* Key Responsibilities */}
                {selectedJobObj?.key_responsibilities && selectedJobObj.key_responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-2">Key Responsibilities</h3>
                    <ul className="space-y-1.5">
                      {selectedJobObj.key_responsibilities.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-brand-navy/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/40 shrink-0 mt-1.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Key Skills */}
                {selectedJobObj?.key_skills && selectedJobObj.key_skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-2">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobObj.key_skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-brand-blue/8 text-brand-navy/70 text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Education & Experience */}
                {selectedJobObj?.education_experience && (
                  <div>
                    <h3 className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wide mb-2">Education & Experience</h3>
                    <p className="text-sm text-brand-navy/70 leading-relaxed whitespace-pre-line">{selectedJobObj.education_experience}</p>
                  </div>
                )}
                {/* No JD fields populated */}
                {!selectedJobObj?.description && !selectedJobObj?.role_purpose && !selectedJobObj?.key_responsibilities?.length && (
                  <div className="text-center py-8">
                    <FileText size={32} className="text-brand-navy/20 mx-auto mb-3" />
                    <p className="text-sm text-brand-navy/50">Detailed job description is not available yet.</p>
                    <p className="text-xs text-brand-navy/40 mt-1">Please proceed to fill in your details to apply.</p>
                  </div>
                )}
                {/* CTA to apply */}
                <div className="pt-2">
                  <Button
                    onClick={() => setModalStep('form')}
                    variant="primary"
                    size="md"
                    className="w-full shadow-sm"
                  >
                    <span className="flex items-center gap-2">Fill Details & Apply <ArrowRight size={15} /></span>
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step: Application Form ── */}
            {modalStep === 'form' && (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
                <AnimatedFormContainer onSubmit={handleSubmit} noValidate className="space-y-4">
                  <AnimatedInput 
                    id="career-name"
                    label="Full Name"
                    required
                    value={form.full_name}
                    onChange={e => {
                      setForm({ ...form, full_name: e.target.value });
                      setFieldErrors(prev => ({ ...prev, full_name: validatePersonName(e.target.value) }));
                    }}
                    hasError={Boolean(fieldErrors.full_name)}
                    errorMessage={fieldErrors.full_name}
                    errorId="career-name-error"
                    aria-invalid={Boolean(fieldErrors.full_name)}
                    aria-describedby={fieldErrors.full_name ? "career-name-error" : undefined}
                    isValid={!validatePersonName(form.full_name) && form.full_name.length > 0}
                  />
                  <AnimatedInput 
                    id="career-email"
                    type="email"
                    label="Email"
                    required
                    value={form.email}
                    onChange={e => {
                      setForm({ ...form, email: e.target.value });
                      setFieldErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                    }}
                    hasError={Boolean(fieldErrors.email)}
                    errorMessage={fieldErrors.email}
                    errorId="career-email-error"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "career-email-error" : undefined}
                    isValid={!validateEmail(form.email) && form.email.length > 0}
                  />
                  <AnimatedInput 
                    id="career-phone"
                    type="tel"
                    label="Phone"
                    required
                    value={form.phone}
                    onChange={e => {
                      setForm({ ...form, phone: e.target.value });
                      setFieldErrors(prev => ({ ...prev, phone: validatePhone(e.target.value, true) }));
                    }}
                    hasError={Boolean(fieldErrors.phone)}
                    errorMessage={fieldErrors.phone}
                    errorId="career-phone-error"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? "career-phone-error" : undefined}
                    isValid={!validatePhone(form.phone, true) && form.phone.length > 0}
                  />
                  {selectedJob === "General Application" && (
                    <AnimatedInput 
                      id="career-position"
                      label="Desired Role / Position"
                      required
                      value={form.position}
                      onChange={e => {
                        setForm({ ...form, position: e.target.value });
                        setFieldErrors(prev => ({ ...prev, position: validateJobPosition(e.target.value) }));
                      }}
                      placeholder="e.g. AI Engineer, Full Stack Developer, or General Application"
                      hasError={Boolean(fieldErrors.position)}
                      errorMessage={fieldErrors.position}
                      errorId="career-position-error"
                      aria-invalid={Boolean(fieldErrors.position)}
                      aria-describedby={fieldErrors.position ? "career-position-error" : undefined}
                      isValid={!validateJobPosition(form.position) && form.position.length > 0}
                    />
                  )}
                  <AnimatedInput 
                    id="career-portfolio"
                    type="url"
                    label="LinkedIn / Portfolio URL"
                    value={form.portfolio_url}
                    onChange={e => {
                      setForm({ ...form, portfolio_url: e.target.value });
                      setFieldErrors(prev => ({ ...prev, portfolio_url: validateURL(e.target.value, false) }));
                    }}
                    placeholder="https://linkedin.com/in/yourprofile"
                    hasError={Boolean(fieldErrors.portfolio_url)}
                    errorMessage={fieldErrors.portfolio_url}
                    errorId="career-portfolio-error"
                    aria-invalid={Boolean(fieldErrors.portfolio_url)}
                    aria-describedby={fieldErrors.portfolio_url ? "career-portfolio-error" : undefined}
                    isValid={!validateURL(form.portfolio_url, false) && form.portfolio_url.length > 0}
                  />
                  <AnimatedFileUpload 
                    id="career-resume"
                    label="Resume (PDF)"
                    accept=".pdf"
                    required
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setResume(file);
                      if (file && file.size > 5 * 1024 * 1024) {
                        setFieldErrors(prev => ({ ...prev, resume: "Resume file is too large. Maximum allowed: 5MB." }));
                      } else if (file) {
                        setFieldErrors(prev => ({ ...prev, resume: "" }));
                      } else {
                        setFieldErrors(prev => ({ ...prev, resume: "Please upload a resume." }));
                      }
                    }}
                    selectedFile={resume}
                    hasError={Boolean(fieldErrors.resume)}
                  />
                  {fieldErrors.resume && (
                    <p id="career-resume-error" className="mt-1.5 text-xs text-brand-red break-words">
                      {fieldErrors.resume}
                    </p>
                  )}
                  <AnimatedTextarea 
                    id="career-message"
                    label="Message"
                    rows={3}
                    value={form.message}
                    onChange={e => {
                      setForm({ ...form, message: e.target.value });
                      setFieldErrors(prev => ({ ...prev, message: validateFreeText(e.target.value, 0, 1000, false) }));
                    }}
                    placeholder="Tell us a bit about yourself..."
                    hasError={Boolean(fieldErrors.message)}
                    errorMessage={fieldErrors.message}
                    errorId="career-message-error"
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "career-message-error" : undefined}
                    isValid={!validateFreeText(form.message, 0, 1000, false) && form.message.length > 0}
                  />

                  {/* Policy Consent */}
                  <PolicyConsentBox
                    audience="CAREER"
                    termsDoc={termsDoc}
                    rulesDoc={rulesDoc}
                    loading={policiesLoading}
                    error={policiesError}
                    termsConsent={termsConsent}
                    rulesConsent={rulesConsent}
                    onOpenTerms={() => setOpenModal("terms")}
                    onOpenRules={() => setOpenModal("rules")}
                    onRevokeTerms={() => setTermsConsent(EMPTY_CONSENT)}
                    onRevokeRules={() => setRulesConsent(EMPTY_CONSENT)}
                  />

                  {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
                  
                  <AnimatedSubmitButton 
                    isLoading={submitLoading}
                    disabled={!canSubmit}
                    defaultText="Submit Application"
                  />
                </AnimatedFormContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Policy modals — rendered outside the apply modal to avoid z-index conflicts */}
      <PolicyModal
        isOpen={applyOpen && openModal !== null}
        document={activeModalDoc}
        loading={policiesLoading}
        onClose={() => setOpenModal(null)}
        onAgree={openModal === "terms" ? handleAgreeTerms : handleAgreeRules}
      />

      {/* Application success popup — z-[70] ensures it sits above the career modal (z-50) */}
      <ApplicationSuccessModal
        open={successOpen}
        title="Application Received!"
        message="Thank you for applying. We’ll review your application and get back to you soon."
        onClose={() => {
          setSuccessOpen(false);
          setSubmitted(false);
          closeApply();
        }}
        applicationType="career"
      />
    </Layout>
  );
}
