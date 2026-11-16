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
  const [france, assisi, china] = await bandFlipsAt(page, 500);
  expect(france).toBeGreaterThan(0);
  expect([assisi, china]).toEqual([0, 0]);
  expect((await bandFlipsAt(page, 1750))[1]).toBeGreaterThan(0);
  expect((await bandFlipsAt(page, 3000))[2]).toBeGreaterThan(0);
  expect(await bandFlipsAt(page, 4500)).toEqual([180, 180, 180]);
  expect(await bandFlipsAt(page, 10000)).toEqual([0, 0, 0]);
});

for (const width of [390, 1440]) {
  test(`at ${width}px the band's cards share one row`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const middles = await bandCards(page).evaluateAll((cards) =>
      cards.map((el) => {
        const { top, height } = el.getBoundingClientRect();
        return top + height / 2;
      }),
    );
    expect(Math.max(...middles) - Math.min(...middles)).toBeLessThan(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test("each band card marks its flip axis across the square around it", async ({ page }) => {
  // CSS turns clockwise: -45deg runs bottom-left to top-right
  const axes: Record<string, string> = {
    "left-hand": "-45deg",
    "right-hand": "45deg",
    book: "90deg",
  };
  await bandFlipsAt(page, 10000);
  for (const card of await bandCards(page).all()) {
    const flip = (await card.getAttribute("class"))!.match(/flip-(\S+)/)![1];
    const line = card.locator(".axis span");
    expect(await line.evaluate((el) => getComputedStyle(el).rotate)).toBe(axes[flip]);
    const [l, c] = [(await line.boundingBox())!, (await card.boundingBox())!];
    const side = Math.max(c.width, c.height);
    expect(l.height).toBeCloseTo(side, -1);
    expect(l.y + l.height / 2).toBeCloseTo(c.y + c.height / 2, 0);
    expect(l.x + l.width / 2).toBeCloseTo(c.x + c.width / 2, 0);
    if (flip !== "book") expect(l.width).toBeCloseTo(side, -1);
  }
});

test("the axis line hides behind its card", async ({ page }) => {
  await bandCards(page).first().scrollIntoViewIfNeeded();
  for (const ms of [10000, 250, 1500, 2750]) {
    await bandFlipsAt(page, ms);
    for (const card of await bandCards(page).all()) {
      const c = (await card.boundingBox())!;
      const middle = { x: c.x + c.width / 2 - 8, y: c.y + c.height / 2 - 8, width: 16, height: 16 };
      const shown = await page.screenshot({ clip: middle });
      await card.locator(".axis").evaluate((el) => (el.style.visibility = "hidden"));
      expect(await page.screenshot({ clip: middle }), `at ${ms}ms`).toEqual(shown);
      await card.locator(".axis").evaluate((el) => (el.style.visibility = ""));
    }
  }
});

test("band cards show the default cursor, since a click doesn't flip them", async ({ page }) => {
  expect(
    await bandCards(page).evaluateAll((cards) => cards.map((el) => getComputedStyle(el).cursor)),
  ).toEqual(["default", "default", "default"]);
});

test("no two band cards are mid-turn at once", async ({ page }) => {
  for (let ms = 0; ms < 11000; ms += 125) {
    const turning = (await bandFlipsAt(page, ms)).filter((deg) => deg !== 0 && deg !== 180);
    expect(turning.length, `at ${ms}ms`).toBeLessThanOrEqual(1);
  }
});

// Stopgap for WebKit re-fetching images through the library's shared var(--postcard) (see Postcard.svelte)
test("every card draws its faces and shadow from its own literal url()", async ({ page }) => {
  const missing = await page.locator("label.postcard").evaluateAll((labels) => {
    const rules = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
    return labels.flatMap((label) => {
      const url = label.getAttribute("style")!.match(/url\('([^']+)'\)/)![1];
      const literal = (part: string, faces: boolean) =>
        rules.some(
          ({ selectorText, style }) =>
            selectorText.endsWith(part) &&
            label.matches(selectorText.slice(0, -part.length)) &&
            style.maskImage.includes(url) &&
            (!faces || style.backgroundImage.includes(url)),
        );
      const parts: [string, boolean][] = [[" .shadow::before", false]];
      if (!label.classList.contains("flip-none")) parts.push(["::after", true], ["::before", true]);
      return parts.filter(([part, faces]) => !literal(part, faces)).map(([part]) => url + part);
    });
  });
  expect(missing).toEqual([]);
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

  test("band cards show a pointer, since a click flips them", async ({ page }) => {
    expect(
      await bandCards(page).evaluateAll((cards) => cards.map((el) => getComputedStyle(el).cursor)),
    ).toEqual(["pointer", "pointer", "pointer"]);
  });

  test("a band card's checkbox takes keyboard focus", async ({ page }) => {
    const box = page.locator("input:has(+ label.postcard.sequence)").first();
    await box.focus();
    await expect(box).toBeFocused();
  });
});
