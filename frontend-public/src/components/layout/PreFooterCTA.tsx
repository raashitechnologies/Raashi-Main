import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb } from "lucide-react";
import { FadeInView } from "@/components/shared/FadeInView";
import { Button } from "@/components/shared/Button";

interface PreFooterCTAProps {
  headline?: string;
  subtext?: string;
  buttonLabel?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
}

export function PreFooterCTA({
  headline = "Have a Project in Mind?",
  subtext = "Let's build something intelligent together.",
  buttonLabel = "Contact Us Today",
  buttonHref = "/contact",
  onButtonClick,
}: PreFooterCTAProps) {
  return (
    <section className="bg-background py-16 lg:py-20" aria-label="Call to action">
      <div className="section-container">
        <FadeInView>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left */}
            <div className="flex items-start gap-4 text-center lg:text-left flex-col lg:flex-row lg:items-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-orange/15 flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                <Lightbulb size={26} className="text-brand-orange" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy mb-1.5 leading-tight">
                  {headline}
                </h2>
                <p className="text-brand-navy/70 text-base">{subtext}</p>
              </div>
            </div>

            {/* Right CTA */}
            {onButtonClick ? (
              <Button
                variant="primary"
                size="lg"
                onClick={onButtonClick}
                className="shrink-0"
              >
                <span className="flex items-center gap-2">
                  {buttonLabel}
                  <ArrowRight size={16} />
                </span>
              </Button>
            ) : (
              <Button asChild variant="primary" size="lg" className="shrink-0">
                <Link to={buttonHref} className="gap-2">
                  {buttonLabel}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            )}
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
