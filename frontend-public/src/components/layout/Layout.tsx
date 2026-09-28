import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PreFooterCTA } from "./PreFooterCTA";
import { BackToTop } from "@/components/shared/BackToTop";
import { getFooterEmailForRoute } from "@/lib/footerEmail";

interface LayoutProps {
  children: React.ReactNode;
  headerCta?: { label: string; href: string };
  prefooter?: {
    headline?: string;
    subtext?: string;
    buttonLabel?: string;
    buttonHref?: string;
    onButtonClick?: () => void;
  };
}

export function Layout({ children, headerCta, prefooter }: LayoutProps) {
  const { pathname } = useLocation();
  // Returns undefined for "/", a specific email string for all other routes
  const contextualEmail = getFooterEmailForRoute(pathname);

  return (
    <div className="min-h-viewport flex flex-col">
      <Header cta={headerCta} />
      <main id="main-content" className="flex-1 min-w-0">
        {children}
      </main>
      <PreFooterCTA {...prefooter} />
      <Footer contactEmail={contextualEmail} />
      <BackToTop />
    </div>
  );
}

