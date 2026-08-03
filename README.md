# Ordence — static site

A complete marketing site with no build step. Plain HTML, one shared
stylesheet, one shared scene engine. Push it and it is live.

## Deploy on Cloudflare Pages

1. Push this folder to a GitHub repository.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *leave empty*
   - Build output directory: **/**
4. Save and Deploy.

There is no build command because there is nothing to build. That is the
point: no Node version to pin, no dependency that can break a deploy, no
lockfile drift. What you push is what is served.

## Structure

```
index.html            home
crm/  erp/  ai/       product pages
services/             websites
pricing/  about/
get-started/ contact/
security/
assets/
  scene.js            the particle engine
  site.css            every style on the site
  three.module.min.js three.js (cached forever)
  three.core.min.js
  mark-layers.json    the logo, split into its seven glyphs
brand/                official SVG logo set
_headers              cache policy for Cloudflare Pages
```

## Editing content

Headlines, ledes and buttons live in the HTML of each page. Search for
the text you want to change; it appears exactly once.

To change what the particles do on a page, edit the `data-program`
attribute on `<body>`. Available shapes:

`chaos` `rows` `grid` `funnel` `orbit` `wave` `columns` `shell` `drift` `mark`

Two to four, comma separated. Particles morph between them as you scroll.
`data-anchor` is the index of the beat that must be fully resolved when it
lands — usually the last one.

## Testing

Add `?debug` to any URL, or press `d`, for the engine readout: which
quality tier was chosen, particle count, frame rate.

Add `?tier=ultra` (or `high` / `medium` / `low` / `minimal`) to force a
level and see how it looks on hardware you do not have in front of you.

## Notes

- The scene picks a quality tier from the visitor's cores, memory, GPU and
  pixel count, then adjusts down if the frame rate drops. A cheap Android
  and an M3 Max both get something that runs smoothly.
- `prefers-reduced-motion` pins it to the minimal tier automatically.
- Verified: 10 pages × 2 viewports, no horizontal overflow, exactly one
  `<h1>` per page, no console errors.
