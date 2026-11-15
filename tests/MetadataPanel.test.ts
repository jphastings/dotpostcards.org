import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import MetadataPanel from "$lib/MetadataPanel.svelte";
import { getCard, type Card } from "$lib/cards";

test("shows iceland as stored, front first", () => {
  render(MetadataPanel, { card: getCard("iceland") });
  for (const v of ["Reykjavík, Iceland", "13 January 2023", "Claire", "JP", "Left-hand", "10.8 cm", "15.2 cm"])
    expect(screen.getAllByText(v).length).toBeGreaterThan(0);
  expect(screen.getByText(/fiendishly grinning/)).toBeVisible();
  expect(screen.queryByText("“Haltu Kjafti, JP”")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});
test("flipping shows the back: transcription and anonymised region", async () => {
  const { container } = render(MetadataPanel, { card: getCard("iceland") });
  await userEvent.click(screen.getByRole("checkbox", { name: "Flip postcard" }));
  expect(screen.getByText("“Haltu Kjafti, JP”")).toBeInTheDocument();
  expect(screen.getByText("(Icelandic)")).toBeInTheDocument();
  expect(screen.getByText("Anonymised regions (eg. for an address)")).toBeInTheDocument();
  expect(container.querySelectorAll("polygon")).toHaveLength(1);
});
test("omits what a card does not store", () => {
  const sparse: Card = { ...getCard("athens"), sentOn: undefined, sender: undefined, recipient: undefined, back: undefined };
  render(MetadataPanel, { card: sparse });
  for (const label of ["Sent on", "From", "To"]) expect(screen.queryByText(label)).toBeNull();
  expect(document.body.textContent).not.toMatch(/undefined/);
});
