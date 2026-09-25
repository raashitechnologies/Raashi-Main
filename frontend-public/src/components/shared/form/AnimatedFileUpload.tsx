import React, { useState, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { getFormFieldVariants } from "./AnimatedFormContainer";

interface AnimatedFileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hasError?: boolean;
  selectedFile: File | null;
}

export const AnimatedFileUpload = React.forwardRef<HTMLInputElement, AnimatedFileUploadProps>(
  ({ label, hasError, selectedFile, className = "", onChange, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Combine refs
    const setRefs = (element: HTMLInputElement) => {
      inputRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = e.dataTransfer.files;
        // Construct a synthetic event to pass to onChange
        if (inputRef.current) {
          inputRef.current.files = fileList;
          // React synthetic events need slightly different handling, but 
          // triggering onChange directly is safest
          const event = {
            target: inputRef.current,
            currentTarget: inputRef.current,
            type: 'change'
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          
          onChange?.(event);
        }
      }
    };

    const triggerClick = () => {
      inputRef.current?.click();
    };

    return (
      <motion.div 
        variants={getFormFieldVariants(prefersReducedMotion)} 
        className={`relative ${className}`}
      >
        <label className="block text-xs font-semibold text-brand-navy/70 mb-1.5 transition-colors duration-200"
          style={{ color: hasError ? '#EE3128' : undefined }}>
          {label} {props.required && "*"}
        </label>

        <div
          onClick={triggerClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
            hasError
              ? "border-brand-red/50 bg-brand-red/5"
              : isDragOver
              ? "border-brand-blue bg-brand-blue/5 scale-[1.01]"
              : selectedFile
              ? "border-green-500/30 bg-green-500/5"
              : "border-brand-navy/10 bg-white/80 hover:border-brand-blue/40"
          }`}
          style={{ minHeight: "120px" }}
        >
          {/* Native Hidden Input */}
          <input
            {...props}
            ref={setRefs}
            type="file"
            onChange={onChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  >
                    <CheckCircle2 size={24} className="text-green-500" />
                  </motion.div>
                  <span className="font-semibold text-brand-navy text-sm max-w-[200px] truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <motion.span 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-green-600 font-medium"
                >
                  Selected successfully
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
              >
                <motion.div
                  animate={{ y: isDragOver ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <UploadCloud 
                    size={28} 
                    className={`mb-3 ${hasError ? "text-brand-red/60" : isDragOver ? "text-brand-blue" : "text-brand-navy/40"}`} 
                  />
                </motion.div>
                <span className={`text-sm font-semibold mb-1 ${hasError ? "text-brand-red" : isDragOver ? "text-brand-blue" : "text-brand-navy"}`}>
                  {isDragOver ? "Drop resume here" : "Upload Resume"}
                </span>
                <span className="text-xs text-brand-navy/50">
                  {props.accept?.replace(/\./g, "").toUpperCase() || "PDF / DOCX"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);
AnimatedFileUpload.displayName = "AnimatedFileUpload";
