import { forwardRef } from "react";
import { Check } from "lucide-react";
import { SpecularButton, type SpecularButtonProps } from "./SpecularButton";
import { ConveyorLoop } from "./ConveyorLoop";

export interface ButtonProps extends Omit<SpecularButtonProps, "baseColor" | "lineColor" | "textColor" | "radius"> {
  variant?: "primary" | "secondary" | "outline" | "outline-light" | "ghost" | "ghost-light" | "danger" | "icon" | "primary-glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  success?: boolean;
  loadingText?: string;
  successText?: string;
}

export const Button = forwardRef<HTMLElement, ButtonProps>(
  ({ 
    children, 
    variant = "primary", 
    size = "md", 
    isLoading = false, 
    success = false,
    loadingText = "Submitting...",
    successText = "Submitted",
    disabled, 
    className = "",
    ...props 
  }, ref) => {
    
    // Map sizes to border radius and padding
    let radius = 12; // md default
    let paddingClass = "px-5 py-2.5";
    let textClass = "text-sm font-semibold";
    
    switch (size) {
      case "sm":
        radius = 8;
        paddingClass = "px-3 py-1.5";
        textClass = "text-xs font-semibold";
        break;
      case "md":
        radius = 12;
        paddingClass = "px-5 py-2.5";
        textClass = "text-sm font-semibold";
        break;
      case "lg":
        radius = 16;
        paddingClass = "px-8 py-3.5";
        textClass = "text-base font-bold";
        break;
      case "icon":
        radius = 10;
        paddingClass = "p-2";
        textClass = "";
        break;
    }

    // Map variants to colors and specular configurations
    let baseColor = "transparent";
    let lineColor = "transparent";
    let textColor = "inherit";
    let specularConfig = {
      intensity: 0,
      followMouse: false,
      thickness: 0,
    };
    let variantClass = "";

    switch (variant) {
      case "primary":
        baseColor = "#0560DF"; // Brand Blue
        lineColor = "#FFFFFF"; // White shine
        textColor = "#FFFFFF";
        specularConfig = {
          intensity: 0.8,
          followMouse: size === "lg", // Only follow mouse for large primary CTAs
          thickness: 1,
        };
        variantClass = "shadow-sm hover:brightness-110 hover:shadow-soft-hover hover:scale-[1.02] transition-all duration-300";
        break;
      case "primary-glass":
        baseColor = "rgba(5, 96, 223, 0.15)"; // Translucent Brand Blue
        lineColor = "#FFFFFF"; // White shine
        textColor = "#FFFFFF";
        specularConfig = {
          intensity: 0.6,
          followMouse: false,
          thickness: 1,
        };
        variantClass = "border border-brand-blue/20 shadow-sm hover:bg-brand-blue/25 hover:border-brand-blue/30 transition-all duration-300 backdrop-blur-md";
        break;
      case "secondary":
        baseColor = "#FFFFFF";
        lineColor = "#17285E"; // Navy shine
        textColor = "#17285E";
        specularConfig = {
          intensity: 0.4,
          followMouse: false,
          thickness: 1,
        };
        variantClass = "border border-brand-navy shadow-sm hover:bg-[#F1F1EE]";
        break;
      case "outline":
        baseColor = "transparent";
        lineColor = "#17285E"; 
        textColor = "#17285E";
        specularConfig = {
          intensity: 0.3,
          followMouse: false,
          thickness: 1.5,
        };
        variantClass = "border border-brand-navy/30 hover:border-brand-navy/60 hover:bg-brand-navy/5";
        break;
      case "outline-light":
        baseColor = "transparent";
        lineColor = "#FFFFFF"; 
        textColor = "#FFFFFF";
        specularConfig = {
          intensity: 0.3,
          followMouse: false,
          thickness: 1.5,
        };
        variantClass = "border border-white/20 hover:border-white/40 hover:bg-white/5";
        break;
      case "ghost":
        baseColor = "transparent";
        textColor = "#17285E";
        variantClass = "hover:bg-[#F1F1EE]";
        break;
      case "ghost-light":
        baseColor = "transparent";
        textColor = "#FFFFFF";
        variantClass = "hover:bg-white/10";
        break;
      case "danger":
        baseColor = "#EE3128"; // Brand Red
        textColor = "#FFFFFF";
        lineColor = "#FFFFFF";
        specularConfig = {
          intensity: 0.3,
          followMouse: false,
          thickness: 1,
        };
        variantClass = "hover:brightness-110";
        break;
      case "icon":
        baseColor = "transparent";
        textColor = "#174A7E";
        variantClass = "hover:bg-[#F1F1EE] text-[#174A7E] hover:text-[#174A7E]";
        break;
    }

    const isDisabled = disabled || isLoading || success;
    const disabledClass = isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:ring-offset-2";

    // Combine classes
    const combinedClassName = `${paddingClass} ${textClass} ${variantClass} ${disabledClass} ${className}`;

    // Handle content states
    let content = children;
    if (isLoading) {
      content = (
        <>
          {/* ConveyorLoop inherits the button's text color via currentColor.
              trackLength=6 for icon size, 8 for md/lg — compact enough to sit inline. */}
          <ConveyorLoop
            trackLength={size === "icon" ? 4 : 6}
            speed={500}
            className="text-current"
            aria-label={loadingText}
          />
          {size !== "icon" && <span>{loadingText}</span>}
        </>
      );
    } else if (success) {
      content = (
        <>
          <Check className="w-4 h-4" />
          {size !== "icon" && <span>{successText}</span>}
        </>
      );
    }

    return (
      <SpecularButton
        ref={ref}
        baseColor={baseColor}
        lineColor={lineColor}
        textColor={textColor}
        radius={radius}
        className={combinedClassName}
        disabled={isDisabled}
        {...specularConfig}
        {...props}
      >
        {content}
      </SpecularButton>
    );
  }
);
Button.displayName = "Button";
