"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * WordRotate — cycles through words with a vertical roll, Twenty/Framer
 * style. Reserves the width of the longest word so the headline never
 * reflows (zero CLS).
 */
export function WordRotate({
  words,
  interval = 2400,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      interval,
    );
    return () => clearInterval(id);
  }, [words.length, interval, reduce]);

  return (
    <span style={{ display: "inline-grid", verticalAlign: "bottom" }}>
      {/* Invisible sizer: widest word reserves space (zero CLS).
          Carries the same className so width matches the styled word. */}
      {words.map((w) => (
        <span
          key={w}
          aria-hidden="true"
          className={className}
          style={{ gridArea: "1 / 1", visibility: "hidden", height: 0 }}
        >
          {w}
        </span>
      ))}
      <span style={{ gridArea: "1 / 1", position: "relative" }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {/* className lives on the WORD itself — gradient-text utilities
              (background-clip: text) don't reach through child boundaries,
              so applying it on a wrapper renders the word invisible. */}
          <motion.span
            key={words[index]}
            className={className}
            initial={{ y: "80%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-80%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "inline-block" }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
