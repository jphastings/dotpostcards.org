import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("prerendered HTML has content but no whole email address", () => {
  const html = readFileSync("build/index.html", "utf8");
  expect(html).toContain('class="postcard');
  expect(html).toContain("The open digital postcard format");
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
  await expect(page.getByText("brew install jphastings/tools/fastfoto-postcards")).toBeVisible();
  await expect(
    page
      .locator("section", { hasText: "For developers." })
      .getByText("brew install jphastings/tools/postcards"),
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
test("copy falls back to selecting the command when the clipboard refuses", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error("denied"));
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Copy" }).first().click();
  await expect(page.getByRole("button", { name: "Press ⌘C" })).toBeVisible();
  expect(await page.evaluate(() => getSelection()?.toString())).toBe(
    "brew install jphastings/tools/fastfoto-postcards",
  );
});
test("shows a scanning session in a terminal", async ({ page }) => {
  await page.goto("/");
  const terminal = page.locator("pre", { hasText: "$ fastfoto-postcards" });
  for (const line of [
    "$ fastfoto-postcards --quality detail --format postcard --llm claude-code",
    "⚙︎ Scanning postcards into postcard format…",
    "⊕ Postcard scanned, analysing with your LLM…",
    "✓ london-sights scanned",
    "  ↳ Postcard (2.3MB)",
  ])
    expect(await terminal.textContent()).toContain(line);
});
test("says why this scanner, and what an LLM can help with", async ({ page }) => {
  await page.goto("/");
  const make = page.locator("section", { hasText: "Ridiculously easy to make." });
  await expect(make.getByText("Why this machine? Because I have one!")).toBeVisible();
  await expect(make.getByText("Want to automate it all? Use an LLM to help with:")).toBeVisible();
  await expect(make.getByRole("listitem")).toHaveText([
    "alt-text/descriptions",
    "orientation",
    "handwriting transcription",
    "location",
    "dates",
  ]);
});
