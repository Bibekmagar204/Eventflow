import { test, expect } from "@playwright/test"
import { acceptanceShot } from "../helpers/acceptance"

test.describe("AT-01 Home (public)", () => {
  test("landing hero and marquee area", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /Find the night/i })).toBeVisible()
    await acceptanceShot(page, "AT-01-home", "01-landing")

    const marqueeRoot = page.locator(".hero-marquee-track").first()
    await expect(marqueeRoot).toBeVisible({ timeout: 15_000 }).catch(() => {
      // No events: empty state message
      return expect(page.getByText(/New events are loading|Check back shortly/i)).toBeVisible()
    })
    await acceptanceShot(page, "AT-01-home", "02-marquee-or-empty")
  })
})
