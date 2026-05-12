import { test, expect } from "@playwright/test"
import { acceptanceShot } from "../helpers/acceptance"

test.describe("AT-02 Auth pages (unauthenticated)", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /Sign in to EventFlow/i })).toBeVisible()
    await acceptanceShot(page, "AT-02-auth", "01-login")
  })

  test("register page", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible()
    await acceptanceShot(page, "AT-02-auth", "02-register")
  })
})
