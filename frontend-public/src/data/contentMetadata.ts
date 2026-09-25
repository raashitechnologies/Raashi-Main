export interface FieldMeta {
  label?: string;
  location: string;
  description?: string;
}

export interface SectionMeta {
  pageName: string;
  sectionName: string;
  previewUrl?: string;
  fields: Record<string, FieldMeta>;
}

export const contentMetadata: Record<string, SectionMeta> = {
  homepage_hero: {
    pageName: "Home Page",
    sectionName: "Hero Section",
    previewUrl: "/",
    fields: {
      badge: { location: "Top floating badge" },
      heading: { location: "Main Heading (white text)" },
      heading_highlight: { location: "Main Heading (colored text)" },
      description: { location: "Sub-description below heading" },
      cta_primary: { location: "Primary Button Label" },
      cta_primary_link: { location: "Primary Button URL" },
      cta_secondary: { location: "Secondary Button Label" },
      cta_secondary_link: { location: "Secondary Button URL" },
    },
  },

  homepage_about: {
    pageName: "Home Page",
    sectionName: "About Us Teaser Section",
    previewUrl: "/",
    fields: {
      eyebrow: { location: "Small heading above main title" },
      heading: { location: "Main Title" },
      heading_highlight: { location: "Main Title (colored text)" },
      description: { location: "Main description paragraphs" },
      features: { location: "List of key features/highlights" },
      "features.label": { location: "Feature Title" },
      "features.desc": { location: "Feature Description" },
    },
  },
  homepage_internship_banner: {
    pageName: "Home Page",
    sectionName: "Internship Banner Section",
    previewUrl: "/",
    fields: {
      eyebrow: { location: "Small heading above main title" },
      heading: { location: "Main Title" },
      heading_highlight: { location: "Main Title (colored text)" },
      description: { location: "Main description paragraph" },
      cta: { location: "Button Label" },
      cta_link: { location: "Button URL" },
    },
  },
  about_page: {
    pageName: "About Us Page",
    sectionName: "Hero & Mission Sections",
    previewUrl: "/about",
    fields: {
      hero_heading: { location: "Hero Section → Main Heading" },
      hero_description: { location: "Hero Section → Description" },
      mission: { location: "Hero Section → Mission Statement" },
      vision: { location: "Our Vision Card (not currently mapped directly in UI, reserved for future)" },
    },
  },
  contact_info: {
    pageName: "Contact Us Page",
    sectionName: "Contact Information Panel",
    previewUrl: "/contact",
    fields: {
      phone: { location: "Phone Number row" },
      email: { location: "Email Address row" },
      address: { location: "Physical Address row" },
      hours: { location: "Business Hours row" },
    },
  },
  faqs: {
    pageName: "Contact Us Page",
    sectionName: "Frequently Asked Questions Section",
    previewUrl: "/contact",
    fields: {
      items: { location: "FAQ Accordion List" },
      "items.question": { location: "FAQ Question" },
      "items.answer": { location: "FAQ Answer" },
    },
  },
  announcements: {
    pageName: "Global / Sitewide",
    sectionName: "Announcements Banner",
    fields: {
      items: { location: "List of active announcements" },
      "items.title": { location: "Announcement Title" },
      "items.description": { location: "Announcement Description" },
    },
  },
};
