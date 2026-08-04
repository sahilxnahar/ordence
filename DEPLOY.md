# Ordence — deploying, start to end

One document. Seven steps, about forty minutes, and at the end
`ordence.com` shows your site and the enquiry form reaches your inbox.

**Read this first, because it changes what the rest of the document is
for: your site is already deployed.** It has been since this morning. It
is live at `https://ordence.sahil-ad6.workers.dev` with all 32 pages of
the current build. You can open it now.

So this is not a rescue. It is: switch off the one thing that keeps
failing, connect the email, and move the domain across.

---

## Why you kept hitting problems

Worth two minutes, because the answer decides Step 1.

Since yesterday there were seven separate failures. They were not one
thing going wrong repeatedly — they were seven different things, and only
two of them were Cloudflare's:

| What failed | Whose fault | Fixed |
|---|---|---|
| Build hung 39 min at "Initializing" | Cloudflare — a real platform incident | passed |
| Build token deleted or rotated | Cloudflare | Step 1 |
| Git lock file, twice | **Mine** — my diagnostic commands leave a lock the sandbox cannot delete | yes, and I stopped running them |
| `package.json` had no Wrangler | **Mine** — I dropped it when I replaced the file | yes |
| Files wiped in the "2.0" commit | **Mine** — I moved git locks while GitHub Desktop was open | yes |
| `/dist/` in `.gitignore` hid the whole site | A fossil from when this repo was a Next.js app | yes |
| Terminal in the wrong folder | The `cd` was missing | Step 2 |

**Three of the seven were mine.** If you concluded from this week that
Cloudflare is unreliable, that would be the wrong lesson drawn from mostly
my mess.

**Your $5/month Workers plan changes none of this.** It buys CPU time and
features. It does not affect the build token, GitHub, or DNS. Nothing here
needed you to upgrade, and nothing here is failing for want of it.

**And GitHub is working.** Commit `ce2863c` is on `origin/main` with all 82
site files in it. That part is done and stays done.

---

# Step 1 · Switch off the automatic build

**Two minutes. This is the step that ends the failures.**

Cloudflare can build your site from GitHub every time you push. For a site
like yours, that system does nothing except run one command — and it has
its own credential that expires, its own build fleet that can go down, and
its own queue that can hang. It is a whole extra machine whose only job is
to run a command you can run yourself in twenty seconds.

Your `dist/` folder is finished HTML. **There is no build.** So there is
nothing to gain and a list of things to lose.

1. Go to **https://dash.cloudflare.com**
2. Left menu → **Compute** → **Workers & Pages**
3. Click **ordence**
4. Top tabs → **Settings**
5. Find **Git repository** — it says `sahilxnahar/ordence`
6. Click **Disconnect**, and confirm

**What you should see:** the "Latest build failed" badge disappears from
the top of the page and the Build section empties out.

**What this does NOT do:** it does not touch your code, your GitHub repo,
your deployed site, or your domain. GitHub keeps every file and every
commit. You are only removing Cloudflare's permission to build from it.

While you are on that screen, delete the build variable
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`. It is left over from when this was a
Next.js project — your site does not read it.

---

# Step 2 · Your permanent deploy command

**This replaces everything that was failing.** From now on, this is how the
site goes live. Two lines. It has already worked twice today.

```
cd ~/Documents/GitHub/ordence
npm run deploy
```

**Both lines, every time.** The single most common mistake — the one that
gave you `Missing script: "deploy"` — is opening a fresh Terminal window
and forgetting the first line. A new window always starts in your home
folder, never in the project.

**What you should see:** a list of assets, then `Deployed ordence` and the
`workers.dev` URL. About twenty seconds.

Git and deploying are now completely separate. Commit in GitHub Desktop
whenever you like — it costs nothing and it is your undo button if
something ever goes wrong. Deploy whenever you like. Neither waits for the
other, and neither can break the other.

---

# Step 3 · Put the keys on the Worker

**Five minutes. One-time.** Two secrets, one command each.

Secrets never live in the repo — that is why this is a command rather than
a file you edit. What you type is encrypted at Cloudflare and cannot be
read back out by anyone, including you.

```
cd ~/Documents/GitHub/ordence
npx wrangler secret put TURNSTILE_SECRET
```

It says `Enter a secret value:`. Fetch the value from **Cloudflare →
Turnstile → your Ordence widget → Settings → Secret Key**, paste, Enter.

> **You will see nothing as you paste.** Terminal hides secret input — no
> dots, no stars, no movement. That is correct, not frozen.

Then:

```
npx wrangler secret put RESEND_API_KEY
```

Paste the `re_...` key from **Resend → API Keys**. If you have not created
one, do it now: **Create API Key**, name it `ordence-site`, permission
**Sending access**. It is shown once and never again.

Then confirm both landed:

```
npx wrangler secret list
```

You should see both names. It never shows values.

---

# Step 4 · The email fix I have already made

**No action — this is done, but you need to know why.**

I checked your DNS directly. Resend is verified on **`updates.ordence.com`**,
not on `ordence.com`:

```
resend._domainkey.updates.ordence.com   → exists
resend._domainkey.ordence.com           → does not exist
```

Your Worker was set to send from `sahil@ordence.com`. Resend would have
rejected **every single send** — the form would say "thank you" and no
email would ever arrive. That is the worst kind of broken, because it
looks fine.

Two changes are already in the files I sent you:

- `MAIL_FROM` is now `Ordence <sahil@updates.ordence.com>` — the domain
  Resend actually verified
- A new `REPLY_TO` of `sahil@ordence.com`, because `updates.ordence.com`
  can send but has no inbound MX and cannot receive. Without it, anyone
  who simply hit Reply on your acknowledgement would get a bounce, having
  done exactly what you invited them to do.

They take effect on your next `npm run deploy`.

---

# Step 5 · Test it before anybody can see it

**Ten minutes. Do not skip this.** Your site is still invisible to the
public at this point — that is exactly why the domain move is last.

1. Deploy: `cd ~/Documents/GitHub/ordence` then `npm run deploy`
2. Open `https://ordence.sahil-ad6.workers.dev`
3. Go to **Get a quote**
4. Fill it in using **a personal address that is not on ordence.com** —
   your Gmail. Mail between two addresses on the same domain can succeed
   while mail to the outside world fails, so testing with an ordence
   address proves nothing.
5. Put `TEST — ignore` in the message. Submit.

**Within about thirty seconds:**

- The page moves to a thank-you page
- `sahil@ordence.com` gets the enquiry
- The address you typed gets an acknowledgement

**Then check the thing that actually matters.** Open the acknowledgement in
Gmail. Is it in the **inbox**, or in spam? If spam: three dots → **Show
original** → look for **SPF**, **DKIM**, **DMARC**. All three should say
**PASS**. Your DMARC record is already live and correct — I verified it —
so if any of them fail, send me that screen.

If no email arrives at all, run `npx wrangler tail`, leave it running,
submit again, and watch. It will name the problem.

---

# Step 6 · Move the domain

**Ten minutes. This is the one that makes it public.** Only after Step 5
passes.

### 6a · Remove the Squarespace records

Cloudflare → **ordence.com** → **DNS** → **Records**. Delete these two:

- **A** records on `ordence.com` pointing at `198.185.159.x` / `198.49.23.x`
- The **CNAME** on `www` pointing at `ext-sq.squarespace.com`

> ### ⛔ Do not delete these
>
> | Leave alone | Why |
> |---|---|
> | **MX** → `smtp.google.com` | Your email. Deleting it stops all mail to ordence.com. |
> | **TXT** on `ordence.com` starting `v=spf1` | Your email's SPF. |
> | **TXT** on `_dmarc` | You added it today. |
> | **MX** and **TXT** on `send.updates` | Resend. |
> | **TXT** on `resend._domainkey` | Resend's signature. |
> | **TXT** on `google._domainkey` | Google's signature. |
> | Anything on **`app`**, `clerk`, `clk`, `clkmail` | Your CRM application and its login. |
> | The **`*`** wildcard CNAME | Your tenant subdomains. |
>
> **The rule: delete only `A` and `CNAME` records that point at
> Squarespace. Never an `MX`. Never a `TXT`.** If you are unsure about one,
> leave it and ask me.

### 6b · Attach the domain to the Worker

1. **Workers & Pages** → **ordence** → **Settings** → **Domains & Routes**
2. **Add** → **Custom Domain** → `ordence.com` → Add
3. Repeat for `www.ordence.com`

Cloudflare creates the right records itself. That is why 6a comes first —
it will not overwrite records that already exist.

### 6c · Check

Wait three minutes, then open **https://ordence.com** in a **private
window**. Your normal browser has the Squarespace page cached and will keep
showing it long after the world sees the new one.

---

# Step 7 · The log

**Five minutes. Same day as Step 6.**

Right now the only copy of an enquiry is an email. If Resend has a bad
hour, an enquiry is gone and the sender saw a thank-you page.

```
cd ~/Documents/GitHub/ordence
npx wrangler kv namespace create LOG
```

It prints an id. Open `wrangler.jsonc`, find the commented block near the
bottom, remove the `//` from those three lines, paste your id in, save, and
`npm run deploy`.

---

## From here on, forever

```
cd ~/Documents/GitHub/ordence
npm run deploy
```

That is the whole thing. No build token, no build queue, no credential that
expires, no third system between your folder and the edge.

If you later want push-to-deploy back, the honest answer is not Cloudflare's
build system but a GitHub Action — one file in the repo, logs on GitHub
where you already look. Worth doing when things are calm. Not now.
