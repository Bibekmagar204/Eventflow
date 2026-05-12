/** Mirrors defaults in e2e/global-setup.ts and env overrides. */
export const E2E_ATTENDEE_EMAIL =
  process.env.E2E_ATTENDEE_EMAIL ?? "e2e-attendee@eventflow.test"
export const E2E_ORGANISER_EMAIL =
  process.env.E2E_ORGANISER_EMAIL ?? "e2e-organiser@eventflow.test"
export const E2E_STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? "e2e-staff@eventflow.test"
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "TestPassword12345!"
export const E2E_EVENT_TITLE =
  process.env.E2E_EVENT_TITLE ?? "E2E Acceptance Event"
