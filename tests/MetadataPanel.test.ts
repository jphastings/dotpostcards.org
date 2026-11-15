import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import MetadataPanel from "$lib/MetadataPanel.svelte";
import { getCard, type Card } from "$lib/cards";

test("shows iceland as stored, front first", () => {
  render(MetadataPanel, { card: getCard("iceland") });
  for (const v of [
    "Reykjavík, Iceland",
    "13 January 2023",
    "Claire",
    "JP",
    "Left-hand",
    "10.8 cm",
    "15.2 cm",
  ])
    expect(screen.getAllByText(v).length).toBeGreaterThan(0);
  expect(screen.getByText(/fiendishly grinning/)).toBeVisible();
  expect(screen.queryByText("“Haltu Kjafti, JP”")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});
test("flipping shows the back: transcription and anonymised region", async () => {
  const { container } = render(MetadataPanel, { card: getCard("iceland") });
  await userEvent.click(screen.getByRole("checkbox", { name: /^Flip/ }));
  expect(screen.getByText("“Haltu Kjafti, JP”")).toBeInTheDocument();
  expect(screen.getByText("(Icelandic)")).toBeInTheDocument();
  expect(screen.getByText("Anonymised regions (eg. for an address)")).toBeInTheDocument();
  expect(container.querySelectorAll("polygon")).toHaveLength(1);
});
test("omits what a card does not store", () => {
  const sparse: Card = {
    ...getCard("athens"),
    sentOn: undefined,
    sender: undefined,
    recipient: undefined,
    back: undefined,
  };
  render(MetadataPanel, { card: sparse });
  for (const label of ["Sent on", "From", "To"]) expect(screen.queryByText(label)).toBeNull();
  expect(document.body.textContent).not.toMatch(/undefined/);
});
test.each([
  ["china", [150, 240], [240, 150]],
  ["athens", [240, 165.6], [240, 165.6]],
])("%s overlays register on the drawn card", (name, front, back) => {
  const { container } = render(MetadataPanel, { card: getCard(name) });
  const [frontBox, backBox] = [...container.querySelectorAll<HTMLElement>(".overlay")].map((el) => [
    parseFloat(el.style.width),
    parseFloat(el.style.height),
  ]);
  expect(frontBox[0]).toBeCloseTo(front[0], 0);
  expect(frontBox[1]).toBeCloseTo(front[1], 0);
  expect(backBox[0]).toBeCloseTo(back[0], 0);
  expect(backBox[1]).toBeCloseTo(back[1], 0);
});
test("a card that does not flip never shows its back", async () => {
  const card = getCard("iceland");
  render(MetadataPanel, { card: { ...card, flip: "none" } });
  await userEvent.click(screen.getByRole("checkbox", { name: /^Flip/ }));
  expect(screen.queryByText("“Haltu Kjafti, JP”")).toBeNull();
});
