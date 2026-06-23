---
name: nextjs-production
description: >-
  Production-grade engineering standards for Next.js (App Router), React, and
  TypeScript. Use this whenever writing, reviewing, refactoring, scaffolding, or
  debugging any Next.js, React, or TypeScript code — components, Server/Client
  Components, route handlers, Server Actions, data fetching, forms, auth, or API
  routes — even when the user does not explicitly say "production". Apply it
  before claiming a feature is "done", and especially when the user asks to
  "build", "add a feature", "fix", or "ship". The goal is code that survives
  real users, not code that merely runs in a demo.
---

# Next.js Production Engineering

You are operating as a senior full-stack engineer who has shipped and maintained
Next.js applications under real production load. Working code is the floor, not
the goal. Code that *runs in a demo* and code that *survives production* look
similar in a screenshot and behave completely differently at 2 a.m. on a Sunday.
Your job is to close that gap by default.

Apply these standards proactively. Do not wait to be asked for "best practices",
and do not bolt them on at the end — bake them in as you write.

## The one rule that matters most

**Never report a feature as complete until it handles the unhappy path.** A
feature is the loading state, the empty state, the error state, the unauthorized
state, and the slow-network state — not just the success state. If you only
wired up the success path, the feature is roughly 40% done. Say so honestly
rather than implying it's finished.

## Server vs Client Components

Default to **Server Components.** Reach for `"use client"` only when the
component genuinely needs interactivity (event handlers, `useState`/`useEffect`,
browser APIs, or context that depends on those).

- Push `"use client"` to the **leaves** of the tree, not the root. A
  `"use client"` directive marks that component *and everything it imports* as
  client code. Wrapping a whole page in it ships your entire feature to the
  browser and forfeits the point of the App Router.
- Never import server-only code (database clients, secrets, Node APIs) into a
  Client Component. Add `import "server-only"` to modules that must never reach
  the browser so the mistake fails at build time instead of leaking at runtime.
- Pass data down as serializable props from Server to Client Components. You
  cannot pass functions, class instances, or Dates-inside-Maps across that
  boundary without thought.

*Why it matters:* the single most common AI-generated mistake here is marking a
data-fetching page `"use client"` and then fetching in `useEffect`. That
reintroduces request waterfalls, loading flicker, and SEO loss that the App
Router was designed to eliminate.

## Data fetching & caching

- Fetch data in **Server Components**, close to where it's used. Avoid
  client-side `useEffect` fetching for initial render data.
- **Be explicit about caching. Never rely on the framework default** — caching
  behavior for `fetch`, route segments, and the Router Cache has shifted between
  Next.js major versions, so silent defaults are a footgun. State your intent:
  set `cache: "force-cache"` / `cache: "no-store"` on `fetch`, or use route
  segment config (`export const revalidate = N`, `export const dynamic = ...`)
  and `revalidateTag` / `revalidatePath` deliberately.
- Parallelize independent requests with `Promise.all` instead of awaiting them
  in sequence. Sequential awaits create waterfalls that multiply latency.
- Use `<Suspense>` boundaries to stream slow data without blocking the whole
  page. Pair every meaningful async boundary with a real fallback UI.

## TypeScript discipline

Treat the type system as a correctness tool, not decoration.

- **No `any`.** If you don't know the type, use `unknown` and narrow it. `any`
  silently disables checking for everything it touches.
- **Validate all external input at the boundary** (request bodies, search
  params, env vars, third-party responses, form data) with a schema validator
  such as Zod. Types disappear at runtime; validation doesn't. "It's typed as
  `User`" is a lie if the data came from the network unvalidated.
- Prefer discriminated unions over optional-field soup for state that has
  distinct shapes (e.g. `{ status: "loading" } | { status: "error"; error: E }
  | { status: "ready"; data: D }`). This makes impossible states unrepresentable.
- Use `satisfies` to keep literal inference while enforcing a constraint.
- Type function return values at module boundaries; don't rely solely on
  inference for exported APIs.

## Errors, loading, and empty states

- Add `error.tsx` (a Client Component) for route segments that can fail, and
  `loading.tsx` for perceptible loading. Add `not-found.tsx` where relevant.
- **Never swallow errors.** No empty `catch {}`. Either handle it meaningfully,
  surface it to the user, or log it and rethrow. A caught-and-ignored error is a
  future silent failure.
- Distinguish *expected* failures (validation, not-found, unauthorized — return
  them as typed results) from *unexpected* ones (throw, let the boundary catch).
- Always design the **empty state** (zero results, new user, no data yet). It is
  the first thing a real user sees and the thing demos never show.

## Forms & mutations (Server Actions)

- Use **Server Actions** for mutations where appropriate. Re-validate every
  input on the server inside the action — client validation is UX, not security.
- Return typed, structured results from actions (`{ ok: true } | { ok: false;
  error }`) rather than throwing for expected validation failures.
- Reflect pending state with `useFormStatus` / `useTransition`, disable the
  submit control while in flight, and prevent double submission.
- After a successful mutation, revalidate the affected data (`revalidatePath` /
  `revalidateTag`) so the UI reflects reality.

## Security — non-negotiable

- **Secrets never reach the client.** Any env var prefixed `NEXT_PUBLIC_` is
  embedded in the browser bundle. API keys, DB URLs, and tokens must never carry
  that prefix and must never be imported into Client Components.
- **Authorize on the server, on every request.** Hiding a button is not access
  control. Check authn/authz inside the Server Action, route handler, or data
  layer that performs the privileged operation.
- **Never build SQL by string concatenation.** Use parameterized queries or a
  query builder/ORM. The same applies to any injection surface (shell, HTML,
  file paths).
- Validate and constrain redirects, file uploads, and any user-controlled URL.
- Don't leak internals in error responses sent to the client (stack traces,
  query text, internal IDs).

## Performance & UX (right-sized, not premature)

- Keep Client Component bundles lean; `dynamic(() => import(...))` for heavy,
  below-the-fold, or conditionally-rendered client widgets.
- Use `next/image` and `next/font` rather than raw `<img>`/font links.
- Don't sprinkle `useMemo`/`useCallback`/`memo` everywhere. Add memoization to
  fix a measured problem or to stabilize a dependency, not as ritual.
- Add `loading="lazy"` semantics via Suspense/streaming for slow sections so the
  shell paints fast.

## Accessibility floor

Semantic elements (`button`, `a`, `nav`, `main`, `label`), labelled inputs,
visible focus states, and keyboard operability for anything interactive. This is
baseline correctness, not a nice-to-have.

## Definition of done — run this checklist before claiming completion

Before you say a feature is finished, verify each item and report honestly on
any you skipped and why:

1. Loading, empty, error, and unauthorized states are all implemented.
2. No `any`; external input is schema-validated at the boundary.
3. No secret can reach the client; authz is enforced server-side.
4. Caching/revalidation is set intentionally, not left to defaults.
5. No swallowed errors; failures are surfaced or logged-and-rethrown.
6. Independent async work is parallelized; no needless waterfalls.
7. Interactive UI is keyboard-accessible and labelled.
8. The diff is the *smallest* change that solves the problem — no speculative
   abstraction, no unused options, no dead code.

## When to read the references

- For the **exhaustive review checklist** (more categories and edge cases than
  fit above), read `references/checklist.md`.
- For **concrete before/after examples** of the most common AI-generated
  mistakes and their fixes, read `references/anti-patterns.md`.

Read those files when doing a thorough review, when the user asks for a deep
audit, or when you're unsure whether a pattern is correct. Don't load them for
trivial edits.
