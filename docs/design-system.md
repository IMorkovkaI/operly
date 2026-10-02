# Operly design system

Operly uses the supplied [Taskzen Figma file](https://www.figma.com/design/dv7JxRZLHIP8u5S9dxr9Jj/Taskzen?node-id=1-140). Source properties drive the desktop landing components. The workspace and responsive layouts extend this marketing template.

## Parameter source

[design/figma-source.json](../design/figma-source.json) retains node IDs, numeric geometry, text properties, paints, radii, and auto-layout values. It includes direct Plugin API properties for 19 nodes and previously retrieved design-context attributes with metadata geometry for 482 nodes across these sections:

| Section | Source root |
| --- | --- |
| Navigation and hero | `1:140` |
| Features | `1:854` |
| Pricing | `1:1610` |
| FAQ | `1:2521` |

Measurements come from element data. Screenshots are not used for extraction, comparison, or browser verification. Each section records its retrieval method; direct properties take precedence over rounded design-context values.

[scripts/generate-design-tokens.mjs](../scripts/generate-design-tokens.mjs) generates [app/figma-tokens.css](../app/figma-tokens.css) from this snapshot. The JSON is a development artifact and is not shipped in the client bundle. Raw Figma floats remain intact; generated CSS rounds to six decimal places, and normalized paint channels are converted to their 8-bit sRGB values.

```sh
npm run design:tokens
npm run design:check
```

Edit the source snapshot when importing updated element data, then regenerate the tokens. Do not edit the generated CSS.

The Figma Starter plan tool limit prevented completing fresh Plugin API reads for every node. Those nodes retain their earlier design-context properties and metadata. The atmosphere SVG uses its actual viewBox dimensions and exported numerical insets; those insets are rounded in design-context output. Its precise `absoluteRenderBounds` remains unverified until further Figma calls are available.

## Mapped values

| Component property | Source value | Source node |
| --- | --- | --- |
| Main content width / hero height | 1224 / 906px | `1:157` |
| Announcement height | 52px | `1:133` |
| Brand typography | Geist 500, 24px / 1.4, −1px tracking | `1:144` |
| Navigation typography / gap | Geist 400, 16px / 1.7; 38px gap | `1:146`, `1:145` |
| Primary button | 212 × 51px, 12 × 20px padding, 6px radius | `1:154` |
| Header action color | `#F2B11C` | `1:154` |
| Hero action color | `#F0A802` | `1:211` |
| Tag marker | 10 × 10px, 2px radius | `1:204` |
| Hero title | Geist 500, 60px / 1.15, −3px tracking | `1:208` |
| Hero body width | 464px | `1:209` |
| Hero actions / preview gap | 24px | `1:210`, `1:216` |
| Task preview | 291 × 378px, 13.816px radius | `1:217` |
| Center preview | 486 × 329px, 12px radius | `1:265` |
| Right preview | 290.812988 × 378.792969px | `1:317` |
| Preview border / blur | 6px white at 40%; 20px blur | `1:217` |
| Section divider height | 90px | `1:354` |
| Section title | Geist 500, 44px / 1.2, −3px tracking | `1:861` |
| Feature title | Geist 500, 32px / 1.4, −1.5px tracking | `1:867` |
| Feature surface / panel | 1096 × 395 / 486 × 291px | `1:864`, `1:872` |
| Secondary feature visual | 528 × 348px, 13px radius | `1:909` |
| Pricing title | Plus Jakarta Sans 600, 48px / 1.2, −2px; `#00063D` | `1:1617` |
| Plan surface | 340 × 433px; 16px top, 24px side/bottom padding | `1:1632` |
| FAQ closed / open height | 93.5 / 156px | `1:2539`, `1:2533` |
| FAQ width / question | 725px; Geist 500, 20px / 1.7 | `1:2533`, `1:2536` |

Source foundation colors include primary text `#251B18`, body `#33312F`, white `#FFFFFF`, surface `#FAF7F5`, chart remainder `#FAF4EF`, terracotta `#B7654A`, and sand `#F6DB9D`. Source opacity is preserved, including brown borders at 10% and FAQ borders at 15%.

Geist, Geist Mono, and Plus Jakarta Sans are bundled locally in `app/fonts/` with their licenses. Pricing retains its source font and color.

## Product extensions

The reference is a marketing template. Operly adds project and task workflows, members, activity, settings, local persistence, and illustrative billing. These product screens are not represented by source frames.

Operly copy, actual project metrics, checkboxes in the preview, two demo plans, the project-table visual, circular progress chart, additional page sections, hover/focus states, and mobile layouts are intentional adaptations. Intrinsic text widths and section heights can differ when copy changes; expanded FAQ answers grow when they need additional lines. The mapped source card sizes remain fixed at the desktop reference width.

`app/globals.css` separates generated source tokens from product colors and layouts. Semantic completion green, destructive red, avatar tones, muted text, denser 14px/44px workspace buttons, dialogs, and floating feedback are product extensions. Source typography, surfaces, and radii remain shared. Responsive layouts below 1280px use flexible columns; narrow screens stack content and expose a navigation drawer.

## Components and behavior

- `components/ui.tsx`: Logo, Avatar, AvatarGroup, StatusBadge, Modal, EmptyState.
- `components/icon.tsx`: native 24px stroke icon vocabulary. The Figma Plus Code Connect mapping has no matching installed component in this starter.
- `components/workspace.tsx`: workspace shell, project table and cards, data-driven charts, and project workflows.
- `components/landing.tsx`: public page using shared primitives and live local workspace data.

Original artwork is stored in `public/design/`: logo, grid, atmosphere, divider, and three decorative portraits. Runtime assets do not depend on temporary Figma URLs.

Native dialogs trap focus and support Escape. Forms have labels, required/type validation, length limits, and duplicate email feedback. Checklists use checkbox semantics; filters expose pressed state; FAQs expose their expanded state through native disclosure semantics. Toasts use a status live region and storage failures use an alert. Reduced-motion preferences disable animation and smooth scrolling. Wide tables scroll within their panel.

Sample records and illustrative pricing are identified as demo content. SVG chart titles use single strings for valid server markup. Activity times use UTC during server hydration, then the browser’s local time.

## Numeric verification

`e2e/design-parameters.spec.ts` compares rendered dimensions, typography, gaps, radii, padding, and colors against the retained node data at the source’s 1400px viewport. Layout tolerates Chromium’s 1/64px quantization; Figma-rounded text heights allow 0.5px. It also checks that adapted content stays inside the measured card surfaces and attaches a JSON parameter report.

```sh
npm run build
npm run test:e2e
```

Browser screenshots and trace screenshots are disabled. Workflow, hydration, and document-overflow tests cover the complete app at desktop, tablet, and mobile sizes. These checks verify the mapped properties and usable behavior; they do not claim a full-template match for the intentional extensions or the pending atmosphere render bounds.

## Interaction extensions

The FAQ uses native `details` and `summary` with an exclusive group. Source padding now belongs to the summary so the entire closed row responds to clicks. The first answer starts open; expanded content grows naturally. Original typography, borders, colors, radius, and desktop closed/open reference dimensions remain checked against the retained Figma parameters.

Workspace search, Help & getting started, and the three-step guided demo reuse existing workspace tokens and native modal primitives. Search provides combobox/listbox semantics, grouped results, a live result count, and keyboard selection. The tour is an inline panel with explicit actions, not an overlay that blocks the workspace. Help transitions to existing forms and routes. The sidebar scrolls when its contents exceed the viewport. These product interactions introduce no source-token or persisted-schema changes.
