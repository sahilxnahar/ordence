# Securing admin.ordence.com — copy-paste guide

**Do this BEFORE you point DNS at the admin console.** The admin app has
no login screen of its own, on purpose: it is protected at Cloudflare's
edge by **Cloudflare Access**, which authenticates every visitor *before*
the request reaches your Worker. That is stronger than an app-level
password (an attacker never reaches your code at all), it costs nothing —
Access is free for up to 50 users — and there is no auth library to
maintain or breach.

Until the policy below exists, anyone who guesses the hostname can
provision, suspend and read every tenant. Fifteen minutes, once.

---

## Part A — Turn on Zero Trust (one time)

**A1.** Go to https://one.dash.cloudflare.com — this is Cloudflare's Zero
Trust dashboard (a different console from the main one).

**A2.** If asked to choose a plan, pick **Free** (50 users) and complete
the setup. It may ask for a team name — anything you like, e.g.
`ordence`. Your team domain becomes `ordence.cloudflareaccess.com`.

**A3.** Payment details may be requested to activate the free plan. It
does not charge for the free tier.

## Part B — Add a login method

**B1.** In Zero Trust, go to **Settings → Authentication**.

**B2.** Under **Login methods**, click **Add new**.

**B3.** Choose **Google** (or **One-time PIN**, which emails a code and
needs no setup at all — the fastest option if you want to skip Google
configuration).

- **One-time PIN** works immediately, no configuration.
- **Google** gives you one-click sign-in with your Google Workspace
  account; follow Cloudflare's on-screen steps to paste in a Client ID
  and Secret.

## Part C — Protect the admin hostname

**C1.** Go to **Access → Applications** → **Add an application**.

**C2.** Choose **Self-hosted**.

**C3.** Fill in:

- Application name:

```
Ordence Admin
```

- Session duration: **24 hours** (or shorter if you prefer)
- Under **Application domain**, set subdomain and domain:

```
admin
```

```
ordence.com
```

Leave the path blank so the whole console is covered.

**C4.** Click **Next** to reach policies. Create one policy:

- Policy name:

```
Ordence operators
```

- Action: **Allow**
- Under **Configure rules**, set Include → **Emails** → and enter exactly:

```
sahil@ordence.com
```

(Add any teammates' emails here later. To allow your whole company
instead, use Include → **Emails ending in** → `@ordence.com`.)

**C5.** Click **Next**, then **Add application**.

## Part D — Point the hostname at the Worker

**D1.** Back in the main Cloudflare dashboard, open your **ordence**
Worker → **Settings** → **Domains & Routes** → **Add** → **Custom
domain**, and enter:

```
admin.ordence.com
```

**D2.** Visit https://admin.ordence.com. You should be stopped by a
Cloudflare login screen *before* the Ordence UI appears. Sign in with the
email you allowed in C4.

**D3.** Confirm it actually blocks strangers: open the same URL in a
private window and try a different email address — you should be refused.

> If you see the admin console **without** being asked to log in, stop
> and re-check Part C. The application domain must be exactly
> `admin.ordence.com` with an empty path.

---

## Part E — Add the email API key (for signup notifications)

Signup requests are stored safely with or without this — email is only
the notification channel — but you'll want it.

**E1.** Create a free account at https://resend.com and verify
`ordence.com` as a sending domain (they walk you through adding a few DNS
records; since Cloudflare hosts your DNS, this is quick).

**E2.** Create an API key in Resend and copy it.

**E3.** In a terminal, from the project folder, run:

```
npx wrangler secret put RESEND_API_KEY
```

Paste the key when prompted. Deploy once more and notification emails
start flowing to sahil@ordence.com.

> Until this key exists, the system logs `RESEND_API_KEY not set — would
> have sent …` and carries on. No signup is ever lost; you'll just need
> to check **Requests** in the admin console manually.

---

## What this protects

| Surface | Protection |
|---|---|
| `admin.ordence.com` | Cloudflare Access — email-verified login at the edge |
| `ordence.com` and tenant subdomains | Public by design |
| `app.ordence.com` | Your separate CRM app's own authentication |

Because Access sits in front of the Worker, an unauthenticated request
never reaches the provisioning code — there is no application endpoint to
find, guess, or brute force.
