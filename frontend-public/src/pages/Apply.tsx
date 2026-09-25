import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import { FadeInView } from "@/components/shared/FadeInView";
import { useDomains } from "@/contexts/DomainsProvider";
import {
  AnimatedFormContainer,
  AnimatedInput,
  AnimatedTextarea,
  AnimatedSelect,
  AnimatedFileUpload,
  AnimatedSubmitButton,
  ApplicationSuccessModal,
} from "@/components/shared/form";
import { PolicyConsentBox, type ConsentState } from "@/components/shared/PolicyConsentBox";
import { PolicyModal, type PolicyDocument } from "@/components/shared/PolicyModal";
import { getApiUrl, publicApi } from "@/lib/api";
import { normalizeApiError } from "@shared/lib/apiError";
import {
  validatePersonName,
  validateEmail,
  validatePhone,
  validateInstitutionName,
  validateCourseYear,
  validateFreeText,
  validateSelect,
} from "@/lib/formValidation";

const EMPTY_CONSENT: ConsentState = { accepted: false, documentId: null, version: null };

export default function Apply() {
  const { domains } = useDomains();
  const [submitted, setSubmitted] = useState(false); // true after first successful POST — prevents duplicate submissions
  const [successOpen, setSuccessOpen] = useState(false); // controls the success popup overlay
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", domain_slug: "", college: "",
    course_year: "", mode: "Online", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    full_name: "", email: "", phone: "", domain_slug: "",
    college: "", course_year: "", message: "", resume: ""
  });

  // Policy state
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesError, setPoliciesError] = useState("");
  const [termsDoc, setTermsDoc] = useState<PolicyDocument | null>(null);
  const [rulesDoc, setRulesDoc] = useState<PolicyDocument | null>(null);
  const [termsConsent, setTermsConsent] = useState<ConsentState>(EMPTY_CONSENT);
  const [rulesConsent, setRulesConsent] = useState<ConsentState>(EMPTY_CONSENT);
  const [openModal, setOpenModal] = useState<"terms" | "rules" | null>(null);

  // Load active policies on mount
  useEffect(() => {
    setPoliciesLoading(true);
    setPoliciesError("");
    publicApi
      .getActivePolicies("INTERNSHIP")
      .then((res) => {
        const docs: PolicyDocument[] = res.data ?? [];
        setTermsDoc(docs.find((d) => d.document_type === "TERMS") ?? null);
        setRulesDoc(docs.find((d) => d.document_type === "RULES") ?? null);
      })
      .catch(() => {
        setPoliciesError(
          "Terms & Conditions and Rules & Regulations could not be loaded. Please refresh the page."
        );
      })
      .finally(() => setPoliciesLoading(false));
  }, []);

  const formIsValid =
    !validatePersonName(form.full_name) &&
    !validateEmail(form.email) &&
    !validatePhone(form.phone, true) &&
    !validateSelect(form.domain_slug, "Please select a domain of interest.") &&
    !validateInstitutionName(form.college) &&
    !validateCourseYear(form.course_year) &&
    !validateFreeText(form.message, 0, 1000, false) &&
    resume !== null;

  const canSubmit =
    formIsValid &&
    termsConsent.accepted &&
    rulesConsent.accepted &&
    !loading &&
    !submitted && // prevent duplicate submissions after success
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
    setLoading(true);
    setError("");

    // Frontend validation
    const errors = {
      full_name: validatePersonName(form.full_name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone, true),
      domain_slug: validateSelect(form.domain_slug, "Please select a domain of interest."),
      college: validateInstitutionName(form.college),
      course_year: validateCourseYear(form.course_year),
      message: validateFreeText(form.message, 0, 1000, false),
      resume: !resume ? "Please upload a resume." : (resume.size > 5 * 1024 * 1024 ? "Resume file is too large. Maximum allowed: 5MB." : "")
    };

    setFieldErrors(errors);

    if (Object.values(errors).some(err => err !== "")) {
      setLoading(false);
      return;
    }

    // Consent validation
    if (!termsConsent.accepted || !termsConsent.documentId) {
      setError("You must accept the Terms & Conditions before submitting.");
      setLoading(false);
      return;
    }
    if (!rulesConsent.accepted || !rulesConsent.documentId) {
      setError("You must accept the Rules & Regulations before submitting.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (resume) fd.append("resume", resume);
      // Send consent references — backend validates and generates timestamps
      fd.append("terms_document_id", termsConsent.documentId);
      fd.append("terms_version", String(termsConsent.version ?? 0));
      fd.append("rules_document_id", rulesConsent.documentId!);
      fd.append("rules_version", String(rulesConsent.version ?? 0));

      const res = await fetch(getApiUrl("/internships/apply"), { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw { response: { data: data, status: res.status } };
      }
      setSubmitted(true);
      setSuccessOpen(true);
    } catch (err: any) {
      const apiError = normalizeApiError(err);
      setError(apiError.message || "Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    // submitted remains true — form stays visible but submit is disabled,
    // preventing accidental re-submission.
  };

  const activeModalDoc = openModal === "terms" ? termsDoc : rulesDoc;

  return (
    <Layout>
      <SEO 
        title="Apply for Internship | Raashi Cognitive Technologies" 
        description="Apply for an internship at Raashi Cognitive Technologies. Build real-world skills and kickstart your career in technology."
        robots="noindex, nofollow"
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
                "name": "Internships",
                "item": "https://raashitech.com/internships"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Apply",
                "item": "https://raashitech.com/apply"
              }
            ]
          })}
        </script>
      </SEO>
      <div className="bg-brand-surface py-20 lg:py-28 min-h-[80vh] flex items-center relative overflow-hidden">
        {/* Soft color orbs behind the glass panel */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-royal/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <FadeInView className="bg-white/55 backdrop-blur-xl backdrop-saturate-[160%] border border-white/60 rounded-3xl shadow-glass p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-navy mb-3">Apply for Internship</h1>
              <p className="text-brand-navy/60">Fill out your details to begin your journey with us.</p>
            </div>

            <AnimatedFormContainer onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AnimatedInput 
                    id="intern-name" 
                    label="Full Name"
                    required 
                    value={form.full_name}
                    onChange={e => {
                      setForm({ ...form, full_name: e.target.value });
                      setFieldErrors(prev => ({ ...prev, full_name: validatePersonName(e.target.value) }));
                    }}
                    placeholder="Your full name"
                    hasError={Boolean(fieldErrors.full_name)}
                    errorMessage={fieldErrors.full_name}
                    errorId="intern-name-error"
                    aria-invalid={Boolean(fieldErrors.full_name)}
                    aria-describedby={fieldErrors.full_name ? "intern-name-error" : undefined}
                    isValid={!validatePersonName(form.full_name) && form.full_name.length > 0}
                  />
                  <AnimatedInput 
                    id="intern-email" 
                    type="email" 
                    label="Email"
                    required 
                    value={form.email}
                    onChange={e => {
                      setForm({ ...form, email: e.target.value });
                      setFieldErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                    }}
                    placeholder="you@example.com"
                    hasError={Boolean(fieldErrors.email)}
                    errorMessage={fieldErrors.email}
                    errorId="intern-email-error"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "intern-email-error" : undefined}
                    isValid={!validateEmail(form.email) && form.email.length > 0}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AnimatedInput 
                    id="intern-phone" 
                    type="tel" 
                    label="Phone"
                    required 
                    value={form.phone}
                    onChange={e => {
                      setForm({ ...form, phone: e.target.value });
                      setFieldErrors(prev => ({ ...prev, phone: validatePhone(e.target.value, true) }));
                    }}
                    placeholder="+91 XXXXX XXXXX"
                    hasError={Boolean(fieldErrors.phone)}
                    errorMessage={fieldErrors.phone}
                    errorId="intern-phone-error"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? "intern-phone-error" : undefined}
                    isValid={!validatePhone(form.phone, true) && form.phone.length > 0}
                  />
                  <AnimatedSelect 
                    id="intern-domain" 
                    label="Domain of Interest"
                    required 
                    value={form.domain_slug}
                    onChange={e => {
                      setForm({ ...form, domain_slug: e.target.value });
                      setFieldErrors(prev => ({ ...prev, domain_slug: validateSelect(e.target.value, "Please select a domain of interest.") }));
                    }}
                    hasError={Boolean(fieldErrors.domain_slug)}
                    errorMessage={fieldErrors.domain_slug}
                    errorId="intern-domain-error"
                    aria-invalid={Boolean(fieldErrors.domain_slug)}
                    aria-describedby={fieldErrors.domain_slug ? "intern-domain-error" : undefined}
                    isValid={form.domain_slug.length > 0}
                  >
                    <option value="">Select domain</option>
                    {domains.map(d => <option key={d.slug} value={d.slug}>{d.shortName}</option>)}
                  </AnimatedSelect>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AnimatedInput 
                    id="intern-college" 
                    label="College / University"
                    value={form.college}
                    onChange={e => {
                      setForm({ ...form, college: e.target.value });
                      setFieldErrors(prev => ({ ...prev, college: validateInstitutionName(e.target.value) }));
                    }}
                    placeholder="College / University name"
                    hasError={Boolean(fieldErrors.college)}
                    errorMessage={fieldErrors.college}
                    errorId="intern-college-error"
                    aria-invalid={Boolean(fieldErrors.college)}
                    aria-describedby={fieldErrors.college ? "intern-college-error" : undefined}
                    isValid={!validateInstitutionName(form.college) && form.college.length > 0}
                  />
                  <AnimatedInput 
                    id="intern-course" 
                    label="Course & Year"
                    value={form.course_year}
                    onChange={e => {
                      setForm({ ...form, course_year: e.target.value });
                      setFieldErrors(prev => ({ ...prev, course_year: validateCourseYear(e.target.value) }));
                    }}
                    placeholder="e.g. B.E. CSE, 3rd Year"
                    hasError={Boolean(fieldErrors.course_year)}
                    errorMessage={fieldErrors.course_year}
                    errorId="intern-course-error"
                    aria-invalid={Boolean(fieldErrors.course_year)}
                    aria-describedby={fieldErrors.course_year ? "intern-course-error" : undefined}
                    isValid={!validateCourseYear(form.course_year) && form.course_year.length > 0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-2">Mode Preference</label>
                  <div className="flex gap-5">
                    {["Online", "Offline"].map(m => (
                      <label key={m} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="mode" value={m} checked={form.mode === m}
                          onChange={() => setForm({ ...form, mode: m })}
                          className="accent-brand-blue w-4 h-4" />
                        <span className="text-sm text-brand-navy">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <AnimatedTextarea 
                  id="intern-message" 
                  label="Message / Cover Note"
                  rows={4} 
                  value={form.message}
                  onChange={e => {
                    setForm({ ...form, message: e.target.value });
                    setFieldErrors(prev => ({ ...prev, message: validateFreeText(e.target.value, 0, 1000, false) }));
                  }}
                  placeholder="Tell us why you're interested in this internship..."
                  hasError={Boolean(fieldErrors.message)}
                  errorMessage={fieldErrors.message}
                  errorId="intern-message-error"
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={fieldErrors.message ? "intern-message-error" : undefined}
                  isValid={!validateFreeText(form.message, 0, 1000, false) && form.message.length > 0}
                />
                <AnimatedFileUpload 
                  id="intern-resume" 
                  label="Resume (PDF)"
                  accept=".pdf"
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
                  <p id="intern-resume-error" className="mt-1.5 text-xs text-brand-red break-words">
                    {fieldErrors.resume}
                  </p>
                )}

                {/* Policy Consent */}
                <PolicyConsentBox
                  audience="INTERNSHIP"
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

                {error && <p className="text-sm text-brand-red">{error}</p>}
                
                <AnimatedSubmitButton 
                  isLoading={loading}
                  disabled={!canSubmit}
                  defaultText="Submit Application"
                />
              </AnimatedFormContainer>
          </FadeInView>
        </div>

        {/* Application success popup — floats above the form */}
        <ApplicationSuccessModal
          open={successOpen}
          title="Application Received!"
          message="Thank you for applying. Please check your inbox for a confirmation email and next steps."
          onClose={handleSuccessClose}
          applicationType="internship"
        />
      </div>

      {/* Policy modals */}
      <PolicyModal
        isOpen={openModal !== null}
        document={activeModalDoc}
        loading={policiesLoading}
        onClose={() => setOpenModal(null)}
        onAgree={openModal === "terms" ? handleAgreeTerms : handleAgreeRules}
      />
    </Layout>
  );
}
