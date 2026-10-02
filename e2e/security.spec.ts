import { expect, test } from "@playwright/test";
import { createWorkspace } from "../lib/workspace";

test("stored project and task markup is displayed as text", async ({ page }) => {
  const payload = '<img src=x onerror="window.__operlyXss=1">';
  const workspace = createWorkspace();
  workspace.projects[0].name = payload;
  workspace.projects[0].description = payload;
  workspace.projects[0].tasks[0].title = payload;
  await page.addInitScript(data => localStorage.setItem("operly-workspace-v1", JSON.stringify(data)), workspace);
  await page.goto("/projects");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: `${payload} Design`, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(payload);
  await expect(page.getByRole("checkbox", { name: payload, exact: true })).toBeVisible();
  await expect(page.locator('img[onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => "__operlyXss" in window)).toBe(false);
});

test("source and development artifacts are not public routes", async ({ request }) => {
  for (const path of ["/.git/config", "/.env", "/AGENTS.md", "/CLAUDE.md", "/package.json", "/design/figma-source.json", "/components/workspace.tsx", "/test-results/.last-run.json"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("record deployment security headers for review", async ({ request }, testInfo) => {
  const names = ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "strict-transport-security", "x-powered-by"];
  const report: Record<string, Record<string, string | null>> = {};
  for (const path of ["/", "/workspace"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    report[path] = Object.fromEntries(names.map(name => [name, response.headers()[name] ?? null]));
  }
  console.log("Security header inventory:", JSON.stringify(report));
  await testInfo.attach("security-headers", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
});
