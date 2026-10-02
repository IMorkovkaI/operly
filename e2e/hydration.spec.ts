import { expect, test } from "@playwright/test";

// The browser must hydrate correctly even when its time zone differs from the server.
test.use({ timezoneId: "America/New_York" });

test("server markup hydrates without errors on repeat visits", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(`${page.url()}: ${error.message}`));
  for (const route of ["/", "/workspace", "/projects", "/workspace"]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
    if (route === "/workspace") await expect(page.getByRole("button", { name: "New project" })).toBeEnabled();
  }
  expect(errors).toEqual([]);
});
