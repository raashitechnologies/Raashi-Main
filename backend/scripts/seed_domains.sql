-- Seed script with attractive FAQs for Domains in Cloudflare D1

INSERT OR REPLACE INTO domains (
    id, name, slug, display_order, short_name, tagline, description, accent_color,
    seo_title, seo_description, seo_image, overview_json, hero_json, offers_json,
    tech_json, apps_json, why_json, internship_json, future_json, faqs_json,
    created_at, updated_at
  ) VALUES (
    'domain-artificial-intelligence',
    'Artificial Intelligence & Data Intelligence',
    'artificial-intelligence',
    1,
    'Artificial Intelligence',
    'Building intelligent systems that learn, reason and solve complex problems using data-driven insights.',
    'We deliver cutting-edge AI and data intelligence solutions that transform raw data into actionable insights.',
    '#0560DF',
    NULL, NULL, NULL,
    '{"eyebrow":"OVERVIEW","heading":"Artificial Intelligence is at the heart of modern business transformation","paragraphs":["Artificial Intelligence is at the heart of modern business transformation.","From predictive analytics and machine learning pipelines to cognitive computing, our solutions deliver measurable outcomes."],"image_url":null,"image_gridfs_id":null}',
    '{"eyebrow":"OUR DOMAIN","heading":"Artificial Intelligence &","heading_highlight":"Data Intelligence","description":"Building intelligent systems that learn, reason and solve complex problems using data-driven insights."}',
    '{"eyebrow":"WHAT WE OFFER","heading":"","cards":[{"title":"AI Solutions","description":"End-to-end AI system design, development, and deployment."},{"title":"Machine Learning","description":"Supervised, unsupervised, and reinforcement learning models."},{"title":"Data Analytics","description":"Transform raw business data into meaningful insights."},{"title":"AI Consulting","description":"Strategic guidance on AI adoption and governance."}]}',
    '{"eyebrow":"TECHNOLOGIES WE USE","heading":"Tools & Frameworks","items":["Python","TensorFlow","PyTorch","scikit-learn","OpenCV","pandas"]}',
    '{"eyebrow":"APPLICATIONS","heading":"Industries We Serve","description":"Where our AI solutions create real impact.","items":["Healthcare","Manufacturing","Education","Retail","Finance","Smart Cities"]}',
    '{"eyebrow":"WHY CHOOSE RAASHI?","heading":"Your Trusted Technology Partner","cards":[{"title":"Expert Team","description":"Experienced professionals dedicated to your success.","icon":"Users","order":0,"enabled":true},{"title":"Practical Approach","description":"Real-world solutions built on hands-on experience.","icon":"Wrench","order":1,"enabled":true},{"title":"Innovation Driven","description":"Constantly pushing boundaries with emerging technology.","icon":"Lightbulb","order":2,"enabled":true},{"title":"Quality & Support","description":"Committed to quality delivery and ongoing support.","icon":"Shield","order":3,"enabled":true},{"title":"Industry Oriented","description":"Solutions aligned with real industry needs and standards.","icon":"Award","order":4,"enabled":true}]}',
    '{"heading":"Internship Opportunities","checklist":["Duration: 1–6 Months","Eligibility: Students, Graduates & Research Scholars","Live Projects & Real-world Problems","Expert Mentorship","Certificate on Completion","Flexible Online / Offline Mode"],"cta_label":"Apply for Internship","cta_link":"/apply"}',
    '{"enabled":true,"heading":"Expanding Capabilities","description":"We are continuously expanding our Artificial Intelligence capabilities."}',
    '{"eyebrow":"FAQ","contact_heading":"Have more questions?","contact_description":"We''re here to help. Reach out and our team will respond within 24 hours.","contact_cta_label":"Contact Us","contact_cta_link":"/contact","items":[{"question":"What cutting-edge AI and Machine Learning solutions does Raashi develop?","answer":"We engineer end-to-end intelligent systems, including custom LLM fine-tuning, retrieval-augmented generation (RAG) pipelines, computer vision for automated quality inspection, NLP-based document intelligence, and predictive modeling tailored to enterprise workflows."},{"question":"Do we need massive historical datasets to begin an AI engagement?","answer":"Not at all. We utilize transfer learning, synthetic data augmentation, and few-shot learning techniques to train accurate models even with limited initial datasets, scaling data pipelines seamlessly as your operations expand."},{"question":"How does Raashi ensure client data privacy and intellectual property protection?","answer":"Enterprise security is foundational. All client data and models are protected under strict non-disclosure agreements (NDAs). We offer on-premise, private VPC, or edge deployments ensuring your proprietary data never leaves your infrastructure."},{"question":"Can your AI models seamlessly integrate with our existing legacy systems?","answer":"Yes. We package our AI models into high-performance, containerized REST and gRPC microservices that integrate frictionlessly with your existing ERPs, CRMs, mobile applications, and cloud platforms."},{"question":"What makes Raashi''s AI internship program unique for aspiring engineers?","answer":"Interns work directly on live production-grade systems—building neural networks with PyTorch/TensorFlow, deploying inference microservices, and implementing vector search databases—under the direct mentorship of senior AI practitioners."},{"question":"What is the typical timeline from problem formulation to an operational AI MVP?","answer":"A focused proof-of-concept (POC) typically takes 3–5 weeks, followed by iterative refinement and full-scale production deployment within 8–12 weeks."}]}',
    '2026-09-28T19:19:54.674Z',
    '2026-09-28T19:19:54.674Z'
  );

INSERT OR REPLACE INTO domains (
    id, name, slug, display_order, short_name, tagline, description, accent_color,
    seo_title, seo_description, seo_image, overview_json, hero_json, offers_json,
    tech_json, apps_json, why_json, internship_json, future_json, faqs_json,
    created_at, updated_at
  ) VALUES (
    'domain-research-innovation',
    'Research & Innovation (R&D)',
    'research-innovation',
    2,
    'Research & Innovation',
    'Driving innovation through research, technology development and commercialization of new ideas.',
    'We fuel the next wave of technological breakthroughs through applied research and systematic R&D processes.',
    '#D11753',
    NULL, NULL, NULL,
    '{"eyebrow":"OVERVIEW","heading":"Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions","paragraphs":["Innovation is the result of systematic research, disciplined experimentation, and the courage to turn novel ideas into tangible solutions.","We partner with institutions to conduct applied research across AI, IoT, robotics, and advanced materials."],"image_url":null,"image_gridfs_id":null}',
    '{"eyebrow":"OUR DOMAIN","heading":"Research &","heading_highlight":"Innovation","description":"Driving innovation through research, technology development and commercialization of new ideas."}',
    '{"eyebrow":"WHAT WE OFFER","heading":"","cards":[{"title":"Research & Development","description":"Applied and exploratory R&D across emerging tech domains."},{"title":"Product Innovation","description":"Systematic ideation and product development."},{"title":"IP Development","description":"Intellectual property creation and patent guidance."},{"title":"Academic Collaboration","description":"Industry-academia partnership programs."}]}',
    '{"eyebrow":"TECHNOLOGIES WE USE","heading":"Tools & Frameworks","items":["MATLAB","Python","Arduino","Raspberry Pi","ROS","SolidWorks"]}',
    '{"eyebrow":"APPLICATIONS","heading":"Industries We Serve","description":"Where our Research & Innovation solutions create real impact.","items":["Academic Institutions","Startups","Manufacturing","Healthcare","Defense"]}',
    '{"eyebrow":"WHY CHOOSE RAASHI?","heading":"Your Trusted Technology Partner","cards":[{"title":"Expert Team","description":"Experienced professionals dedicated to your success.","icon":"Users","order":0,"enabled":true},{"title":"Practical Approach","description":"Real-world solutions built on hands-on experience.","icon":"Wrench","order":1,"enabled":true},{"title":"Innovation Driven","description":"Constantly pushing boundaries with emerging technology.","icon":"Lightbulb","order":2,"enabled":true},{"title":"Quality & Support","description":"Committed to quality delivery and ongoing support.","icon":"Shield","order":3,"enabled":true},{"title":"Industry Oriented","description":"Solutions aligned with real industry needs and standards.","icon":"Award","order":4,"enabled":true}]}',
    '{"heading":"Internship Opportunities","checklist":["Duration: 1–6 Months","Eligibility: Students, Graduates & Research Scholars","Live Projects & Real-world Problems","Expert Mentorship","Certificate on Completion","Flexible Online / Offline Mode"],"cta_label":"Apply for Internship","cta_link":"/apply"}',
    '{"enabled":true,"heading":"Expanding Capabilities","description":"We are continuously expanding our Research & Innovation capabilities."}',
    '{"eyebrow":"FAQ","contact_heading":"Have more questions?","contact_description":"We''re here to help. Reach out and our team will respond within 24 hours.","contact_cta_label":"Contact Us","contact_cta_link":"/contact","items":[{"question":"What primary research areas and emerging technologies does Raashi specialize in?","answer":"Our R&D division focuses on autonomous robotics, edge computing architectures, intelligent sensing, bio-inspired algorithms, sustainable smart materials, and human-machine interaction systems."},{"question":"Can Raashi assist startups and researchers with Patent and IPR filing?","answer":"Yes, absolutely. We provide end-to-end intellectual property guidance—from prior-art patentability searches and technical claim drafting to prototype validation and patent filing strategies with patent attorneys."},{"question":"How do institutional and academic research partnerships work?","answer":"We collaborate with universities and research centers through joint grant proposals (DST, SERB, AICTE), co-authored journal publications (IEEE, Springer, Elsevier), sponsored lab setups, and faculty development programs."},{"question":"What are the tangible deliverables of an R&D engagement?","answer":"Deliverables include comprehensive technical feasibility reports, functional proof-of-concept hardware/software prototypes, design patents, and complete documentation ready for commercialization or venture funding."},{"question":"What do students and scholars experience during an R&D fellowship or internship?","answer":"Fellows tackle novel, unsolved technical challenges, conduct formal literature reviews, experiment with advanced lab equipment, and co-author high-impact research papers and patent disclosures."}]}',
    '2026-09-28T19:19:54.674Z',
    '2026-09-28T19:19:54.674Z'
  );

INSERT OR REPLACE INTO domains (
    id, name, slug, display_order, short_name, tagline, description, accent_color,
    seo_title, seo_description, seo_image, overview_json, hero_json, offers_json,
    tech_json, apps_json, why_json, internship_json, future_json, faqs_json,
    created_at, updated_at
  ) VALUES (
    'domain-iot-smart-automation',
    'IoT & Smart Automation',
    'iot-smart-automation',
    3,
    'IoT & Automation',
    'Creating connected and intelligent systems that automate processes and enhance efficiency.',
    'We build comprehensive IoT ecosystems from device firmware to cloud dashboards, enabling smarter environments.',
    '#4D9FFF',
    NULL, NULL, NULL,
    '{"eyebrow":"OVERVIEW","heading":"The Internet of Things is revolutionizing how businesses operate","paragraphs":["The Internet of Things is revolutionizing how businesses operate — connecting the physical and digital worlds.","Our smart automation solutions eliminate manual bottlenecks and enable real-time monitoring."],"image_url":null,"image_gridfs_id":null}',
    '{"eyebrow":"OUR DOMAIN","heading":"IoT &","heading_highlight":"Smart Automation","description":"Creating connected and intelligent systems that automate processes and enhance efficiency."}',
    '{"eyebrow":"WHAT WE OFFER","heading":"","cards":[{"title":"IoT Solutions","description":"End-to-end IoT ecosystem design."},{"title":"Smart Automation","description":"Intelligent automation of industrial processes."},{"title":"Industrial Automation","description":"Automation for manufacturing industries."},{"title":"Remote Monitoring","description":"Real-time dashboards with alert management."}]}',
    '{"eyebrow":"TECHNOLOGIES WE USE","heading":"Tools & Frameworks","items":["Arduino","Raspberry Pi","ESP32","MQTT","Node-RED","AWS IoT"]}',
    '{"eyebrow":"APPLICATIONS","heading":"Industries We Serve","description":"Where our IoT & Automation solutions create real impact.","items":["Smart Manufacturing","Agriculture","Smart Buildings","Healthcare","Energy"]}',
    '{"eyebrow":"WHY CHOOSE RAASHI?","heading":"Your Trusted Technology Partner","cards":[{"title":"Expert Team","description":"Experienced professionals dedicated to your success.","icon":"Users","order":0,"enabled":true},{"title":"Practical Approach","description":"Real-world solutions built on hands-on experience.","icon":"Wrench","order":1,"enabled":true},{"title":"Innovation Driven","description":"Constantly pushing boundaries with emerging technology.","icon":"Lightbulb","order":2,"enabled":true},{"title":"Quality & Support","description":"Committed to quality delivery and ongoing support.","icon":"Shield","order":3,"enabled":true},{"title":"Industry Oriented","description":"Solutions aligned with real industry needs and standards.","icon":"Award","order":4,"enabled":true}]}',
    '{"heading":"Internship Opportunities","checklist":["Duration: 1–6 Months","Eligibility: Students, Graduates & Research Scholars","Live Projects & Real-world Problems","Expert Mentorship","Certificate on Completion","Flexible Online / Offline Mode"],"cta_label":"Apply for Internship","cta_link":"/apply"}',
    '{"enabled":true,"heading":"Expanding Capabilities","description":"We are continuously expanding our IoT & Automation capabilities."}',
    '{"eyebrow":"FAQ","contact_heading":"Have more questions?","contact_description":"We''re here to help. Reach out and our team will respond within 24 hours.","contact_cta_label":"Contact Us","contact_cta_link":"/contact","items":[{"question":"Which industries benefit the most from Raashi''s IoT and Smart Automation systems?","answer":"We serve industrial manufacturing (Industry 4.0), smart agriculture, healthcare devices, intelligent building automation, energy monitoring, and cold-chain logistics with real-time telemetry."},{"question":"Can you retrofit IoT sensors onto existing legacy industrial machinery?","answer":"Yes, non-invasive brownfield retrofitting is one of our key strengths. We deploy non-intrusive current, vibration, temperature, and acoustic sensors to digitize legacy machines without voiding manufacturer warranties or disrupting operations."},{"question":"How do you secure IoT devices against cyber attacks and edge vulnerabilities?","answer":"Security is baked into hardware and firmware: encrypted hardware roots-of-trust, TLS 1.3 encrypted MQTT communications, secure boot, regular cryptographically signed OTA (Over-The-Air) firmware updates, and zero-trust edge gateway policies."},{"question":"Does Raashi build custom IoT cloud dashboards and mobile monitoring apps?","answer":"Yes. We deliver custom-branded web dashboards and mobile apps featuring sub-second telemetry visualization, automated anomaly alerts (via SMS, WhatsApp, and email), predictive maintenance triggers, and historical analytics."},{"question":"What hardware and embedded skills do interns learn in the IoT program?","answer":"Interns gain hands-on mastery in PCB schematic design, microcontroller programming (ESP32, STM32, Raspberry Pi), RTOS, industrial communication protocols (RS-485, Modbus, CAN, LoRaWAN), and cloud integration."}]}',
    '2026-09-28T19:19:54.674Z',
    '2026-09-28T19:19:54.674Z'
  );

INSERT OR REPLACE INTO domains (
    id, name, slug, display_order, short_name, tagline, description, accent_color,
    seo_title, seo_description, seo_image, overview_json, hero_json, offers_json,
    tech_json, apps_json, why_json, internship_json, future_json, faqs_json,
    created_at, updated_at
  ) VALUES (
    'domain-engineering-design',
    'Engineering Design & Digital Manufacturing',
    'engineering-design',
    4,
    'Engineering Design',
    'From concept to prototype — we design, simulate and manufacture innovative products with precision.',
    'We provide comprehensive engineering design, simulation, and digital manufacturing services.',
    '#F94F0E',
    NULL, NULL, NULL,
    '{"eyebrow":"OVERVIEW","heading":"Engineering Design is the bridge between imagination and reality","paragraphs":["Engineering Design is the bridge between imagination and reality.","From concept sketches to validated 3D models, we support the complete product development lifecycle."],"image_url":null,"image_gridfs_id":null}',
    '{"eyebrow":"OUR DOMAIN","heading":"Engineering Design &","heading_highlight":"Digital Manufacturing","description":"From concept to prototype — we design, simulate and manufacture innovative products with precision."}',
    '{"eyebrow":"WHAT WE OFFER","heading":"","cards":[{"title":"3D Designing & Modeling","description":"Precision 3D CAD models for product design."},{"title":"Simulation & Analysis","description":"FEA, CFD, and thermal analysis to validate designs."},{"title":"3D Printing","description":"Rapid prototyping using FDM, SLA, and SLS."},{"title":"Product Design","description":"Complete product development to DFM-ready packages."}]}',
    '{"eyebrow":"TECHNOLOGIES WE USE","heading":"Tools & Frameworks","items":["SolidWorks","AutoCAD","ANSYS","MATLAB","Fusion 360","CATIA"]}',
    '{"eyebrow":"APPLICATIONS","heading":"Industries We Serve","description":"Where our Engineering Design solutions create real impact.","items":["Aerospace","Automotive","Consumer Products","Medical Devices","Industrial Machinery"]}',
    '{"eyebrow":"WHY CHOOSE RAASHI?","heading":"Your Trusted Technology Partner","cards":[{"title":"Expert Team","description":"Experienced professionals dedicated to your success.","icon":"Users","order":0,"enabled":true},{"title":"Practical Approach","description":"Real-world solutions built on hands-on experience.","icon":"Wrench","order":1,"enabled":true},{"title":"Innovation Driven","description":"Constantly pushing boundaries with emerging technology.","icon":"Lightbulb","order":2,"enabled":true},{"title":"Quality & Support","description":"Committed to quality delivery and ongoing support.","icon":"Shield","order":3,"enabled":true},{"title":"Industry Oriented","description":"Solutions aligned with real industry needs and standards.","icon":"Award","order":4,"enabled":true}]}',
    '{"heading":"Internship Opportunities","checklist":["Duration: 1–6 Months","Eligibility: Students, Graduates & Research Scholars","Live Projects & Real-world Problems","Expert Mentorship","Certificate on Completion","Flexible Online / Offline Mode"],"cta_label":"Apply for Internship","cta_link":"/apply"}',
    '{"enabled":true,"heading":"Expanding Capabilities","description":"We are continuously expanding our Engineering Design capabilities."}',
    '{"eyebrow":"FAQ","contact_heading":"Have more questions?","contact_description":"We''re here to help. Reach out and our team will respond within 24 hours.","contact_cta_label":"Contact Us","contact_cta_link":"/contact","items":[{"question":"What CAD software and simulation tools does your engineering team employ?","answer":"We utilize industry gold-standard tools including SolidWorks, Autodesk Fusion 360, CATIA, and AutoCAD for parametric modeling, alongside ANSYS and MATLAB for FEA (stress/strain) and CFD (fluid/thermal) simulations."},{"question":"Which 3D printing and rapid prototyping technologies are available at Raashi?","answer":"We operate commercial FDM (Fused Deposition Modeling), SLA (Stereolithography resin), and SLS (Selective Laser Sintering) machines, producing precision functional prototypes in PLA, ABS, PETG, Nylon, and engineering-grade carbon-fiber composites."},{"question":"Do you design products with Design for Manufacturing (DFM) guidelines?","answer":"Yes. Every concept is engineered with DFM/DFA (Design for Assembly) principles, taking into account injection molding draft angles, sheet metal bend radii, CNC machining clearances, and Bill of Materials (BOM) cost optimization."},{"question":"Can you reverse-engineer damaged, obsolete, or undocumented physical parts?","answer":"Yes. Using precision optical/laser 3D scanners and metrology tools, we digitize physical components into high-fidelity parametric CAD models, optimize them for modern manufacturing, and 3D print functional replacements."},{"question":"What hands-on experience do interns gain in Engineering Design?","answer":"Interns take a product from blank-screen conceptual sketching to 3D CAD modeling, run structural stress analyses, slice files for 3D printers, operate rapid prototyping machinery, and assemble real physical prototypes."}]}',
    '2026-09-28T19:19:54.674Z',
    '2026-09-28T19:19:54.674Z'
  );

INSERT OR REPLACE INTO domains (
    id, name, slug, display_order, short_name, tagline, description, accent_color,
    seo_title, seo_description, seo_image, overview_json, hero_json, offers_json,
    tech_json, apps_json, why_json, internship_json, future_json, faqs_json,
    created_at, updated_at
  ) VALUES (
    'domain-education-training',
    'Education, Training & Academic Consultancy',
    'education-training',
    5,
    'Education & Training',
    'Empowering students, researchers and institutions with knowledge, skills and consulting support.',
    'We bridge the gap between academic learning and industry requirements through structured training and consultancy.',
    '#F94F0E',
    NULL, NULL, NULL,
    '{"eyebrow":"OVERVIEW","heading":"Education is the foundation of every technological breakthrough","paragraphs":["Education is the foundation of every technological breakthrough.","We partner with students, researchers, and institutions to deliver structured skill development programs."],"image_url":null,"image_gridfs_id":null}',
    '{"eyebrow":"OUR DOMAIN","heading":"Education &","heading_highlight":"Training","description":"Empowering students, researchers and institutions with knowledge and skills."}',
    '{"eyebrow":"WHAT WE OFFER","heading":"","cards":[{"title":"Internship Programs","description":"Structured 1–6 month programs across all technology domains."},{"title":"Skill Development Training","description":"Hands-on technical training in AI, IoT, and engineering."},{"title":"Academic Consultancy","description":"Guidance on project selection and research methodology."},{"title":"Project Development","description":"End-to-end support for final year and mini projects."}]}',
    '{"eyebrow":"TECHNOLOGIES WE USE","heading":"Tools & Frameworks","items":["Python","TensorFlow","Arduino","MATLAB","SolidWorks","Jupyter"]}',
    '{"eyebrow":"APPLICATIONS","heading":"Industries We Serve","description":"Where our Education & Training solutions create real impact.","items":["Engineering Colleges","Polytechnics","Universities","Corporate Training","EdTech"]}',
    '{"eyebrow":"WHY CHOOSE RAASHI?","heading":"Your Trusted Technology Partner","cards":[{"title":"Expert Team","description":"Experienced professionals dedicated to your success.","icon":"Users","order":0,"enabled":true},{"title":"Practical Approach","description":"Real-world solutions built on hands-on experience.","icon":"Wrench","order":1,"enabled":true},{"title":"Innovation Driven","description":"Constantly pushing boundaries with emerging technology.","icon":"Lightbulb","order":2,"enabled":true},{"title":"Quality & Support","description":"Committed to quality delivery and ongoing support.","icon":"Shield","order":3,"enabled":true},{"title":"Industry Oriented","description":"Solutions aligned with real industry needs and standards.","icon":"Award","order":4,"enabled":true}]}',
    '{"heading":"Internship Opportunities","checklist":["Duration: 1–6 Months","Eligibility: Students, Graduates & Research Scholars","Live Projects & Real-world Problems","Expert Mentorship","Certificate on Completion","Flexible Online / Offline Mode"],"cta_label":"Apply for Internship","cta_link":"/apply"}',
    '{"enabled":true,"heading":"Expanding Capabilities","description":"We are continuously expanding our Education & Training capabilities."}',
    '{"eyebrow":"FAQ","contact_heading":"Have more questions?","contact_description":"We''re here to help. Reach out and our team will respond within 24 hours.","contact_cta_label":"Contact Us","contact_cta_link":"/contact","items":[{"question":"What types of internship and skill-development programs do you offer?","answer":"We offer 1-month, 3-month, and 6-month intensive, project-driven internship programs across Artificial Intelligence, IoT & Robotics, Engineering Design, Full-Stack Web Development, and Applied R&D."},{"question":"Are the internship programs available in online, offline, or hybrid modes?","answer":"Yes! We offer flexible learning modes: fully in-person at our tech center in Belgaum for intensive hardware/lab access, as well as live mentor-led virtual/hybrid options for outstation students."},{"question":"Will I receive an official certificate, letter of recommendation, and project review?","answer":"Every candidate who successfully finishes their program receives an official, verifiable Certificate of Completion from Raashi Cognitive Technologies Pvt. Ltd., project viva verification, and high performers receive formal Letters of Recommendation (LORs)."},{"question":"How does Raashi mentor students on final year B.Tech, M.Tech, and Diploma capstone projects?","answer":"We guide students through IEEE-aligned problem selection, system architecture design, component sourcing, coding, testing, and report/paper preparation according to university guidelines."},{"question":"How can engineering colleges, polytechnics, and universities partner with Raashi?","answer":"We sign institutional Memorandums of Understanding (MoUs) for setting up Center of Excellence (CoE) labs, delivering accredited faculty development programs (FDPs), conducting hackathons, and providing campus placement assistance."}]}',
    '2026-09-28T19:19:54.674Z',
    '2026-09-28T19:19:54.674Z'
  );
