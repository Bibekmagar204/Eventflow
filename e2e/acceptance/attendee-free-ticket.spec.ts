import { test, expect } from "@playwright/test"
import { acceptanceShot } from "../helpers/acceptance"
import { E2E_ATTENDEE_EMAIL, E2E_EVENT_TITLE, E2E_USER_PASSWORD } from "../constants"

test.describe("AT-04 Attendee free checkout", () => {
  test.describe.configure({ mode: "serial" })
  test.setTimeout(120_000)

  test("login and claim free ticket from attendee events", async ({ page }) => {
    await page.goto("/login")
    await page.locator('input[type="email"]').fill(E2E_ATTENDEE_EMAIL)
    await page.locator('input[type="password"]').fill(E2E_USER_PASSWORD)
    await acceptanceShot(page, "AT-04-attendee-checkout", "01-login-filled")
    await page.getByRole("button", { name: /Sign in/i }).click()
    await page.waitForURL(/\/attendee\/events/, { timeout: 30_000 })
    await acceptanceShot(page, "AT-04-attendee-checkout", "02-attendee-events")

    const eventLink = page.getByRole("link", { name: new RegExp(E2E_EVENT_TITLE, "i") }).first()
    await expect(eventLink).toBeVisible({ timeout: 20_000 })
    await eventLink.click()

    await expect(
      page.getByRole("heading", { name: new RegExp(E2E_EVENT_TITLE, "i") }).last()
    ).toBeVisible({
      timeout: 15_000,
    })
    await acceptanceShot(page, "AT-04-attendee-checkout", "03-event-detail-modal")

    await page.getByRole("button", { name: /Buy Ticket/i }).click()
    await expect(page.getByRole("heading", { name: /Confirm Your Ticket/i })).toBeVisible()
    await acceptanceShot(page, "AT-04-attendee-checkout", "04-purchase-panel")

    await page.getByRole("button", { name: /Claim Free Ticket/i }).click()
    await expect(page.getByText(/Your ticket has been confirmed/i)).toBeVisible({
      timeout: 45_000,
    })
    await acceptanceShot(page, "AT-04-attendee-checkout", "05-success")

    await page.getByRole("button", { name: /View My Ticket/i }).click()
    await expect(page.getByText("✓ Valid")).toBeVisible({ timeout: 25_000 })
    await expect(page.locator("h2").filter({ hasText: E2E_EVENT_TITLE }).last()).toBeVisible()
    await acceptanceShot(page, "AT-04-attendee-checkout", "06-ticket-detail-modal")
  })
})
