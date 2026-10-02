import { expect, test, type Page } from "@playwright/test";
import { createWorkspace } from "../lib/workspace";

async function ready(page: Page, path = "/workspace") {
  await page.goto(path);
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
}
async function help(page: Page) {
  await page.getByRole("button", { name: "Help & getting started" }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Help & getting started");
}
const guide = (page: Page) => page.locator(".guided-tour");

test("FAQ text, indicator, padding and keyboard toggle exclusive disclosures", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await ready(page, "/");
  const items = page.locator(".faq-item");
  await expect(items.first()).toHaveAttribute("open", "");
  await items.nth(1).locator("h3").click();
  await expect(items.nth(1)).toHaveAttribute("open", "");
  await expect(items.first()).not.toHaveAttribute("open");
  await items.nth(2).locator(".faq-indicator").click();
  await expect(items.nth(2).locator("p")).toBeVisible();
  await items.nth(3).locator("summary").click({ position: { x: 8, y: 8 } });
  await expect(items.nth(3)).toHaveAttribute("open", "");
  const last = items.nth(4).locator("summary");
  await last.focus();
  await page.keyboard.press("Enter");
  await expect(items.nth(4)).toHaveAttribute("open", "");
  await expect(page.locator(".faq-item[open]")).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(items.nth(4)).not.toHaveAttribute("open");
  expect(errors).toEqual([]);
});

test("FAQ works before JavaScript loads", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.locator(".faq-item").first()).toHaveAttribute("open", "");
  await page.locator("summary").nth(2).click({ position: { x: 8, y: 8 } });
  await expect(page.locator(".faq-item").nth(2).locator("p")).toBeVisible();
  await expect(page.locator(".faq-item[open]")).toHaveCount(1);
  await context.close();
});

test("demo entry, actions, Back, Finish, restart and Skip preserve saved data", async ({ page }) => {
  const workspace = createWorkspace();
  workspace.name = "My saved workspace";
  await page.addInitScript(data => localStorage.setItem("operly-workspace-v1", JSON.stringify(data)), workspace);
  await ready(page, "/");
  const before = await page.evaluate(() => localStorage.getItem("operly-workspace-v1"));
  await page.getByRole("link", { name: "Try a demo", exact: true }).click();
  await expect(guide(page)).toContainText("STEP 1 OF 3");
  await expect(page).toHaveURL(/\/workspace$/);
  await guide(page).getByRole("button", { name: "Open project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(workspace.projects[0].name);
  await page.keyboard.press("Escape");
  await expect(guide(page).getByRole("button", { name: "Open project", exact: true })).toBeFocused();
  await guide(page).getByRole("button", { name: "Next", exact: true }).click();
  await guide(page).getByRole("button", { name: "Open checklist" }).click();
  await expect(page.locator("[data-checklist-heading]")).toBeFocused();
  await page.keyboard.press("Escape");
  await guide(page).getByRole("button", { name: "Back", exact: true }).click();
  await expect(guide(page)).toContainText("STEP 1 OF 3");
  await guide(page).getByRole("button", { name: "Next", exact: true }).click();
  await guide(page).getByRole("button", { name: "Next", exact: true }).click();
  await guide(page).getByRole("button", { name: "View progress" }).click();
  await expect(page.locator("#workspace-progress")).toBeFocused();
  await guide(page).getByRole("button", { name: "Finish tour" }).click();
  await expect(guide(page)).toHaveCount(0);
  await help(page);
  await page.getByRole("button", { name: "Restart guided demo" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(guide(page)).toContainText("STEP 1 OF 3");
  await guide(page).getByRole("button", { name: "Skip", exact: true }).click();
  await expect(guide(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("operly-workspace-v1"))).toBe(before);
  await page.reload();
  await expect(guide(page)).toHaveCount(0);
});

test("demo checklist edits are explicit and empty workspaces use the creation form", async ({ page }) => {
  await ready(page, "/workspace?tour=1");
  await guide(page).getByRole("button", { name: "Next", exact: true }).click();
  await guide(page).getByRole("button", { name: "Open checklist" }).click();
  await page.getByRole("checkbox", { name: "Build responsive pages", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator(".stat").filter({ hasText: "Tasks completed" }).locator(".stat-value")).toHaveText("14");
  const workspace = createWorkspace();
  workspace.projects = [];
  await page.evaluate(data => localStorage.setItem("operly-workspace-v1", JSON.stringify(data)), workspace);
  await ready(page, "/workspace?tour=1");
  await expect(guide(page)).toContainText("Your workspace is empty");
  await guide(page).getByRole("button", { name: "Create a project" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByLabel("Project name", { exact: true }).fill("My first project");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("My first project");
  await page.keyboard.press("Escape");
  await guide(page).getByRole("button", { name: "Next", exact: true }).click();
  await guide(page).getByRole("button", { name: "Open checklist" }).click();
  await expect(page.getByRole("textbox", { name: "New task title" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("operly-workspace-v1")!).projects.length)).toBe(1);
});

test("help actions transition without stacking and restore focus on desktop and mobile", async ({ page }) => {
  await ready(page);
  await help(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Help & getting started" })).toBeFocused();
  await help(page);
  await page.getByRole("button", { name: "Create a project", exact: false }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Make room for a new project");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Help & getting started" })).toBeFocused();
  for (const [action, route] of [["Find your tasks", "/projects"], ["Manage teammates", "/team"], ["Open Settings", "/settings"]]) {
    await help(page);
    await page.getByRole("button", { name: new RegExp(action) }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset demo", exact: true })).toBeVisible();
  await help(page);
  await page.getByRole("button", { name: "Restart guided demo" }).click();
  await expect(guide(page)).toContainText("STEP 1 OF 3");
  for (const viewport of [{ width: 1200, height: 500 }, { width: 390, height: 640 }]) {
    await page.setViewportSize(viewport);
    if (viewport.width < 760) await page.getByRole("button", { name: "Open navigation" }).click();
    await help(page);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.getByRole("button", { name: viewport.width < 760 ? "Open navigation" : "Help & getting started" })).toBeFocused();
  }
});

test("search groups, matching, no results, keyboard navigation and filter independence", async ({ page }) => {
  await ready(page, "/projects");
  const filter = page.getByRole("textbox", { name: "Find a project", exact: true });
  await filter.fill("brand");
  await page.locator(".search-trigger kbd").click();
  const search = page.getByRole("combobox", { name: "Search projects or pages" });
  await expect(page.getByRole("group", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Pages", exact: true })).toBeVisible();
  await expect(search).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { selected: true })).toHaveAccessibleName("Brand guidelines Branding");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("option", { selected: true })).toHaveAccessibleName("Website redesign Design");
  await search.fill("  mArKeTiNg  ");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Product launch");
  await page.keyboard.press("Escape");
  await expect(filter).toHaveValue("brand");
  await page.keyboard.press("Control+k");
  await search.fill("nothing matches this");
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("No matching projects or pages.");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Search projects or pages");
  await page.keyboard.press("Escape");
  await expect(filter).toHaveValue("brand");
  await page.keyboard.press("Control+k");
  await search.fill("  SeTTings ");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);
});

test("search shortcuts preserve editing dialogs and project details", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Unsaved draft");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Make room for a new project");
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue("Unsaved draft");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open Website redesign", exact: true }).click();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Website redesign");
  await expect(page.getByRole("button", { name: "Save details" })).toBeVisible();
});

for (const [platform, hint, shortcut] of [["Win32", "Ctrl K", "Control+k"], ["Linux x86_64", "Ctrl K", "Control+k"], ["MacIntel", "⌘ K", "Meta+k"]]) {
  test(`search hint and shortcut match ${platform}`, async ({ page }) => {
    await page.addInitScript(value => Object.defineProperty(navigator, "platform", { get: () => value }), platform);
    await ready(page);
    await expect(page.locator(".search-trigger kbd")).toHaveText(hint);
    await page.keyboard.press(shortcut);
    await expect(page.getByRole("combobox", { name: "Search projects or pages" })).toBeFocused();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Search projects or pages" }).click();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.getByRole("button", { name: "Search projects or pages" })).toBeFocused();
  });
}
