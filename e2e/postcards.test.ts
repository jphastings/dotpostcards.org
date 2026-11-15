import { test, expect, type Locator, type Page } from "@playwright/test";

const tapCard = (page: Page) => page.locator("label.postcard:not(.sequence)").first();
const bandCards = (page: Page) => page.locator("label.postcard.sequence");
const flip = (card: Locator) =>
  card.evaluate((el) => getComputedStyle(el).getPropertyValue("--flip"));
const bandFlipsAt = (page: Page, ms: number) =>
  bandCards(page).evaluateAll((cards, ms) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = ms;
    }
    return cards.map((el) => parseFloat(getComputedStyle(el).getPropertyValue("--flip")));
  }, ms);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("a click flips a tap card", async ({ page }) => {
  await tapCard(page).click();
  await expect.poll(() => flip(tapCard(page))).toBe("180deg");
});

test("the band flips one card after another, then holds still", async ({ page }) => {
  const [france, assisi, china] = await bandFlipsAt(page, 600);
  expect(france).toBeGreaterThan(assisi);
  expect(assisi).toBeGreaterThan(china);
  expect(await bandFlipsAt(page, 2500)).toEqual([180, 180, 180]);
});

test("keyboard focus lands on a card's checkbox and outlines that card", async ({ page }) => {
  const box = page.locator("input:has(+ label.postcard:not(.sequence))").first();
  const isFocused = () => box.evaluate((el) => el === document.activeElement);
  for (let tabs = 0; tabs < 100 && !(await isFocused()); tabs++) await page.keyboard.press("Tab");
  await expect(box).toBeFocused();
  const label = box.locator("+ label");
  expect(await label.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
});

test("a looping band card is not a tab stop", async ({ page }) => {
  const box = page.locator("input:has(+ label.postcard.sequence)").first();
  await box.focus();
  await expect(box).not.toBeFocused();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the band holds still and a click flips a card", async ({ page }) => {
    const band = bandCards(page);
    await expect(band).toHaveCount(3);
    expect(await band.evaluateAll((cards) => cards.flatMap((el) => el.getAnimations()))).toEqual(
      [],
    );
    await band.first().click();
    await expect.poll(() => flip(band.first())).toBe("180deg");
  });

  test("a band card's checkbox takes keyboard focus", async ({ page }) => {
    const box = page.locator("input:has(+ label.postcard.sequence)").first();
    await box.focus();
    await expect(box).toBeFocused();
  });
});
