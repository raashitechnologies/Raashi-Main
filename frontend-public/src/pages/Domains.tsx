import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import { FadeInView } from "@/components/shared/FadeInView";
import { MotionSection } from "@/components/shared/MotionSection";
import FoldText from "@/components/shared/FoldText";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { useDomains } from "@/contexts/DomainsProvider";
import { SpecularButton } from "@/components/shared/SpecularButton";


import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";
import { domainIcons } from "@/data/domainIcons";

export default function Domains() {
  const { domains, loading, error, refresh } = useDomains();

  return (
    <Layout
      prefooter={{
        headline: "Let's Build Intelligent Solutions Together",
        subtext: "Have a project in mind? Let's discuss how we can help you innovate and grow.",
        buttonLabel: "Get In Touch",
        buttonHref: "/contact",
      }}
    >
      <SEO 
        title="Our Domains | Raashi Cognitive Technologies" 
        description="Explore our specialised technology domains including AI, IoT, Engineering Design, Research & Innovation, and Education & Training."
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
                "name": "Domains",
                "item": "https://raashitech.com/domains"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Our Domains | Raashi Cognitive Technologies",
            "description": "Explore our specialised technology domains including AI, IoT, Engineering Design, Research & Innovation, and Education & Training.",
            "url": "https://raashitech.com/domains"
          })}
        </script>
      </SEO>
      {/* Hero */}
      <section className="bg-brand-navy section-py relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse 70% 60% at 60% 50%, #0560DF, transparent)" }} />
        <div className="section-container relative z-10">
          <Breadcrumb items={[{ label: "Domains" }]} />
          <div className="mt-8 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
                Our <span className="text-brand-orange">Domains</span> —{" "}
                <FoldText 
                  text="Solutions that Drive Innovation" 
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  duration={0.65}
                  stagger={0.04}
                  ease="power3.out"
                  perspective={700}
                  creaseShading={0.45}
                  fontSize="clamp(2.2rem, 5vw, 4.5rem)"
                  color="white"
                />
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                Explore our specialised technology domains, each designed to deliver measurable
                impact through expertise, innovation, and real-world application.
              </p>
            </div>
            {/* Globe graphic */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-2 rotate-12">
                    {domains.map((d) => (
                      <div
                        key={d.slug}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${d.accentColor}20`, color: d.accentColor }}
                      >
                        {domainIcons[d.slug]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Domain rows — detailed panels */}
      <section className="section-py bg-[#F5F0E6]" aria-label="Domain detail panels">
        <div className="section-container">
          <MotionSection className="text-center mb-14">
            <SectionEyebrow>What We Offer</SectionEyebrow>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy">Explore Our Core Domains</h2>
            <p className="text-brand-navy/55 mt-3 max-w-xl mx-auto">
              Pillars of expertise, each addressing a distinct dimension of modern technological advancement.
            </p>
          </MotionSection>

          {/* Loading state */}
          {loading && (
            <div className="space-y-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#F1F1EE] rounded-3xl shadow-warm-card border border-[#E98A3A]/18 overflow-hidden">
                  <div className="grid lg:grid-cols-2">
                    <div className="p-10 lg:p-14 animate-pulse">
                      <div className="h-6 w-24 bg-brand-navy/10 rounded mb-4" />
                      <div className="h-16 w-16 bg-brand-navy/10 rounded-2xl mb-5" />
                      <div className="h-8 w-3/4 bg-brand-navy/10 rounded mb-3" />
                      <div className="h-4 w-full bg-brand-navy/10 rounded mb-2" />
                      <div className="h-4 w-2/3 bg-brand-navy/10 rounded mb-6" />
                      <div className="h-10 w-32 bg-brand-navy/10 rounded-xl" />
                    </div>
                    <div className="p-8 lg:p-12 animate-pulse">
                      <div className="h-4 w-28 bg-brand-navy/10 rounded mb-5" />
                      <div className="grid grid-cols-2 gap-2.5">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <div key={j} className="h-5 bg-brand-navy/8 rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <FadeInView>
              <ErrorState 
                message={error} 
                onRetry={refresh}
                variant="public"
              />
            </FadeInView>
          )}

          {/* Empty state */}
          {!loading && !error && domains.length === 0 && (
            <FadeInView>
              <EmptyState 
                title="No domains available yet"
                message="New domains are being prepared. Please check back soon."
                variant="public"
              />
            </FadeInView>
          )}

          {/* Domain list — large panels use panel3d */}
          {!loading && domains.length > 0 && (
            <div className="space-y-10">
              {domains.map((domain, i) => {
                const isEven = i % 2 === 0;
                const num = String(i + 1).padStart(2, "0");
                return (
                  <FadeInView key={domain.slug} variant="panel3d" delay={i * 0.04}>
                    <div className="bg-[#F1F1EE] rounded-3xl shadow-warm-card border border-[#E98A3A]/18 overflow-hidden">
                      <div className="grid lg:grid-cols-2">
                        {/* Image tile */}
                        <div
                          className={`relative p-10 lg:p-14 flex flex-col justify-center ${!isEven ? "lg:order-2" : ""}`}
                          style={{
                            background: `linear-gradient(135deg, ${domain.accentColor}18 0%, ${domain.accentColor}08 100%)`,
                            borderLeft: isEven ? "none" : `4px solid ${domain.accentColor}`,
                            borderRight: !isEven ? "none" : `4px solid ${domain.accentColor}`,
                          }}
                        >
                          <span className="text-7xl font-black opacity-[0.07] text-brand-navy font-mono mb-3 leading-none">
                            {num}
                          </span>
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                            style={{ backgroundColor: `${domain.accentColor}18`, color: domain.accentColor }}
                          >
                            {domainIcons[domain.slug] || (
                              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: domain.accentColor }} />
                            )}
                          </div>
                          <h3
                            className="text-2xl font-bold mb-3 leading-tight"
                            style={{ color: domain.accentColor }}
                          >
                            {domain.name}
                          </h3>
                          <p className="text-brand-navy/60 text-sm leading-relaxed mb-6">
                            {domain.tagline}
                          </p>
                          <SpecularButton
                            asChild
                            baseColor={domain.accentColor}
                            lineColor="#ffffff"
                            textColor="#ffffff"
                            intensity={0.4}
                            followMouse={false}
                            thickness={1}
                            radius={12}
                            className="self-start shadow-sm hover:brightness-110 px-5 py-2.5"
                          >
                            <Link
                              to={`/domains/${domain.slug}`}
                              className="text-sm font-bold flex items-center gap-2"
                            >
                              View Details <ArrowRight size={15} />
                            </Link>
                          </SpecularButton>
                        </div>

                        {/* Offer list */}
                        <div className={`p-8 lg:p-12 ${!isEven ? "lg:order-1" : ""}`}>
                          <p className="text-xs font-semibold tracking-widest text-brand-navy/40 uppercase mb-5">
                            What We Offer
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {domain.whatWeOffer.slice(0, 6).map((offer) => (
                              <li key={offer.title} className="flex items-start gap-2">
                                <Check size={14} className="mt-0.5 shrink-0" style={{ color: domain.accentColor }} strokeWidth={2.5} />
                                <span className="text-sm text-brand-navy/70">{offer.title}</span>
                              </li>
                            ))}
                          </ul>
                          <Link
                            to={`/domains/${domain.slug}`}
                            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold group"
                            style={{ color: domain.accentColor }}
                          >
                            Know More <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </FadeInView>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
