/**
 * Assembles ./dist for the Cloudflare Workers assets deploy.
 *
 * The site is authored at the repo root — index.html, the page folders,
 * assets/ and brand/ all sit next to the config that ships them. Pointing
 * Wrangler straight at "./" would work right until it uploaded .git, this
 * script and the build config alongside the site. So the build is one
 * deliberate copy into a folder that holds the site and nothing else.
 *
 * Zero dependencies, on purpose. Cloudflare runs an install step before
 * the build command, and a site made of static files should not need a
 * lockfile resolved over the network in order to deploy. That also means
 * this file cannot import anything outside node: builtins.
 */
import { readFile, writeFile, rm, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = "dist";

/**
 * Repo plumbing rather than site. A denylist and not an allowlist,
 * because the failure modes are not symmetric: forgetting to add a new
 * page to an allowlist ships a site that is silently missing it, while
 * forgetting to add a new config file here ships one harmless extra file.
 */
const SKIP = new Set([
  OUT,
  ".git",
  ".github",
  ".wrangler",
  "node_modules",
  "scripts",
  "package.json",
  "package-lock.json",
  "wrangler.jsonc",
  ".gitignore",
  ".env.example",
  ".DS_Store",
  "README.md",
]);

const entries = await readdir(".", { withFileTypes: true });

/*
 * Guard, not decoration. An assets deploy of an empty folder succeeds:
 * Wrangler uploads nothing, Cloudflare accepts it, and the live site
 * starts returning 404 for every URL with a green build log above it.
 * Failing here turns that into a build error someone actually reads.
 */
if (!entries.some((e) => e.name === "index.html")) {
  throw new Error(
    "No index.html at the repo root — the site files are not where this " +
      "script expects them, and deploying now would empty the live site.",
  );
}

/*
 * Clean first, and carry on if the filesystem will not allow it.
 *
 * On Cloudflare this is a no-op: every build starts from a fresh clone
 * with no dist to remove. It matters locally, where a page deleted from
 * the repo would otherwise linger in dist forever and keep getting
 * deployed. But some environments — a synced folder, a mount that
 * refuses unlink, a file held open by an editor — make rm fail on a
 * directory that is perfectly readable and writable. Aborting the whole
 * build over that is the wrong trade: a stale extra file is a much
 * smaller problem than no build at all. So we say so, loudly, and copy
 * over the top.
 */
let clean = true;
try {
  await rm(OUT, { recursive: true, force: true });
} catch (err) {
  clean = false;
  console.warn(
    `\n  WARNING: could not clear ./${OUT} (${err.code}).\n` +
      "  Copying over the top instead. Files deleted from the repo may\n" +
      "  still be present in the build. Cloudflare builds from a fresh\n" +
      "  clone, so this affects local builds only.\n",
  );
}
await mkdir(OUT, { recursive: true });

/*
 * Read-and-write rather than fs.cp.
 *
 * cp() unlinks an existing destination before writing it, so on a
 * filesystem that refuses unlink it fails on the second build for
 * exactly the same reason rm did — and it fails halfway through, leaving
 * a partially updated dist, which is worse than either succeeding or
 * refusing. writeFile truncates in place and never needs to delete
 * anything. The site is a couple of megabytes; buffering a file at a
 * time costs nothing worth optimising.
 */
async function copyInto(src, dest) {
  const entry = await readdir(src, { withFileTypes: true }).catch(() => null);
  if (entry === null) {                       // a file, not a directory
    await writeFile(dest, await readFile(src));
    return 1;
  }
  await mkdir(dest, { recursive: true });
  let n = 0;
  for (const e of entry) {
    if (e.name === ".DS_Store") continue;
    n += await copyInto(join(src, e.name), join(dest, e.name));
  }
  return n;
}

const shipped = [];
let files = 0;
for (const entry of entries) {
  if (SKIP.has(entry.name)) continue;
  files += await copyInto(entry.name, join(OUT, entry.name));
  shipped.push(entry.name);
}

console.log(
  `dist/ assembled${clean ? "" : " (not cleaned)"} — ` +
    `${shipped.length} entries, ${files} files:`,
);
console.log(shipped.sort().join(", "));
