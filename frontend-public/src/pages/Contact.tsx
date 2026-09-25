import { useState } from "react";

import { ArrowRight, Phone, Mail, MapPin, Clock, MessageSquare, Users, Handshake, Star, HelpCircle } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import FoldText from "@/components/shared/FoldText";
import { FadeInView } from "@/components/shared/FadeInView";
import { MotionCard } from "@/components/shared/MotionCard";
import { MotionSection } from "@/components/shared/MotionSection";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { useContentContext } from "@/contexts/ContentProvider";
import { RaashiFAQ } from "@/components/shared/RaashiFAQ";
import { Button } from "@/components/shared/Button";
import { getApiUrl } from "@/lib/api";
import { normalizeApiError } from "@shared/lib/apiError";
import {
  validatePersonName,
  validateEmail,
  validatePhone,
  validateFreeText,
  validateSelect,
} from "@/lib/formValidation";

const subjectOptions = [
  "General Enquiry", "Internship", "Collaboration", "Partnership", "Feedback", "Other"
];

const connectItems = [
  { icon: MessageSquare, label: "Internship Enquiries", desc: "Ask about our internship programs" },
  { icon: Handshake, label: "Collaboration", desc: "Partner with us on a project" },
  { icon: Users, label: "Partnerships", desc: "Institutional and corporate tie-ups" },
  { icon: HelpCircle, label: "General Queries", desc: "Any question about our services" },
  { icon: Star, label: "Feedback", desc: "Share your experience with us" },
];

const defaultFaqs = [
  { question: "What kind of internships do you offer?", answer: "We offer structured internship programs across five domains: Artificial Intelligence, Research & Innovation, IoT & Smart Automation, Engineering Design & Digital Manufacturing, and Education & Training. Duration ranges from 1–6 months." },
  { question: "How can I apply for an internship?", answer: "Visit our Apply page. Fill in your details, select your preferred domain, and upload your resume. Our team will reach out within 2–3 business days." },
  { question: "Is the internship program online or offline?", answer: "We offer both online and offline modes. You can select your preference during the application process, subject to availability and project requirements." },
  { question: "Will I receive a certificate after completing?", answer: "Yes. All students who successfully complete the internship program receive a Certificate of Completion from Raashi Cognitive Technologies Pvt. Ltd." },
];

export default function Contact() {
  const { getContent } = useContentContext();
  const contactInfo = getContent("contact_info");
  const phone = contactInfo?.phone || "+91 9742419316";
  const email = contactInfo?.email || "raashitechnologies@gmail.com";
  const address = contactInfo?.address || "69, CTS NO.4482B/67, Shruti Layout, Kanabargi Road, Belgaum Fort, Belgaum – 590016, Karnataka";
  const hours = contactInfo?.hours || "Mon – Sat: 9:00 AM – 6:00 PM\nSunday: Closed";

  const faqsContent = getContent("faqs");
  const faqs = (faqsContent?.items as typeof defaultFaqs) || defaultFaqs;

  const [form, setForm] = useState({ full_name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    full_name: "", email: "", phone: "", subject: "", message: ""
  });

  const canSubmit = 
    !validatePersonName(form.full_name) &&
    !validateEmail(form.email) &&
    !validatePhone(form.phone, false) &&
    !validateSelect(form.subject, "Please select a subject.") &&
    !validateFreeText(form.message, 10, 2000, true) &&
    !loading && 
    !submitted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const errors = {
      full_name: validatePersonName(form.full_name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone, false),
      subject: validateSelect(form.subject, "Please select a subject."),
      message: validateFreeText(form.message, 10, 2000, true),
    };

    setFieldErrors(errors);

    if (Object.values(errors).some(err => err !== "")) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl("/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw { response: { data: errorData, status: res.status } };
      }
      setSubmitted(true);
    } catch (err: any) {
      const apiError = normalizeApiError(err);
      setError(apiError.message || "Something went wrong. Please email us directly at raashitechnologies@gmail.com");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      prefooter={{
        headline: "Ready to Start Your Journey with Raashi?",
        subtext: "Apply for our internship or get in touch today.",
        buttonLabel: "Apply Now",
        buttonHref: "/apply",
      }}
    >
      <SEO 
        title="Contact Us | Raashi Cognitive Technologies" 
        description="Get in touch with Raashi Cognitive Technologies. Contact us for internships, collaborations, partnerships, or general inquiries."
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
                "name": "Contact",
                "item": "https://raashitech.com/contact"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Contact Us | Raashi Cognitive Technologies",
            "description": "Get in touch with Raashi Cognitive Technologies. Contact us for internships, collaborations, partnerships, or general inquiries.",
            "url": "https://raashitech.com/contact"
          })}
        </script>
      </SEO>
      {/* 1. Hero */}
      <section className="bg-brand-navy section-py relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, #0560DF, transparent)" }} />
        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            <FoldText 
              text="Contact Us —" 
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
            <span className="text-brand-blue">
              <FoldText 
                text="We're Here to Help!" 
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
                Whether you have a project idea, an internship query, or just want to say hello —
                we'd love to hear from you. Reach out and our team will respond promptly.
              </p>
            </div>
            <div className="hidden lg:flex justify-center gap-6 opacity-30">
              <Mail size={80} className="text-white -rotate-12" strokeWidth={0.7} />
              <Phone size={60} className="text-brand-blue self-end rotate-6" strokeWidth={0.7} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Form + Map */}
      <section className="section-py bg-[#F5F0E6] relative overflow-hidden">
        {/* Soft color orbs behind the glass panels */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-royal/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Form */}
            <FadeInView direction="left">
              <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-[160%] border border-white/60 rounded-3xl shadow-glass p-8">
                <h2 className="text-2xl font-bold text-brand-navy mb-1">Send Us a Message</h2>
                <p className="text-sm text-brand-navy/55 mb-6">We typically respond within 24 hours.</p>

                {submitted ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
                      <Mail size={26} className="text-brand-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-navy mb-2">Message Sent!</h3>
                    <p className="text-brand-navy/55 text-sm">Thank you for reaching out. We'll get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="c-name" className="block text-xs font-semibold text-brand-navy/70 mb-1.5">Full Name *</label>
                        <input id="c-name" required value={form.full_name}
                          onChange={e => {
                            setForm({ ...form, full_name: e.target.value });
                            setFieldErrors(prev => ({ ...prev, full_name: validatePersonName(e.target.value) }));
                          }}
                          aria-invalid={Boolean(fieldErrors.full_name)}
                          aria-describedby={fieldErrors.full_name ? "c-name-error" : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors text-brand-navy ${fieldErrors.full_name ? "border-brand-red/50 focus:border-brand-red" : "border-brand-navy/10 focus:border-brand-blue"}`}
                          placeholder="Your name" />
                        {fieldErrors.full_name && (
                          <p id="c-name-error" className="mt-1.5 text-xs text-brand-red break-words">{fieldErrors.full_name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="c-email" className="block text-xs font-semibold text-brand-navy/70 mb-1.5">Email Address *</label>
                        <input id="c-email" type="email" required value={form.email}
                          onChange={e => {
                            setForm({ ...form, email: e.target.value });
                            setFieldErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                          }}
                          aria-invalid={Boolean(fieldErrors.email)}
                          aria-describedby={fieldErrors.email ? "c-email-error" : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors text-brand-navy ${fieldErrors.email ? "border-brand-red/50 focus:border-brand-red" : "border-brand-navy/10 focus:border-brand-blue"}`}
                          placeholder="you@example.com" />
                        {fieldErrors.email && (
                          <p id="c-email-error" className="mt-1.5 text-xs text-brand-red break-words">{fieldErrors.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="c-phone" className="block text-xs font-semibold text-brand-navy/70 mb-1.5">Phone Number</label>
                        <input id="c-phone" type="tel" value={form.phone}
                          onChange={e => {
                            setForm({ ...form, phone: e.target.value });
                            setFieldErrors(prev => ({ ...prev, phone: validatePhone(e.target.value, false) }));
                          }}
                          aria-invalid={Boolean(fieldErrors.phone)}
                          aria-describedby={fieldErrors.phone ? "c-phone-error" : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors text-brand-navy ${fieldErrors.phone ? "border-brand-red/50 focus:border-brand-red" : "border-brand-navy/10 focus:border-brand-blue"}`}
                          placeholder="+91 XXXXX XXXXX" />
                        {fieldErrors.phone && (
                          <p id="c-phone-error" className="mt-1.5 text-xs text-brand-red break-words">{fieldErrors.phone}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="c-subject" className="block text-xs font-semibold text-brand-navy/70 mb-1.5">Subject *</label>
                        <select id="c-subject" required value={form.subject}
                          onChange={e => {
                            setForm({ ...form, subject: e.target.value });
                            setFieldErrors(prev => ({ ...prev, subject: validateSelect(e.target.value, "Please select a subject.") }));
                          }}
                          aria-invalid={Boolean(fieldErrors.subject)}
                          aria-describedby={fieldErrors.subject ? "c-subject-error" : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors text-brand-navy ${fieldErrors.subject ? "border-brand-red/50 focus:border-brand-red" : "border-brand-navy/10 focus:border-brand-blue"}`}>
                          <option value="">Select subject</option>
                          {subjectOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                        {fieldErrors.subject && (
                          <p id="c-subject-error" className="mt-1.5 text-xs text-brand-red break-words">{fieldErrors.subject}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="c-message" className="block text-xs font-semibold text-brand-navy/70 mb-1.5">Message *</label>
                      <textarea id="c-message" rows={5} required value={form.message}
                        onChange={e => {
                          setForm({ ...form, message: e.target.value });
                          setFieldErrors(prev => ({ ...prev, message: validateFreeText(e.target.value, 10, 2000, true) }));
                        }}
                        aria-invalid={Boolean(fieldErrors.message)}
                        aria-describedby={fieldErrors.message ? "c-message-error" : undefined}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors resize-none text-brand-navy ${fieldErrors.message ? "border-brand-red/50 focus:border-brand-red" : "border-brand-navy/10 focus:border-brand-blue"}`}
                        placeholder="How can we help you?" />
                      {fieldErrors.message && (
                        <p id="c-message-error" className="mt-1.5 text-xs text-brand-red break-words">{fieldErrors.message}</p>
                      )}
                    </div>
                    {error && <p className="text-sm text-brand-red">{error}</p>}
                    <Button type="submit" variant="primary" size="lg" isLoading={loading} disabled={!canSubmit} className="w-full shadow-sm">
                      <span className="flex items-center gap-2">
                        Send Message <ArrowRight size={15} />
                      </span>
                    </Button>
                  </form>
                )}
              </div>
            </FadeInView>

            {/* Office info */}
            <FadeInView direction="right">
              <div className="space-y-5">

                {/* Contact info card */}
                <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-[160%] border border-white/60 rounded-3xl shadow-glass p-6 space-y-4">
                  <h3 className="font-bold text-brand-navy mb-1">Contact Information</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/8 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone size={14} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-navy/40 font-medium">Phone</p>
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-sm font-semibold text-brand-navy hover:text-brand-blue transition-colors">{phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/8 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail size={14} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-navy/40 font-medium">Email</p>
                      <a href={`mailto:${email}`} className="text-sm font-semibold text-brand-navy hover:text-brand-blue transition-colors break-all">{email}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/8 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={14} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-navy/40 font-medium">Address</p>
                      <p className="text-sm text-brand-navy leading-relaxed">{address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/8 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={14} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-navy/40 font-medium">Business Hours</p>
                      {hours.split('\n').map((line: string, i: number) => (
                        <p key={i} className={`text-sm ${i === 0 ? 'text-brand-navy' : 'text-brand-navy/55'}`}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* 3. Connect icons */}
      <section className="section-py bg-background">
        <div className="section-container">
          <MotionSection className="text-center mb-10">
            <SectionEyebrow>We'd Love to Connect</SectionEyebrow>
            <h2 className="text-2xl font-bold text-brand-navy">We'd Love to Connect With You</h2>
          </MotionSection>
          <div className="flex flex-wrap justify-center gap-4">
            {connectItems.map(({ icon: Icon, label, desc }, i) => (
              <MotionCard key={label} index={i} total={connectItems.length}>
                <div className="warm-tile flex items-center gap-3 w-full sm:w-auto sm:min-w-[200px] !p-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4A90D9]/10 flex items-center justify-center shrink-0">
                    <Icon size={18} style={{ color: '#4A90D9' }} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#174A7E' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'rgba(23,74,126,0.5)' }}>{desc}</p>
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ */}
      <section className="section-py bg-[#F5F0E6]">
        <div className="section-container max-w-4xl">
          <FadeInView className="text-center mb-10">
            <SectionEyebrow>Common Questions</SectionEyebrow>
            <h2 className="text-2xl font-bold text-brand-navy">Frequently Asked Questions</h2>
          </FadeInView>
          <div className="mb-6">
            <RaashiFAQ faqs={faqs} />
          </div>

        </div>
      </section>
    </Layout>
  );
}
