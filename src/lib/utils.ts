/**
 * Minimal class-name combiner. Deliberately dependency-free:
 * at this scale `clsx` + `tailwind-merge` are optional; adopt them
 * when variant collisions actually appear.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
