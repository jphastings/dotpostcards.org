import { test, expect, type Locator, type Page } from "@playwright/test";

const tapCard = (page: Page) => page.locator("label.postcard:not(.spin)").first();
const spinCard = (page: Page) => page.locator("label.postcard.spin").first();
const flip = (card: Locator) =>
  card.evaluate((el) => getComputedStyle(el).getPropertyValue("--flip"));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("a click flips a tap card", async ({ page }) => {
  await tapCard(page).click();
  await page.waitForTimeout(1200);
  expect(await flip(tapCard(page))).toBe("180deg");
});

test("a spinning card keeps turning", async ({ page }) => {
  const before = await flip(spinCard(page));
  await page.waitForTimeout(500);
  expect(await flip(spinCard(page))).not.toBe(before);
});

test("keyboard focus lands on the checkbox and outlines the card", async ({ page }) => {
  await page.keyboard.press("Tab");
  const box = page.getByRole("checkbox", { name: "Flip postcard" }).first();
  await expect(box).toBeFocused();
  const outline = await tapCard(page).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a spinning card holds still and a click flips it", async ({ page }) => {
    const before = await flip(spinCard(page));
    await page.waitForTimeout(500);
    expect(await flip(spinCard(page))).toBe(before);
    await spinCard(page).click();
    await page.waitForTimeout(1200);
    expect(await flip(spinCard(page))).toBe("180deg");
  });
});
