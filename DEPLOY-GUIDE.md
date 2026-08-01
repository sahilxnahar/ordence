# Ordence — Step-by-Step Deploy Guide (Cloudflare Free Plan)

Follow these in order. Steps 1–4 fix the failed deploy you saw. Steps 5–6
connect your real domains. No terminal is required except where marked
"(optional)".

---

## Step 1 — Create the two KV namespaces (in the Cloudflare dashboard)

KV is the small key-value store the site uses for caching. The Worker
expects two namespaces and will refuse to deploy until they exist and
their ids are in the config.

1. Go to **dash.cloudflare.com** and log in.
2. In the left sidebar, click **Storage & Databases → KV**.
3. Click **Create a namespace**.
4. Name it exactly: `TENANT_KV` → click **Add**.
5. Click **Create a namespace** again.
6. Name it exactly: `NEXT_INC_CACHE_KV` → click **Add**.
7. You now see both namespaces in a list, each with an **ID** column — a
   long code like `a1b2c3d4e5f64789a0b1c2d3e4f5a6b7`. Keep this page open;
   you'll copy both IDs in the next step.

## Step 2 — Put the IDs into `wrangler.jsonc`

1. Open your project (the code you pushed to GitHub) in your editor.
2. Open the file **`wrangler.jsonc`** in the project root.
3. Find this block:

   ```jsonc
   "kv_namespaces": [
     {
       "binding": "TENANT_KV",
       "id": "<REPLACE_WITH_TENANT_KV_ID>"
     },
     {
       "binding": "NEXT_INC_CACHE_KV",
       "id": "<REPLACE_WITH_INC_CACHE_KV_ID>"
     }
   ],
   ```

4. Replace `<REPLACE_WITH_TENANT_KV_ID>` with the **ID of TENANT_KV** from
   Step 1 (keep the quotes — the line becomes `"id": "a1b2c3..."`).
5. Replace `<REPLACE_WITH_INC_CACHE_KV_ID>` with the **ID of
   NEXT_INC_CACHE_KV**.
6. Save the file. **Don't push yet** — do Step 3 first so one push
   triggers one correct build.

## Step 3 — Fix the build command (this is what caused the failure)

Your build ran `npm run build`, which compiles Next.js but never creates
the `.open-next` worker bundle that the deploy step uploads. Change it:

1. In the Cloudflare dashboard sidebar, click **Compute (Workers) →
   Workers & Pages** and open your **ordence** worker.
2. Go to the **Settings** tab, then find the **Build** section (the one
   showing your connected GitHub repo).
3. Click **Edit** next to the build configuration.
4. Set **Build command** to:

   ```
   npx opennextjs-cloudflare build
   ```

   (If your repo has the latest code from me, `npm run build:worker` does
   the same thing.)
5. Leave **Deploy command** as `npx wrangler deploy`.
6. Save.

## Step 4 — Push and watch it deploy

1. Commit and push the `wrangler.jsonc` change from Step 2 (and any other
   updated files) to your GitHub repo.
2. Cloudflare starts a new build automatically. Watch it under the
   worker's **Deployments** (or **Builds**) tab.
3. Success looks like: `next build` output → "OpenNext build complete" →
   "Deployed ordence". The one warning you can ignore: *"the middleware
   file convention is deprecated"* — that's intentional (documented in
   BLUEPRINT.md; the new convention doesn't run on Cloudflare yet).
4. Test it: the worker gets a free URL like
   `ordence.<your-subdomain>.workers.dev` — open it. You should see the
   Ordence marketing homepage.

## Step 5 — Connect ordence.com (when you're ready)

Prerequisite: the `ordence.com` domain is added to this same Cloudflare
account as a zone (Cloudflare manages its DNS).

1. Open the worker → **Settings** → **Domains & Routes** → **Add**.
2. Choose **Custom domain**, add these four, one at a time:
   - `ordence.com`
   - `www.ordence.com`
   - `admin.ordence.com`
   - `app.ordence.com`
   Cloudflare creates the DNS records and TLS certificates automatically.
3. For tenant subdomains (`ameyaa.ordence.com`, etc.), add a **Route**
   instead: click **Add** → **Route** → route: `*.ordence.com/*` → zone:
   `ordence.com`. Then in **DNS**, add one record:
   - Type `CNAME`, name `*`, target `ordence.com`, proxy status **ON**
     (orange cloud).
4. Test: `ameyaa.ordence.com` should show the Ameyaa tenant page,
   `admin.ordence.com` the admin console.

## Step 6 — Client custom domains (later, per client)

1. In the `ordence.com` zone: **SSL/TLS → Custom Hostnames** (Cloudflare
   for SaaS — first 100 hostnames are free; you may need to click
   **Enable** once and set a fallback origin like `ordence.com`).
2. Add the client's domain (e.g. `customclientdomain.com`).
3. Tell the client to add the CNAME record Cloudflare shows you.
4. Add the domain to that tenant's entry in
   `src/lib/tenant/registry.ts` (the `domains` array) and push.

---

## If something fails

- **"Could not find compiled Open Next config"** → Step 3 wasn't applied;
  the build command is still `npm run build`.
- **"KV namespace ... not found" / binding error** → the IDs in
  `wrangler.jsonc` don't match Step 1's namespaces, or the change wasn't
  pushed.
- **Build fails in `next build`** → a code error; read the log lines just
  above the failure and share them with me.
- Anything else: copy the build log and send it over.
