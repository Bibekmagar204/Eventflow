import type { Page } from "@playwright/test"
import fs from "fs"
import path from "path"

export async function acceptanceShot(page: Page, testcaseId: string, stepId: string) {
  const dir = path.join(process.cwd(), "test-results", "acceptance", testcaseId)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${stepId}.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}
