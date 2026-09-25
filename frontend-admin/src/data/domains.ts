export interface DomainOffer {
  title: string;
  description: string;
}

export interface DomainFaq {
  question: string;
  answer: string;
}

export interface Domain {
  slug: string;
  order: number;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;
  accentClass: string;
  heroImage?: string;
  overviewParagraphs: string[];
  whatWeOffer: DomainOffer[];
  technologies: string[];
  applications: string[];
  faqs: DomainFaq[];
}

export const domains: Domain[] = [
  {
    slug: "artificial-intelligence",
    order: 1,
    name: "Artificial Intelligence & Data Intelligence",
    shortName: "Artificial Intelligence",
    tagline: "Building intelligent systems that learn, reason and solve complex problems using data-driven insights.",
    description: "We deliver cutting-edge AI and data intelligence solutions that transform raw data into actionable insights, empowering businesses to make smarter decisions, automate processes, and stay ahead in the digital era.",
    accentColor: "#0560DF",
    accentClass: "domain-border-ai",
    heroImage: "/image4.png",
    overviewParagraphs: [
      "Artificial Intelligence is at the heart of modern business transformation. At Raashi Cognitive Technologies, we develop AI-powered systems that learn from data, reason across domains, and solve complex real-world problems with precision and efficiency.",
      "From predictive analytics and machine learning pipelines to cognitive computing and enterprise AI deployment, our solutions are designed to deliver measurable outcomes — reducing costs, increasing efficiency, and unlocking new growth opportunities for our clients.",
    ],
    whatWeOffer: [
      { title: "AI Solutions", description: "End-to-end AI system design, development, and deployment tailored to your business." },
      { title: "Machine Learning", description: "Supervised, unsupervised, and reinforcement learning models for complex pattern recognition." },
      { title: "Cognitive Computing", description: "Systems that simulate human thought processes to solve unstructured problems." },
      { title: "Data Analytics", description: "Transform raw business data into meaningful insights with advanced analytics pipelines." },
      { title: "Predictive Modeling", description: "Forecast trends, demand, and outcomes using statistical and ML-based models." },
      { title: "Intelligent Systems", description: "Autonomous systems that perceive, reason, learn, and act with minimal human intervention." },
      { title: "AI Consulting", description: "Strategic guidance on AI adoption, roadmap planning, and responsible AI governance." },
      { title: "AI Deployment & Integration", description: "Seamlessly integrate AI models into existing enterprise workflows and infrastructure." },
    ],
    technologies: ["Python", "TensorFlow", "PyTorch", "scikit-learn", "OpenCV", "pandas", "NumPy", "Jupyter", "FastAPI", "Docker"],
    applications: ["Healthcare & Diagnostics", "Manufacturing & Quality", "Education & EdTech", "Retail & E-commerce", "Finance & Banking", "Smart Cities", "Agriculture", "Logistics & Supply Chain"],
    faqs: [
      { question: "What types of AI solutions do you develop?", answer: "We develop a wide range of AI solutions including machine learning models, natural language processing systems, computer vision applications, predictive analytics platforms, and intelligent automation tools tailored to your specific business needs." },
      { question: "Do I need a large dataset to start an AI project?", answer: "Not necessarily. While more data generally improves model accuracy, we can work with smaller datasets using transfer learning, data augmentation, and other techniques. We'll assess your data situation and recommend the best approach." },
      { question: "How long does an AI project typically take?", answer: "Project timelines vary based on complexity. A focused ML model can be built in 4–8 weeks, while comprehensive AI platforms may take 3–6 months. We provide detailed timelines during our initial consultation." },
      { question: "Can you integrate AI into our existing systems?", answer: "Yes. We specialize in integrating AI capabilities into existing enterprise systems, ERP platforms, CRMs, and custom applications through well-defined APIs and microservices architectures." },
      { question: "Do you offer AI internship programs in this domain?", answer: "Yes! We offer 1–6 month internship programs in AI and Data Science where students work on real-world projects under expert mentorship." },
      { question: "Is AI suitable for small and medium businesses?", answer: "Absolutely. AI solutions today are increasingly accessible and scalable. We design cost-effective AI implementations suitable for businesses of all sizes, ensuring ROI from day one." },
    ],
  },
  {
    slug: "research-innovation",
    order: 2,
    name: "Research & Innovation (R&D)",
    shortName: "Research & Innovation",
    tagline: "Driving innovation through research, technology development and commercialization of new ideas.",
    description: "We fuel the next wave of technological breakthroughs by conducting applied research, developing emerging technologies, and helping organizations bring innovative ideas to life through systematic R&D processes.",
    accentColor: "#D11753",
    accentClass: "domain-border-rd",
    heroImage: "/image5.png",
    overviewParagraphs: [
      "Innovation is not accidental — it is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions. At Raashi Cognitive Technologies, our R&D practice bridges academia and industry to deliver breakthrough technologies.",
      "We partner with institutions, startups, and enterprises to conduct applied research across AI, IoT, robotics, and advanced materials — translating research outcomes into commercially viable products, patents, and intellectual property.",
    ],
    whatWeOffer: [
      { title: "Research & Development", description: "Applied and exploratory R&D across AI, IoT, robotics, and emerging tech domains." },
      { title: "Emerging Technologies", description: "Deep-dive research and prototyping in AI, IoT, robotics, and next-gen computing." },
      { title: "Product Innovation", description: "Systematic ideation, design thinking, and product development from concept to prototype." },
      { title: "Technology Commercialization", description: "Bridge R&D outcomes to market-ready products and business models." },
      { title: "IP Development", description: "Support for intellectual property creation, documentation, and patent filing strategies." },
      { title: "Technology Licensing", description: "Evaluate, structure, and manage technology licensing agreements and partnerships." },
      { title: "Academic Collaboration", description: "Industry-academia partnership programs for joint research and knowledge transfer." },
      { title: "Innovation Consulting", description: "Strategic advisory on building innovation capabilities within your organization." },
    ],
    technologies: ["MATLAB", "Python", "Arduino", "Raspberry Pi", "ROS (Robot Operating System)", "SolidWorks", "ANSYS", "Jupyter", "LaTeX", "Proteus"],
    applications: ["Academic Institutions", "Startups & Deep Tech", "Manufacturing & Industry 4.0", "Healthcare Innovation", "Defense & Aerospace", "Smart Infrastructure", "AgriTech", "Energy & Sustainability"],
    faqs: [
      { question: "What research areas does Raashi specialize in?", answer: "Our core research areas include Artificial Intelligence, Internet of Things, robotics, advanced automation, engineering design, and educational technology. We also collaborate on interdisciplinary projects spanning these domains." },
      { question: "Can you help with patent filing for our invention?", answer: "Yes. We provide IP development support including invention documentation, prior art analysis, and guidance on patent filing strategies through our network of IP professionals." },
      { question: "Do you collaborate with colleges and universities?", answer: "Absolutely. We actively partner with academic institutions for joint research, student project mentorship, sponsored research programs, and industry-academia knowledge exchange." },
      { question: "How is R&D project pricing structured?", answer: "R&D projects are priced based on scope, duration, and resource requirements. We offer both fixed-price engagements for well-defined projects and retainer models for ongoing research partnerships." },
      { question: "Can students intern in your R&D division?", answer: "Yes! Our R&D internship is one of our most sought-after programs. Students work on live research problems, contribute to publications, and develop deep technical expertise." },
      { question: "What is the typical output of an R&D engagement?", answer: "Outputs vary by project but typically include research reports, proof-of-concept prototypes, technical specifications, patent disclosures, and peer-reviewed publications where applicable." },
    ],
  },
  {
    slug: "iot-smart-automation",
    order: 3,
    name: "IoT & Smart Automation",
    shortName: "IoT & Automation",
    tagline: "Creating connected and intelligent systems that automate processes and enhance efficiency.",
    description: "We design and deploy end-to-end IoT ecosystems and smart automation solutions that connect devices, collect real-time data, and drive intelligent decisions — transforming physical environments into responsive, data-driven systems.",
    accentColor: "#4D9FFF",
    accentClass: "domain-border-iot",
    heroImage: "/image6.png",
    overviewParagraphs: [
      "The Internet of Things is revolutionizing how businesses operate — connecting the physical and digital worlds to create smarter, more efficient environments. At Raashi Cognitive Technologies, we build comprehensive IoT ecosystems from device firmware to cloud dashboards.",
      "Our smart automation solutions eliminate manual bottlenecks, reduce operational costs, and enable real-time monitoring and control of industrial and commercial environments — all while ensuring security, scalability, and reliability.",
    ],
    whatWeOffer: [
      { title: "IoT Solutions", description: "End-to-end IoT ecosystem design, from edge devices to cloud-based management platforms." },
      { title: "Smart Automation", description: "Intelligent automation of industrial, commercial, and residential processes." },
      { title: "IoT Devices & Sensors", description: "Custom sensor integration, firmware development, and hardware prototyping." },
      { title: "IoT Platform Development", description: "Scalable cloud platforms for device management, data ingestion, and analytics." },
      { title: "Connected Systems", description: "Integration of disparate devices and systems into unified, communicating networks." },
      { title: "Industrial Automation", description: "Retrofit and new-build automation for manufacturing and process industries." },
      { title: "Commercial Automation", description: "Smart building, energy management, and facility automation solutions." },
      { title: "Remote Monitoring", description: "Real-time monitoring dashboards with alert management and predictive maintenance." },
    ],
    technologies: ["Arduino", "Raspberry Pi", "ESP32", "MQTT", "Node-RED", "AWS IoT", "Python", "C/C++", "LoRaWAN", "Modbus"],
    applications: ["Smart Manufacturing", "Agriculture & Precision Farming", "Smart Buildings", "Healthcare Monitoring", "Energy Management", "Logistics & Tracking", "Smart Cities", "Water & Environmental Monitoring"],
    faqs: [
      { question: "What industries benefit most from IoT solutions?", answer: "Manufacturing, agriculture, healthcare, smart buildings, logistics, and utilities see the greatest ROI from IoT implementations. However, almost any industry with physical processes can benefit from connected device solutions." },
      { question: "How do you ensure IoT security?", answer: "We implement security at every layer — encrypted communication (TLS/MQTT over TLS), secure boot on devices, role-based access control on platforms, and regular vulnerability assessments." },
      { question: "Can you retrofit IoT into our existing equipment?", answer: "Yes. We specialize in brownfield IoT deployments, adding sensors and connectivity to existing machinery without significant downtime or replacement costs." },
      { question: "What is the typical project timeline for an IoT deployment?", answer: "Simple monitoring solutions can be deployed in 4–6 weeks. Complex industrial automation projects may take 3–12 months depending on scope, hardware customization, and integration requirements." },
      { question: "Do you offer IoT internship programs?", answer: "Yes! Our IoT internship gives students hands-on experience with hardware programming, sensor integration, and platform development on real client projects." },
      { question: "How do you handle data from IoT devices?", answer: "We design robust data pipelines — from edge preprocessing to cloud storage and analytics. We work with time-series databases, streaming platforms, and BI tools to make device data actionable." },
    ],
  },
  {
    slug: "engineering-design",
    order: 4,
    name: "Engineering Design & Digital Manufacturing",
    shortName: "Engineering Design",
    tagline: "From concept to prototype — we design, simulate and manufacture innovative products with precision.",
    description: "We provide comprehensive engineering design, simulation, and digital manufacturing services — turning ideas into precise, manufacturable products through advanced CAD, FEA analysis, and additive manufacturing technologies.",
    accentColor: "#F94F0E",
    accentClass: "domain-border-eng",
    heroImage: "/image7.png",
    overviewParagraphs: [
      "Engineering Design is the bridge between imagination and reality. At Raashi Cognitive Technologies, our engineering team leverages industry-standard tools to design, analyze, and manufacture products with the precision that modern applications demand.",
      "From initial concept sketches to fully validated 3D models, simulation-tested prototypes, and additive-manufactured final products, we support the complete product development lifecycle — accelerating time-to-market while ensuring design integrity.",
    ],
    whatWeOffer: [
      { title: "3D Designing & Modeling", description: "Precision 3D CAD models for mechanical, structural, and product design applications." },
      { title: "Simulation & Analysis", description: "FEA, CFD, and thermal analysis to validate designs before physical prototyping." },
      { title: "3D Printing & Additive Manufacturing", description: "Rapid prototyping and end-use part production using FDM, SLA, and SLS technologies." },
      { title: "Prototyping & Customization", description: "Custom prototype development with iterative design refinement cycles." },
      { title: "Product Design & Development", description: "Complete product development from concept through DFM-ready engineering packages." },
      { title: "Technical & Engineering Services", description: "Technical documentation, BOM preparation, and manufacturing support services." },
      { title: "Reverse Engineering", description: "Digitize existing physical parts for redesign, improvement, or remanufacturing." },
      { title: "Engineering Consultancy", description: "Expert advisory for material selection, structural optimization, and manufacturing process planning." },
    ],
    technologies: ["SolidWorks", "AutoCAD", "ANSYS", "MATLAB", "Fusion 360", "Ultimaker Cura", "Siemens NX", "CATIA", "Arduino", "Proteus"],
    applications: ["Aerospace & Defense", "Automotive & Mobility", "Consumer Products", "Medical Devices", "Industrial Machinery", "Architecture & Construction", "Electronics Enclosures", "Educational Prototyping"],
    faqs: [
      { question: "What 3D design software do you use?", answer: "We primarily use SolidWorks, AutoCAD, Fusion 360, and CATIA for 3D modeling. For simulation and analysis, we use ANSYS and MATLAB. We can also work with client-preferred software upon request." },
      { question: "What types of 3D printing technologies do you support?", answer: "We support FDM (Fused Deposition Modeling), SLA (Stereolithography), and SLS (Selective Laser Sintering) technologies, allowing us to produce prototypes in plastics, resins, and engineering-grade materials." },
      { question: "Can you design products for mass manufacturing?", answer: "Yes. Our Design for Manufacturing (DFM) approach ensures that all designs are optimized for the intended production process, whether injection molding, CNC machining, sheet metal fabrication, or additive manufacturing." },
      { question: "How long does it take to go from concept to prototype?", answer: "A basic prototype can be ready in 2–4 weeks depending on complexity. Full product development from concept to manufacturing-ready drawings typically takes 6–16 weeks." },
      { question: "Do you offer engineering internships?", answer: "Yes! Our Engineering Design internship provides students with hands-on CAD, simulation, and 3D printing experience on real projects — perfect for mechanical and production engineering students." },
      { question: "Can you help validate a design before manufacturing?", answer: "Absolutely. Our simulation and analysis services use FEA and CFD to identify stress points, thermal issues, and failure modes before any physical material is committed — saving significant time and cost." },
    ],
  },
  {
    slug: "education-training",
    order: 5,
    name: "Education, Training & Academic Consultancy",
    shortName: "Education & Training",
    tagline: "Empowering students, researchers and institutions with knowledge, skills and consulting support.",
    description: "We bridge the gap between academic learning and industry requirements through structured training programs, internships, project development support, and strategic academic consultancy for institutions and students.",
    accentColor: "#F94F0E",
    accentClass: "domain-border-edu",
    heroImage: "/image8.png",
    overviewParagraphs: [
      "Education is the foundation of every technological breakthrough. At Raashi Cognitive Technologies, our Education & Training division is dedicated to building future-ready professionals through practical, industry-aligned learning experiences that go beyond textbooks.",
      "We partner with students, researchers, and educational institutions to deliver structured skill development programs, academic consultancy, and institutional support services — creating pathways from knowledge to career success.",
    ],
    whatWeOffer: [
      { title: "Internship Programs", description: "Structured 1–6 month internship programs across all our technology domains." },
      { title: "Skill Development Training", description: "Hands-on technical training in AI, IoT, engineering design, and emerging technologies." },
      { title: "Academic Consultancy", description: "Guidance for students on project selection, research methodology, and academic planning." },
      { title: "Project Development", description: "End-to-end support for final year projects, mini-projects, and research assignments." },
      { title: "Patent & IPR Consultancy", description: "Guidance on intellectual property rights, patent filing, and innovation documentation." },
      { title: "Institutional Accreditation Consultancy", description: "Strategic support for institutions seeking NAAC, NBA, or other accreditation processes." },
      { title: "Workshop & Seminars", description: "Technical workshops, guest lectures, and industry-academia events for institutions." },
      { title: "Research Publication Support", description: "Guidance on research paper writing, journal selection, and publication submission." },
    ],
    technologies: ["Python", "TensorFlow", "Arduino", "MATLAB", "SolidWorks", "Jupyter Notebook", "MS Office Suite", "LaTeX", "Google Colab", "Scratch/Block Programming"],
    applications: ["Engineering Colleges", "Polytechnics & ITIs", "Universities & Research Institutions", "Corporate Training", "Individual Students & Graduates", "Government Skill Programs", "EdTech Platforms", "School STEM Programs"],
    faqs: [
      { question: "What internship domains do you offer?", answer: "We offer internships across all five of our technology domains: Artificial Intelligence, Research & Innovation, IoT & Smart Automation, Engineering Design & Digital Manufacturing, and Education & Training itself." },
      { question: "Is the internship online or offline?", answer: "We offer both online and offline internship modes. Students can choose their preferred mode during the application process, subject to availability and project requirements." },
      { question: "Will I receive a certificate after completing the internship?", answer: "Yes. All students who successfully complete the internship program receive a Certificate of Completion from Raashi Cognitive Technologies Pvt. Ltd., which can be added to your resume and LinkedIn profile." },
      { question: "How can our institution partner with Raashi Cognitive Technologies?", answer: "We welcome institutional partnerships for student internships, campus workshops, sponsored research, and accreditation consultancy. Please contact us at raashitechnologies@gmail.com to discuss partnership opportunities." },
      { question: "Do you offer project support for final year engineering students?", answer: "Yes! We provide comprehensive project development support including topic selection, literature review, design and development, testing, documentation, and presentation preparation for final year and mini projects." },
      { question: "What is the fee structure for your training programs?", answer: "Training program fees vary by duration, domain, and mode of delivery. Please contact us directly for current pricing. We also offer institutional group rates and scholarship opportunities for deserving students." },
    ],
  },
];

export const getDomainBySlug = (slug: string): Domain | undefined =>
  domains.find((d) => d.slug === slug);

export const getDomainAccentStyle = (domain: Domain) => ({
  borderTopColor: domain.accentColor,
  borderTopWidth: "4px",
  borderTopStyle: "solid" as const,
});

/**
 * Normalise a single domain document returned by the API (snake_case)
 * into the frontend Domain shape (camelCase).
 * Gracefully handles both formats so it works with API data and static data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDomain(d: any): Domain {
  const localFallback = domains.find((loc) => loc.slug === d.slug);
  return {
    slug: d.slug ?? "",
    order: d.order ?? 0,
    name: d.name ?? "",
    shortName: d.short_name ?? d.shortName ?? "",
    tagline: d.tagline ?? "",
    description: d.description ?? "",
    accentColor: d.accent_color ?? d.accentColor ?? "#0560DF",
    accentClass: d.accent_class ?? d.accentClass ?? "",
    heroImage: d.hero_image ?? d.heroImage ?? localFallback?.heroImage,
    overviewParagraphs: d.overview_paragraphs ?? d.overviewParagraphs ?? [],
    whatWeOffer: (d.what_we_offer ?? d.whatWeOffer ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => ({ title: o.title ?? "", description: o.description ?? "" })
    ),
    technologies: d.technologies ?? [],
    applications: d.applications ?? [],
    faqs: (d.faqs ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => ({ question: f.question ?? "", answer: f.answer ?? "" })
    ),
  };
}

/**
 * Known test / placeholder domain slugs that should never appear in the public UI.
 * Add any additional test slugs here as needed.
 * NOTE: This only filters the frontend rendering layer — it does NOT delete database records.
 */
const TEST_DOMAIN_SLUGS = new Set([
  "testdomain",
  "test-domain",
  "test",
  "placeholder",
]);

/**
 * Normalise the full domain list from the API response.
 * Filters out known test/placeholder domains before returning.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDomainsResponse(data: any): Domain[] {
  const raw = data?.domains ?? data ?? [];
  return (Array.isArray(raw) ? raw : [])
    .map(normalizeDomain)
    .filter((d) => !TEST_DOMAIN_SLUGS.has(d.slug));
}
