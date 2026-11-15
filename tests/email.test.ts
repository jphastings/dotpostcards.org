import { contactHref } from "$lib/email";

test("assembles the contact address", () => {
  expect(contactHref()).toBe("mailto:jp@dotpostcard.org");
});
