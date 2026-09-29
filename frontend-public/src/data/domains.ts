// ── Sub-section interfaces ───────────────────────────────────────────────────

import type {
  Domain,
  DomainOffer,
  DomainFaq,
  DomainHero,
  DomainOverview,
  DomainOfferCard,
  DomainOfferSection,
  DomainTechSection,
  DomainAppsSection,
  DomainWhyCard,
  DomainWhySection,
  DomainInternship,
  DomainFutureServices,
  DomainFaqSection
} from "../../../shared/domain/types";

export type {
  Domain,
  DomainOffer,
  DomainFaq,
  DomainHero,
  DomainOverview,
  DomainOfferCard,
  DomainOfferSection,
  DomainTechSection,
  DomainAppsSection,
  DomainWhyCard,
  DomainWhySection,
  DomainInternship,
  DomainFutureServices,
  DomainFaqSection
};

const ACCENT_CLASS_MAP: Record<string, string> = {
  "artificial-intelligence": "domain-border-ai",
  "research-innovation": "domain-border-rd",
  "iot-smart-automation": "domain-border-iot",
  "engineering-design": "domain-border-eng",
  "education-training": "domain-border-edu",
};

// ── Default CMS values ────────────────────────────────────────────────────────

const DEFAULT_WHY_CARDS: DomainWhyCard[] = [
  { title: "Expert Team", description: "Experienced professionals dedicated to your success.", icon: "Users", order: 0, enabled: true },
  { title: "Practical Approach", description: "Real-world solutions built on hands-on experience.", icon: "Wrench", order: 1, enabled: true },
  { title: "Innovation Driven", description: "Constantly pushing boundaries with emerging technology.", icon: "Lightbulb", order: 2, enabled: true },
  { title: "Quality & Support", description: "Committed to quality delivery and ongoing support.", icon: "Shield", order: 3, enabled: true },
  { title: "Industry Oriented", description: "Solutions aligned with real industry needs and standards.", icon: "Award", order: 4, enabled: true },
];

const DEFAULT_INTERNSHIP_CHECKLIST = [
  "Duration: 1\u20136 Months",
  "Eligibility: Students, Graduates & Research Scholars",
  "Live Projects & Real-world Problems",
  "Expert Mentorship",
  "Certificate on Completion",
  "Flexible Online / Offline Mode",
];

// ── Static fallback domains ───────────────────────────────────────────────────

export const domains: Domain[] = [
  {
    slug: "artificial-intelligence", order: 1,
    name: "Artificial Intelligence & Data Intelligence", shortName: "Artificial Intelligence",
    tagline: "Building intelligent systems that learn, reason and solve complex problems using data-driven insights.",
    description: "We deliver cutting-edge AI and data intelligence solutions that transform raw data into actionable insights.",
    accentColor: "#0560DF", accentClass: "domain-border-ai",
    heroImage: "/image4.png",
    overviewParagraphs: ["Artificial Intelligence is at the heart of modern business transformation.", "From predictive analytics and machine learning pipelines to cognitive computing, our solutions deliver measurable outcomes."],
    whatWeOffer: [{ title: "AI Solutions", description: "End-to-end AI system design, development, and deployment." }, { title: "Machine Learning", description: "Supervised, unsupervised, and reinforcement learning models." }, { title: "Data Analytics", description: "Transform raw business data into meaningful insights." }, { title: "AI Consulting", description: "Strategic guidance on AI adoption and governance." }],
    technologies: ["Python", "TensorFlow", "PyTorch", "scikit-learn", "OpenCV", "pandas"],
    applications: ["Healthcare", "Manufacturing", "Education", "Retail", "Finance", "Smart Cities"],
    faqs: [
      {
        question: "What cutting-edge AI and Machine Learning solutions does Raashi develop?",
        answer: "We engineer end-to-end intelligent systems, including custom LLM fine-tuning, retrieval-augmented generation (RAG) pipelines, computer vision for automated quality inspection, NLP-based document intelligence, and predictive modeling tailored to enterprise workflows."
      },
      {
        question: "Do we need massive historical datasets to begin an AI engagement?",
        answer: "Not at all. We utilize transfer learning, synthetic data augmentation, and few-shot learning techniques to train accurate models even with limited initial datasets, scaling data pipelines seamlessly as your operations expand."
      },
      {
        question: "How does Raashi ensure client data privacy and intellectual property protection?",
        answer: "Enterprise security is foundational. All client data and models are protected under strict non-disclosure agreements (NDAs). We offer on-premise, private VPC, or edge deployments ensuring your proprietary data never leaves your infrastructure."
      },
      {
        question: "Can your AI models seamlessly integrate with our existing legacy systems?",
        answer: "Yes. We package our AI models into high-performance, containerized REST and gRPC microservices that integrate frictionlessly with your existing ERPs, CRMs, mobile applications, and cloud platforms."
      },
      {
        question: "What makes Raashi's AI internship program unique for aspiring engineers?",
        answer: "Interns work directly on live production-grade systems—building neural networks with PyTorch/TensorFlow, deploying inference microservices, and implementing vector search databases—under the direct mentorship of senior AI practitioners."
      },
      {
        question: "What is the typical timeline from problem formulation to an operational AI MVP?",
        answer: "A focused proof-of-concept (POC) typically takes 3–5 weeks, followed by iterative refinement and full-scale production deployment within 8–12 weeks."
      }
    ],
    hero: { eyebrow: "OUR DOMAIN", heading: "Artificial Intelligence &", heading_highlight: "Data Intelligence", description: "Building intelligent systems that learn, reason and solve complex problems." },
    overview: { eyebrow: "OVERVIEW", heading: "Artificial Intelligence is at the heart of modern business transformation", paragraphs: ["Artificial Intelligence is at the heart of modern business transformation.", "From predictive analytics to cognitive computing, our solutions deliver measurable outcomes."], image_url: null, image_gridfs_id: null },
    whySection: { eyebrow: "WHY CHOOSE RAASHI?", heading: "Your Trusted Technology Partner", cards: DEFAULT_WHY_CARDS },
    internship: { heading: "Internship Opportunities", checklist: DEFAULT_INTERNSHIP_CHECKLIST, cta_label: "Apply for Internship", cta_link: "/apply" },
    futureServices: { enabled: true, heading: "Expanding Capabilities", description: "We are continuously expanding our Artificial Intelligence capabilities." },
  },
  {
    slug: "research-innovation", order: 2,
    name: "Research & Innovation (R&D)", shortName: "Research & Innovation",
    tagline: "Driving innovation through research, technology development and commercialization of new ideas.",
    description: "We fuel the next wave of technological breakthroughs through applied research and systematic R&D processes.",
    accentColor: "#D11753", accentClass: "domain-border-rd",
    heroImage: "/image5.png",
    overviewParagraphs: ["Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions.", "We partner with institutions to conduct applied research across AI, IoT, robotics, and advanced materials."],
    whatWeOffer: [{ title: "Research & Development", description: "Applied and exploratory R&D across emerging tech domains." }, { title: "Product Innovation", description: "Systematic ideation and product development." }, { title: "IP Development", description: "Intellectual property creation and patent guidance." }, { title: "Academic Collaboration", description: "Industry-academia partnership programs." }],
    technologies: ["MATLAB", "Python", "Arduino", "Raspberry Pi", "ROS", "SolidWorks"],
    applications: ["Academic Institutions", "Startups", "Manufacturing", "Healthcare", "Defense"],
    faqs: [
      {
        question: "What primary research areas and emerging technologies does Raashi specialize in?",
        answer: "Our R&D division focuses on autonomous robotics, edge computing architectures, intelligent sensing, bio-inspired algorithms, sustainable smart materials, and human-machine interaction systems."
      },
      {
        question: "Can Raashi assist startups and researchers with Patent and IPR filing?",
        answer: "Yes, absolutely. We provide end-to-end intellectual property guidance—from prior-art patentability searches and technical claim drafting to prototype validation and patent filing strategies with patent attorneys."
      },
      {
        question: "How do institutional and academic research partnerships work?",
        answer: "We collaborate with universities and research centers through joint grant proposals (DST, SERB, AICTE), co-authored journal publications (IEEE, Springer, Elsevier), sponsored lab setups, and faculty development programs."
      },
      {
        question: "What are the tangible deliverables of an R&D engagement?",
        answer: "Deliverables include comprehensive technical feasibility reports, functional proof-of-concept hardware/software prototypes, design patents, and complete documentation ready for commercialization or venture funding."
      },
      {
        question: "What do students and scholars experience during an R&D fellowship or internship?",
        answer: "Fellows tackle novel, unsolved technical challenges, conduct formal literature reviews, experiment with advanced lab equipment, and co-author high-impact research papers and patent disclosures."
      }
    ],
    hero: { eyebrow: "OUR DOMAIN", heading: "Research &", heading_highlight: "Innovation", description: "Driving innovation through research, technology development and commercialization." },
    overview: { eyebrow: "OVERVIEW", heading: "Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions", paragraphs: ["Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions.", "We partner with institutions to conduct applied research across AI, IoT, robotics, and advanced materials."], image_url: null, image_gridfs_id: null },
    whySection: { eyebrow: "WHY CHOOSE RAASHI?", heading: "Your Trusted Technology Partner", cards: DEFAULT_WHY_CARDS },
    internship: { heading: "Internship Opportunities", checklist: DEFAULT_INTERNSHIP_CHECKLIST, cta_label: "Apply for Internship", cta_link: "/apply" },
    futureServices: { enabled: true, heading: "Expanding Capabilities", description: "We are continuously expanding our Research & Innovation capabilities." },
  },
  {
    slug: "iot-smart-automation", order: 3,
    name: "IoT & Smart Automation", shortName: "IoT & Automation",
    tagline: "Creating connected and intelligent systems that automate processes and enhance efficiency.",
    description: "We build comprehensive IoT ecosystems from device firmware to cloud dashboards.",
    accentColor: "#4D9FFF", accentClass: "domain-border-iot",
    heroImage: "/image6.png",
    overviewParagraphs: ["The Internet of Things is revolutionizing how businesses operate \u2014 connecting the physical and digital worlds.", "Our smart automation solutions eliminate manual bottlenecks and enable real-time monitoring."],
    whatWeOffer: [{ title: "IoT Solutions", description: "End-to-end IoT ecosystem design." }, { title: "Smart Automation", description: "Intelligent automation of industrial processes." }, { title: "Industrial Automation", description: "Automation for manufacturing industries." }, { title: "Remote Monitoring", description: "Real-time dashboards with alert management." }],
    technologies: ["Arduino", "Raspberry Pi", "ESP32", "MQTT", "Node-RED", "AWS IoT"],
    applications: ["Smart Manufacturing", "Agriculture", "Smart Buildings", "Healthcare", "Energy"],
    faqs: [
      {
        question: "Which industries benefit the most from Raashi's IoT and Smart Automation systems?",
        answer: "We serve industrial manufacturing (Industry 4.0), smart agriculture, healthcare devices, intelligent building automation, energy monitoring, and cold-chain logistics with real-time telemetry."
      },
      {
        question: "Can you retrofit IoT sensors onto existing legacy industrial machinery?",
        answer: "Yes, non-invasive brownfield retrofitting is one of our key strengths. We deploy non-intrusive current, vibration, temperature, and acoustic sensors to digitize legacy machines without voiding manufacturer warranties or disrupting operations."
      },
      {
        question: "How do you secure IoT devices against cyber attacks and edge vulnerabilities?",
        answer: "Security is baked into hardware and firmware: encrypted hardware roots-of-trust, TLS 1.3 encrypted MQTT communications, secure boot, regular cryptographically signed OTA (Over-The-Air) firmware updates, and zero-trust edge gateway policies."
      },
      {
        question: "Does Raashi build custom IoT cloud dashboards and mobile monitoring apps?",
        answer: "Yes. We deliver custom-branded web dashboards and mobile apps featuring sub-second telemetry visualization, automated anomaly alerts (via SMS, WhatsApp, and email), predictive maintenance triggers, and historical analytics."
      },
      {
        question: "What hardware and embedded skills do interns learn in the IoT program?",
        answer: "Interns gain hands-on mastery in PCB schematic design, microcontroller programming (ESP32, STM32, Raspberry Pi), RTOS, industrial communication protocols (RS-485, Modbus, CAN, LoRaWAN), and cloud integration."
      }
    ],
    hero: { eyebrow: "OUR DOMAIN", heading: "IoT &", heading_highlight: "Smart Automation", description: "Creating connected and intelligent systems that automate processes." },
    overview: { eyebrow: "OVERVIEW", heading: "The Internet of Things is revolutionizing how businesses operate", paragraphs: ["The Internet of Things is revolutionizing how businesses operate \u2014 connecting the physical and digital worlds.", "Our smart automation solutions eliminate manual bottlenecks and enable real-time monitoring."], image_url: null, image_gridfs_id: null },
    whySection: { eyebrow: "WHY CHOOSE RAASHI?", heading: "Your Trusted Technology Partner", cards: DEFAULT_WHY_CARDS },
    internship: { heading: "Internship Opportunities", checklist: DEFAULT_INTERNSHIP_CHECKLIST, cta_label: "Apply for Internship", cta_link: "/apply" },
    futureServices: { enabled: true, heading: "Expanding Capabilities", description: "We are continuously expanding our IoT & Automation capabilities." },
  },
  {
    slug: "engineering-design", order: 4,
    name: "Engineering Design & Digital Manufacturing", shortName: "Engineering Design",
    tagline: "From concept to prototype \u2014 we design, simulate and manufacture innovative products with precision.",
    description: "We provide comprehensive engineering design, simulation, and digital manufacturing services.",
    accentColor: "#F94F0E", accentClass: "domain-border-eng",
    heroImage: "/image7.png",
    overviewParagraphs: ["Engineering Design is the bridge between imagination and reality.", "From concept sketches to validated 3D models, we support the complete product development lifecycle."],
    whatWeOffer: [{ title: "3D Designing & Modeling", description: "Precision 3D CAD models for product design." }, { title: "Simulation & Analysis", description: "FEA, CFD, and thermal analysis to validate designs." }, { title: "3D Printing", description: "Rapid prototyping using FDM, SLA, and SLS." }, { title: "Product Design", description: "Complete product development to DFM-ready packages." }],
    technologies: ["SolidWorks", "AutoCAD", "ANSYS", "MATLAB", "Fusion 360", "CATIA"],
    applications: ["Aerospace", "Automotive", "Consumer Products", "Medical Devices", "Industrial Machinery"],
    faqs: [
      {
        question: "What CAD software and simulation tools does your engineering team employ?",
        answer: "We utilize industry gold-standard tools including SolidWorks, Autodesk Fusion 360, CATIA, and AutoCAD for parametric modeling, alongside ANSYS and MATLAB for FEA (stress/strain) and CFD (fluid/thermal) simulations."
      },
      {
        question: "Which 3D printing and rapid prototyping technologies are available at Raashi?",
        answer: "We operate commercial FDM (Fused Deposition Modeling), SLA (Stereolithography resin), and SLS (Selective Laser Sintering) machines, producing precision functional prototypes in PLA, ABS, PETG, Nylon, and engineering-grade carbon-fiber composites."
      },
      {
        question: "Do you design products with Design for Manufacturing (DFM) guidelines?",
        answer: "Yes. Every concept is engineered with DFM/DFA (Design for Assembly) principles, taking into account injection molding draft angles, sheet metal bend radii, CNC machining clearances, and Bill of Materials (BOM) cost optimization."
      },
      {
        question: "Can you reverse-engineer damaged, obsolete, or undocumented physical parts?",
        answer: "Yes. Using precision optical/laser 3D scanners and metrology tools, we digitize physical components into high-fidelity parametric CAD models, optimize them for modern manufacturing, and 3D print functional replacements."
      },
      {
        question: "What hands-on experience do interns gain in Engineering Design?",
        answer: "Interns take a product from blank-screen conceptual sketching to 3D CAD modeling, run structural stress analyses, slice files for 3D printers, operate rapid prototyping machinery, and assemble real physical prototypes."
      }
    ],
    hero: { eyebrow: "OUR DOMAIN", heading: "Engineering Design &", heading_highlight: "Digital Manufacturing", description: "From concept to prototype \u2014 we design, simulate and manufacture innovative products." },
    overview: { eyebrow: "OVERVIEW", heading: "Engineering Design is the bridge between imagination and reality", paragraphs: ["Engineering Design is the bridge between imagination and reality. Our team leverages industry-standard tools.", "From concept sketches to validated 3D models, we support the complete product development lifecycle."], image_url: null, image_gridfs_id: null },
    whySection: { eyebrow: "WHY CHOOSE RAASHI?", heading: "Your Trusted Technology Partner", cards: DEFAULT_WHY_CARDS },
    internship: { heading: "Internship Opportunities", checklist: DEFAULT_INTERNSHIP_CHECKLIST, cta_label: "Apply for Internship", cta_link: "/apply" },
    futureServices: { enabled: true, heading: "Expanding Capabilities", description: "We are continuously expanding our Engineering Design capabilities." },
  },
  {
    slug: "education-training", order: 5,
    name: "Education, Training & Academic Consultancy", shortName: "Education & Training",
    tagline: "Empowering students, researchers and institutions with knowledge, skills and consulting support.",
    description: "We bridge the gap between academic learning and industry requirements through structured training.",
    accentColor: "#F94F0E", accentClass: "domain-border-edu",
    heroImage: "/image8.png",
    overviewParagraphs: ["Education is the foundation of every technological breakthrough.", "We partner with students, researchers, and institutions to deliver structured skill development programs."],
    whatWeOffer: [{ title: "Internship Programs", description: "Structured 1\u20136 month programs across all technology domains." }, { title: "Skill Development Training", description: "Hands-on technical training in AI, IoT, and engineering." }, { title: "Academic Consultancy", description: "Guidance on project selection and research methodology." }, { title: "Project Development", description: "End-to-end support for final year and mini projects." }],
    technologies: ["Python", "TensorFlow", "Arduino", "MATLAB", "SolidWorks", "Jupyter"],
    applications: ["Engineering Colleges", "Polytechnics", "Universities", "Corporate Training", "EdTech"],
    faqs: [
      {
        question: "What types of internship and skill-development programs do you offer?",
        answer: "We offer 1-month, 3-month, and 6-month intensive, project-driven internship programs across Artificial Intelligence, IoT & Robotics, Engineering Design, Full-Stack Web Development, and Applied R&D."
      },
      {
        question: "Are the internship programs available in online, offline, or hybrid modes?",
        answer: "Yes! We offer flexible learning modes: fully in-person at our tech center in Belgaum for intensive hardware/lab access, as well as live mentor-led virtual/hybrid options for outstation students."
      },
      {
        question: "Will I receive an official certificate, letter of recommendation, and project review?",
        answer: "Every candidate who successfully finishes their program receives an official, verifiable Certificate of Completion from Raashi Cognitive Technologies Pvt. Ltd., project viva verification, and high performers receive formal Letters of Recommendation (LORs)."
      },
      {
        question: "How does Raashi mentor students on final year B.Tech, M.Tech, and Diploma capstone projects?",
        answer: "We guide students through IEEE-aligned problem selection, system architecture design, component sourcing, coding, testing, and report/paper preparation according to university guidelines."
      },
      {
        question: "How can engineering colleges, polytechnics, and universities partner with Raashi?",
        answer: "We sign institutional Memorandums of Understanding (MoUs) for setting up Center of Excellence (CoE) labs, delivering accredited faculty development programs (FDPs), conducting hackathons, and providing campus placement assistance."
      }
    ],
    hero: { eyebrow: "OUR DOMAIN", heading: "Education &", heading_highlight: "Training", description: "Empowering students, researchers and institutions with knowledge and skills." },
    overview: { eyebrow: "OVERVIEW", heading: "Education is the foundation of every technological breakthrough", paragraphs: ["Education is the foundation of every technological breakthrough.", "We partner with students, researchers, and institutions to deliver structured skill development programs."], image_url: null, image_gridfs_id: null },
    whySection: { eyebrow: "WHY CHOOSE RAASHI?", heading: "Your Trusted Technology Partner", cards: DEFAULT_WHY_CARDS },
    internship: { heading: "Internship Opportunities", checklist: DEFAULT_INTERNSHIP_CHECKLIST, cta_label: "Apply for Internship", cta_link: "/apply" },
    futureServices: { enabled: true, heading: "Expanding Capabilities", description: "We are continuously expanding our Education & Training capabilities." },
  },
];

export const getDomainBySlug = (slug: string): Domain | undefined =>
  domains.find((d) => d.slug === slug);

export const getDomainAccentStyle = (domain: Domain) => ({
  borderTopColor: domain.accentColor,
  borderTopWidth: "4px",
  borderTopStyle: "solid" as const,
});

// ── normalizeDomain ──────────────────────────────────────────────────────────
/**
 * Normalise a single domain document returned by the API (snake_case) into
 * the frontend Domain shape (camelCase).
 * Priority: structured CMS sections > legacy flat fields > static fallbacks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDomain(d: any): Domain {
  const localFallback = domains.find((loc) => loc.slug === d.slug);

  const slug: string = d.slug ?? "";
  const shortName: string = d.short_name ?? d.shortName ?? localFallback?.shortName ?? "";
  const accentColor: string = d.accent_color ?? d.accentColor ?? localFallback?.accentColor ?? "#0560DF";
  const accentClass: string = ACCENT_CLASS_MAP[slug] ?? localFallback?.accentClass ?? "";

  const asArray = <T,>(value: unknown, fallback: T[]): T[] => Array.isArray(value) ? value as T[] : fallback;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapHero = (h: any): DomainHero => ({
    eyebrow: h?.eyebrow ?? "OUR DOMAIN",
    heading: h?.heading ?? shortName,
    heading_highlight: h?.heading_highlight ?? "",
    description: h?.description ?? (d.description ?? ""),
    image_url: h?.image_url,
    image_gridfs_id: h?.image_gridfs_id,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapOverview = (o: any): DomainOverview => ({
    eyebrow: o?.eyebrow ?? "OVERVIEW",
    heading: o?.heading ?? (overviewParagraphs[0]?.split(".")[0] ?? ""),
    paragraphs: asArray<string>(o?.paragraphs, overviewParagraphs),
    image_url: o?.image_url ?? null,
    image_gridfs_id: o?.image_gridfs_id ?? null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapOfferSection = (s: any): DomainOfferSection => ({
    eyebrow: s?.eyebrow ?? "WHAT WE OFFER",
    heading: s?.heading ?? `Our ${shortName} Services`,
    cards: whatWeOffer,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapTechSection = (t: any): DomainTechSection => ({
    eyebrow: t?.eyebrow ?? "TECHNOLOGIES WE USE",
    heading: t?.heading ?? "Tools & Frameworks",
    items: asArray<string>(t?.items, technologies),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapAppsSection = (a: any): DomainAppsSection => ({
    eyebrow: a?.eyebrow ?? "APPLICATIONS",
    heading: a?.heading ?? "Industries We Serve",
    description: a?.description ?? `Where our ${shortName} solutions create real impact.`,
    items: asArray<string>(a?.items, applications),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapWhySection = (w: any): DomainWhySection => ({
    eyebrow: w?.eyebrow ?? "WHY CHOOSE RAASHI?",
    heading: w?.heading ?? "Your Trusted Technology Partner",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cards: asArray<any>(w?.cards, DEFAULT_WHY_CARDS).map((c: any) => ({
      title: c.title ?? "", description: c.description ?? "",
      icon: c.icon ?? "Check", order: c.order ?? 0, enabled: c.enabled !== false,
    })),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInternship = (i: any): DomainInternship => ({
    heading: i?.heading ?? "Internship Opportunities",
    checklist: asArray<string>(i?.checklist, DEFAULT_INTERNSHIP_CHECKLIST),
    cta_label: i?.cta_label ?? "Apply for Internship",
    cta_link: i?.cta_link ?? "/apply",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFutureServices = (f: any): DomainFutureServices => ({
    enabled: f?.enabled !== false,
    heading: f?.heading ?? "Expanding Capabilities",
    description: f?.description ?? `We are continuously expanding our ${shortName} capabilities.`,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFaqSection = (s: any): DomainFaqSection => ({
    eyebrow: s?.eyebrow ?? "FAQ",
    contact_heading: s?.contact_heading ?? "Have more questions?",
    contact_description: s?.contact_description ?? "We're here to help. Reach out and our team will respond within 24 hours.",
    contact_cta_label: s?.contact_cta_label ?? "Contact Us",
    contact_cta_link: s?.contact_cta_link ?? "/contact",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: asArray<any>(s?.items, faqs).map((f: any) => ({ question: f.question ?? "", answer: f.answer ?? "" })),
  });

function decodeEntities(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

  const rawHero = d.hero ?? null;
  const rawOverview = d.overview ?? null;
  // D1 repositories expose JSON columns without their `_json` suffix. Support
  // those names while retaining the older API contract for compatibility.
  const rawOffer = d.offer_section ?? d.offers ?? null;
  const rawTech = d.tech_section ?? d.tech ?? null;
  const rawApps = d.apps_section ?? d.apps ?? null;
  const rawWhy = d.why_section ?? d.why ?? null;
  const rawInternship = d.internship ?? null;
  const rawFuture = d.future_services ?? d.future ?? null;
  // The canonical API key is `faq_section`. Older deployed workers returned
  // the same structured section under `faqs`, while much older responses used
  // `faqs` as a plain array. Accept all three shapes so persisted CMS FAQs are
  // not silently replaced by static fallbacks before they reach the renderer.
  const rawFaq = d.faq_section
    ?? (Array.isArray(d.faqs) ? { items: d.faqs } : d.faqs && typeof d.faqs === "object" ? d.faqs : null);

  // API/D1 structured sections are canonical. Legacy flat fields and local
  // definitions are outage/backwards-compatibility fallbacks only.
  const overviewParagraphs = asArray<string>(
    rawOverview?.paragraphs ?? d.overview_paragraphs ?? d.overviewParagraphs,
    localFallback?.overviewParagraphs ?? [],
  );
  
  const validOfferCards = [
    rawOffer?.cards,
    Array.isArray(rawOffer) ? rawOffer : undefined,
    d.offers,
    d.what_we_offer,
    d.whatWeOffer
  ].find((arr) => Array.isArray(arr) && arr.length > 0);

  const whatWeOffer: DomainOffer[] = asArray<any>(
    validOfferCards,
    localFallback?.whatWeOffer ?? [],
  ).map((o: any) => ({ title: o.title ?? "", description: o.description ?? "" }));

  const technologies = asArray<string>(rawTech?.items ?? d.technologies, localFallback?.technologies ?? []);
  const applications = asArray<string>(rawApps?.items ?? d.applications, localFallback?.applications ?? []);
  const faqs: DomainFaq[] = asArray<any>(rawFaq?.items ?? d.faqs, localFallback?.faqs ?? []).map(
    (f: any) => ({ question: f.question ?? "", answer: f.answer ?? "" }),
  );

  return {
    slug,
    order: d.order ?? localFallback?.order ?? 0,
    name: decodeEntities(d.name || localFallback?.name || ""),
    shortName: decodeEntities(shortName),
    tagline: decodeEntities(d.tagline ?? localFallback?.tagline ?? ""),
    description: decodeEntities(d.description ?? localFallback?.description ?? ""),
    accentColor,
    accentClass,
    heroImage: d.hero_image ?? d.heroImage ?? rawHero?.image_url ?? localFallback?.heroImage,
    overviewParagraphs,
    whatWeOffer,
    technologies,
    applications,
    faqs,
    hero: mapHero(rawHero),
    overview: mapOverview(rawOverview),
    offerSection: mapOfferSection(rawOffer),
    techSection: mapTechSection(rawTech),
    appsSection: mapAppsSection(rawApps),
    whySection: mapWhySection(rawWhy),
    internship: mapInternship(rawInternship),
    futureServices: mapFutureServices(rawFuture),
    faqSection: mapFaqSection(rawFaq),
    seo_title: d.seo_title ?? d.seoTitle ?? undefined,
    seo_description: d.seo_description ?? d.seoDescription ?? undefined,
    seo_image: d.seo_image ?? d.seoImage ?? undefined,
  };
}

const TEST_DOMAIN_SLUGS = new Set(["testdomain", "test-domain", "test", "placeholder"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDomainsResponse(data: any): Domain[] {
  const raw = data?.domains ?? data ?? [];
  return (Array.isArray(raw) ? raw : [])
    .map(normalizeDomain)
    .filter((d) => !TEST_DOMAIN_SLUGS.has(d.slug));
}
