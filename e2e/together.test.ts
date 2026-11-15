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

// Seeks every running animation and transition to each time, sampling the card and the file's halves
const samplesAt = (page: Page, times: number[]) =>
  section(page).evaluate((el, times) => {
    const style = getComputedStyle(el.querySelector("label.postcard")!);
    const height = (half: string) => el.querySelector(half)!.getBoundingClientRect().height;
    const animations = document.getAnimations();
    return times.map((ms) => {
      for (const a of animations) {
        a.pause();
        a.currentTime = ms;
      }
      return {
        flip: parseFloat(style.getPropertyValue("--flip")),
        cardShown: style.visibility === "visible",
        front: height(".front-half"),
        back: height(".back-half"),
      };
    });
  }, times);
const midFold = [250, 500, 750];

test("from the file, the back is reached by folding the front away behind it", async ({ page }) => {
  await tab(page, "Back").click();
  const samples = await samplesAt(page, [...midFold, 1050]);
  expect(samples.map((s) => s.flip)).toEqual([180, 180, 180, 180]);
  expect(samples.map((s) => s.cardShown)).toEqual([false, false, false, true]);
  for (const { front, back } of samples.slice(0, 3)) expect(front).toBeLessThan(back);
});

test("from the back, the file is reached by unfolding the front from behind it", async ({
  page,
}) => {
  await tab(page, "Back").click();
  await expect.poll(async () => (await samplesAt(page, [1050]))[0].cardShown).toBe(true);
  await tab(page, "Postcard").click();
  const samples = await samplesAt(page, [...midFold, 1050]);
  expect(samples.map((s) => s.cardShown)).toEqual([false, false, false, false]);
  for (const { flip } of samples) expect([0, 180]).toContain(flip);
  for (const { front, back } of samples.slice(0, 3)) expect(front).toBeLessThan(back);
  expect(samples[3].front).toBe(samples[3].back);
});

test("between front and back, the card turns over in view", async ({ page }) => {
  await tab(page, "Front").click();
  await expect.poll(async () => (await samplesAt(page, [1050]))[0].cardShown).toBe(true);
  await tab(page, "Back").click();
  const [{ flip, cardShown }] = await samplesAt(page, [500]);
  expect(cardShown).toBe(true);
  expect(flip).toBeGreaterThan(0);
  expect(flip).toBeLessThan(180);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("choosing the front shows the card at once", async ({ page }) => {
    await tab(page, "Front").click();
    expect(await card(page).evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
  });
});
