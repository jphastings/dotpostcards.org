import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import MetadataPanel from "$lib/MetadataPanel.svelte";
import { getCard } from "$lib/cards";

const panel = () => screen.getByRole("tabpanel");
const selected = () => screen.getByRole("tab", { selected: true });

test("starts on the postcard as stored, inventing nothing", () => {
  render(MetadataPanel, { card: getCard("around-we-go") });
  expect(selected()).toHaveTextContent("Postcard");
  for (const v of ["Calendar", "14.2 cm × 9.9 cm", "around-we-go.postcard.webp"])
    expect(within(panel()).getByText(v)).toBeVisible();
  for (const label of ["Location", "Sent on", "From", "To"])
    expect(within(panel()).queryByText(label)).toBeNull();
  expect(document.body.textContent).not.toMatch(/undefined/);
});

test("each side's tab shows what is stored about that side, or says there is nothing", async () => {
  render(MetadataPanel, { card: getCard("around-we-go") });
  await userEvent.click(screen.getByRole("tab", { name: "Front" }));
  expect(within(panel()).getByText(/Around We Go!/)).toBeVisible();
  await userEvent.click(screen.getByRole("tab", { name: "Back" }));
  expect(within(panel()).getByText("Nothing stored about this side.")).toBeVisible();
});

test("the back tab shows a transcription with its language, and anonymised regions", async () => {
  render(MetadataPanel, { card: getCard("iceland") });
  await userEvent.click(screen.getByRole("tab", { name: "Back" }));
  expect(within(panel()).getByText(/Haltu Kjafti, JP/)).toBeVisible();
  expect(within(panel()).getByText("(Icelandic)")).toBeVisible();
  expect(within(panel()).getByText("Anonymised regions (eg. for an address)")).toBeVisible();
  const term = within(panel()).getByText("Anonymised");
  expect(term.lastElementChild).toHaveClass("swatch");
  expect(term.firstChild?.textContent?.trim()).toBe("Anonymised");
});

test("arrow keys move between tabs", async () => {
  render(MetadataPanel, { card: getCard("around-we-go") });
  selected().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(selected()).toHaveTextContent("Front");
  expect(selected()).toHaveFocus();
  await userEvent.keyboard("{End}");
  expect(selected()).toHaveTextContent("Back");
  await userEvent.keyboard("{ArrowRight}");
  expect(selected()).toHaveTextContent("Postcard");
});

test("clicking the card steps through file, front and back", async () => {
  const card = getCard("around-we-go");
  render(MetadataPanel, { card });
  await userEvent.click(screen.getByRole("img", { name: /around-we-go\.postcard\.webp/ }));
  expect(selected()).toHaveTextContent("Front");
  await userEvent.click(screen.getByRole("img", { name: card.front.description }));
  expect(selected()).toHaveTextContent("Back");
  await userEvent.click(screen.getByRole("img", { name: card.front.description }));
  expect(selected()).toHaveTextContent("Postcard");
});
