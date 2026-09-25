import React, { useState, forwardRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { getFormFieldVariants } from "./AnimatedFormContainer";

interface BaseAnimatedProps {
  label: string;
  hasError?: boolean;
  isValid?: boolean;
  className?: string;
}

type InputProps = BaseAnimatedProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseAnimatedProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const shakeVariants = {
  initial: { x: 0 },
  shake: { 
    x: [0, -3, 3, -2, 0], 
    transition: { duration: 0.3, ease: "easeInOut" as const } 
  },
};

export const AnimatedInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hasError, isValid, className = "", onFocus, onBlur, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const [isFocused, setIsFocused] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);

    useEffect(() => {
      if (hasError) {
        setShakeKey(prev => prev + 1);
      }
    }, [hasError]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <motion.div 
        variants={getFormFieldVariants(prefersReducedMotion)} 
        className={`relative ${className}`}
      >
        <label 
          htmlFor={props.id} 
          className="block text-xs font-semibold text-brand-navy/70 mb-1.5 transition-colors duration-200"
          style={{ color: isFocused ? '#0560DF' : hasError ? '#EE3128' : undefined }}
        >
          {label} {props.required && "*"}
        </label>
        
        <motion.div
          variants={!prefersReducedMotion ? shakeVariants : undefined}
          initial="initial"
          animate={hasError ? "shake" : "initial"}
          key={shakeKey}
          className="relative"
        >
          <input
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-navy bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors relative z-10 ${
              hasError ? "border-brand-red/50" : "border-brand-navy/10"
            }`}
            {...props}
          />
          
          {/* Animated focus border */}
          {!hasError && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-blue z-20 rounded-b-xl origin-center"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isFocused ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            />
          )}

          {/* Validation Checkmark */}
          {isValid && !isFocused && !hasError && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20"
            >
              <Check size={16} className="text-green-500" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }
);
AnimatedInput.displayName = "AnimatedInput";

export const AnimatedTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hasError, isValid, className = "", onFocus, onBlur, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const [isFocused, setIsFocused] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);

    useEffect(() => {
      if (hasError) {
        setShakeKey(prev => prev + 1);
      }
    }, [hasError]);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <motion.div 
        variants={getFormFieldVariants(prefersReducedMotion)} 
        className={`relative ${className}`}
      >
        <label 
          htmlFor={props.id} 
          className="block text-xs font-semibold text-brand-navy/70 mb-1.5 transition-colors duration-200"
          style={{ color: isFocused ? '#0560DF' : hasError ? '#EE3128' : undefined }}
        >
          {label} {props.required && "*"}
        </label>
        
        <motion.div
          variants={!prefersReducedMotion ? shakeVariants : undefined}
          initial="initial"
          animate={hasError ? "shake" : "initial"}
          key={shakeKey}
          className="relative"
        >
          <textarea
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-navy bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors relative z-10 resize-none ${
              hasError ? "border-brand-red/50" : "border-brand-navy/10"
            }`}
            {...props}
          />
          
          {/* Animated focus border */}
          {!hasError && (
            <motion.div 
              className="absolute bottom-1 left-0 right-0 h-[2px] bg-brand-blue z-20 rounded-b-xl origin-center"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isFocused ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Validation Checkmark */}
          {isValid && !isFocused && !hasError && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute right-4 top-4 z-20"
            >
              <Check size={16} className="text-green-500" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }
);
AnimatedTextarea.displayName = "AnimatedTextarea";
