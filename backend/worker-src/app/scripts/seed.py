"""
Seed script — populates the `domains`, `job_openings`, `users`, and `website_content` collections.
Run: python -m app.scripts.seed   (from backend/ directory)
"""
import asyncio
# import certifi
# import os
# from datetime import datetime, timezone
import bcrypt
from app.core.config import get_settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


_DEFAULT_WHY_CARDS = [
    {"title": "Expert Team", "description": "Experienced professionals dedicated to your success.", "icon": "Users", "order": 0, "enabled": True},
    {"title": "Practical Approach", "description": "Real-world solutions built on hands-on experience.", "icon": "Wrench", "order": 1, "enabled": True},
    {"title": "Innovation Driven", "description": "Constantly pushing boundaries with emerging technology.", "icon": "Lightbulb", "order": 2, "enabled": True},
    {"title": "Quality & Support", "description": "Committed to quality delivery and ongoing support.", "icon": "Shield", "order": 3, "enabled": True},
    {"title": "Industry Oriented", "description": "Solutions aligned with real industry needs and standards.", "icon": "Award", "order": 4, "enabled": True},
]

_DEFAULT_INTERNSHIP = {
    "heading": "Internship Opportunities",
    "checklist": [
        "Duration: 1\u20136 Months",
        "Eligibility: Students, Graduates & Research Scholars",
        "Live Projects & Real-world Problems",
        "Expert Mentorship",
        "Certificate on Completion",
        "Flexible Online / Offline Mode",
    ],
    "cta_label": "Apply for Internship",
    "cta_link": "/apply",
}


def _default_faq_section(items: list) -> dict:
    return {
        "eyebrow": "FAQ",
        "contact_heading": "Have more questions?",
        "contact_description": "We're here to help. Reach out and our team will respond within 24 hours.",
        "contact_cta_label": "Contact Us",
        "contact_cta_link": "/contact",
        "items": items,
    }


_AI_FAQS = [
    {"question": "What types of AI solutions do you develop?", "answer": "We develop ML models, NLP systems, computer vision applications, predictive analytics platforms, and intelligent automation tools."},
    {"question": "Do I need a large dataset to start?", "answer": "Not necessarily. We use transfer learning and data augmentation for smaller datasets."},
    {"question": "How long does an AI project take?", "answer": "A focused ML model: 4\u20138 weeks. Comprehensive platforms: 3\u20136 months."},
    {"question": "Can you integrate AI into existing systems?", "answer": "Yes, through well-defined APIs and microservices architectures."},
    {"question": "Do you offer AI internship programs?", "answer": "Yes! 1\u20136 month internship programs with real-world AI projects."},
    {"question": "Is AI suitable for small businesses?", "answer": "Absolutely. We design cost-effective, scalable AI solutions for all business sizes."},
]

_RD_FAQS = [
    {"question": "What research areas does Raashi specialize in?", "answer": "AI, IoT, robotics, advanced automation, engineering design, and educational technology."},
    {"question": "Can you help with patent filing?", "answer": "Yes, including invention documentation and patent filing strategies."},
    {"question": "Do you collaborate with universities?", "answer": "Yes, through joint research, student mentorship, and sponsored research programs."},
    {"question": "How is R&D project pricing structured?", "answer": "Fixed-price for well-defined projects, retainer models for ongoing research."},
    {"question": "Can students intern in R&D?", "answer": "Yes! Students work on live research problems and contribute to publications."},
    {"question": "What are typical R&D outputs?", "answer": "Research reports, prototypes, technical specifications, patent disclosures, and publications."},
]

_IOT_FAQS = [
    {"question": "Which industries benefit most from IoT?", "answer": "Manufacturing, agriculture, healthcare, smart buildings, logistics, and utilities."},
    {"question": "How do you ensure IoT security?", "answer": "Encrypted communication, secure boot, role-based access control, and regular vulnerability assessments."},
    {"question": "Can you retrofit IoT into existing equipment?", "answer": "Yes, we specialize in brownfield IoT deployments."},
    {"question": "What is the typical project timeline?", "answer": "Simple monitoring: 4\u20136 weeks. Complex industrial automation: 3\u201312 months."},
    {"question": "Do you offer IoT internships?", "answer": "Yes! Hands-on experience with hardware programming and platform development."},
    {"question": "How do you handle IoT data?", "answer": "Robust data pipelines from edge preprocessing to cloud analytics and BI dashboards."},
]

_ENG_FAQS = [
    {"question": "What 3D design software do you use?", "answer": "SolidWorks, AutoCAD, Fusion 360, and CATIA for modeling; ANSYS and MATLAB for simulation."},
    {"question": "What 3D printing technologies do you support?", "answer": "FDM, SLA, and SLS technologies \u2014 producing prototypes in plastics, resins, and engineering-grade materials."},
    {"question": "Can you design products for mass manufacturing?", "answer": "Yes, using Design for Manufacturing (DFM) principles for injection molding, CNC, and sheet metal."},
    {"question": "How long to go from concept to prototype?", "answer": "Basic prototype: 2\u20134 weeks. Full product development: 6\u201316 weeks."},
    {"question": "Do you offer engineering internships?", "answer": "Yes! Hands-on CAD, simulation, and 3D printing experience on real projects."},
    {"question": "Can you validate a design before manufacturing?", "answer": "Yes \u2014 FEA and CFD simulation identifies stress points and failure modes before physical production."},
]

_EDU_FAQS = [
    {"question": "What internship domains do you offer?", "answer": "AI, Research & Innovation, IoT, Engineering Design, and Education & Training."},
    {"question": "Is the internship online or offline?", "answer": "Both modes are available \u2014 students select preference during application."},
    {"question": "Will I receive a certificate?", "answer": "Yes \u2014 a Certificate of Completion from Raashi Cognitive Technologies Pvt. Ltd."},
    {"question": "How can our institution partner with you?", "answer": "Contact us at raashitechnologies@gmail.com to discuss institutional partnerships."},
    {"question": "Do you support final year projects?", "answer": "Yes \u2014 topic selection, development, testing, documentation, and presentation support."},
    {"question": "What are the training program fees?", "answer": "Fees vary by duration and domain. Contact us for current pricing and group rates."},
]


DOMAINS = [
    {
        "slug": "artificial-intelligence",
        "order": 1,
        "name": "Artificial Intelligence & Data Intelligence",
        "short_name": "Artificial Intelligence",
        "tagline": "Building intelligent systems that learn, reason and solve complex problems using data-driven insights.",
        "description": "We deliver cutting-edge AI and data intelligence solutions that transform raw data into actionable insights.",
        "accent_color": "#0560DF",
        "overview_paragraphs": [
            "Artificial Intelligence is at the heart of modern business transformation. At Raashi Cognitive Technologies, we develop AI-powered systems that learn from data, reason across domains, and solve complex real-world problems with precision and efficiency.",
            "From predictive analytics and machine learning pipelines to cognitive computing and enterprise AI deployment, our solutions deliver measurable outcomes.",
        ],
        "what_we_offer": [
            {"title": "AI Solutions", "description": "End-to-end AI system design, development, and deployment."},
            {"title": "Machine Learning", "description": "Supervised, unsupervised, and reinforcement learning models."},
            {"title": "Cognitive Computing", "description": "Systems that simulate human thought processes."},
            {"title": "Data Analytics", "description": "Transform raw business data into meaningful insights."},
            {"title": "Predictive Modeling", "description": "Forecast trends and outcomes using ML-based models."},
            {"title": "Intelligent Systems", "description": "Autonomous systems that perceive, reason, and act."},
            {"title": "AI Consulting", "description": "Strategic guidance on AI adoption and governance."},
            {"title": "AI Deployment & Integration", "description": "Seamlessly integrate AI into existing workflows."},
        ],
        "technologies": ["Python", "TensorFlow", "PyTorch", "scikit-learn", "OpenCV", "pandas", "NumPy", "Jupyter"],
        "applications": ["Healthcare", "Manufacturing", "Education", "Retail", "Finance", "Smart Cities", "Agriculture", "Logistics"],
        "faqs": _AI_FAQS,
        "hero": {"eyebrow": "OUR DOMAIN", "heading": "Artificial Intelligence &", "heading_highlight": "Data Intelligence", "description": "Building intelligent systems that learn, reason and solve complex problems using data-driven insights."},
        "overview": {"eyebrow": "OVERVIEW", "heading": "Artificial Intelligence is at the heart of modern business transformation", "paragraphs": ["Artificial Intelligence is at the heart of modern business transformation. At Raashi Cognitive Technologies, we develop AI-powered systems that learn from data, reason across domains, and solve complex real-world problems with precision and efficiency.", "From predictive analytics and machine learning pipelines to cognitive computing and enterprise AI deployment, our solutions deliver measurable outcomes."], "image_url": None, "image_gridfs_id": None},
        "offer_section": {"eyebrow": "WHAT WE OFFER", "heading": "Our Artificial Intelligence Services", "cards": [{"title": "AI Solutions", "description": "End-to-end AI system design, development, and deployment."}, {"title": "Machine Learning", "description": "Supervised, unsupervised, and reinforcement learning models."}, {"title": "Cognitive Computing", "description": "Systems that simulate human thought processes."}, {"title": "Data Analytics", "description": "Transform raw business data into meaningful insights."}, {"title": "Predictive Modeling", "description": "Forecast trends and outcomes using ML-based models."}, {"title": "Intelligent Systems", "description": "Autonomous systems that perceive, reason, and act."}, {"title": "AI Consulting", "description": "Strategic guidance on AI adoption and governance."}, {"title": "AI Deployment & Integration", "description": "Seamlessly integrate AI into existing workflows."}]},
        "tech_section": {"eyebrow": "TECHNOLOGIES WE USE", "heading": "Tools & Frameworks", "items": ["Python", "TensorFlow", "PyTorch", "scikit-learn", "OpenCV", "pandas", "NumPy", "Jupyter"]},
        "apps_section": {"eyebrow": "APPLICATIONS", "heading": "Industries We Serve", "description": "Where our Artificial Intelligence solutions create real impact.", "items": ["Healthcare", "Manufacturing", "Education", "Retail", "Finance", "Smart Cities", "Agriculture", "Logistics"]},
        "why_section": {"eyebrow": "WHY CHOOSE RAASHI?", "heading": "Your Trusted Technology Partner", "cards": _DEFAULT_WHY_CARDS},
        "internship": _DEFAULT_INTERNSHIP,
        "future_services": {"enabled": True, "heading": "Expanding Capabilities", "description": "We are continuously expanding our Artificial Intelligence capabilities. Commercial consulting, product development and enterprise solutions will be introduced as we grow. Stay connected for updates."},
        "faq_section": _default_faq_section(_AI_FAQS),
    },
    {
        "slug": "research-innovation",
        "order": 2,
        "name": "Research & Innovation (R&D)",
        "short_name": "Research & Innovation",
        "tagline": "Driving innovation through research, technology development and commercialization of new ideas.",
        "description": "We fuel the next wave of technological breakthroughs through applied research and systematic R&D processes.",
        "accent_color": "#D11753",
        "overview_paragraphs": [
            "Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions.",
            "We partner with institutions and enterprises to conduct applied research across AI, IoT, robotics, and advanced materials.",
        ],
        "what_we_offer": [
            {"title": "Research & Development", "description": "Applied and exploratory R&D across emerging tech domains."},
            {"title": "Emerging Technologies", "description": "Deep-dive research in AI, IoT, robotics, and next-gen computing."},
            {"title": "Product Innovation", "description": "Systematic ideation and product development from concept to prototype."},
            {"title": "Technology Commercialization", "description": "Bridge R&D outcomes to market-ready products."},
            {"title": "IP Development", "description": "Intellectual property creation and patent filing guidance."},
            {"title": "Technology Licensing", "description": "Technology licensing agreements and partnerships."},
            {"title": "Academic Collaboration", "description": "Industry-academia partnership programs."},
            {"title": "Innovation Consulting", "description": "Build innovation capabilities within your organization."},
        ],
        "technologies": ["MATLAB", "Python", "Arduino", "Raspberry Pi", "ROS", "SolidWorks", "ANSYS", "Jupyter"],
        "applications": ["Academic Institutions", "Startups", "Manufacturing", "Healthcare", "Defense", "Smart Infrastructure", "AgriTech", "Energy"],
        "faqs": _RD_FAQS,
        "hero": {"eyebrow": "OUR DOMAIN", "heading": "Research &", "heading_highlight": "Innovation", "description": "We fuel the next wave of technological breakthroughs through applied research and systematic R&D processes."},
        "overview": {"eyebrow": "OVERVIEW", "heading": "Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions", "paragraphs": ["Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions.", "We partner with institutions and enterprises to conduct applied research across AI, IoT, robotics, and advanced materials."], "image_url": None, "image_gridfs_id": None},
        "offer_section": {"eyebrow": "WHAT WE OFFER", "heading": "Our Research & Innovation Services", "cards": [{"title": "Research & Development", "description": "Applied and exploratory R&D across emerging tech domains."}, {"title": "Emerging Technologies", "description": "Deep-dive research in AI, IoT, robotics, and next-gen computing."}, {"title": "Product Innovation", "description": "Systematic ideation and product development from concept to prototype."}, {"title": "Technology Commercialization", "description": "Bridge R&D outcomes to market-ready products."}, {"title": "IP Development", "description": "Intellectual property creation and patent filing guidance."}, {"title": "Technology Licensing", "description": "Technology licensing agreements and partnerships."}, {"title": "Academic Collaboration", "description": "Industry-academia partnership programs."}, {"title": "Innovation Consulting", "description": "Build innovation capabilities within your organization."}]},
        "tech_section": {"eyebrow": "TECHNOLOGIES WE USE", "heading": "Tools & Frameworks", "items": ["MATLAB", "Python", "Arduino", "Raspberry Pi", "ROS", "SolidWorks", "ANSYS", "Jupyter"]},
        "apps_section": {"eyebrow": "APPLICATIONS", "heading": "Industries We Serve", "description": "Where our Research & Innovation solutions create real impact.", "items": ["Academic Institutions", "Startups", "Manufacturing", "Healthcare", "Defense", "Smart Infrastructure", "AgriTech", "Energy"]},
        "why_section": {"eyebrow": "WHY CHOOSE RAASHI?", "heading": "Your Trusted Technology Partner", "cards": _DEFAULT_WHY_CARDS},
        "internship": _DEFAULT_INTERNSHIP,
        "future_services": {"enabled": True, "heading": "Expanding Capabilities", "description": "We are continuously expanding our Research & Innovation capabilities. Commercial consulting, product development and enterprise solutions will be introduced as we grow. Stay connected for updates."},
        "faq_section": _default_faq_section(_RD_FAQS),
    },
    {
        "slug": "iot-smart-automation",
        "order": 3,
        "name": "IoT & Smart Automation",
        "short_name": "IoT & Automation",
        "tagline": "Creating connected and intelligent systems that automate processes and enhance efficiency.",
        "description": "We build comprehensive IoT ecosystems from device firmware to cloud dashboards, enabling smarter environments.",
        "accent_color": "#4D9FFF",
        "overview_paragraphs": [
            "The Internet of Things is revolutionizing how businesses operate.",
            "Our smart automation solutions eliminate manual bottlenecks, reduce costs, and enable real-time monitoring and control.",
        ],
        "what_we_offer": [
            {"title": "IoT Solutions", "description": "End-to-end IoT ecosystem design, from edge devices to cloud platforms."},
            {"title": "Smart Automation", "description": "Intelligent automation of industrial and commercial processes."},
            {"title": "IoT Devices & Sensors", "description": "Custom sensor integration and firmware development."},
            {"title": "IoT Platform Development", "description": "Scalable cloud platforms for device management and analytics."},
            {"title": "Connected Systems", "description": "Integration of disparate devices into unified networks."},
            {"title": "Industrial Automation", "description": "Automation for manufacturing and process industries."},
            {"title": "Commercial Automation", "description": "Smart building and energy management solutions."},
            {"title": "Remote Monitoring", "description": "Real-time dashboards with alert management."},
        ],
        "technologies": ["Arduino", "Raspberry Pi", "ESP32", "MQTT", "Node-RED", "AWS IoT", "Python", "C/C++"],
        "applications": ["Smart Manufacturing", "Agriculture", "Smart Buildings", "Healthcare", "Energy", "Logistics", "Smart Cities", "Water Management"],
        "faqs": _IOT_FAQS,
        "hero": {"eyebrow": "OUR DOMAIN", "heading": "IoT &", "heading_highlight": "Smart Automation", "description": "Creating connected and intelligent systems that automate processes and enhance efficiency."},
        "overview": {"eyebrow": "OVERVIEW", "heading": "The Internet of Things is revolutionizing how businesses operate", "paragraphs": ["The Internet of Things is revolutionizing how businesses operate \u2014 connecting the physical and digital worlds to create smarter, more efficient environments.", "Our smart automation solutions eliminate manual bottlenecks, reduce costs, and enable real-time monitoring and control."], "image_url": None, "image_gridfs_id": None},
        "offer_section": {"eyebrow": "WHAT WE OFFER", "heading": "Our IoT & Automation Services", "cards": [{"title": "IoT Solutions", "description": "End-to-end IoT ecosystem design, from edge devices to cloud platforms."}, {"title": "Smart Automation", "description": "Intelligent automation of industrial and commercial processes."}, {"title": "IoT Devices & Sensors", "description": "Custom sensor integration and firmware development."}, {"title": "IoT Platform Development", "description": "Scalable cloud platforms for device management and analytics."}, {"title": "Connected Systems", "description": "Integration of disparate devices into unified networks."}, {"title": "Industrial Automation", "description": "Automation for manufacturing and process industries."}, {"title": "Commercial Automation", "description": "Smart building and energy management solutions."}, {"title": "Remote Monitoring", "description": "Real-time dashboards with alert management."}]},
        "tech_section": {"eyebrow": "TECHNOLOGIES WE USE", "heading": "Tools & Frameworks", "items": ["Arduino", "Raspberry Pi", "ESP32", "MQTT", "Node-RED", "AWS IoT", "Python", "C/C++"]},
        "apps_section": {"eyebrow": "APPLICATIONS", "heading": "Industries We Serve", "description": "Where our IoT & Automation solutions create real impact.", "items": ["Smart Manufacturing", "Agriculture", "Smart Buildings", "Healthcare", "Energy", "Logistics", "Smart Cities", "Water Management"]},
        "why_section": {"eyebrow": "WHY CHOOSE RAASHI?", "heading": "Your Trusted Technology Partner", "cards": _DEFAULT_WHY_CARDS},
        "internship": _DEFAULT_INTERNSHIP,
        "future_services": {"enabled": True, "heading": "Expanding Capabilities", "description": "We are continuously expanding our IoT & Automation capabilities. Commercial consulting, product development and enterprise solutions will be introduced as we grow. Stay connected for updates."},
        "faq_section": _default_faq_section(_IOT_FAQS),
    },
    {
        "slug": "engineering-design",
        "order": 4,
        "name": "Engineering Design & Digital Manufacturing",
        "short_name": "Engineering Design",
        "tagline": "From concept to prototype \u2014 we design, simulate and manufacture innovative products with precision.",
        "description": "We provide comprehensive engineering design, simulation, and digital manufacturing services.",
        "accent_color": "#F94F0E",
        "overview_paragraphs": [
            "Engineering Design is the bridge between imagination and reality.",
            "From concept sketches to fully validated 3D models, simulation-tested prototypes, and 3D-manufactured final products, we support the complete product development lifecycle.",
        ],
        "what_we_offer": [
            {"title": "3D Designing & Modeling", "description": "Precision 3D CAD models for mechanical and product design."},
            {"title": "Simulation & Analysis", "description": "FEA, CFD, and thermal analysis to validate designs."},
            {"title": "3D Printing & Additive Manufacturing", "description": "Rapid prototyping using FDM, SLA, and SLS technologies."},
            {"title": "Prototyping & Customization", "description": "Custom prototype development with iterative design refinement."},
            {"title": "Product Design & Development", "description": "Complete product development to DFM-ready engineering packages."},
            {"title": "Technical & Engineering Services", "description": "Technical documentation, BOM preparation, and manufacturing support."},
            {"title": "Reverse Engineering", "description": "Digitize existing physical parts for redesign or remanufacturing."},
            {"title": "Engineering Consultancy", "description": "Advisory for material selection and structural optimization."},
        ],
        "technologies": ["SolidWorks", "AutoCAD", "ANSYS", "MATLAB", "Fusion 360", "Ultimaker Cura", "CATIA", "Arduino"],
        "applications": ["Aerospace", "Automotive", "Consumer Products", "Medical Devices", "Industrial Machinery", "Architecture", "Electronics", "Education"],
        "faqs": _ENG_FAQS,
        "hero": {"eyebrow": "OUR DOMAIN", "heading": "Engineering Design &", "heading_highlight": "Digital Manufacturing", "description": "From concept to prototype \u2014 we design, simulate and manufacture innovative products with precision."},
        "overview": {"eyebrow": "OVERVIEW", "heading": "Engineering Design is the bridge between imagination and reality", "paragraphs": ["Engineering Design is the bridge between imagination and reality. Our team leverages industry-standard tools to design, analyze, and manufacture products with precision.", "From concept sketches to fully validated 3D models, simulation-tested prototypes, and 3D-manufactured final products, we support the complete product development lifecycle."], "image_url": None, "image_gridfs_id": None},
        "offer_section": {"eyebrow": "WHAT WE OFFER", "heading": "Our Engineering Design Services", "cards": [{"title": "3D Designing & Modeling", "description": "Precision 3D CAD models for mechanical and product design."}, {"title": "Simulation & Analysis", "description": "FEA, CFD, and thermal analysis to validate designs."}, {"title": "3D Printing & Additive Manufacturing", "description": "Rapid prototyping using FDM, SLA, and SLS technologies."}, {"title": "Prototyping & Customization", "description": "Custom prototype development with iterative design refinement."}, {"title": "Product Design & Development", "description": "Complete product development to DFM-ready engineering packages."}, {"title": "Technical & Engineering Services", "description": "Technical documentation, BOM preparation, and manufacturing support."}, {"title": "Reverse Engineering", "description": "Digitize existing physical parts for redesign or remanufacturing."}, {"title": "Engineering Consultancy", "description": "Advisory for material selection and structural optimization."}]},
        "tech_section": {"eyebrow": "TECHNOLOGIES WE USE", "heading": "Tools & Frameworks", "items": ["SolidWorks", "AutoCAD", "ANSYS", "MATLAB", "Fusion 360", "Ultimaker Cura", "CATIA", "Arduino"]},
        "apps_section": {"eyebrow": "APPLICATIONS", "heading": "Industries We Serve", "description": "Where our Engineering Design solutions create real impact.", "items": ["Aerospace", "Automotive", "Consumer Products", "Medical Devices", "Industrial Machinery", "Architecture", "Electronics", "Education"]},
        "why_section": {"eyebrow": "WHY CHOOSE RAASHI?", "heading": "Your Trusted Technology Partner", "cards": _DEFAULT_WHY_CARDS},
        "internship": _DEFAULT_INTERNSHIP,
        "future_services": {"enabled": True, "heading": "Expanding Capabilities", "description": "We are continuously expanding our Engineering Design capabilities. Commercial consulting, product development and enterprise solutions will be introduced as we grow. Stay connected for updates."},
        "faq_section": _default_faq_section(_ENG_FAQS),
    },
    {
        "slug": "education-training",
        "order": 5,
        "name": "Education, Training & Academic Consultancy",
        "short_name": "Education & Training",
        "tagline": "Empowering students, researchers and institutions with knowledge, skills and consulting support.",
        "description": "We bridge the gap between academic learning and industry requirements through structured training and consultancy.",
        "accent_color": "#F94F0E",
        "overview_paragraphs": [
            "Education is the foundation of every technological breakthrough. Our Education & Training division builds future-ready professionals through practical, industry-aligned learning experiences.",
            "We partner with students, researchers, and institutions to deliver structured skill development programs, academic consultancy, and institutional support services.",
        ],
        "what_we_offer": [
            {"title": "Internship Programs", "description": "Structured 1\u20136 month programs across all technology domains."},
            {"title": "Skill Development Training", "description": "Hands-on technical training in AI, IoT, and engineering."},
            {"title": "Academic Consultancy", "description": "Guidance on project selection and research methodology."},
            {"title": "Project Development", "description": "End-to-end support for final year and mini projects."},
            {"title": "Patent & IPR Consultancy", "description": "Guidance on IP rights, patent filing, and innovation documentation."},
            {"title": "Institutional Accreditation", "description": "Strategic support for NAAC, NBA, and other accreditation processes."},
            {"title": "Workshop & Seminars", "description": "Technical workshops and industry-academia events."},
            {"title": "Research Publication Support", "description": "Guidance on research writing and journal submission."},
        ],
        "technologies": ["Python", "TensorFlow", "Arduino", "MATLAB", "SolidWorks", "Jupyter", "MS Office", "LaTeX", "Google Colab"],
        "applications": ["Engineering Colleges", "Polytechnics", "Universities", "Corporate Training", "Individual Students", "Government Programs", "EdTech", "School STEM"],
        "faqs": _EDU_FAQS,
        "hero": {"eyebrow": "OUR DOMAIN", "heading": "Education &", "heading_highlight": "Training", "description": "Empowering students, researchers and institutions with knowledge, skills and consulting support."},
        "overview": {"eyebrow": "OVERVIEW", "heading": "Education is the foundation of every technological breakthrough", "paragraphs": ["Education is the foundation of every technological breakthrough. Our Education & Training division builds future-ready professionals through practical, industry-aligned learning experiences.", "We partner with students, researchers, and institutions to deliver structured skill development programs, academic consultancy, and institutional support services."], "image_url": None, "image_gridfs_id": None},
        "offer_section": {"eyebrow": "WHAT WE OFFER", "heading": "Our Education & Training Services", "cards": [{"title": "Internship Programs", "description": "Structured 1\u20136 month programs across all technology domains."}, {"title": "Skill Development Training", "description": "Hands-on technical training in AI, IoT, and engineering."}, {"title": "Academic Consultancy", "description": "Guidance on project selection and research methodology."}, {"title": "Project Development", "description": "End-to-end support for final year and mini projects."}, {"title": "Patent & IPR Consultancy", "description": "Guidance on IP rights, patent filing, and innovation documentation."}, {"title": "Institutional Accreditation", "description": "Strategic support for NAAC, NBA, and other accreditation processes."}, {"title": "Workshop & Seminars", "description": "Technical workshops and industry-academia events."}, {"title": "Research Publication Support", "description": "Guidance on research writing and journal submission."}]},
        "tech_section": {"eyebrow": "TECHNOLOGIES WE USE", "heading": "Tools & Frameworks", "items": ["Python", "TensorFlow", "Arduino", "MATLAB", "SolidWorks", "Jupyter", "MS Office", "LaTeX", "Google Colab"]},
        "apps_section": {"eyebrow": "APPLICATIONS", "heading": "Industries We Serve", "description": "Where our Education & Training solutions create real impact.", "items": ["Engineering Colleges", "Polytechnics", "Universities", "Corporate Training", "Individual Students", "Government Programs", "EdTech", "School STEM"]},
        "why_section": {"eyebrow": "WHY CHOOSE RAASHI?", "heading": "Your Trusted Technology Partner", "cards": _DEFAULT_WHY_CARDS},
        "internship": _DEFAULT_INTERNSHIP,
        "future_services": {"enabled": True, "heading": "Expanding Capabilities", "description": "We are continuously expanding our Education & Training capabilities. Commercial consulting, product development and enterprise solutions will be introduced as we grow. Stay connected for updates."},
        "faq_section": _default_faq_section(_EDU_FAQS),
    },
]

SAMPLE_JOBS = [
    {
        "title": "AI/ML Engineer (Intern)",
        "department": "Artificial Intelligence",
        "location": "Belgaum, Karnataka (Hybrid)",
        "type": "Internship",
        "description": "Work on real-world machine learning projects under expert guidance.",
        "is_active": True,
        "posted_at": datetime.now(timezone.utc),
    },
    {
        "title": "IoT Solutions Developer",
        "department": "IoT & Smart Automation",
        "location": "Belgaum, Karnataka",
        "type": "Full-time",
        "description": "Design and develop end-to-end IoT solutions for industrial clients.",
        "is_active": True,
        "posted_at": datetime.now(timezone.utc),
    },
]

_DEV_DEFAULT_ADMIN_PW = "Admin@123"
_DEV_DEFAULT_COORD_PW = "Coord@123"


def _get_seed_users() -> list[dict]:
    settings = get_settings()
    admin_pw = os.environ.get("SEED_ADMIN_PASSWORD", "")
    coord_pw = os.environ.get("SEED_COORDINATOR_PASSWORD", "")

    if settings.is_production:
        if not admin_pw or not coord_pw:
            raise RuntimeError(
                "SEED_ADMIN_PASSWORD and SEED_COORDINATOR_PASSWORD must be set "
                "via environment variables when seeding in production."
            )
    else:
        if not admin_pw:
            admin_pw = _DEV_DEFAULT_ADMIN_PW
            print("  \u26a0 Using default admin password \u2014 do NOT use in production.")
        if not coord_pw:
            coord_pw = _DEV_DEFAULT_COORD_PW
            print("  \u26a0 Using default coordinator password \u2014 do NOT use in production.")

    return [
        {"name": "Admin", "email": "admin@raashi.com", "password": admin_pw, "role": "admin", "is_active": True},
        {"name": "Coordinator", "email": "coordinator@raashi.com", "password": coord_pw, "role": "coordinator", "is_active": True},
    ]


DEFAULT_CONTENT = [
    {
        "section_key": "homepage_hero",
        "title": "Homepage Hero",
        "content": {
            "badge": "Raashi Cognitive Technologies Pvt. Ltd.",
            "heading": "Transforming Knowledge into",
            "heading_highlight": "Intelligent Solutions",
            "description": "Raashi Cognitive Technologies Pvt. Ltd. delivers innovative solutions in Artificial Intelligence, IoT, Smart Automation, 3D Design, Research & Development, and Skill Development to empower businesses and build a smarter future.",
            "cta_primary": "Explore Our Domains",
            "cta_primary_link": "/domains",
            "cta_secondary": "Get In Touch",
            "cta_secondary_link": "/contact",
        },
        "is_published": True,
    },
    {
        "section_key": "homepage_about",
        "title": "About Teaser",
        "content": {
            "eyebrow": "About Us",
            "heading": "Building Intelligent Solutions for a",
            "heading_highlight": "Smarter Tomorrow",
            "description": "Founded with a vision to democratize intelligent technology, Raashi Cognitive Technologies is a growing force in AI, IoT, engineering, and education.",
            "features": [
                {"label": "Innovation", "desc": "Pushing boundaries with cutting-edge technology"},
                {"label": "Excellence", "desc": "Delivering quality in every project and engagement"},
                {"label": "Impact", "desc": "Creating meaningful outcomes for clients and communities"},
            ],
        },
        "is_published": True,
    },
    {
        "section_key": "homepage_internship_banner",
        "title": "Internship Banner",
        "content": {
            "eyebrow": "Internships",
            "heading": "Kickstart Your Career with",
            "heading_highlight": "Hands-on Experience",
            "description": "Join our structured internship programs across AI, IoT, Engineering, R&D and Education. Work on live projects, learn from experts, and earn a certificate that matters.",
            "cta": "Explore Internships",
            "cta_link": "/internships",
        },
        "is_published": True,
    },
    {
        "section_key": "about_page",
        "title": "About Page",
        "content": {
            "hero_heading": "About Raashi Cognitive Technologies",
            "hero_description": "We are a technology company dedicated to transforming knowledge into intelligent solutions.",
            "mission": "To democratize intelligent technology and empower businesses and individuals to thrive in the knowledge economy.",
            "vision": "To be a leading force in AI, IoT, engineering, and education \u2014 creating meaningful impact through innovation.",
        },
        "is_published": True,
    },
    {
        "section_key": "contact_info",
        "title": "Contact Information",
        "content": {
            "phone": "+91 9742419316",
            "email": "raashitechnologies@gmail.com",
            "address": "69, CTS NO.4482B/67, Shruti Layout, Kanabargi Road, Belgaum Fort, Belgaum \u2013 590016, Karnataka",
            "hours": "Mon \u2013 Sat: 9:00 AM \u2013 6:00 PM\nSunday: Closed",
        },
        "is_published": True,
    },
    {
        "section_key": "announcements",
        "title": "Announcements",
        "content": {"items": []},
        "is_published": True,
    },
    {
        "section_key": "faqs",
        "title": "General FAQs",
        "content": {
            "items": [
                {"question": "What services does Raashi Cognitive Technologies offer?", "answer": "We offer services in AI, IoT, Engineering Design, R&D, and Education & Training."},
                {"question": "Where is Raashi Cognitive Technologies located?", "answer": "We are based in Belgaum (Belagavi), Karnataka, India."},
                {"question": "Do you offer internships?", "answer": "Yes! We offer structured 1-6 month internship programs across all our technology domains."},
                {"question": "How can I contact you?", "answer": "You can reach us at raashitechnologies@gmail.com or call +91 9742419316."},
            ],
        },
        "is_published": True,
    },
]


async def seed():
    print("Seeding in Cloudflare D1 should be done via SQL scripts or the D1 API.")
    print("This script is deprecated; use the D1 migration and deployment workflow instead.")
    print("Use `npx wrangler d1 execute` instead.")


if __name__ == "__main__":
    asyncio.run(seed())
