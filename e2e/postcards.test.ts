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
  await expect.poll(() => flip(tapCard(page))).toBe("180deg");
});

test("a spinning card keeps turning", async ({ page }) => {
  const before = await flip(spinCard(page));
  await page.waitForTimeout(500);
  expect(await flip(spinCard(page))).not.toBe(before);
});

test("keyboard focus lands on a card's checkbox and outlines that card", async ({ page }) => {
  const box = page.locator("input:has(+ label.postcard:not(.spin))").first();
  const isFocused = () => box.evaluate((el) => el === document.activeElement);
  for (let tabs = 0; tabs < 100 && !(await isFocused()); tabs++) await page.keyboard.press("Tab");
  await expect(box).toBeFocused();
  const label = box.locator("+ label");
  expect(await label.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a spinning card holds still and a click flips it", async ({ page }) => {
    const before = await flip(spinCard(page));
    await page.waitForTimeout(500);
    expect(await flip(spinCard(page))).toBe(before);
    await spinCard(page).click();
    await expect.poll(() => flip(spinCard(page))).toBe("180deg");
  });
});
