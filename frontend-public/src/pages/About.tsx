import { Link } from "react-router-dom";
import { ArrowRight, Target, Eye, Diamond, Sparkles, Users, Shield, Clock, Heart, TrendingUp, Layers } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import FoldText from "@/components/shared/FoldText";
import { FadeInView } from "@/components/shared/FadeInView";
import { MotionCard } from "@/components/shared/MotionCard";
import { MotionSection } from "@/components/shared/MotionSection";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { useContentContext } from "@/contexts/ContentProvider";
import { Button } from "@/components/shared/Button";

const cards3 = [
  {
    icon: Target,
    label: "Our Mission",
    text: "To deliver innovative and intelligent technology solutions that empower businesses and create value for a better tomorrow.",
  },
  {
    icon: Eye,
    label: "Our Vision",
    text: "To be a trusted global technology partner in driving intelligent transformation and building a sustainable, innovation-driven future.",
  },
  {
    icon: Diamond,
    label: "Our Values",
    isList: true,
    list: ["Innovation", "Integrity", "Excellence", "Collaboration", "Customer Success"],
  },
];

const whyCards = [
  { icon: Sparkles, label: "Innovation Driven", desc: "We pioneer solutions at the frontier of technology." },
  { icon: Users, label: "Expert Team", desc: "Multidisciplinary professionals passionate about results." },
  { icon: Shield, label: "Quality Assurance", desc: "Rigorous processes ensure every deliverable exceeds expectations." },
  { icon: Clock, label: "Timely Delivery", desc: "We respect deadlines and communicate proactively." },
  { icon: Heart, label: "Client Focused", desc: "Your success is our metric. We listen before we build." },
  { icon: TrendingUp, label: "Continuous Growth", desc: "We learn, iterate, and improve — always." },
];

const statItems = [
  { icon: Layers, label: "5+ Domains", sub: "of Expertise" },
  { icon: Sparkles, label: "20+ Technologies", sub: "We Work With" },
  { icon: TrendingUp, label: "Industry Focused", sub: "Solutions" },
  { icon: Shield, label: "Future Ready", sub: "Approach" },
  { icon: Users, label: "Dedicated", sub: "Support" },
];

export default function About() {
  const { getContent } = useContentContext();
  const content = getContent("about_page");

  return (
    <Layout
      prefooter={{
        headline: "Let's Build Intelligent Solutions Together",
        subtext: "We are excited to collaborate and turn your ideas into impactful solutions.",
        buttonLabel: "Get In Touch",
        buttonHref: "/contact",
      }}
    >
      <SEO 
        title="About Us | Raashi Cognitive Technologies" 
        description="Learn about Raashi Cognitive Technologies, an emerging technology company building intelligent solutions across AI, IoT, engineering, research, and education in Belagavi, Karnataka."
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
                "name": "About Us",
                "item": "https://raashitech.com/about"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "About Us | Raashi Cognitive Technologies",
            "description": "Learn about Raashi Cognitive Technologies, an emerging technology company building intelligent solutions across AI, IoT, engineering, research, and education in Belagavi, Karnataka.",
            "url": "https://raashitech.com/about"
          })}
        </script>
      </SEO>
      {/* Hero */}
      <section className="bg-brand-navy section-py relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, #0560DF, transparent)" }} />
        <div className="section-container relative z-10">
          <Breadcrumb items={[{ label: "About Us" }]} />
          <div className="mt-8 max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              <FoldText 
                text={content?.hero_heading || "About Raashi Cognitive Technologies"} 
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
              />
            </h1>
            <p className="text-white/65 text-lg leading-relaxed mb-3">
              {content?.hero_description || "We are an emerging technology company building intelligent solutions across AI, IoT, engineering, research and education."}
            </p>
            <p className="text-white/50 leading-relaxed">
              {content?.mission || "Our mission is to transform knowledge into intelligent solutions."}
            </p>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values card row */}
      <section className="relative z-10 -mt-10 pb-0">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards3.map(({ icon: Icon, label, text, isList, list }, i) => (
              <MotionCard key={label} index={i} total={cards3.length}>
                <div className="warm-tile flex flex-col h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#174A7E]/8 flex items-center justify-center mb-4">
                    <Icon size={22} style={{ color: '#174A7E' }} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#174A7E' }}>{label}</h3>
                  {isList ? (
                    <ul className="space-y-1.5">
                      {list!.map((v) => (
                        <li key={v} className="text-sm flex items-center gap-2" style={{ color: 'rgba(23,74,126,0.65)' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(23,74,126,0.4)' }} />
                          {v}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(23,74,126,0.65)' }}>{text}</p>
                  )}
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="section-py bg-[#F5F0E6] mt-10">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <FadeInView direction="right">
              <SectionEyebrow>Who We Are</SectionEyebrow>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-5 leading-tight">
                Building Intelligent Solutions with{" "}
                <span className="text-brand-blue">Purpose</span>
              </h2>
              <p className="text-brand-navy/60 leading-relaxed mb-4">
                Raashi Cognitive Technologies was founded with a singular belief: that technology, when guided by
                knowledge and purpose, can solve humanity's most pressing challenges. Our team works at the
                intersection of engineering, research, and education.
              </p>
              <p className="text-brand-navy/60 leading-relaxed mb-7">
                From the industrial heartland of Karnataka, we serve clients and students across India —
                delivering custom AI solutions, IoT ecosystems, design engineering services, and world-class
                training programs tailored to real-world needs.
              </p>
              <Button asChild variant="primary" size="md">
                <Link to="/internships" className="gap-2 shadow-sm">
                  Explore Internships <ArrowRight size={15} />
                </Link>
              </Button>
            </FadeInView>

            <FadeInView direction="left">
              <div className="relative rounded-3xl overflow-hidden bg-brand-navy aspect-video flex items-center justify-center shadow-floating">
                <img src="/image2.png" alt="Team" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-4 right-4 bg-brand-navy/60 backdrop-blur border border-white/20 rounded-xl px-4 py-2 z-10">
                  <p className="text-white text-xs font-semibold">Belgaum, Karnataka 🇮🇳</p>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* Why Partner section */}
      <section className="section-py bg-background">
        <div className="section-container">
          <MotionSection className="text-center mb-12">
            <SectionEyebrow>Why Partner With Us?</SectionEyebrow>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy">
              Why Choose Raashi Cognitive Technologies?
            </h2>
          </MotionSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyCards.map(({ icon: Icon, label, desc }, i) => (
              <MotionCard key={label} index={i} total={whyCards.length}>
                <div className="warm-tile-alt group flex flex-col h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#4A90D9]/10 flex items-center justify-center mb-4 group-hover:bg-[#4A90D9]/18 transition-colors">
                    <Icon size={21} style={{ color: '#4A90D9' }} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: '#174A7E' }}>{label}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(23,74,126,0.6)' }}>{desc}</p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* Dark stat bar */}
      <section className="bg-[#F5F0E6] py-12">
        <div className="section-container">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
            {statItems.map(({ icon: Icon, label, sub }, i) => (
              <MotionCard key={label} index={i} total={statItems.length} variant="panel">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/15 flex items-center justify-center">
                    <Icon size={17} className="text-brand-blue" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-brand-navy font-bold text-sm leading-tight">{label}</p>
                    <p className="text-brand-navy/60 text-xs">{sub}</p>
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
