# Parked surfaces

Folders whose name starts with `_` are **private** in the Next.js App
Router: they are excluded from routing entirely, and because nothing in
the live route tree imports them they never enter the build graph. The
code below ships in the repository but not in the deployed Worker.

## `admin/` — internal operations console

Parked on request until the admin surface is wanted. It contains the
Tenant Command Grid (provision / rebrand / suspend), the platform health
observatory and the lead inbox.

**Before un-parking it, authentication is mandatory.** These pages call
server actions that create and suspend tenants with no access control —
they were only ever safe while the hostname was private. See
`BLUEPRINT.md` §Authentication for the recommended edge-compatible
session design.

To restore:

1. `git mv src/app/_parked/admin src/app/admin`
2. In `src/middleware.ts`, change the `case "admin"` branch back to
   `rewrite('/admin' + path)` instead of returning a 404.
3. Add authentication in front of it before pointing DNS at it.

## `app/` — signed-in workspace placeholder

Superseded: `app.ordence.com` is served by the separate CRM application,
not by this marketing Worker. Kept only as a reference for the shell
layout. This repository deliberately does **not** serve that hostname —
see the routing note in `DEPLOYMENT.md`.
