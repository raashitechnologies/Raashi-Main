import { FAQChatAccordion, type FAQItem } from "@/registry/ruixenui/faq-chat-accordion";

interface RaashiFAQProps {
  title?: string;
  faqs: FAQItem[];
}

export function RaashiFAQ({
  title = "Have questions?",
  faqs,
}: RaashiFAQProps) {
  return (
    <FAQChatAccordion
      title={title}
      faqs={faqs}
      className="py-0 md:py-0 w-full"
    />
  );
}
