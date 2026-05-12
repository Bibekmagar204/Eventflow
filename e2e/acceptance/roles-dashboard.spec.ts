import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { acceptanceShot } from "../helpers/acceptance"
import {
  E2E_ORGANISER_EMAIL,
  E2E_STAFF_EMAIL,
  E2E_USER_PASSWORD,
} from "../constants"

async function loginAs(page: Page, email: string) {
  await page.goto("/login")
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: /Sign in/i }).click()
}

test.describe("AT-05 Role dashboards", () => {
  test("organiser dashboard", async ({ page }) => {
    await loginAs(page, E2E_ORGANISER_EMAIL)
    await page.waitForURL(/\/organiser\/dashboard/, { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20_000 })
    await acceptanceShot(page, "AT-05-dashboards", "01-organiser")
  })

  test("staff scan page", async ({ page }) => {
    await loginAs(page, E2E_STAFF_EMAIL)
    await page.waitForURL(/\/staff\/scan/, { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Ticket Scanner" })).toBeVisible({ timeout: 20_000 })
    await acceptanceShot(page, "AT-05-dashboards", "02-staff-scan")
  })
})
