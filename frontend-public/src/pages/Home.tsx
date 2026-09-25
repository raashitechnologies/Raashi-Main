import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, GraduationCap,
  Sparkles, Target, Layers, Shield, TrendingUp,
  Settings2, Zap, BadgeCheck, HeartHandshake,
  Lightbulb, Users, Handshake, BarChart3
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import FoldText from "@/components/shared/FoldText";
import { MotionCard } from "@/components/shared/MotionCard";
import { MotionSection } from "@/components/shared/MotionSection";
import { FadeInView } from "@/components/shared/FadeInView";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { HoverExpandDomainRow } from "@/components/shared/HoverExpandDomainRow";
import { useDomains } from "@/contexts/DomainsProvider";
import { useContentContext } from "@/contexts/ContentProvider";
import { StaggerContainer, FadeUp, transition } from "@/lib/motionVariants";
import { Button } from "@/components/shared/Button";


const statsPanel = [
  { icon: Layers, label: "5+ Domains", sub: "of Expertise" },
  { icon: Sparkles, label: "Industry-Focused", sub: "Solutions" },
  { icon: TrendingUp, label: "Future-Ready", sub: "Technologies" },
  { icon: Shield, label: "Dedicated", sub: "Support" },
];

const pillarsRow = [
  { icon: Settings2, title: "Tailored Solutions",  sub: "Built for Your Needs" },
  { icon: Zap,       title: "Agile Approach",      sub: "Adapt. Deliver. Succeed." },
  { icon: BadgeCheck, title: "Quality Assurance",  sub: "Excellence in Every Step" },
  { icon: HeartHandshake, title: "Support & Maintenance", sub: "We're with You, Always" },
];

const coreValues = [
  { icon: Lightbulb,   title: "INNOVATION",  sub: "Driven Solutions" },
  { icon: Users,       title: "EXPERTISE",   sub: "Skilled Professionals" },
  { icon: Handshake,   title: "COMMITMENT",  sub: "Quality & On-Time Delivery" },
  { icon: BarChart3,   title: "GROWTH",      sub: "Your Success, Our Goal" },
];

export default function Home() {
  const { domains, loading: domainsLoading, error: domainsError, refresh: domainsRefresh } = useDomains();
  const { getContent } = useContentContext();

  const hero = getContent("homepage_hero");
  const whyUs = getContent("homepage_why_us");
  const about = getContent("homepage_about");
  const internship = getContent("homepage_internship_banner");

  const checklistItems: string[] = whyUs?.checklist || [
    "Expert Team of Professionals",
    "Innovative & Customized Solutions",
    "Quality, Reliability & Timely Delivery",
    "Client-Centric Approach",
    "Continuous Learning & Improvement",
  ];

  return (
    <Layout
      prefooter={{
        headline: "Have a Project in Mind?",
        subtext: "Let's build something intelligent together.",
        buttonLabel: "Contact Us Today",
        buttonHref: "/contact",
      }}
    >
      <SEO 
        title="Raashi Cognitive Technologies | AI, IoT & Engineering Solutions" 
        description="Raashi Cognitive Technologies delivers innovative solutions in Artificial Intelligence, IoT, Smart Automation, Engineering Design, R&D, and Skill Development in Belgaum, Karnataka."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Raashi Cognitive Technologies Pvt. Ltd.",
            "alternateName": "Raashi CT",
            "url": "https://raashitech.com",
            "logo": "https://raashitech.com/logo.png",
            "description": "Transforming Knowledge into Intelligent Solutions",
            "telephone": "+919742419316",
            "email": "raashitechnologies@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "69, CTS NO.4482B/67, Shruti Layout, Kanabargi Road, Belgaum Fort",
              "addressLocality": "Belagavi",
              "addressRegion": "Karnataka",
              "postalCode": "590016",
              "addressCountry": "IN"
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
                "opens": "09:00",
                "closes": "18:00"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Raashi Cognitive Technologies",
            "url": "https://raashitech.com"
          })}
        </script>
      </SEO>
      {/* ── 1. HERO ── */}
      <section className="bg-brand-navy min-h-[88vh] relative overflow-hidden" aria-label="Hero">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #0560DF 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[300px] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #D11753 0%, transparent 70%)" }} />
        </div>

        <div className="section-container pt-8 md:pt-12 lg:pt-16 pb-16 md:pb-24 lg:pb-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={StaggerContainer}
            >
              <motion.div variants={FadeUp} transition={transition.standard}>
                <span className="inline-block py-1.5 px-4 rounded-full bg-brand-navy/30 backdrop-blur border border-white/10 text-white text-xs font-semibold tracking-wider mb-5 uppercase">
                  {hero?.badge || "Raashi Cognitive Technologies Pvt. Ltd."}
                </span>
              </motion.div>

              <h1 className="text-[32px] sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 break-words sm:break-normal">
                <FoldText 
                  text={hero?.heading || "Transforming Knowledge into"} 
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  duration={0.65}
                  stagger={0.035}
                  ease="power3.out"
                  perspective={700}
                  creaseShading={0.45}
                  color="white"
                /> 
                <br />
                <span className="text-brand-orange">
                  <FoldText 
                    text={hero?.heading_highlight || "Intelligent Solutions"} 
                    splitBy="char"
                    hinge="top"
                    trigger="scroll"
                    duration={0.65}
                    stagger={0.035}
                    ease="power3.out"
                    perspective={700}
                    creaseShading={0.45}
                  />
                </span>
              </h1>

              <motion.p
                variants={FadeUp}
                transition={{ ...transition.standard, delay: 0.1 }}
                className="text-white/65 text-lg max-w-2xl mb-10 leading-relaxed font-light"
              >
                {hero?.description || "Raashi Cognitive Technologies Pvt. Ltd. delivers innovative solutions in Artificial Intelligence, IoT, Smart Automation, 3D Design, Research & Development, and Skill Development to empower businesses and build a smarter future."}
              </motion.p>

              <motion.div
                variants={FadeUp}
                transition={{ ...transition.standard, delay: 0.15 }}
                className="flex flex-wrap gap-3"
              >
                <Button asChild variant="primary" size="lg">
                  <Link to={hero?.cta_primary_link || "/domains"} className="gap-2 shadow-md">
                    {hero?.cta_primary || "Explore Our Domains"} <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button asChild variant="outline-light" size="lg">
                  <Link to={hero?.cta_secondary_link || "/contact"} className="gap-2">
                    {hero?.cta_secondary || "Get In Touch"}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right — hero graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex items-center justify-center relative"
            >
              {/* Clean logo circle */}
              <div className="relative w-80 h-80 flex items-center justify-center">
                {/* Subtle outer ring */}
                <div className="absolute inset-0 rounded-full border border-brand-blue/20" />
                {/* White circle with logo */}
                <div className="w-60 h-60 rounded-full bg-white flex items-center justify-center shadow-floating border border-brand-navy/5 overflow-hidden p-4">
                  <img src="/logo.png" alt="Raashi Cognitive Technologies" className="w-full h-full object-contain" loading="eager" fetchPriority="high" width="240" height="240" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. CORE DOMAINS ── */}
      <section className="section-py bg-[#F5F0E6]" aria-label="Our Core Domains">
        <div className="section-container">
          <MotionSection className="text-center mb-14">
            <SectionEyebrow>What We Do</SectionEyebrow>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-4">Our Core Domains</h2>
            <p className="text-brand-navy/60 text-lg max-w-2xl mx-auto">
              Five specialised areas of expertise, each delivering real-world impact through innovation,
              technology, and knowledge.
            </p>
          </MotionSection>

          {/* HoverExpandDomainRow owns its own loading skeleton and equal-width flex layout. */}
          <HoverExpandDomainRow domains={domains} isLoading={domainsLoading} error={domainsError} onRetry={domainsRefresh} />
        </div>
      </section>

      {/* ── 3. WHY CHOOSE US ── */}
      <section className="section-py bg-background" aria-label="Why Choose Us">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            {/* Heading */}
            <MotionSection className="text-center lg:col-span-2">
              <SectionEyebrow>{whyUs?.eyebrow || "Why Choose Us"}</SectionEyebrow>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-5">
                {whyUs?.heading || "Innovation. Expertise."} <span className="text-brand-blue">{whyUs?.heading_highlight || "Impact."}</span>
              </h2>
              <p className="text-brand-navy/60 leading-relaxed max-w-2xl mx-auto">
                {whyUs?.description || "We bring together a multidisciplinary team of engineers, researchers, and innovators dedicated to delivering technology solutions that create measurable business value."}
              </p>
            </MotionSection>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:col-span-2 max-w-4xl mx-auto w-full">
              {checklistItems.map((item: string, i: number) => {
                const isLastOdd = i === checklistItems.length - 1 && checklistItems.length % 2 !== 0;
                return (
                  <MotionCard 
                    key={i} 
                    index={i} 
                    total={checklistItems.length}
                    className={isLastOdd ? "sm:col-span-2 sm:w-[calc(50%-10px)] sm:justify-self-center w-full" : "w-full"}
                  >
                    <div className="flex items-center gap-3 bg-[#F1F1EE] p-4 rounded-xl border border-[#E98A3A]/12 h-full w-full">
                      <div className="w-5 h-5 rounded-full bg-[#4A90D9]/10 border border-[#4A90D9]/25 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[#4A90D9]" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-medium text-brand-navy">{item}</span>
                    </div>
                  </MotionCard>
                );
              })}
            </div>

            {/* ── Pillars Banner Row ── */}
            <FadeInView className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-brand-navy/10 rounded-2xl overflow-hidden border border-brand-navy/10">
                {pillarsRow.map(({ icon: Icon, title, sub }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 bg-[#F5F0E6] px-5 py-4 hover:bg-white transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-navy/8 flex items-center justify-center shrink-0 group-hover:bg-brand-blue/10 transition-colors">
                      <Icon size={20} className="text-brand-navy/60 group-hover:text-brand-blue transition-colors" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold tracking-wider uppercase text-brand-navy">{title}</p>
                      <p className="text-[11px] text-brand-navy/50 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInView>

            {/* ── Core Values + Stats Panel side by side ── */}
            <FadeInView direction="left" className="lg:col-span-1">
              <div className="bg-white border border-brand-navy/8 rounded-2xl overflow-hidden divide-y divide-brand-navy/8">
                {coreValues.map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-center gap-4 px-5 py-4 group hover:bg-[#F5F0E6] transition-colors duration-200">
                    <div className="w-11 h-11 rounded-full border-2 border-brand-navy/15 flex items-center justify-center shrink-0 group-hover:border-brand-blue/40 transition-colors">
                      <Icon size={19} className="text-brand-navy/50 group-hover:text-brand-blue transition-colors" strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-widest text-brand-navy">{title}</p>
                      <p className="text-xs text-brand-navy/50">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInView>

            {/* Right — stat panel */}
            <FadeInView direction="right" variant="panel3d" className="lg:col-span-1">
              <div className="bg-brand-navy rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                {statsPanel.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-white/8 rounded-2xl p-5 border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center mb-3">
                      <Icon size={20} className="text-brand-blue" strokeWidth={1.8} />
                    </div>
                    <p className="font-bold text-white text-base leading-tight">{label}</p>
                    <p className="text-white/50 text-sm mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ── 4. ABOUT TEASER ── */}
      <section className="section-py bg-[#F5F0E6]" aria-label="About Raashi">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — image placeholder */}
            <FadeInView direction="left">
              <div className="relative rounded-3xl overflow-hidden bg-brand-navy aspect-[4/3] flex items-center justify-center shadow-floating">
                <img src="/image1.png" alt="Raashi Cognitive Technologies Office in Belgaum" className="w-full h-full object-cover" loading="lazy" width="800" height="600" />
                
                {/* Floating badge */}
                <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-2">
                  <p className="text-white text-xs font-semibold">Belgaum, Karnataka</p>
                  <p className="text-white/50 text-[10px]">Since 2024</p>
                </div>
              </div>
            </FadeInView>

            {/* Right — text */}
            <FadeInView direction="left">
              <SectionEyebrow>{about?.eyebrow || "About Us"}</SectionEyebrow>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-6 leading-tight">
                {about?.heading || "Building Intelligent Solutions for a"} <span className="text-brand-blue">{about?.heading_highlight || "Smarter Tomorrow"}</span>
              </h2>
              <p className="text-brand-navy/60 leading-relaxed mb-8">
                {about?.description || "Founded with a vision to democratize intelligent technology, Raashi Cognitive Technologies is a growing force in AI, IoT, engineering, and education — empowering organisations and individuals to thrive in the knowledge economy."}
              </p>
              <ul className="space-y-4 mb-8">
                {(about?.features || [
                  { label: "Innovation", desc: "Pushing boundaries with cutting-edge technology" },
                  { label: "Excellence", desc: "Delivering quality in every project and engagement" },
                  { label: "Impact", desc: "Creating meaningful outcomes for clients and communities" },
                ]).map((f: any) => (
                  <li key={f.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E98A3A]/10 flex items-center justify-center shrink-0">
                      <Target size={18} className="text-[#E98A3A]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-navy text-sm mb-1">{f.label}</h4>
                      <p className="text-xs text-brand-navy/60">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" size="md">
                <Link to="/about" className="gap-2 bg-brand-blue/5 border-brand-blue/20 hover:bg-brand-blue/10">
                  Learn More About Us <ArrowRight size={15} />
                </Link>
              </Button>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ── 5. INTERNSHIP BANNER ── */}
      <section className="bg-[#F5F0E6] section-py relative overflow-hidden" aria-label="Internships">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block">
          <div className="h-full bg-gradient-to-l from-[#4A90D9]/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <GraduationCap size={220} color="#17285E" strokeWidth={0.8} />
          </div>
        </div>

        <div className="section-container relative z-10">
          <FadeInView variant="panel3d">
            <div className="max-w-3xl">
              <SectionEyebrow>{internship?.eyebrow || "Internships"}</SectionEyebrow>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-4 leading-tight">
                {internship?.heading || "Kickstart Your Career with"} <br />
                <span className="text-brand-orange">{internship?.heading_highlight || "Hands-on Experience"}</span>
              </h2>
              <p className="text-brand-navy/70 text-lg mb-8 leading-relaxed">
                {internship?.description || "Join our structured internship programs across AI, IoT, Engineering, R&D and Education. Work on live projects, learn from experts, and earn a certificate that matters."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="primary" size="lg" className="!bg-brand-orange shadow-md">
                  <Link to={internship?.cta_link || "/internships"} className="gap-2 !text-brand-navy">
                    {internship?.cta || "Explore Internships"} <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>
    </Layout>
  );
}
