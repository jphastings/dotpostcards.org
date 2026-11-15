import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import Postcard from "$lib/Postcard.svelte";
import { getCard } from "$lib/cards";

test("describes the card and flips from the keyboard", async () => {
  const card = getCard("iceland");
  render(Postcard, { card });
  expect(screen.getByRole("img", { name: card.front.description })).toBeInTheDocument();
  const box = screen.getByRole("checkbox", { name: "Flip postcard" });
  box.focus();
  await userEvent.keyboard(" ");
  expect(box).toBeChecked();
});
test("uses the library markup", () => {
  const { container } = render(Postcard, { card: getCard("iceland") });
  const label = container.querySelector("label.postcard.flip-left-hand.portrait") as HTMLElement;
  expect(label.getAttribute("style")).toContain("url('/cards/iceland.postcard.webp')");
  expect(label.getAttribute("style")).toContain("--aspect-ratio: 1091 / 1536");
  expect(container.querySelector("input")!.id).toMatch(/^postcard-/);
});
