# Eventflow

## Stripe one-time checkout setup

1. Add Stripe values to your local `.env`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
2. Start the app:
   - `npm run dev`
3. In another terminal, forward Stripe events to the webhook route:
   - `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the signing secret printed by Stripe CLI and set it as `STRIPE_WEBHOOK_SECRET`.

Checkout now uses Stripe Elements for one-time attendee purchases and only issues tickets after payment is confirmed.
