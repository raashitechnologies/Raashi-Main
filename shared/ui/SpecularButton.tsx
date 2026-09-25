import { useRef, useEffect, useState, forwardRef } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { Slot, Slottable } from "@radix-ui/react-slot";

export interface SpecularButtonProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  baseColor?: string;
  lineColor?: string;
  textColor?: string;
  radius?: number;
  className?: string;
  disabled?: boolean;
  as?: React.ElementType | string;
  type?: "button" | "submit" | "reset";
  href?: string;
  asChild?: boolean;
}

export const SpecularButton = forwardRef<HTMLElement, SpecularButtonProps>((
{
  children,
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  baseColor = "transparent",
  lineColor = "#ffffff",
  textColor = "inherit",
  radius = 16,
  className = "",
  disabled = false,
  asChild = false,
  as = "button",
  ...props
}, forwardedRef) => {
  const innerRef = useRef<HTMLElement>(null);

  const setRefs = (node: HTMLElement) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);

  // Springs for smooth shine positioning
  const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 50 });
  const opacity = useSpring(0, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    setTouchDevice(isTouch);
  }, []);

  useEffect(() => {
    if (disabled || prefersReducedMotion || touchDevice || !followMouse) {
      opacity.set(0);
      return;
    }

    let animationFrame: number;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!innerRef.current) return;

      const rect = innerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distanceX = Math.abs(x - centerX);
      const distanceY = Math.abs(y - centerY);

      if (
        x > -proximity &&
        x < rect.width + proximity &&
        y > -proximity &&
        y < rect.height + proximity
      ) {
        mouseX.set(x);
        mouseY.set(y);

        if (isHovered) {
          opacity.set(intensity);
        } else {
          const dist = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          const maxDist = Math.max(rect.width, rect.height) / 2 + proximity;
          const proximityRatio = Math.max(0, 1 - dist / maxDist);
          opacity.set(intensity * 0.3 * proximityRatio);
        }
      } else {
        opacity.set(0);
      }
    };

    if (autoAnimate && !isHovered) {
      const animate = () => {
        if (!innerRef.current) return;
        time += speed * 0.01;
        const rect = innerRef.current.getBoundingClientRect();
        mouseX.set((Math.sin(time) * 0.5 + 0.5) * rect.width);
        mouseY.set((Math.cos(time * 0.8) * 0.5 + 0.5) * rect.height);
        opacity.set(intensity * 0.5);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    } else {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [disabled, prefersReducedMotion, touchDevice, followMouse, isHovered, proximity, autoAnimate, speed, intensity, mouseX, mouseY, opacity]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    setIsHovered(true);
    props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    setIsHovered(false);
    props.onMouseLeave?.(e);
  };

  const Component = asChild ? Slot : (as as React.ElementType);

  const hoverClasses = !disabled && !prefersReducedMotion
    ? "hover:-translate-y-[1px] active:scale-[0.98] transition-transform duration-200 ease-out"
    : "";

  return (
    <Component
      ref={setRefs}
      // `isolate` creates a new stacking context.
      // Decorative layers (shine, border) use zIndex:-1 within this context,
      // so they sit BELOW Slottable's natural-flow content automatically.
      // Root is NOT overflow-hidden so keyboard focus rings are never clipped.
      className={`relative isolate inline-flex items-center justify-center gap-2 ${hoverClasses} ${className}`}
      style={{
        backgroundColor: baseColor,
        color: textColor,
        borderRadius: radius,
        ...(props.style || {}),
      }}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* LAYER 1 — Specular shine (z:-1, below natural flow content)
          Inner span clips the gradient to borderRadius shape.
          Outer container has zIndex:-1 so it's beneath Slottable's rendered child.
          mix-blend-overlay means it only brightens the background color — never covers text. */}
      {!disabled && !prefersReducedMotion && !touchDevice && (
        <span
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ borderRadius: radius, zIndex: -1 }}
        >
          <motion.span
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              opacity,
              background: `radial-gradient(circle ${shineSize * 10}px at calc(var(--x) * 1px) calc(var(--y) * 1px), ${lineColor}, transparent ${shineFade}%)`,
              // @ts-ignore — assigning MotionValue to CSS custom property
              "--x": mouseX,
              "--y": mouseY,
            }}
          />
        </span>
      )}

      {/* LAYER 2 — Content
          Slottable MUST be a direct child of Component/Slot — wrapping it in any element
          breaks Radix UI's slot-merging logic and causes a runtime error.
          Because decorative layers have zIndex:-1 and root has `isolate`,
          this content naturally renders above them without any z-index of its own. */}
      <Slottable>{children}</Slottable>

      {/* LAYER 3 — Decorative inset border (z:-1, purely visual)
          Uses inset box-shadow — draws inside the button area without covering content.
          zIndex:-1 ensures it stays below the flow content (Slottable).
          pointer-events-none so it never intercepts mouse events. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 ${thickness}px ${lineColor}20`,
          borderRadius: radius,
          zIndex: -1,
        }}
      />
    </Component>
  );
});
SpecularButton.displayName = "SpecularButton";
