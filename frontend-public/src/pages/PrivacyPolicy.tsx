import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <SEO 
        title="Privacy Policy | Raashi Cognitive Technologies" 
        description="Privacy Policy for Raashi Cognitive Technologies. Learn how we collect, use, and safeguard your information."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy | Raashi Cognitive Technologies",
            "description": "Privacy Policy for Raashi Cognitive Technologies. Learn how we collect, use, and safeguard your information.",
            "url": "https://raashitech.com/privacy-policy"
          })}
        </script>
      </SEO>
      <section className="bg-brand-navy py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>
      </section>
      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-brand-navy/70">
          <p className="text-lg text-brand-navy font-semibold mb-4">Last updated: {new Date().getFullYear()}</p>
          <p className="leading-relaxed mb-4">
            Raashi Cognitive Technologies Pvt. Ltd. ("we", "us", or "our") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, and safeguard your information when
            you visit our website or use our services.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Information We Collect</h2>
          <p className="leading-relaxed mb-4">
            We collect information you provide directly, including name, email address, phone number, and any
            messages sent through our contact or application forms.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">How We Use Your Information</h2>
          <p className="leading-relaxed mb-4">
            We use collected information to respond to enquiries, process internship and career applications,
            improve our services, and communicate updates relevant to you.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Data Security</h2>
          <p className="leading-relaxed mb-4">
            We implement appropriate security measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Contact</h2>
          <p className="leading-relaxed">
            For privacy-related questions, please contact us at{" "}
            <a href="mailto:raashitechnologies@gmail.com" className="text-brand-blue underline">
              raashitechnologies@gmail.com
            </a>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
