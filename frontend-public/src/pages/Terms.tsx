import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";

export default function Terms() {
  return (
    <Layout>
      <SEO 
        title="Terms & Conditions | Raashi Cognitive Technologies" 
        description="Terms and Conditions for Raashi Cognitive Technologies. Read our terms of service and usage policies."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms & Conditions | Raashi Cognitive Technologies",
            "description": "Terms and Conditions for Raashi Cognitive Technologies. Read our terms of service and usage policies.",
            "url": "https://raashitech.com/terms"
          })}
        </script>
      </SEO>
      <section className="bg-brand-navy py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Terms &amp; Conditions</h1>
        </div>
      </section>
      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-brand-navy/70">
          <p className="text-lg text-brand-navy font-semibold mb-4">Last updated: {new Date().getFullYear()}</p>
          <p className="leading-relaxed mb-4">
            By accessing or using the Raashi Cognitive Technologies Pvt. Ltd. website, you agree to be bound
            by these Terms &amp; Conditions.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Use of Website</h2>
          <p className="leading-relaxed mb-4">
            You agree to use this website for lawful purposes only and in a manner that does not infringe
            the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Intellectual Property</h2>
          <p className="leading-relaxed mb-4">
            All content on this website, including text, graphics, logos, and images, is the property of
            Raashi Cognitive Technologies Pvt. Ltd. and is protected by applicable intellectual property laws.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Limitation of Liability</h2>
          <p className="leading-relaxed mb-4">
            Raashi Cognitive Technologies Pvt. Ltd. shall not be liable for any indirect, incidental, or
            consequential damages arising from the use of this website or our services.
          </p>
          <h2 className="text-xl font-bold text-brand-navy mt-8 mb-3">Contact</h2>
          <p className="leading-relaxed">
            For questions regarding these terms, contact us at{" "}
            <a href="mailto:raashitechnologies@gmail.com" className="text-brand-blue underline">
              raashitechnologies@gmail.com
            </a>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
