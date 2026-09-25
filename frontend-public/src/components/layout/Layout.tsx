import { Header } from "./Header";
import { Footer } from "./Footer";
import { PreFooterCTA } from "./PreFooterCTA";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

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
  return (
    <div className="min-h-viewport flex flex-col">
      <Header cta={headerCta} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PreFooterCTA {...prefooter} />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
