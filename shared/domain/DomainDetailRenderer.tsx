import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Users, Wrench, Lightbulb, Shield, Award, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { FadeInView } from "../ui/FadeInView";
import { SectionEyebrow } from "../ui/SectionEyebrow";
import { StaggerContainer, FadeUp, transition } from "../lib/motionVariants";
import { RaashiFAQ } from "../ui/RaashiFAQ";
import { Button } from "../ui/Button";
import type { Domain, DomainWhyCard } from "./types";

const WHY_ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Wrench,
  Lightbulb,
  Shield,
  Award,
  Check,
};

function WhyIcon({ icon }: { icon: string }) {
  const IconComponent = WHY_ICON_MAP[icon] ?? Check;
  return <IconComponent size={19} strokeWidth={1.8} />;
}

export interface DomainDetailRendererProps {
  domain: Domain;
  previewMode?: boolean;
  /** Supplied by the consuming app; keeps API asset resolution centralized. */
  apiBaseUrl?: string;
}

function decodeEntities(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function resolveDomainImageUrl(url: string | null | undefined, fallbackHeroImage?: string | null, apiBaseUrl?: string): string | null {
  const candidate = url || fallbackHeroImage || null;
  if (!candidate) return null;
  if (
    candidate.startsWith("blob:") ||
    candidate.startsWith("data:") ||
    candidate.startsWith("http://") ||
    candidate.startsWith("https://")
  ) {
    return candidate;
  }
  const apiBase = apiBaseUrl?.replace(/\/+$/, "") || "/api/v1";

  if (candidate.startsWith("/api/v1/")) {
    return apiBase.startsWith("http") ? `${apiBase}${candidate.slice(7)}` : candidate;
  }
  if (candidate.startsWith("/domains/")) {
    return apiBase.startsWith("http") ? `${apiBase}${candidate}` : `/api/v1${candidate}`;
  }
  return candidate;
}

export function DomainDetailRenderer({ domain, previewMode = false, apiBaseUrl }: DomainDetailRendererProps) {
  const preventNavigation = (e: React.MouseEvent) => {
    if (previewMode) {
      e.preventDefault();
    }
  };

  const hero = domain.hero!;
  const overview = domain.overview!;
  const offerSection = domain.offerSection!;
  const techSection = domain.techSection!;
  const appsSection = domain.appsSection!;
  const whySection = domain.whySection!;
  const internship = domain.internship!;
  const futureServices = domain.futureServices!;
  const faqSection = domain.faqSection!;

  const enabledWhyCards = whySection.cards
    .filter((c: DomainWhyCard) => c.enabled)
    .sort((a: DomainWhyCard, b: DomainWhyCard) => a.order - b.order);

  const decodedDomainName = decodeEntities(domain.name);
  const initialImageSrc = resolveDomainImageUrl(overview.image_url, domain.heroImage, apiBaseUrl);
  const [currentImgSrc, setCurrentImgSrc] = React.useState<string | null>(initialImageSrc);
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    const resolved = resolveDomainImageUrl(overview.image_url, domain.heroImage, apiBaseUrl);
    setCurrentImgSrc(resolved);
    setImgFailed(false);
  }, [overview.image_url, domain.heroImage, apiBaseUrl]);

  const handleImageError = () => {
    const fallback = resolveDomainImageUrl(null, domain.heroImage, apiBaseUrl);
    if (currentImgSrc && fallback && currentImgSrc !== fallback) {
      setCurrentImgSrc(fallback);
    } else {
      setImgFailed(true);
    }
  };

  // In previewMode: animate staggered motion.divs statically (no viewport detection).
  // This prevents IntersectionObserver from firing inside the scaled preview container
  // and avoids repeated expensive stagger re-runs while editing.
  const motionStaggerProps = previewMode
    ? { animate: "animate" as const, initial: "animate" as const }
    : { initial: "initial" as const, whileInView: "animate" as const, viewport: { once: true, margin: "-60px" } as const };

  return (
    <>
      {/* 1. Hero */}
      <section id="preview-hero" className="bg-brand-navy section-py relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] overflow-hidden"
          style={{ background: `radial-gradient(ellipse 60% 50% at 70% 50%, ${domain.accentColor}, transparent)` }} />
        <div className="section-container relative z-10">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-8 font-medium">
            <Link to="/domains" onClick={preventNavigation} className="hover:text-white transition-colors">Domains</Link>
            <span>/</span>
            <span className="text-white">{decodeEntities(domain.shortName)}</span>
          </div>
          <div className="mt-8 max-w-3xl pb-2">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: `${domain.accentColor}CC` }}>
              {hero.eyebrow}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-5">
              {hero.heading}{hero.heading && hero.heading_highlight ? " " : ""}
              {hero.heading_highlight && (
                <span style={{ color: domain.accentColor }}>{hero.heading_highlight}</span>
              )}
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">{hero.description || domain.description}</p>
          </div>
        </div>
      </section>

      {/* 2. Overview */}
      {overview.paragraphs.length > 0 && (
        <section id="preview-overview" className="section-py bg-[#F5F0E6]">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <FadeInView direction="left" forceVisible={previewMode}>
                <SectionEyebrow>{overview.eyebrow}</SectionEyebrow>
                <h2 className="text-3xl font-bold text-brand-navy mb-5 leading-tight">
                  {overview.heading}
                </h2>
                {overview.paragraphs.map((p, i) => (
                  <p key={i} className="text-brand-navy/60 leading-relaxed mb-4">{p}</p>
                ))}
              </FadeInView>
              <FadeInView direction="right" forceVisible={previewMode}>
                <div className="relative rounded-3xl overflow-hidden bg-brand-navy aspect-video flex items-center justify-center shadow-floating">
                  {currentImgSrc && !imgFailed ? (
                    <img
                      src={currentImgSrc}
                      alt={decodedDomainName}
                      onError={handleImageError}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-navy to-brand-royal/60" />
                      <div className="text-center p-8 relative z-10">
                        <div
                          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                          style={{ backgroundColor: `${domain.accentColor}20`, color: domain.accentColor }}
                        >
                          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2" />
                            <circle cx="14" cy="14" r="4" fill="currentColor" opacity="0.4" />
                            <circle cx="14" cy="14" r="2" fill="currentColor" />
                          </svg>
                        </div>
                        <p className="text-white/70 text-sm font-medium">{decodedDomainName}</p>
                      </div>
                    </>
                  )}
                </div>
              </FadeInView>
            </div>
          </div>
        </section>
      )}

      {/* 3. What We Offer */}
      {offerSection.cards.length > 0 && (
        <section id="preview-what-we-offer" className="section-py bg-background">
          <div className="section-container">
            <FadeInView className="text-center mb-12" forceVisible={previewMode}>
              <SectionEyebrow>{offerSection.eyebrow}</SectionEyebrow>
              <h2 className="text-3xl font-bold text-brand-navy">{offerSection.heading}</h2>
            </FadeInView>
            <motion.div
              {...motionStaggerProps}
              variants={StaggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {offerSection.cards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={FadeUp}
                  transition={transition.standard}
                  className={`brand-tile group flex flex-col h-full ${domain.accentClass}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${domain.accentColor}15`, color: domain.accentColor }}
                  >
                    <Check size={18} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-brand-navy text-sm mb-1.5">{card.title}</h4>
                  <p className="text-xs text-brand-navy/55 leading-relaxed">{card.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 4. Technologies */}
      {techSection.items.length > 0 && (
        <section id="preview-technologies" className="section-py bg-[#F5F0E6]">
          <div className="section-container">
            <FadeInView className="text-center mb-8" forceVisible={previewMode}>
              <SectionEyebrow>{techSection.eyebrow}</SectionEyebrow>
              <h2 className="text-2xl font-bold text-brand-navy">{techSection.heading}</h2>
            </FadeInView>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {techSection.items.map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-brand-navy bg-white border border-brand-navy/[0.1] hover:border-opacity-30 transition-colors cursor-default"
                  style={{ borderColor: `${domain.accentColor}30` }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Applications */}
      {appsSection.items.length > 0 && (
        <section id="preview-applications" className="section-py bg-background">
          <div className="section-container">
            <FadeInView className="text-center mb-10" forceVisible={previewMode}>
              <SectionEyebrow>{appsSection.eyebrow}</SectionEyebrow>
              <h2 className="text-2xl font-bold text-brand-navy mb-2">{appsSection.heading}</h2>
              {appsSection.description && (
                <p className="text-brand-navy/55 text-sm">{appsSection.description}</p>
              )}
            </FadeInView>
            <motion.div
              {...motionStaggerProps}
              variants={StaggerContainer}
              className="flex flex-wrap justify-center gap-3"
            >
              {appsSection.items.map((app) => (
                <motion.div
                  key={app}
                  variants={FadeUp}
                  transition={transition.fast}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-navy/[0.08] text-sm font-medium text-brand-navy"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: domain.accentColor }} />
                  {app}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 6. Why Raashi + Internship panel — separate preview IDs for each */}
      <section id="preview-why-choose" className="section-py bg-[#F5F0E6]">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Why Raashi */}
            <div className="lg:col-span-2">
              <FadeInView forceVisible={previewMode}>
                <SectionEyebrow>{whySection.eyebrow}</SectionEyebrow>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">{whySection.heading}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enabledWhyCards.map((card: DomainWhyCard) => (
                    <div key={card.title} className={`brand-tile flex flex-col h-full ${domain.accentClass}`}>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${domain.accentColor}12`, color: domain.accentColor }}
                      >
                        <WhyIcon icon={card.icon} />
                      </div>
                        <p className="font-semibold text-brand-navy text-sm">{card.title}</p>
                      {card.description && (
                        <p className="text-xs text-brand-navy/55 leading-relaxed mt-1">{card.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </FadeInView>
            </div>

            {/* Internship panel — separate ID for direct scroll-to */}
            <div id="preview-internship">
              <FadeInView direction="right" forceVisible={previewMode}>
                <div
                  className="rounded-2xl p-6 border text-white"
                  style={{ backgroundColor: domain.accentColor, borderColor: `${domain.accentColor}40` }}
                >
                  <h3 className="font-bold text-lg mb-4">{internship.heading}</h3>
                  <ul className="space-y-2.5 mb-6">
                    {internship.checklist.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/85">
                        <Check size={13} className="mt-0.5 shrink-0 text-white" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="secondary" size="md" className="w-full mt-4">
                    <Link to={internship.cta_link} onClick={preventNavigation} className="gap-2 justify-center">
                      {internship.cta_label} <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </FadeInView>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Future Services note */}
      {futureServices.enabled && (
        <section id="preview-future-services" className="section-py bg-background">
          <div className="section-container">
            <div className="flex items-start gap-4 p-6 rounded-2xl border-l-4 bg-[#F1F1EE]"
              style={{ borderLeftColor: domain.accentColor }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${domain.accentColor}15`, color: domain.accentColor }}>
                <Lightbulb size={16} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-semibold text-brand-navy text-sm mb-1">{futureServices.heading}</p>
                <p className="text-sm text-brand-navy/60 leading-relaxed">{futureServices.description}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. FAQ */}
      {faqSection.items.length > 0 && (
        <section id="preview-faq" className="section-py bg-[#F5F0E6]">
          <div className="section-container">
            <div className="grid lg:grid-cols-3 gap-10 items-start">
              <FadeInView className="lg:col-span-2" forceVisible={previewMode}>
                <SectionEyebrow>{faqSection.eyebrow}</SectionEyebrow>
                <RaashiFAQ faqs={faqSection.items} />
              </FadeInView>
              <FadeInView direction="right" className="lg:mt-7" forceVisible={previewMode}>
                <div className="bg-brand-navy rounded-2xl p-6 text-white sticky top-24">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <MessageSquare size={20} color="white" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{faqSection.contact_heading}</h3>
                  <p className="text-white/60 text-sm mb-5 leading-relaxed">{faqSection.contact_description}</p>
                  <Button asChild variant="secondary" size="md" className="w-full">
                    <Link to={faqSection.contact_cta_link} onClick={preventNavigation} className="gap-2 justify-center">
                      {faqSection.contact_cta_label} <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </FadeInView>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
