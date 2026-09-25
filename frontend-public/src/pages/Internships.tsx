
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Star, Award, Briefcase, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import FoldText from "@/components/shared/FoldText";
import { FadeInView } from "@/components/shared/FadeInView";
import { MotionCard } from "@/components/shared/MotionCard";
import { MotionSection } from "@/components/shared/MotionSection";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { HoverExpandDomainRow } from "@/components/shared/HoverExpandDomainRow";
import { StepProcess } from "@/components/shared/StepProcess";
import { useDomains } from "@/contexts/DomainsProvider";
import { StaggerContainer, FadeUp, transition } from "@/lib/motionVariants";
import { Button } from "@/components/shared/Button";
import { getApiUrl, publicApi } from "@/lib/api";

const benefits = [
  { icon: Users, label: "Expert Mentorship", desc: "Learn directly from experienced professionals" },
  { icon: Briefcase, label: "Real-world Projects", desc: "Work on live client and research projects" },
  { icon: Star, label: "Skill Development", desc: "Build in-demand technical and soft skills" },
  { icon: Award, label: "Certificate on Completion", desc: "Industry-recognised certification" },
  { icon: BookOpen, label: "Career Guidance", desc: "Personalised counselling and placement support" },
];

const processSteps = [
  { icon: <ArrowRight size={20} />, label: "Apply Online" },
  { icon: <BookOpen size={20} />, label: "Screening" },
  { icon: <Users size={20} />, label: "Interview" },
  { icon: <Award size={20} />, label: "Selection" },
  { icon: <Star size={20} />, label: "Start Internship" },
];

export default function Internships() {
  const { domains, loading: domainsLoading, error: domainsError, refresh: domainsRefresh } = useDomains();
  const [brochureAvailable, setBrochureAvailable] = useState(false);

  useEffect(() => {
    publicApi.getBrochureStatus()
      .then((res) => {
        setBrochureAvailable(res.data?.available || false);
      })
      .catch(() => setBrochureAvailable(false));
  }, []);

  return (
    <Layout
      headerCta={{ label: "Apply for Internship", href: "/apply" }}
      prefooter={{
        headline: "Ready to Begin Your Journey?",
        subtext: "Join Raashi Cognitive Technologies and turn your ideas into real-world impact.",
        buttonLabel: "Apply Now",
        buttonHref: "/apply",
      }}
    >
      <SEO 
        title="Internships | Raashi Cognitive Technologies" 
        description="Kickstart your career with our hands-on internship program. Gain experience in Artificial Intelligence, IoT, Engineering Design, Research & Innovation, and Education & Training."
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
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Internships | Raashi Cognitive Technologies",
            "description": "Kickstart your career with our hands-on internship program. Gain experience in Artificial Intelligence, IoT, Engineering Design, Research & Innovation, and Education & Training.",
            "url": "https://raashitech.com/internships"
          })}
        </script>
      </SEO>
      {/* 1. Hero */}
      <section className="bg-brand-navy section-py relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.06]"
            style={{ background: "radial-gradient(ellipse 80% 80% at 80% 40%, #0560DF, transparent)" }} />
        </div>
        <div className="section-container relative z-10 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={StaggerContainer}
          >
            <motion.div variants={FadeUp} transition={transition.standard}>
              <SectionEyebrow light>Internship Program</SectionEyebrow>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 mt-2">
              <FoldText 
                text="Internship Opportunities for" 
                splitBy="char"
                hinge="top"
                trigger="scroll"
                duration={0.65}
                stagger={0.035}
                ease="power3.out"
                perspective={700}
                creaseShading={0.45}
                fontSize="clamp(2.25rem, 4.5vw, 4.5rem)"
                color="white"
              />{" "}
              <span className="text-brand-orange">
                <FoldText 
                  text="Future Innovators" 
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  duration={0.65}
                  stagger={0.035}
                  ease="power3.out"
                  perspective={700}
                  creaseShading={0.45}
                  fontSize="clamp(2.25rem, 4.5vw, 4.5rem)"
                />
              </span>
            </h1>
            <motion.p
              variants={FadeUp}
              transition={{ ...transition.standard, delay: 0.1 }}
              className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Gain hands-on experience in cutting-edge technologies, work alongside expert mentors, and
              build a career that matters. Applications are open across all five of our domains.
            </motion.p>
            <motion.div
              variants={FadeUp}
              transition={{ ...transition.standard, delay: 0.15 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Button asChild variant="primary" size="lg" className="!bg-brand-orange shadow-md">
                <Link to="/apply" className="gap-2 !text-brand-navy">
                  Apply Now <ArrowRight size={16} />
                </Link>
              </Button>
              {brochureAvailable ? (
                <Button asChild variant="outline-light" size="lg">
                  <a href={getApiUrl("/content/brochure/download")} target="_blank" rel="noopener noreferrer" className="gap-2">
                    Download Brochure <Download size={16} />
                  </a>
                </Button>
              ) : (
                <Button variant="outline-light" size="lg" disabled title="Brochure not available yet">
                  <span className="gap-2 opacity-50 flex items-center">
                    Download Brochure <Download size={16} />
                  </span>
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Internship Domains */}
      <section className="section-py bg-[#F5F0E6]">
        <div className="section-container">
          <MotionSection className="text-center mb-12">
            <SectionEyebrow>Learn. Innovate. Grow.</SectionEyebrow>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy">Internship Domains We Offer</h2>
            <p className="text-brand-navy/55 mt-3 max-w-xl mx-auto">
              Choose your domain and start building real-world skills from day one.
            </p>
          </MotionSection>
          {/* HoverExpandDomainRow owns loading skeleton and equal-width flex layout. */}
          <HoverExpandDomainRow domains={domains} isLoading={domainsLoading} error={domainsError} onRetry={domainsRefresh} />
        </div>
      </section>

      {/* 3. Benefits */}
      <section className="section-py bg-background">
        <div className="section-container">
          <MotionSection className="text-center mb-12">
            <SectionEyebrow>What You Gain</SectionEyebrow>
            <h2 className="text-3xl font-bold text-brand-navy">Benefits You Will Get</h2>
          </MotionSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {benefits.map(({ icon: Icon, label, desc }, i) => (
              <MotionCard key={label} index={i} total={benefits.length}>
                <div className="warm-tile-alt text-center flex flex-col h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#4A90D9]/10 flex items-center justify-center mx-auto mb-3">
                    <Icon size={22} style={{ color: '#4A90D9' }} strokeWidth={1.8} />
                  </div>
                  <h4 className="font-bold text-sm mb-1.5" style={{ color: '#174A7E' }}>{label}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(23,74,126,0.6)' }}>{desc}</p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Process */}
      <section className="section-py bg-[#F5F0E6]">
        <div className="section-container max-w-5xl">
          <MotionSection className="text-center mb-12">
            <SectionEyebrow>Your Journey With Us</SectionEyebrow>
            <h2 className="text-3xl font-bold text-brand-navy">How Our Internship Program Works</h2>
          </MotionSection>
          <StepProcess steps={processSteps} />
        </div>
      </section>

      {/* 5. CTA banner */}
      <section className="bg-[#F5F0E6] section-py relative overflow-hidden">
        {/* Soft color orbs behind the glass panels */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-royal/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="section-container max-w-4xl text-center relative z-10">
          <FadeInView variant="panel3d" className="bg-white/55 backdrop-blur-xl backdrop-saturate-[160%] border border-white/60 rounded-3xl shadow-glass p-10 lg:p-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-4 leading-tight">
              Take the First Step Towards an{" "}
              <span className="text-brand-orange">Exciting Career</span>
            </h2>
            <p className="text-brand-navy/60 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
              Join Raashi Cognitive Technologies Pvt. Ltd. and turn your ideas into real-world impact.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="primary" size="lg">
                <Link to="/apply" className="gap-2 shadow-sm">
                  Apply Now <ArrowRight size={15} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact" className="gap-2">
                  Have questions? Contact Us
                </Link>
              </Button>
            </div>
          </FadeInView>
        </div>
      </section>

    </Layout>
  );
}
