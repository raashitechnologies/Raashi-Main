"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQChatAccordionProps {
  title?: string;
  faqs: FAQItem[];
  className?: string;
}

function TypingIndicator() {
  return (
    <div className="flex space-x-1 p-3 bg-white rounded-2xl rounded-tl-sm w-fit shadow-sm border border-brand-navy/[0.04]">
      <motion.div
        className="w-1.5 h-1.5 bg-brand-navy/30 rounded-full"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-1.5 h-1.5 bg-brand-navy/30 rounded-full"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-1.5 h-1.5 bg-brand-navy/30 rounded-full"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

function ChatMessage({
  faq,
  isOpen,
  onClick,
}: {
  faq: FAQItem;
  isOpen: boolean;
  onClick: () => void;
}) {
  const [showTyping, setShowTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      setShowAnswer(false);
      const timer = setTimeout(() => {
        setShowTyping(false);
        setShowAnswer(true);
      }, 700); // Wait for typing animation
      return () => clearTimeout(timer);
    } else {
      setShowTyping(false);
      setShowAnswer(false);
    }
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-2 w-full mb-4">
      {/* Question Bubble (Right aligned, user style) */}
      <div className="flex justify-end w-full">
        <button
          onClick={onClick}
          className={cn(
            "text-left px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] transition-all duration-300",
            "hover:shadow-md active:scale-[0.98]",
            isOpen
              ? "bg-brand-blue text-white shadow-md"
              : "bg-white text-brand-navy shadow-sm hover:bg-brand-blue/5 border border-brand-navy/[0.06]"
          )}
        >
          <p className="text-sm sm:text-base font-medium leading-snug">
            {faq.question}
          </p>
        </button>
      </div>

      {/* Answer Bubble (Left aligned, system style) */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="answer-container"
            initial={{ opacity: 0, y: 5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start w-full overflow-hidden"
          >
            {showTyping ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-1"
              >
                <TypingIndicator />
              </motion.div>
            ) : showAnswer ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-1 px-5 py-4 bg-white rounded-2xl rounded-tl-sm max-w-[90%] sm:max-w-[80%] shadow-sm border border-brand-navy/[0.06]"
              >
                <p className="text-sm sm:text-base text-brand-navy/70 leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </p>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQChatAccordion({
  title = "Have questions?",
  faqs,
  className,
}: FAQChatAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className={cn("w-full max-w-3xl mx-auto flex flex-col", className)}>
      {title && (
        <h3 className="text-2xl font-semibold text-brand-navy mb-8 text-center">
          {title}
        </h3>
      )}

      <div className="flex flex-col gap-2 p-2 sm:p-4 rounded-3xl bg-brand-navy/[0.02]">
        {faqs.map((faq, index) => (
          <ChatMessage
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}
