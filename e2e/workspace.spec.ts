import { expect, test } from "@playwright/test";

test("landing preview persists task changes and FAQs are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Less busywork. More good work." })).toBeVisible();
  const checkbox = page.getByRole("checkbox").first();
  await expect(checkbox).toBeEnabled();
  await checkbox.check();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("operly-workspace-v1")!).projects[0].tasks[4].done)).toBe(true);
  const question = page.locator("summary").filter({ hasText: "Where is my workspace data stored?" });
  await question.click();
  await expect(question.locator("..")).toHaveAttribute("open", "");
  await expect(page.getByText("This version stores your changes in this browser", { exact: false })).toBeVisible();
});

test("create and edit a project, complete a task, and persist it after reload", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Customer portal");
  await page.getByLabel("Description", { exact: false }).fill("A clear home for our clients.");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("Customer portal");
  await page.getByRole("textbox", { name: "New task title" }).fill("Review the first design");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.getByRole("checkbox", { name: "Review the first design", exact: true }).check();
  await expect(dialog.getByRole("combobox").first()).toHaveValue("Completed");
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Client portal");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(dialog).toHaveAccessibleName("Client portal");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Client portal Design", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Completed 2", exact: true }).click();
  await expect(page.getByRole("button", { name: "Client portal Design", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Website redesign Design", exact: true })).toHaveCount(0);
});

test("search opens a project, supports Escape, and deletion needs confirmation", async ({ page }) => {
  await page.goto("/workspace");
  await expect(page.getByRole("button", { name: "New project" })).toBeEnabled();
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Search projects or pages" }).fill("Website");
  await page.getByRole("dialog").getByRole("option", { name: "Website redesign Design", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Website redesign");
  await page.getByRole("button", { name: "Delete project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Delete this project?");
  await page.getByRole("button", { name: "Keep project" }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Website redesign");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("teammate creation validates duplicates and stores roles", async ({ page }) => {
  await page.goto("/team");
  await page.getByRole("button", { name: "Add teammate", exact: true }).click();
  await page.getByLabel("Full name").fill("Jamie Rivera");
  await page.getByLabel("Email address").fill("jamie@example.com");
  await page.getByRole("dialog").getByRole("button", { name: "Add teammate" }).click();
  await expect(page.getByText("Jamie Rivera", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Role for Jamie Rivera" }).selectOption("Admin");
  await page.getByRole("button", { name: "Add teammate", exact: true }).click();
  await page.getByLabel("Full name").fill("Jamie Again");
  await page.getByLabel("Email address").fill("jamie@example.com");
  await page.getByRole("dialog").getByRole("button", { name: "Add teammate" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("A teammate with this email already exists.");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Role for Jamie Rivera" })).toHaveValue("Admin");
});

test("settings, data export, demo reset, and plan selection work", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Workspace name", { exact: true }).fill("River studio");
  await page.getByLabel("Your name", { exact: true }).fill("River Morgan");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  await expect(page.getByLabel("Workspace name", { exact: true })).toHaveValue("River studio");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("operly-workspace.json");
  await page.goto("/billing");
  await page.getByRole("button", { name: "Try Team in demo" }).click();
  await page.reload();
  await expect(page.locator(".plan-featured").getByRole("button", { name: "Your current plan" })).toBeDisabled();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset workspace", exact: true }).click();
  await expect(page.getByLabel("Workspace name", { exact: true })).toHaveValue("Studio workspace");
});

test("malformed saved data falls back to a usable sample workspace", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("operly-workspace-v1", JSON.stringify({ version: 1, members: [] })));
  await page.goto("/workspace");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Saved workspace data could not be read");
  await expect(page.getByRole("button", { name: "Website redesign Design", exact: true })).toBeVisible();
});

test("desktop and mobile screens have no document overflow or runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/workspace", "/projects", "/team", "/activity", "/settings", "/billing"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, overflowing: Array.from(document.querySelectorAll("body *")).filter(el => el.getBoundingClientRect().right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1).map(el => ({ element: `${el.tagName}.${el.className}`, right: Math.round(el.getBoundingClientRect().right), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflow: getComputedStyle(el).overflowX })).slice(0, 20) }));
      expect(geometry.documentWidth, `${route} at ${viewport.width}px: ${JSON.stringify(geometry)}`).toBeLessThanOrEqual(geometry.width);
    }
  }
  await page.goto("/workspace");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.getByRole("link", { name: "Projects 4", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  expect(errors).toEqual([]);
});
