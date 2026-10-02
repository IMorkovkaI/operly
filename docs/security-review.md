# Security and deployment review

Reviewed 2 October 2026 using the OWASP security-check skill. Scope: the current local-storage demo, its source, dependency lockfile, public assets, Git file inventory, and a fresh production build. This is a targeted review, not a penetration test or a guarantee of security. Hosting, TLS, CDN rules, and a deployed production domain have not been configured or audited.

## Findings

### MEDIUM — Missing browser security policy

- Category: security headers / security misconfiguration.
- Location: `next.config.ts:3`.
- Evidence: production responses for `/` and `/workspace` have no `Content-Security-Policy`, `X-Frame-Options`, or `X-Content-Type-Options`. They also lack explicit `Referrer-Policy` and `Permissions-Policy` settings.
- Impact: the browser receives no explicit protection against framing the app; there is no CSP to contain a future script-injection defect. This is missing defense in depth, not a demonstrated XSS vulnerability. The current app has no server account or payment operation to compromise.
- Remediation: configure response headers in Next.js or at the chosen hosting edge, then test the final HTTPS responses. A minimal initial policy can block framing and plugins without interfering with Next's inline bootstrap:

```ts
// Inside nextConfig; proposed remediation, not applied by this audit.
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

That minimal CSP does **not** restrict script execution. A full script policy needs a separate implementation choice: Next's nonce approach requires dynamic rendering, while the current pages are prerendered. Do not paste `script-src 'self'` into this app without addressing inline bootstrap scripts and verifying hydration. See [Next.js headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers) and [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy).

### LOW — Exported workspace files and additional credential files are not ignored

- Category: secrets management / sensitive-data exposure.
- Location: `.gitignore:25`; export implementation at `components/workspace.tsx:84`.
- Evidence: `.env*`, `*.pem`, dependencies, build output, and existing test reports are ignored. An `operly-workspace.json` export copied into the repository, `.aws/credentials`, and `*.key` files are not covered. None of these sensitive files was found in the project during this review.
- Impact: a later copied export could commit teammate email addresses, task text, and project details; future credential files could be committed accidentally.
- Remediation: add narrow ignore rules before storing such files here. Suggested additions:

```gitignore
# Local credentials and private key containers
/.aws/
*.key
*.p12
*.pfx

# Workspace exports may contain personal or project data
/operly-workspace*.json

# Additional generated browser-test artifacts
/blob-report/
/playwright/.cache/
```

These are recommendations; the existing staged `.gitignore` changes were preserved. Ignore rules do not remove already tracked files or Git history and do not control which HTTP paths a server exposes.

## Deployment requirements and accepted demo limits

- **Use HTTPS and a production build.** The current LAN URL is an HTTP development preview. Publish using a Next-compatible production host or `npm run build` followed by `npm run start`, not `npm run dev`. Configure HTTPS redirection and HSTS at the chosen host; decide subdomain coverage only after checking the domain setup. HSTS is absent on the tested local HTTP server, which does not establish what a future hosting provider will send.
- **Browser data is not private account storage.** `lib/store.ts:16` reads, and `lib/store.ts:35` writes, unencrypted browser localStorage. Anyone using the same browser profile can view or change that workspace. A same-origin script can also read it. Team roles and billing plans are editable demo metadata, not authorization. This is intentional for the demo; do not collect confidential data or call it a shared authenticated SaaS. See [OWASP's local-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).
- **HTTP LAN mutations have a separate compatibility limit.** `components/workspace.tsx:21`, `:67`, `:74`, and `:155`, plus the landing preview, use `crypto.randomUUID()`. This API requires a secure browser context; plain HTTP network addresses do not qualify like localhost does. Use HTTPS for deployment and for testing edits on a physical device. This is not weak randomness or an authorization flaw. See [MDN's API requirements](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID).
- **Do not expose the project root as a static directory.** Next's production routing returned 404 for the probed development/source paths. A different server configured to serve the repository itself could expose those files.
- **Framework fingerprint:** `X-Powered-By: Next.js` is present. Setting `poweredByHeader: false` is optional low-impact hardening, not a substitute for patching.

## Verified checks

- `npm audit --json`: **0 known vulnerabilities** across production and development dependency trees at review time. This covers advisories known to the registry, not undisclosed vulnerabilities.
- Production build: successful.
- Browser regression: stored HTML/event-handler payloads in a project name, description, and task title render as text; no injected image element or payload execution was observed.
- HTTP probes: `/.git/config`, `/.env`, `/AGENTS.md`, `/CLAUDE.md`, `/package.json`, `/design/figma-source.json`, `/components/workspace.tsx`, and `/test-results/.last-run.json` returned **404**.
- Response-header inventory collected for `/` and `/workspace`. This check records headers; passing it does **not** mean the missing policies are fixed.
- Source review found no application API routes, Server Actions, database queries, shell execution of user input, user-controlled server fetches, upload handlers, session cookies, raw HTML injection sinks, or user-controlled navigation destinations. Auth, CSRF, IDOR, API rate limits, and database injection rules have no corresponding application backend surface in this version; reassess when a backend is added.
- Pattern scanning found no recognizable hardcoded credentials/private keys in project text or the single existing commit. No `.env` file was present. This was a bounded pattern scan, not a specialist full-history secret scanner.
- Public SVGs contained no scripts, event handlers, or `foreignObject` elements in the scan. Production browser chunks had no source-map references in the scan.

Re-run:

```sh
npm audit
npm run build
npm run test:e2e -- e2e/security.spec.ts
```

Screenshots are disabled. The browser tests use isolated local storage and do not alter a user's workspace.

## Files to keep and files to exclude

There is no selected hosting provider or deployment manifest yet. Do not add a provider-specific ignore file blindly. `.gitignore`, a build upload filter, and a runtime package have different purposes.

| Files | Version control / build input | Deployed runtime |
| --- | --- | --- |
| `app/`, `components/`, `lib/` | Keep and commit | Let Next build/package them |
| `app/figma-tokens.css`, `app/fonts/` | Required; keep fonts and their licenses | Generated CSS/font assets are needed; preserve required license notices |
| `public/design/`, icons | Required; keep | Public assets are intentionally downloadable |
| `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` | Keep; use `npm ci` for a reproducible build | Include what the host/runtime needs |
| `tests/`, `e2e/`, Playwright/ESLint configuration | Keep for validation/CI | Not needed in a minimal runtime package |
| `design/figma-source.json`, `scripts/generate-design-tokens.mjs` | Keep together for numeric design checks/regeneration | Not needed by the running app |
| `docs/`, `README.md`, `AGENTS.md`, `CLAUDE.md` | May remain in the repository | Not needed in a minimal runtime package; never put private notes in `public/` |
| `.git/`, local `.env*`, keys, credential folders, workspace exports | Never upload credentials/exports; `.git` is repository metadata | Exclude |
| Local `node_modules/`, `.next/`, `out/`, `build/`, `*.tsbuildinfo` | Existing ignore rules cover these; rebuild on the target build system | Production needs its freshly built output and runtime dependencies, not the local development cache |
| `test-results/`, `playwright-report/`, coverage, traces, logs, browser caches | Exclude generated files | Exclude; traces can contain form values and DOM content |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Unused starter assets; optional cleanup after checking references | Harmless but unnecessary public files |

**Git deployment blocker:** most implementation directories (`components/`, `lib/`, workspace routes, fonts, design assets, tests, docs, and scripts) are currently untracked. Commit the intended source and the lockfile before deploying from Git, otherwise the host will build an incomplete starter project. This review did not stage or commit files.

Install build-time dependencies too: TypeScript, Tailwind/PostCSS, and the test types currently included by `tsconfig.json` are development dependencies. Do not run `npm ci --omit=dev` before the build. Minimize runtime dependencies after building or let the hosting adapter package them. If choosing a self-hosted minimal package, Next's optional `output: 'standalone'` can trace runtime files; it is **not currently enabled**, and its documented handling of `public/` and `.next/static/` must be followed. See [Next.js output tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

Next serves files in [`public/`](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder) directly. Keeping tests and design metadata outside that directory is sufficient for ordinary Next routing; adding them to `.gitignore` just to hide them from HTTP is unnecessary.
