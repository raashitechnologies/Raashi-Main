import React, { useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';

export interface FoldTextProps {
  text: string;
  splitBy?: "char" | "word";
  hinge?: "top" | "bottom";
  trigger?: "scroll" | "mount";
  duration?: number;
  stagger?: number;
  ease?: any;
  perspective?: number;
  creaseShading?: number;
  fontSize?: string;
  fontWeight?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
}

export default function FoldText({
  text,
  splitBy = "char",
  hinge = "top",
  trigger = "scroll",
  duration = 0.65,
  stagger = 0.045,
  ease = "easeOut",
  perspective = 700,
  creaseShading = 0.55,
  fontSize,
  fontWeight,
  color,
  className = "",
  style,
  as: Component = "span"
}: FoldTextProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const shouldAnimate = trigger === "mount" ? true : isInView;

  const transformOrigin = hinge === "top" ? "50% 0%" : "50% 100%";
  const initialRotate = hinge === "top" ? -80 : 80;

  // Resolve standard GSAP strings if accidentally passed
  let resolvedEase = ease;
  if (ease === "power3.out") resolvedEase = [0.175, 0.885, 0.32, 1];
  if (ease === "power2.out") resolvedEase = [0.25, 1, 0.5, 1];
  if (ease === "power4.out") resolvedEase = [0.165, 0.84, 0.44, 1];

  const segments = useMemo(() => {
    if (splitBy === "word") {
      return text.split(" ").map((word, index, arr) => ({
        content: word,
        globalIndex: index,
        addSpace: index < arr.length - 1
      }));
    } else {
      let globalIndex = 0;
      return text.split(" ").map((word, wordIdx, arr) => {
        const chars = word.split("").map((char) => ({
          content: char,
          globalIndex: globalIndex++
        }));
        const addSpace = wordIdx < arr.length - 1;
        if (addSpace) {
           globalIndex++;
        }
        return {
          word,
          chars,
          addSpace,
        };
      });
    }
  }, [text, splitBy]);

  return (
    <Component
      ref={ref}
      className={`inline ${className}`}
      style={{
        fontSize,
        fontWeight,
        color,
        ...style
      }}
      aria-label={text}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline" style={{ perspective }}>
        {splitBy === "word" ? (
          (segments as any[]).map((seg) => (
            <React.Fragment key={seg.globalIndex}>
              <span className="inline-block whitespace-nowrap">
                <AnimatedSegment
                  content={seg.content}
                  index={seg.globalIndex}
                  duration={duration}
                  stagger={stagger}
                  ease={resolvedEase}
                  initialRotate={initialRotate}
                  transformOrigin={transformOrigin}
                  hinge={hinge}
                  creaseShading={creaseShading}
                  shouldAnimate={shouldAnimate}
                />
              </span>
              {seg.addSpace && " "}
            </React.Fragment>
          ))
        ) : (
          (segments as any[]).map((wordObj, wordIdx) => (
            <React.Fragment key={wordIdx}>
              <span className="inline-block whitespace-nowrap">
                {wordObj.chars.map((charObj: any) => (
                  <AnimatedSegment
                    key={charObj.globalIndex}
                    content={charObj.content}
                    index={charObj.globalIndex}
                    duration={duration}
                    stagger={stagger}
                    ease={resolvedEase}
                    initialRotate={initialRotate}
                    transformOrigin={transformOrigin}
                    hinge={hinge}
                    creaseShading={creaseShading}
                    shouldAnimate={shouldAnimate}
                  />
                ))}
              </span>
              {wordObj.addSpace && " "}
            </React.Fragment>
          ))
        )}
      </span>
    </Component>
  );
}

function AnimatedSegment({
  content,
  index,
  duration,
  stagger,
  ease,
  initialRotate,
  transformOrigin,
  hinge,
  creaseShading,
  shouldAnimate
}: any) {
  return (
    <span
      className="inline-block relative"
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <motion.span
        className="inline-block relative"
        initial={{ opacity: 0, rotateX: initialRotate, y: hinge === "top" ? -5 : 5 }}
        animate={shouldAnimate ? { opacity: 1, rotateX: 0, y: 0 } : {}}
        transition={{
          duration,
          ease,
          delay: index * stagger
        }}
        style={{
          transformOrigin,
          transformStyle: "preserve-3d",
        }}
      >
        {content}
        {creaseShading > 0 && (
          <motion.span
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: creaseShading }}
            animate={shouldAnimate ? { opacity: 0 } : {}}
            transition={{
              duration,
              ease,
              delay: index * stagger
            }}
            style={{
              background: hinge === "top" 
                ? `linear-gradient(to bottom, rgba(0,0,0,1), transparent)` 
                : `linear-gradient(to top, rgba(0,0,0,1), transparent)`,
            }}
          />
        )}
      </motion.span>
    </span>
  );
}
