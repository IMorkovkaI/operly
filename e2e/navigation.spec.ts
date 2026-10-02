import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 640 }, isMobile: true, hasTouch: true });

test("mobile menus and Help respond to touch after hydration", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("websocket", socket => socket.on("socketerror", error => errors.push(String(error))));
  await page.goto("/");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  const landingMenu = page.getByRole("button", { name: "Toggle navigation" });
  await landingMenu.tap();
  await expect(landingMenu).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation").getByRole("link", { name: "FAQs", exact: true }).tap();
  await expect(landingMenu).toHaveAttribute("aria-expanded", "false");

  await page.goto("/workspace");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  const menu = page.getByRole("button", { name: "Open navigation", exact: true });
  for (let visit = 0; visit < 2; visit++) {
    await menu.tap();
    await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
    await page.getByRole("button", { name: "Help & getting started", exact: true }).tap();
    await expect(page.getByRole("dialog")).toHaveAccessibleName("Help & getting started");
    await page.getByRole("button", { name: "Close dialog", exact: true }).tap();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(menu).toBeFocused();
  }
  expect(errors).toEqual([]);
});
