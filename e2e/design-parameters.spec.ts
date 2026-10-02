import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

type Geometry = "x" | "y" | "width" | "height";
type SourceNode = Partial<Record<Geometry, number>> & {
  id: string;
  metadata?: Partial<Record<Geometry, number>>;
  markup?: string;
  cornerRadius?: number;
  itemSpacing?: number;
  text?: { fontSize: number; fontWeight: number; lineHeight: { unit: string; value: number }; letterSpacing: { unit: string; value: number } }[];
};
const source = JSON.parse(readFileSync(resolve("design/figma-source.json"), "utf8")) as {
  directNodes: SourceNode[];
  sections: { nodes: SourceNode[] }[];
};
const nodes = new Map(source.sections.flatMap(section => section.nodes).map(node => [node.id, node]));
for (const direct of source.directNodes) nodes.set(direct.id, { ...nodes.get(direct.id), ...direct });
function geometry(id: string, key: Geometry) {
  const node = nodes.get(id)!;
  return (node[key] ?? node.metadata?.[key])!;
}
function parameter(id: string, key: string) {
  const classes = nodes.get(id)!.markup!.match(/className="([^"]+)"/)![1];
  return Number.parseFloat(classes.match(new RegExp(`(?:^|\\s)${key}-\\[(-?[\\d.]+)(?:px)?\\]`))![1]);
}
async function measured(page: Page, selector: string) {
  return page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      fontSize: Number.parseFloat(css.fontSize), fontWeight: Number(css.fontWeight),
      lineHeight: Number.parseFloat(css.lineHeight), letterSpacing: Number.parseFloat(css.letterSpacing) || 0,
      radius: Number.parseFloat(css.borderTopLeftRadius), gap: Number.parseFloat(css.columnGap),
      paddingTop: Number.parseFloat(css.paddingTop), paddingLeft: Number.parseFloat(css.paddingLeft),
      color: css.color, background: css.backgroundColor, fontFamily: css.fontFamily,
    };
  });
}

test("desktop components match retained Figma parameters without image comparisons", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 1100 });
  await page.goto("/");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  await page.evaluate(() => document.fonts.ready);
  const report: { selector: string; sourceNode: string; property: string; expected: number; actual: number }[] = [];
  async function check(selector: string, id: string, values: Partial<Record<keyof Awaited<ReturnType<typeof measured>>, number>>) {
    const actual = await measured(page, selector);
    for (const [property, expected] of Object.entries(values)) {
      const value = actual[property as keyof typeof actual] as number;
      report.push({ selector, sourceNode: id, property, expected, actual: value });
      // Chromium rounds layout to 1/64px. Figma text heights round to whole pixels.
      const tolerance = property === "height" && /h1|\.brand/.test(selector) ? 0.5 : 0.035;
      expect(Math.abs(value - expected), `${selector} ${property}, node ${id}: ${value} vs ${expected}`).toBeLessThanOrEqual(tolerance);
    }
  }
  await check(".announcement", "1:133", { height: geometry("1:133", "height"), paddingTop: 14, gap: nodes.get("1:134")!.itemSpacing });
  await check(".landing-nav", "1:141", { width: geometry("1:141", "width"), height: geometry("1:157", "y") });
  const brand = nodes.get("1:144")!.text![0];
  await check(".landing-nav .brand", "1:144", { fontSize: brand.fontSize, fontWeight: brand.fontWeight, letterSpacing: brand.letterSpacing.value, lineHeight: brand.fontSize * brand.lineHeight.value / 100 });
  await check(".landing-links", "1:145", { gap: nodes.get("1:145")!.itemSpacing });
  await check(".landing-links a", "1:146", { fontSize: nodes.get("1:146")!.text![0].fontSize, fontWeight: nodes.get("1:146")!.text![0].fontWeight });
  await check(".landing-nav .button", "1:154", { width: geometry("1:154", "width"), height: geometry("1:154", "height"), radius: nodes.get("1:154")!.cornerRadius, fontSize: 16, paddingTop: 12, paddingLeft: 20 });
  await check(".landing-hero", "1:157", { width: geometry("1:157", "width"), height: geometry("1:157", "height"), x: (1400 - geometry("1:157", "width")) / 2 });
  await check(".hero-copy", "1:201", { width: geometry("1:201", "width") });
  await check(".hero-copy h1", "1:208", { fontSize: parameter("1:208", "text"), lineHeight: parameter("1:208", "text") * parameter("1:208", "leading"), letterSpacing: parameter("1:208", "tracking"), height: geometry("1:208", "height") });
  await check(".hero-copy > p", "1:209", { width: geometry("1:209", "width"), fontSize: parameter("1:209", "text") });
  await check(".hero-actions", "1:210", { gap: parameter("1:210", "gap") });
  await check(".hero-actions .button-secondary", "1:214", { width: geometry("1:214", "width"), height: geometry("1:214", "height") });
  const hero = await measured(page, ".landing-hero");
  await check(".hero-preview", "1:216", { x: hero.x + geometry("1:216", "x"), y: hero.y + geometry("1:216", "y"), width: geometry("1:216", "width"), gap: parameter("1:216", "gap") });
  for (const [selector, id] of [[".preview-tasks", "1:217"], [".preview-momentum", "1:265"], [".preview-breakdown", "1:317"]]) {
    await check(selector, id, { width: geometry(id, "width"), height: geometry(id, "height"), radius: parameter(id, "rounded") });
  }
  await check(".preview-task", "1:221", { height: geometry("1:221", "height"), radius: parameter("1:221", "rounded") });
  await check(".photo-avatar-group img", "1:229", { width: geometry("1:229", "width"), height: geometry("1:229", "height"), radius: parameter("1:229", "rounded") });
  await check(".landing-divider", "1:354", { height: geometry("1:354", "height") });
  await check(".features-section .landing-section-heading h2", "1:861", { fontSize: parameter("1:861", "text"), lineHeight: parameter("1:861", "text") * parameter("1:861", "leading"), letterSpacing: parameter("1:861", "tracking") });
  await check(".feature-main", "1:864", { width: geometry("1:864", "width"), height: geometry("1:864", "height"), radius: parameter("1:864", "rounded") });
  await check(".feature-copy h3", "1:867", { width: geometry("1:867", "width"), fontSize: parameter("1:867", "text"), letterSpacing: parameter("1:867", "tracking") });
  await check(".feature-project-preview", "1:872", { width: geometry("1:872", "width"), height: geometry("1:872", "height"), radius: parameter("1:872", "rounded") });
  await check(".feature-visual", "1:909", { width: geometry("1:909", "width"), height: geometry("1:909", "height"), radius: parameter("1:909", "rounded") });
  await check(".landing-pricing h2", "1:1617", { fontSize: parameter("1:1617", "text"), lineHeight: parameter("1:1617", "text") * parameter("1:1617", "leading"), fontWeight: 600, letterSpacing: parameter("1:1617", "tracking") });
  expect((await measured(page, ".landing-pricing h2")).fontFamily).toContain("plusJakartaSans");
  expect((await measured(page, ".landing-pricing h2")).color).toBe("rgb(0, 6, 61)");
  expect((await measured(page, ".hero-actions .button-primary")).background).toBe("rgb(240, 168, 2)");
  expect((await measured(page, ".landing-nav .button")).background).toBe("rgb(242, 177, 28)");
  await check(".landing-plan", "1:1632", { width: geometry("1:1632", "width"), height: geometry("1:1632", "height"), paddingTop: parameter("1:1632", "pt"), paddingLeft: parameter("1:1632", "px"), radius: parameter("1:1632", "rounded") });
  await check(".landing-plan > .button", "1:1666", { height: geometry("1:1666", "height") });
  await check(".faq-item[open]", "1:2533", { width: geometry("1:2533", "width"), height: geometry("1:2533", "height"), radius: parameter("1:2533", "rounded") });
  await check(".faq-item:not([open])", "1:2539", { width: geometry("1:2539", "width"), height: geometry("1:2539", "height") });
  await check(".faq-question h3", "1:2536", { fontSize: parameter("1:2536", "text"), lineHeight: parameter("1:2536", "text") * parameter("1:2536", "leading") });
  await check(".faq-item p", "1:2538", { width: geometry("1:2538", "width"), fontSize: parameter("1:2538", "text") });
  await testInfo.attach("figma-parameter-report", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
});

test("adapted live content stays within measured card surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1100 });
  await page.goto("/");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  await page.evaluate(() => document.fonts.ready);
  for (const selector of [".preview-card", ".feature-project-preview", ".landing-plan"]) {
    const overflow = await page.locator(selector).evaluateAll(elements => elements.flatMap(element => {
      const outer = element.getBoundingClientRect();
      return [...element.children].filter(child => {
        const rect = child.getBoundingClientRect();
        return rect.right > outer.right + 0.1 || rect.bottom > outer.bottom + 0.1 || rect.left < outer.left - 0.1 || rect.top < outer.top - 0.1;
      }).map(child => ({ parent: element.className, child: child.className }));
    }));
    expect(overflow).toEqual([]);
  }
});
