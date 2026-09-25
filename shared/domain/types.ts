export interface DomainOffer {
  title: string;
  description: string;
}

export interface DomainFaq {
  question: string;
  answer: string;
}

export interface DomainHero {
  eyebrow: string;
  heading: string;
  heading_highlight: string;
  description: string;
}

export interface DomainOverview {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  image_url: string | null;
  image_gridfs_id: string | null;
}

export interface DomainOfferCard {
  title: string;
  description: string;
}

export interface DomainOfferSection {
  eyebrow: string;
  heading: string;
  cards: DomainOfferCard[];
}

export interface DomainTechSection {
  eyebrow: string;
  heading: string;
  items: string[];
}

export interface DomainAppsSection {
  eyebrow: string;
  heading: string;
  description: string;
  items: string[];
}

export interface DomainWhyCard {
  title: string;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
}

export interface DomainWhySection {
  eyebrow: string;
  heading: string;
  cards: DomainWhyCard[];
}

export interface DomainInternship {
  heading: string;
  checklist: string[];
  cta_label: string;
  cta_link: string;
}

export interface DomainFutureServices {
  enabled: boolean;
  heading: string;
  description: string;
}

export interface DomainFaqSection {
  eyebrow: string;
  contact_heading: string;
  contact_description: string;
  contact_cta_label: string;
  contact_cta_link: string;
  items: DomainFaq[];
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
  hero?: DomainHero;
  overview?: DomainOverview;
  offerSection?: DomainOfferSection;
  techSection?: DomainTechSection;
  appsSection?: DomainAppsSection;
  whySection?: DomainWhySection;
  internship?: DomainInternship;
  futureServices?: DomainFutureServices;
  faqSection?: DomainFaqSection;
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
}
