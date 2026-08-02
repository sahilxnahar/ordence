import { twMerge } from "tailwind-merge";

/**
 * Class-name combiner with real conflict resolution.
 *
 * This used to be `classes.filter(Boolean).join(" ")` with a note saying
 * tailwind-merge could be adopted "when variant collisions actually
 * appear". They appeared, and they were invisible: a plain join emits both
 * the base utility and the caller's override, so which one wins is decided
 * by the order Tailwind happened to emit them in the stylesheet — not by
 * the order they were written.
 *
 * That produced a whole family of bugs that all read as unrelated
 * alignment problems. `hidden sm:inline-flex` on a Button lost to the
 * Button's own `inline-flex`, so the desktop "Sign in" link rendered on
 * phones and wrapped onto two lines. The same failure shape hid behind
 * every attempted override of a display, size or colour utility.
 *
 * twMerge keeps only the last class in each conflicting group, so the
 * caller's intent wins — which is what every call site already assumed.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
