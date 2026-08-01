# Deploy Ordence — The Complete Copy-Paste Guide (For Beginners)

Everything you need to click and everything you need to paste, in order.
No coding knowledge needed. You will do everything in your web browser —
no terminal, no commands on your computer.

You need two browser tabs:

- **Tab 1:** https://dash.cloudflare.com (your Cloudflare account)
- **Tab 2:** https://github.com (your GitHub account, with the ordence repo)

Set aside ~15 minutes for Parts A–D.

---

# PART A — Create the two storage boxes (KV namespaces)

The website needs two small storage boxes in Cloudflare. Right now the
code points at boxes that don't exist yet — that's one of the two things
blocking your deploy.

**A1.** In Tab 1, go to https://dash.cloudflare.com and log in.

**A2.** Look at the menu on the LEFT side of the screen. Click:

> **Storage & Databases** → then click **KV**

(If you don't see "Storage & Databases", click the little arrow/hamburger
to expand the sidebar, or find **Workers KV** under **Compute (Workers)**.)

**A3.** Click the blue button **Create a namespace** (top right area).

**A4.** In the name box, paste exactly this (nothing else):

```
TENANT_KV
```

Click **Add** / **Create**.

**A5.** Click **Create a namespace** again. This time paste:

```
NEXT_INC_CACHE_KV
```

Click **Add** / **Create**.

**A6.** You now see a table with your two namespaces. Each row has an
**ID** — a long code of letters and numbers, like:

```
f9e8d7c6b5a44321f0e9d8c7b6a54321
```

**A7.** Copy the ID of **TENANT_KV** (there's usually a small copy icon
next to it). Paste it somewhere temporary — a note, a text file, anywhere.
Label it "TENANT_KV id".

**A8.** Copy the ID of **NEXT_INC_CACHE_KV** the same way. Label it
"CACHE id".

✅ Done with Part A. You have two IDs saved.

---

# PART B — Put those IDs into your code (on the GitHub website)

You'll edit ONE file, directly on github.com, in the browser.

**B1.** In Tab 2, go to https://github.com and open your **ordence**
repository (the one connected to Cloudflare).

**B2.** In the list of files, click the file named:

> **wrangler.jsonc**

**B3.** Click the **pencil icon** (✏️) at the top right of the file view.
It says "Edit this file" when you hover. The file becomes editable.

**B4.** Scroll until you find this part (around the middle of the file):

```jsonc
  "kv_namespaces": [
    {
      // Tenant lookup cache (L2 in src/lib/tenant/store.ts)
      "binding": "TENANT_KV",
      "id": "<REPLACE_WITH_TENANT_KV_ID>"
    },
    {
      // Next.js incremental (ISR/data) cache — used by OpenNext
      "binding": "NEXT_INC_CACHE_KV",
      "id": "<REPLACE_WITH_INC_CACHE_KV_ID>"
    }
  ],
```

**B5.** Select ONLY this text (including the angle brackets):

```
<REPLACE_WITH_TENANT_KV_ID>
```

…and paste your **TENANT_KV id** from step A7 in its place. The quotes
must stay. It should end up looking like this (with YOUR id):

```jsonc
      "binding": "TENANT_KV",
      "id": "f9e8d7c6b5a44321f0e9d8c7b6a54321"
```

**B6.** Do the same for the second one — replace:

```
<REPLACE_WITH_INC_CACHE_KV_ID>
```

…with your **CACHE id** from step A8:

```jsonc
      "binding": "NEXT_INC_CACHE_KV",
      "id": "a1b2c3d4e5f60789a1b2c3d4e5f60789"
```

**B7.** Double-check: no `<` or `>` characters remain anywhere in the
file, and every id sits between two quote marks.

**B8.** Click the green **Commit changes...** button (top right). In the
box that pops up, paste this as the message:

```
Add real KV namespace ids
```

Make sure **"Commit directly to the main branch"** is selected, then
click **Commit changes**.

⚠️ Heads up: this push may auto-start a Cloudflare build that STILL fails
— that's expected, because we haven't fixed the build command yet. Ignore
it and continue to Part C.

✅ Done with Part B.

---

# PART C — Fix the build command in Cloudflare (the actual bug)

Cloudflare is currently building your site with an incomplete command.
This is the reason for the error you saw
("Could not find compiled Open Next config").

**C1.** In Tab 1 (Cloudflare dashboard), in the left menu click:

> **Compute (Workers)** → **Workers & Pages**

**C2.** Click on your worker — it's named **ordence** (or whatever name
you gave it when connecting the repo).

**C3.** Click the **Settings** tab.

**C4.** Find the section called **Build** (it shows your connected GitHub
repository, branch, and the build/deploy commands).

**C5.** Click **Edit** (or the pencil) on the build configuration.

**C6.** Find the field **Build command**. Delete whatever is in it
(currently `npm run build`) and paste exactly:

```
npx opennextjs-cloudflare build
```

**C7.** Find the field **Deploy command**. It should say:

```
npx wrangler deploy
```

If it already says that, leave it alone. If it's empty, paste the line
above.

**C8.** Click **Save**.

✅ Done with Part C. The bug is fixed.

---

# PART D — Run the deploy and check it worked

**D1.** Still on your worker's page in Cloudflare, look for the
**Deployments** tab (sometimes the builds are under **View builds** or a
**Builds** section). Open it.

**D2.** Start a new build. Either:

- click **Retry** / **Retry build** on the last failed build, **or**
- if there's no retry button: go back to GitHub, open any file (e.g.
  `README.md`), click the pencil, add a blank line at the end, and commit
  with message `trigger build`. Any commit starts a fresh build.

**D3.** Watch the build log. A SUCCESSFUL run shows these milestones, in
order:

```
Installing project dependencies
next build
✓ Compiled successfully
OpenNext — Generating bundle
Worker saved in `.open-next/worker.js` 🚀
OpenNext build complete.
Deployed
```

You will also see this warning — it is SAFE, ignore it:

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

(Our code uses the older name on purpose — the newer one doesn't work on
Cloudflare yet.)

**D4.** Find your free test link. On the worker's main page (the
**Overview**/**Deployments** area) there's a URL like:

```
https://ordence.YOUR-NAME.workers.dev
```

Click it. **You should see the Ordence website** — dark navy "ORDENCE"
logo, "The operating system for ambitious businesses", moving lines in
the background.

🎉 If you see that, you are LIVE on Cloudflare. Parts E and F are
optional and can be done any time later.

---

# PART E — Connect ordence.com (do this when you own the domain in THIS Cloudflare account)

Skip this part if ordence.com isn't in your Cloudflare account yet.
(To add it: dashboard home → **Add a domain** → follow the steps →
change the "nameservers" at the company where you bought the domain to
the two Cloudflare gives you. Takes up to a day to activate.)

Once ordence.com shows **Active** in your Cloudflare account:

**E1.** Go to your worker → **Settings** → **Domains & Routes** →
click **Add**.

**E2.** Choose **Custom domain**. Type this and confirm:

```
ordence.com
```

**E3.** Repeat "Add → Custom domain" three more times, once for each of:

```
www.ordence.com
```

```
admin.ordence.com
```

```
app.ordence.com
```

Cloudflare sets up DNS and HTTPS certificates for each automatically —
you don't need to do anything else for these four.

**E4.** Now the wildcard, so EVERY client subdomain
(ameyaa.ordence.com, clientx.ordence.com, …) works without adding them
one by one. Click **Add** again, but this time choose **Route**
(not Custom domain). Fill in:

- Route:

```
*.ordence.com/*
```

- Zone: select **ordence.com** from the dropdown.

Save.

**E5.** The wildcard route also needs one DNS record. Left menu → your
**ordence.com** zone → **DNS** → **Records** → **Add record**:

- Type: **CNAME**
- Name (paste just this one character):

```
*
```

- Target:

```
ordence.com
```

- Proxy status: must be **ON** (orange cloud — click it if it's grey).

Click **Save**.

**E6.** Test in your browser (give it a few minutes):

- `https://ordence.com` → marketing site
- `https://admin.ordence.com` → admin console with a sidebar
- `https://ameyaa.ordence.com` → "Welcome to Ameyaa." tenant page
- `https://anything-random.ordence.com` → a "not found" page (correct!)

---

# PART F — A client's own domain (do this per client, later)

Example: your client wants their site on customclientdomain.com.

**F1.** In your **ordence.com** zone → **SSL/TLS** → **Custom Hostnames**.
First time only: click **Enable** (this is "Cloudflare for SaaS" — free
for your first 100 client domains). If it asks for a **fallback origin**,
enter:

```
ordence.com
```

**F2.** Click **Add Custom Hostname**, enter the client's domain, e.g.:

```
customclientdomain.com
```

**F3.** Cloudflare shows DNS records the CLIENT must add at their own
domain provider (usually one CNAME pointing to your fallback origin, plus
one or two verification records). Send those to the client. When they add
them, the hostname turns **Active**.

**F4.** Tell the code which tenant owns that domain. In GitHub, edit:

> **src/lib/tenant/registry.ts**

Find the tenant and add the domain to its `domains` list, e.g.:

```ts
domains: ["customclientdomain.com", "www.customclientdomain.com"],
```

Commit the change (a new deploy runs automatically).

---

# If something goes wrong — match your error to the fix

| What the log says | What it means | Fix |
|---|---|---|
| `Could not find compiled Open Next config` | Build command is still the old one | Redo Part C, step C6 |
| `KV namespace not found` or a binding/id error | The ids in wrangler.jsonc are wrong or still placeholders | Redo Part B; compare ids character by character |
| `A request to the Cloudflare API ... failed` mentioning authentication | The GitHub↔Cloudflare connection hiccuped | Retry the build once; if it persists, reconnect the repo in Settings → Build |
| Red errors during `next build` about code | A code problem | Copy the 30 lines above the error and send them to me |
| Site loads but shows an error page | Runtime problem | Worker page → **Logs** → **Begin log stream**, reload the site, send me what appears |

Anything unclear — send me a screenshot or paste the log and I'll tell
you the exact next click.
