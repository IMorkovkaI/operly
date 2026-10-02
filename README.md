# Operly

A simple workspace for projects, tasks, and teams, built with Next.js App Router, TypeScript, React, and Tailwind CSS 4. The design follows the Taskzen reference supplied in AGENTS.md. Source values, assets, and component conventions are documented in [the design system](docs/design-system.md).

## Run locally

Requires Node.js 22.18 or newer for the TypeScript test runner.

```sh
npm install
npm run dev
```

Visit http://localhost:3000 for the landing page, or http://localhost:3000/workspace for the demo workspace.

For mobile testing on this network, use `http://10.143.132.232:3000`. Its hostname is explicitly included in `allowedDevOrigins` in `next.config.ts`. If the machine's address changes, update that entry and restart the development server. An unlisted network origin can block the development WebSocket and leave the server-rendered page without working client controls.

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

## Included workflows

- Landing page with an interactive workspace preview and accessible FAQs.
- Workspace overview with metrics and charts calculated from project data.
- Create, edit, search, filter, and delete projects; switch between list and grid views.
- Add and complete tasks; assign teammates to projects; update project status.
- Add local teammate records, change their display roles, and remove them from assignments.
- Workspace activity, profile settings, JSON export, and confirmed demo reset.
- Illustrative billing plans with local plan selection.
- Responsive navigation, keyboard search (Ctrl K or Command K), and native modal dialogs.

## Getting started and finding your work

Choose **Try a demo** on the landing page to open `/workspace?tour=1`. The three-step guide opens an existing project, brings its checklist into focus, and shows project momentum. Back and Next move through the guide; Skip and Finish tour dismiss it. The entry parameter is removed once the guide starts, so refreshing or visiting the workspace normally does not restart it. An empty workspace offers the existing project-creation form. The guide never resets or edits data on its own.

Open **Help & getting started** at the bottom of the sidebar for project creation, task-finding instructions, team management, Settings, or **Restart guided demo**. On smaller screens, open the navigation menu first. The sidebar scrolls on short screens. Settings contains JSON export and the confirmed demo reset.

Use **Search projects or pages**, or press **Ctrl K** on Windows/Linux and **⌘ K** on macOS. Search matches project names, categories, and workspace page names, ignoring case and surrounding spaces. An empty query groups all projects and pages. Use Arrow Up/Down and Enter to open a result, or Escape to dismiss search. Individual tasks live inside their projects. Search does not clear the Projects page filter, and its shortcut leaves open editing dialogs intact.

FAQ questions are native disclosures: the whole question row is clickable, Enter or Space toggles a focused question, and only one answer stays open. They work with JavaScript disabled. Dialogs support Escape, a close button, focus restoration, and transitions to another dialog without stacking.

## Simplified persistence

This is a functional local SaaS demo. Workspace changes persist in this browser through localStorage under `operly-workspace-v1`. There is no database, server account, shared multi-user state, email delivery, or payment processing. Team roles are UI metadata, not an authorization boundary. Billing selections do not collect money. No environment variables or service credentials are needed.

The external store in `lib/store.ts` supplies a stable server snapshot, hydrates saved browser data, and reports storage failures. `lib/workspace.ts` contains typed records, storage validation, sample data, and progress helpers. React safely renders user-entered text. Local storage is appropriate for this demo, not for confidential production data.

Sample projects and dates are demonstration content. Landing previews reflect the same local records as the app. Reset the workspace in Settings to restore the original samples. Export data before clearing browser storage or resetting the demo.

## Structure

- `app/`: landing and workspace routes, shared layout and design tokens.
- `components/ui.tsx`: reusable visual and accessible interaction primitives.
- `components/workspace.tsx`: product screens and workflows.
- `components/landing.tsx`: public landing page.
- `components/faq.tsx`, `search-dialog.tsx`, `help-dialog.tsx`, `guided-tour.tsx`: focused interaction components; search and tour state are transient.
- `lib/`: data model and local persistence adapter.
- `public/design/`: original downloaded Figma artwork; no temporary asset URLs.
- `design/figma-source.json`: retained Figma element parameters and provenance.
- `scripts/generate-design-tokens.mjs`: source snapshot to CSS token generator.
- `tests/`: data-model tests.
- `e2e/`: browser workflow and responsive layout checks.

## Browser checks

```sh
npm run build
npm run test:e2e
```

Playwright starts a production server on port 3100. On Windows the configuration uses installed Google Chrome; on other platforms install Chromium with `npx playwright install chromium` first. Tests use isolated browser contexts and do not modify your personal browser data.

To run tests against an already running server on port 3100, set `OPERLY_EXTERNAL_SERVER=1`. This also lets you check a development build. The suite covers project editing and task completion, search, teammate validation, settings, export/reset, demo billing, corrupted storage, hydration in a different time zone, and layout at 390, 820, and 1440px.

To check mobile menus and Help against the actual network development server, run in PowerShell:

```powershell
$env:OPERLY_EXTERNAL_SERVER = "1"
$env:OPERLY_BASE_URL = "http://10.143.132.232:3000"
npm run test:e2e -- e2e/navigation.spec.ts
Remove-Item Env:OPERLY_EXTERNAL_SERVER, Env:OPERLY_BASE_URL
```

This touch regression also checks hydration and WebSocket errors, which a localhost production-only test would miss.

Interaction checks also cover FAQ click targets and operation without JavaScript; tour entry, all steps, restart, dismissal, and empty workspaces; help actions and focus at short desktop/mobile sizes; search grouping, keyboard selection, platform hints, matching, and preservation of filters and edits.

The design checks use computed styles and geometry against retained Figma parameters at the 1400px source viewport. Screenshots are disabled. Run `npm run design:tokens` to regenerate source tokens or `npm run design:check` to check that the generated CSS is current. Source coverage and intentional product extensions are documented in [the design system](docs/design-system.md).

## Production integration

For a deployed multi-user SaaS, replace the local adapter with authenticated server actions or API routes and a database (for example PostgreSQL and Prisma). Enforce workspace membership and roles on the server, validate mutations, add a real invitation flow, and use provider-verified billing events to update subscriptions. The existing UI intentionally does not pretend those integrations are active.
