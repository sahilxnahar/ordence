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
          /* `height: 0` used to be here. All the sizers share grid area
             1/1, so they overlap rather than stack — collapsing them to
             zero height left the row sized by the mask alone, and on the
             hero's display-size headline the mask resolved to a ~10px
             strip. The rotating word rendered as a sliver. Letting the
             sizers hold their natural height gives the row a real, stable
             measure; `visibility: hidden` keeps them invisible. */
          style={{ gridArea: "1 / 1", visibility: "hidden" }}
        >
          {w}
        </span>
      ))}
      {/*
        The roll must happen inside a mask. Without `overflow: hidden` the
        outgoing and incoming words are both fully visible during the
        450ms crossfade, floating roughly 1.6 line-heights apart — which
        is what a visitor sees for a fifth of every cycle. The padding /
        negative-margin pair keeps descenders from being clipped while
        leaving the layout box unchanged.
      */}
      <span
        style={{
          gridArea: "1 / 1",
          position: "relative",
          display: "block",
          overflow: "hidden",
          // Symmetric bleed. Bottom-only padding was enough at heading
          // sizes but not at display sizes, where the taller ascenders of
          // the incoming word were sheared off by the mask — on the hero
          // the rotating word rendered as a sliver.
          paddingTop: "0.2em",
          marginTop: "-0.2em",
          paddingBottom: "0.2em",
          marginBottom: "-0.2em",
        }}
      >
        {/*
          `mode="wait"`, not `popLayout`. popLayout yanks the exiting word
          out of flow with position:absolute, and in this grid-inside-a-
          wrapping-heading arrangement the incoming word never settled out
          of its `y: 80%` entry offset — it sat pinned at the bottom of the
          mask, so all a visitor ever saw was the top few pixels of the
          glyphs. Waiting for the exit to finish keeps both words in normal
          flow, which is the only thing this animation actually needed.
        */}
        <AnimatePresence mode="wait" initial={false}>
          {/* className lives on the WORD itself — gradient-text utilities
              (background-clip: text) don't reach through child boundaries,
              so applying it on a wrapper renders the word invisible. */}
          <motion.span
            key={words[index]}
            className={className}
            initial={{ y: "70%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-70%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "block" }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
