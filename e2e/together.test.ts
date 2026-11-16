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

// Seeks the running animations and transitions (every one, or just the card's) to each time,
// sampling the card, the file's halves and the measurements
const samplesAt = (page: Page, times: number[], cardOnly = false) =>
  section(page).evaluate(
    (el, [times, cardOnly]) => {
      const label = el.querySelector("label.postcard")!;
      const style = getComputedStyle(label);
      const height = (selector: string) =>
        el.querySelector(selector)!.getBoundingClientRect().height;
      const animations = cardOnly ? label.getAnimations() : document.getAnimations();
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
          toBack: el.querySelector(".figure")!.classList.contains("to-back"),
          measure: height(".measure"),
          card: height("label.postcard"),
        };
      });
    },
    [times, cardOnly] as const,
  );
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

for (const [first, then] of [
  ["Back", "Front"],
  ["Front", "Back"],
] as const)
  test(`picking the ${then.toLowerCase()} while folding to the ${first.toLowerCase()} finishes the fold, then turns the card over`, async ({
    page,
  }) => {
    await tab(page, first).click();
    await samplesAt(page, [400]);
    await tab(page, then).click();
    await expect(tab(page, then)).toHaveAttribute("aria-selected", "true");

    const folding = await samplesAt(page, [400, 700, 1050]);
    expect(folding.map((s) => s.toBack)).toEqual(Array(3).fill(first === "Back"));
    const firstFlip = first === "Back" ? 180 : 0;
    expect(folding.map((s) => s.flip)).toEqual(Array(3).fill(firstFlip));
    const { front, back } = folding[1];
    expect(first === "Back" ? front < back : back < front).toBe(true);

    await expect.poll(() => card(page).evaluate((el) => el.getAnimations().length)).toBe(1);
    const [turning, landed] = await samplesAt(page, [500, 1050], true);
    expect(turning.flip).toBeGreaterThan(0);
    expect(turning.flip).toBeLessThan(180);
    expect(landed.flip).toBe(180 - firstFlip);
    expect(landed.toBack).toBe(then === "Back");
    expect(landed.measure).toBeCloseTo(landed.card, 0);
  });

// Finishes the section's animations, then measures the stage, the card, and the tabs' offset in it
const settledLayout = (page: Page) =>
  section(page).evaluate((el) => {
    for (const a of el.getAnimations({ subtree: true })) a.finish();
    const box = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
    return {
      stage: box(".stage").height,
      card: box("label.postcard").height,
      tabs: box("[role=tablist]").top - box(".stage").top,
    };
  });
const gutter = 28;

test("on a wide screen, the stage keeps its height across tabs", async ({ page }) => {
  const heights = [];
  for (const name of ["Postcard", "Front", "Back", "Postcard"]) {
    await tab(page, name).click();
    heights.push((await settledLayout(page)).stage);
  }
  expect(new Set(heights).size).toBe(1);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the stage shrinks to the folded card, bringing the tabs up under it", async ({ page }) => {
    const file = await settledLayout(page);
    expect(file.stage).toBeCloseTo(2 * file.card + gutter, 0);
    for (const name of ["Front", "Back"]) {
      await tab(page, name).click();
      const folded = await settledLayout(page);
      expect(folded.stage).toBeCloseTo(folded.card + gutter, 0);
      expect(file.tabs - folded.tabs).toBeCloseTo(folded.card, 0);
    }
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("choosing the front shows the card at once", async ({ page }) => {
    await tab(page, "Front").click();
    expect(await card(page).evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
  });
});
