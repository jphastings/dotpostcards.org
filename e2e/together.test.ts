import { test, expect, type Page } from "@playwright/test";

const section = (page: Page) => page.locator("section", { hasText: "Everything stays together." });
const tab = (page: Page, name: string) => section(page).getByRole("tab", { name });
const card = (page: Page) => section(page).locator("label.postcard");
const dims = (page: Page) => section(page).locator(".dim > :visible");
const flip = (page: Page) =>
  card(page).evaluate((el) => getComputedStyle(el).getPropertyValue("--flip"));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("the metadata column keeps its height across tabs", async ({ page }) => {
  const info = section(page).locator(".info");
  const heights = [];
  for (const name of ["Postcard", "Front", "Back"]) {
    await tab(page, name).click();
    heights.push((await info.boundingBox())!.height);
  }
  expect(new Set(heights).size).toBe(1);
});

test("the file is measured in pixels, the card in centimetres", async ({ page }) => {
  await expect(dims(page)).toHaveText(["1536 px", "2132 px"]);
  await tab(page, "Front").click();
  await expect(dims(page)).toHaveText(["14.2 cm", "9.9 cm"]);
});

test("the front faces up, the back is flipped over", async ({ page }) => {
  await tab(page, "Front").click();
  await expect.poll(() => flip(page)).toBe("0deg");
  await tab(page, "Back").click();
  await expect.poll(() => flip(page)).toBe("180deg");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("choosing the front shows the card at once", async ({ page }) => {
    await tab(page, "Front").click();
    expect(await card(page).evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
  });
});
