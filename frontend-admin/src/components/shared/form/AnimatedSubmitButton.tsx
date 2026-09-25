import React from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { getFormFieldVariants } from "./AnimatedFormContainer";
import { Button } from "../Button";

interface AnimatedSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
  defaultText?: string;
  loadingText?: string;
}

export function AnimatedSubmitButton({
  isLoading,
  isSuccess,
  defaultText = "Submit Application",
  loadingText = "Submitting...",
  className = "",
  disabled,
  ...props
}: AnimatedSubmitButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || isLoading || isSuccess;

  return (
    <motion.div variants={getFormFieldVariants(prefersReducedMotion)} className="pt-2">
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isDisabled}
        className={`w-full group ${isSuccess ? "!bg-green-500 hover:!bg-green-600" : ""} ${className}`}
        {...(props as any)}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Check size={18} />
              <span>Success</span>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span>{loadingText}</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center gap-2 w-full"
            >
              <span>{defaultText}</span>
              <ArrowRight
                size={16}
                className={`transition-transform duration-300 ease-out ${isDisabled ? '' : 'group-hover:translate-x-[5px]'}`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
