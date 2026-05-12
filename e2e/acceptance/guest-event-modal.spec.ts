import { test, expect } from "@playwright/test"
import { acceptanceShot } from "../helpers/acceptance"

test.describe("AT-03 Guest event modal (home)", () => {
  test("open event overlay from marquee", async ({ page }) => {
    await page.goto("/")
    await page.addStyleTag({ content: ".hero-marquee-track { animation: none !important; }" })
    const cards = page.locator(".hero-marquee-track a")
    const n = await cards.count()
    test.skip(n === 0, "No events in marquee — seed a published event or run global setup")

    await cards.first().click({ force: true })

    await expect(page.getByRole("button", { name: "✕" })).toBeVisible()
    await acceptanceShot(page, "AT-03-guest-modal", "01-event-overlay")

    await expect(page.getByRole("link", { name: /Sign in/i }).first()).toBeVisible()
    await acceptanceShot(page, "AT-03-guest-modal", "02-sign-in-cta")
  })
})
