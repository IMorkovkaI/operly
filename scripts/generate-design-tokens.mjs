import { readFile, writeFile } from "node:fs/promises";

const source = JSON.parse(await readFile(new URL("../design/figma-source.json", import.meta.url), "utf8"));
const nodes = new Map(source.sections.flatMap(section => section.nodes).map(node => [node.id, node]));
for (const node of source.directNodes) nodes.set(node.id, { ...nodes.get(node.id), properties: node });
const node = id => {
  const result = nodes.get(id);
  if (!result) throw new Error(`Missing Figma node ${id}`);
  return result;
};
const number = value => {
  if (!Number.isFinite(value)) throw new Error(`Invalid source measurement: ${value}`);
  // Original float32 data remains in JSON; CSS retains six decimal places.
  return Number(value.toFixed(6));
};
const metric = (id, property) => number(node(id).properties?.[property] ?? node(id).metadata?.[property]);
const px = value => `${number(value)}px`;
const classes = id => node(id).markup?.match(/className="([^"]+)"/)?.[1] ?? "";
const arbitrary = (id, prefix) => {
  const value = classes(id).match(new RegExp(`(?:^|\\s)${prefix}-\\[([^\\]]+)\\]`))?.[1];
  if (value === undefined) throw new Error(`Missing ${prefix} on Figma node ${id}`);
  return value;
};
const numericClass = (id, prefix) => number(Number.parseFloat(arbitrary(id, prefix)));
const radius = id => px(node(id).properties?.cornerRadius ?? numericClass(id, "rounded"));
const color = paint => {
  const channels = ["r", "g", "b"].map(key => Math.round(paint.color[key] * 255));
  return `rgb(${channels.join(" ")} / ${number(paint.opacity ?? 1)})`;
};
const paint = (id, property) => color(node(id).properties[property].find(p => p.visible !== false && p.type === "SOLID"));
const text = (id, inlineIndex) => {
  const direct = node(id).properties?.text?.[0];
  if (direct && inlineIndex === undefined) {
    const line = direct.lineHeight;
    const tracking = direct.letterSpacing;
    return {
      family: direct.fontName.family,
      size: px(direct.fontSize), weight: direct.fontWeight,
      line: line.unit === "PERCENT" ? number(line.value / 100) : px(line.value),
      tracking: tracking.unit === "PIXELS" ? px(tracking.value) : `${number(tracking.value / 100)}em`,
      color: color(direct.fills[0]),
    };
  }
  const cls = inlineIndex === undefined ? classes(id) : node(id).inlineSegments[inlineIndex].className;
  const get = prefix => cls.match(new RegExp(`(?:^|\\s)${prefix}-\\[([^\\]]+)\\]`))?.[1];
  const font = cls.match(/font-\['([^:]+):([^']+)'\]/);
  const fontSize = cls.match(/(?:^|\s)text-\[([\d.]+px)\]/)?.[1];
  const leading = get("leading") ?? (id === "1:1636" ? arbitrary("1:1635", "leading") : undefined);
  if (!font || !fontSize || !leading) throw new Error(`Incomplete typography on ${id}`);
  const weights = { Regular: 400, Medium: 500, SemiBold: 600, Semi_Bold: 600, Bold: 700 };
  return {
    family: font[1].replaceAll("_", " "), size: fontSize, weight: weights[font[2]],
    line: Number(leading), tracking: get("tracking") ?? "0px",
    color: cls.match(/text-\[(#[0-9a-f]+|rgba\([^)]+\))\]/)?.[1],
  };
};
const tokens = {};
const put = (name, value) => {
  if (value === undefined) throw new Error(`Missing source value for ${name}`);
  tokens[name] = value;
};
const size = (name, id, property) => put(name, px(metric(id, property)));
const clsSize = (name, id, property) => put(name, px(numericClass(id, property)));
const type = (name, id, inlineIndex) => {
  for (const [key, value] of Object.entries(text(id, inlineIndex))) put(`${name}-${key}`, value);
};

put("ink", paint("1:144", "fills"));
put("body", text("1:209").color);
put("paper", paint("1:157", "fills"));
put("amber", paint("1:154", "fills"));
put("hero-action", arbitrary("1:211", "bg"));
put("surface", arbitrary("1:864", "bg"));
put("line", paint("1:157", "strokes"));
put("faq-line", arbitrary("1:2539", "border"));
put("preview-line", arbitrary("1:217", "border"));
put("task-line", classes("1:221").match(/border-\[(rgba\([^)]+\))\]/)[1]);
put("check-surface", arbitrary("1:1643", "bg"));
size("content-width", "1:157", "width");
size("hero-height", "1:157", "height");
size("announcement-height", "1:133", "height");
size("announcement-padding", "1:133", "paddingTop");
size("announcement-gap", "1:134", "itemSpacing");
size("announcement-divider-height", "1:136", "width");
put("announcement-divider-color", paint("1:136", "strokes"));
size("nav-gap", "1:145", "itemSpacing");
size("nav-inset-y", "1:141", "y");
size("nav-height", "1:157", "y");
size("button-height", "1:154", "height");
size("button-width", "1:154", "width");
size("button-padding-y", "1:154", "paddingTop");
size("button-padding-x", "1:154", "paddingLeft");
put("button-radius", radius("1:154"));
type("brand", "1:144");
type("nav", "1:146");
type("button", "1:156");
type("tag", "1:205");
put("tag-radius", radius("1:203"));
size("tag-height", "1:203", "height");
size("tag-padding-y", "1:203", "paddingTop");
size("tag-padding-x", "1:203", "paddingLeft");
size("tag-gap", "1:203", "itemSpacing");
size("tag-dot-size", "1:204", "width");
put("tag-dot-radius", radius("1:204"));
type("hero", "1:208");
type("hero-body", "1:209");
size("hero-copy-width", "1:201", "width");
size("hero-copy-top", "1:201", "y");
put("hero-copy-center-offset", px(metric("1:201", "x") + metric("1:201", "width") / 2 - metric("1:157", "width") / 2));
size("hero-body-width", "1:209", "width");
size("hero-copy-gap", "1:202", "itemSpacing");
clsSize("hero-actions-top", "1:206", "gap");
clsSize("hero-actions-gap", "1:210", "gap");
size("hero-secondary-width", "1:214", "width");
size("preview-top", "1:216", "y");
size("preview-width", "1:216", "width");
put("preview-center-offset", px(metric("1:157", "width") / 2 - metric("1:216", "x") - metric("1:216", "width") / 2));
clsSize("preview-gap", "1:216", "gap");
size("tasks-width", "1:217", "width");
size("tasks-height", "1:217", "height");
put("tasks-radius", radius("1:217"));
size("tasks-inset-x", "1:218", "x");
size("tasks-inset-y", "1:218", "y");
size("tasks-content-width", "1:218", "width");
clsSize("tasks-heading-gap", "1:218", "gap");
clsSize("tasks-row-gap", "1:220", "gap");
size("task-height", "1:221", "height");
put("task-radius", radius("1:221"));
clsSize("task-border-width", "1:221", "border");
type("task-title", "1:223");
type("task-caption", "1:225");
size("portrait-size", "1:229", "width");
put("portrait-radius", radius("1:229"));
clsSize("portrait-border", "1:229", "border");
put("portrait-overlap", px(Math.abs(numericClass("1:229", "mr"))));
size("momentum-width", "1:265", "width");
size("momentum-height", "1:265", "height");
size("momentum-inset-x", "1:266", "x");
size("momentum-inset-y", "1:266", "y");
size("breakdown-width", "1:317", "width");
size("breakdown-height", "1:317", "height");
size("breakdown-inset-x", "1:319", "x");
size("breakdown-inset-y", "1:319", "y");
put("preview-radius", radius("1:265"));
put("preview-border-width", px(Number(classes("1:217").match(/(?:^|\s)border-(\d+)/)[1])));
clsSize("preview-blur", "1:217", "backdrop-blur");
type("preview-title", "1:268");
size("grid-width", "1:199", "width");
size("grid-height", "1:199", "height");
// Rotated node bounds are authoritative; x/y are its pre-rotation origin.
put("grid-left", px(node("1:199").properties.absoluteBoundingBox.x - node("1:157").properties.absoluteBoundingBox.x));
put("grid-top", px(node("1:199").properties.absoluteBoundingBox.y - node("1:157").properties.absoluteBoundingBox.y));
put("grid-rotation", `${metric("1:199", "rotation")}deg`);
const atmosphere = source.assetExports.heroAtmosphere;
put("atmosphere-width", px(atmosphere.width));
put("atmosphere-height", px(atmosphere.height));
put("atmosphere-left", px(metric(atmosphere.nodeId, "x") + metric(atmosphere.nodeId, "width") * atmosphere.insetsPercent.left / 100));
put("atmosphere-top", px(metric(atmosphere.nodeId, "y") + metric(atmosphere.nodeId, "height") * atmosphere.insetsPercent.top / 100));
size("divider-height", "1:354", "height");
type("section", "1:861");
type("section-body", "1:862");
type("feature", "1:867");
type("feature-body", "1:868");
type("card", "1:1034");
size("section-inset-y", "1:855", "y");
put("section-inset-x", px(metric("1:855", "x") - 1)); // Compensate for the inside border.
clsSize("feature-heading-gap", "1:855", "gap");
size("feature-heading-width", "1:856", "width");
size("feature-width", "1:864", "width");
size("feature-height", "1:864", "height");
size("feature-inset-x", "1:865", "x");
size("feature-copy-width", "1:865", "width");
size("feature-title-width", "1:867", "width");
size("feature-panel-left", "1:872", "x");
size("feature-panel-width", "1:872", "width");
size("feature-panel-height", "1:872", "height");
put("feature-column-gap", px(metric("1:872", "x") - metric("1:865", "x") - metric("1:865", "width")));
put("feature-inset-right", px(metric("1:864", "width") - metric("1:872", "x") - metric("1:872", "width")));
clsSize("feature-copy-gap", "1:866", "gap");
clsSize("feature-action-gap", "1:865", "gap");
size("feature-visual-height", "1:909", "height");
put("feature-visual-radius", radius("1:909"));
put("feature-secondary-gap", px(metric("1:1008", "x") - metric("1:908", "width")));
clsSize("feature-visual-gap", "1:908", "gap");
clsSize("feature-caption-gap", "1:1033", "gap");
type("pricing", "1:1617");
type("plan-title", "1:1636");
type("price", "1:1638", 0);
type("price-caption", "1:1638", 1);
size("plan-width", "1:1632", "width");
size("plan-height", "1:1632", "height");
clsSize("plan-padding-top", "1:1632", "pt");
clsSize("plan-padding-x", "1:1632", "px");
clsSize("plan-padding-bottom", "1:1632", "pb");
put("plan-radius", radius("1:1632"));
clsSize("plan-gap", "1:1631", "gap");
clsSize("plan-features-gap", "1:1641", "gap");
size("plan-button-height", "1:1666", "height");
clsSize("faq-heading-gap", "1:2524", "gap");
size("faq-width", "1:2533", "width");
size("faq-open-height", "1:2533", "height");
size("faq-closed-height", "1:2539", "height");
size("faq-inner-width", "1:2534", "width");
size("faq-body-width", "1:2538", "width");
put("faq-radius", radius("1:2533"));
type("faq-title", "1:2536");
type("faq-body", "1:2538");
clsSize("faq-gap", "1:2532", "gap");
clsSize("faq-answer-gap", "1:2534", "gap");
put("faq-closed-padding-y", px((metric("1:2539", "height") - metric("1:2541", "height")) / 2 - 1));
put("faq-closed-padding-x", px((metric("1:2539", "width") - metric("1:2540", "width")) / 2 - 1));
size("faq-open-padding-y", "1:2534", "y");
size("faq-open-padding-x", "1:2534", "x");

const css = `/* Generated by npm run design:tokens from design/figma-source.json. Do not edit. */\n:root {\n${Object.entries(tokens).map(([key, value]) => `  --figma-${key}: ${value};`).join("\n")}\n}\n`;
const output = new URL("../app/figma-tokens.css", import.meta.url);
if (process.argv.includes("--check")) {
  if (await readFile(output, "utf8") !== css) throw new Error("Figma tokens are stale. Run npm run design:tokens.");
} else {
  await writeFile(output, css);
}
