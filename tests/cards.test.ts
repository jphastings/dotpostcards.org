import { readdirSync } from "node:fs";
import { getCard, cm, formatDate, transcriptionLanguage, orientation, arModel } from "$lib/cards";
import { showcase } from "$lib/showcase";

test("every card file has an image extension and data", () => {
  for (const f of readdirSync("static/cards")) expect(f).toMatch(/\.postcard\.(webp|jpe?g)$/);
  for (const name of [showcase.hero, ...showcase.band, showcase.together])
    expect(getCard(name).name).toBe(name);
});
test("reads iceland as stored", () => {
  const c = getCard("iceland");
  expect(c.src).toBe("/cards/iceland.postcard.webp");
  expect(c.flip).toBe("left-hand");
  expect(orientation(c)).toBe("portrait");
  expect(formatDate(c.sentOn!)).toBe("13 January 2023");
  expect(transcriptionLanguage(c.back!)).toBe("Icelandic");
});
test("sizes read in centimetres", () => {
  expect(cm("345/32")).toBe("10.8 cm");
});
test("unknown cards fail loudly", () =>
  expect(() => getCard("nope")).toThrow("Unknown card: nope"));
test("the AR model follows the showcase card", () => {
  expect(arModel(getCard(showcase.ar))).toEqual({
    href: `https://shutup.jp/${showcase.ar}.postcard.usdz`,
    label: `View the ${getCard(showcase.ar).location!.name} postcard in AR`,
  });
});
