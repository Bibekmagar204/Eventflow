# Acceptance tests (E2E)

End-to-end acceptance tests use [Playwright](https://playwright.dev/). Each scenario captures **full-page screenshots** under `test-results/acceptance/<testcase-id>/` for coursework documentation (windows, modals, overlays).

## Prerequisites

1. **PostgreSQL** reachable via `DATABASE_URL` (and `DIRECT_URL` if you use Supabase-style pooling).
2. **App secrets** in `.env`, `.env.local`, or `.env.test` (same as local dev): `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, database URLs.
3. **Stripe publishable key** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). The attendee checkout UI wraps Stripe Elements; without it the purchase button does not render. Use a **test** publishable key (`pk_test_...`) for automated runs.
4. **Server Stripe secret** (`STRIPE_SECRET_KEY`) — required only for **paid** events; the seeded E2E event uses **price 0** (free ticket).

## Seed data (global setup)

On `npm run test:e2e`, Playwright runs `e2e/global-setup.ts`, which upserts:

| Role      | Default email                     |
|----------|------------------------------------|
| Organiser | `e2e-organiser@eventflow.test`    |
| Attendee  | `e2e-attendee@eventflow.test`     |
| Staff     | `e2e-staff@eventflow.test`        |

Password (all): `TestPassword12345!` unless overridden by `E2E_USER_PASSWORD`.

A **published** event titled **E2E Acceptance Event** (free, future date, with GA seats) is created for the organiser when missing.

To skip seeding (e.g. you manage data yourself): `E2E_SKIP_GLOBAL_SETUP=1`.

## Running tests

```bash
npm run test:e2e
```

- HTML report: `npx playwright show-report`
- UI mode: `npm run test:e2e:ui`
- Headed browser: `npm run test:e2e:headed`

Override base URL (optional):

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

## Test case map (screenshots)

| ID | Spec file | Description |
|----|-----------|-------------|
| AT-01 | `e2e/acceptance/home.spec.ts` | Home landing and marquee |
| AT-02 | `e2e/acceptance/auth-public.spec.ts` | Login and register pages |
| AT-03 | `e2e/acceptance/guest-event-modal.spec.ts` | Guest opens event modal from home (requires at least one published event) |
| AT-04 | `e2e/acceptance/attendee-free-ticket.spec.ts` | Attendee login, open event, **Claim Free Ticket**, ticket detail modal |
| AT-05 | `e2e/acceptance/roles-dashboard.spec.ts` | Organiser dashboard and staff scanner |

Screenshots are written to `test-results/acceptance/<AT-xx-...>/NN-step.png`.

## Course submission tips

1. Run the suite once with a clean DB (or after global setup).
2. Zip **folder** `test-results/acceptance/` plus the Playwright HTML report, or paste screenshots into your document.
3. In your write-up, reference each **acceptance testcase ID** (AT-01 …) and the matching PNG filenames.

