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
import { cp, rm, mkdir, readdir } from "node:fs/promises";
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

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const shipped = [];
for (const entry of entries) {
  if (SKIP.has(entry.name)) continue;
  await cp(entry.name, join(OUT, entry.name), { recursive: true });
  shipped.push(entry.name);
}

console.log(`dist/ assembled — ${shipped.length} entries:`);
console.log(shipped.sort().join(", "));
