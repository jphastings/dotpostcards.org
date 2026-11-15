import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("serves the atproto DID for dotpostcard.org", async ({ request }) => {
  const res = await request.get("/.well-known/atproto-did");
  expect((await res.text()).trim()).toBe("did:web:dotpostcard.org");
  expect((await request.get("/.well-known/did.json")).ok()).toBe(true);
});

test("ships Pages files in the build", () => {
  expect(readFileSync("build/CNAME", "utf8").trim()).toBe("dotpostcard.org");
  expect(() => readFileSync("build/.nojekyll")).not.toThrow();
});
