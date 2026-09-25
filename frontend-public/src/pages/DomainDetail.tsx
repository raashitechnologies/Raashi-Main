import { useParams, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { API_BASE_URL, publicApi, resolveApiAssetUrl } from "@/lib/api";
import { normalizeDomain } from "@/data/domains";
import { type Domain } from "../../../shared/domain/types";
import { DomainDetailRenderer } from "../../../shared/domain/DomainDetailRenderer";
import { Button } from "@/components/shared/Button";
import { SEO } from "@/components/seo/SEO";
import { ErrorState } from "@shared/ui/FeedbackStates";
import { normalizeApiError } from "@shared/lib/apiError";
import NotFound from "./NotFound";

export default function DomainDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    publicApi
      .getDomain(slug)
      .then((res) => {
        const normalized = normalizeDomain(res.data);
        if (normalized.slug) {
          setDomain(normalized);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          const apiError = normalizeApiError(err);
          setError(apiError.message || "Unable to load domain details. Please try again later.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (notFound) return <NotFound />;

  if (loading) {
    return (
      <Layout>
        <section className="bg-brand-navy section-py">
          <div className="section-container">
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-white/10 rounded mb-8" />
              <div className="max-w-3xl">
                <div className="h-3 w-20 bg-white/10 rounded mb-3" />
                <div className="h-12 w-3/4 bg-white/10 rounded mb-5" />
                <div className="h-5 w-full bg-white/10 rounded mb-2" />
                <div className="h-5 w-2/3 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        </section>
        <section className="section-py bg-[#F5F0E6]">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-14 animate-pulse">
              <div>
                <div className="h-4 w-24 bg-brand-navy/10 rounded mb-4" />
                <div className="h-8 w-3/4 bg-brand-navy/10 rounded mb-5" />
                <div className="h-4 w-full bg-brand-navy/10 rounded mb-3" />
                <div className="h-4 w-full bg-brand-navy/10 rounded mb-3" />
                <div className="h-4 w-2/3 bg-brand-navy/10 rounded" />
              </div>
              <div className="h-64 bg-brand-navy/10 rounded-3xl" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !domain) {
    return (
      <Layout>
        <section className="bg-brand-navy section-py">
          <div className="section-container">
            <Breadcrumb items={[{ label: "Domains", href: "/domains" }, { label: "Error" }]} />
          </div>
        </section>
        <section className="section-py bg-[#F5F0E6]">
          <div className="section-container max-w-3xl text-center">
            <ErrorState 
              message={error || "Something went wrong."} 
              onRetry={() => window.location.reload()}
              variant="public"
            />
            <Button asChild variant="primary" size="md" className="mt-6 mx-auto">
              <Link to="/domains" className="gap-2 shadow-sm">
                Back to Domains <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  // ── Resolved CMS section data ─────────────────────────────────────────────
  
  const seoTitle = domain.seo_title || `${domain.name} | Raashi Cognitive Technologies`;
  const seoDescription = domain.seo_description || domain.description;
  const seoImage = resolveApiAssetUrl(domain.seo_image || domain.overview?.image_url) || domain.heroImage || '/logo.png';

  return (
    <Layout
      headerCta={{ label: "Apply for Internship", href: "/apply" }}
      prefooter={{
        headline: `Ready to start your journey in ${domain.shortName}?`,
        subtext: "Apply for our internship program or get in touch to discuss a project.",
        buttonLabel: "Apply Now",
        buttonHref: "/apply",
      }}
    >
      <SEO 
        title={seoTitle}
        description={seoDescription}
        ogImage={seoImage}
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": domain.name,
            "description": seoDescription,
            "url": `https://raashitech.com/domains/${domain.slug}`
          })}
        </script>
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
                "name": "Domains",
                "item": "https://raashitech.com/domains"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": domain.name,
                "item": `https://raashitech.com/domains/${domain.slug}`
              }
            ]
          })}
        </script>
      </SEO>
      <DomainDetailRenderer domain={domain} apiBaseUrl={API_BASE_URL} />
    </Layout>
  );
}
