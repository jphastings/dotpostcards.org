import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("prerendered HTML has content but no whole email address", () => {
  const html = readFileSync("build/index.html", "utf8");
  expect(html).toContain('class="postcard');
  expect(html).toContain("Every postcard, kept whole.");
  expect(html).not.toContain("jp@dotpostcard.org");
});
test("calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Download for Mac" }).first()).toHaveAttribute(
    "href",
    "https://github.com/jphastings/postcard-collector.app/releases/latest/download/Postcards-macOS.zip",
  );
  await expect(page.getByRole("link", { name: /See them in use/ })).toHaveAttribute(
    "href",
    "https://shutup.jp",
  );
  await expect(
    page.getByText("brew install jphastings/tools/postcards jphastings/tools/fastfoto-postcards"),
  ).toBeVisible();
  const contact = page.getByRole("link", { name: "Get in touch" });
  await contact.hover();
  await expect(contact).toHaveAttribute("href", "mailto:jp@dotpostcard.org");
});
test("fits a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
test("dark mode follows the system", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    "rgb(0, 0, 0)",
  );
});
