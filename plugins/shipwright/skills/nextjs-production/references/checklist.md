# Exhaustive Production Review Checklist

Load this when doing a thorough review or deep audit. It expands on the
summary in `SKILL.md`. Work top to bottom; for each item, either confirm it
holds or flag it explicitly.

## 1. Rendering & component boundaries
- [ ] Server Components by default; `"use client"` only where interactivity is real.
- [ ] `"use client"` lives at the leaves, not high in the tree.
- [ ] No server-only modules (db, secrets, Node APIs) imported into client code.
- [ ] `import "server-only"` guards modules that must never be bundled for the browser.
- [ ] `import "client-only"` guards browser-only modules where helpful.
- [ ] Props crossing the server→client boundary are serializable.

## 2. Data fetching & caching
- [ ] Initial data fetched in Server Components, not client `useEffect`.
- [ ] `fetch` cache mode set explicitly (`force-cache` / `no-store`), or segment config used.
- [ ] `revalidate` / `revalidateTag` / `revalidatePath` chosen intentionally.
- [ ] Independent requests parallelized (`Promise.all`); no accidental waterfalls.
- [ ] `<Suspense>` boundaries around slow data with real fallbacks.
- [ ] No over-fetching (selecting only needed fields/columns).
- [ ] Pagination/limits on any query that can grow unbounded.

## 3. TypeScript
- [ ] No `any`; `unknown` + narrowing where the type is genuinely open.
- [ ] All external input validated with a runtime schema (Zod or similar).
- [ ] Discriminated unions for multi-shape state; impossible states unrepresentable.
- [ ] Exported/module-boundary functions have explicit return types.
- [ ] `strict` (and ideally `noUncheckedIndexedAccess`) on in tsconfig.
- [ ] No non-null assertions (`!`) hiding real nullability.

## 4. Errors, loading, empty
- [ ] `error.tsx` for fallible segments; `loading.tsx` for perceptible loads; `not-found.tsx` where relevant.
- [ ] No empty `catch {}`; no errors silently swallowed.
- [ ] Expected failures returned as typed results; unexpected failures thrown.
- [ ] Empty state designed (new user / zero results / no data).
- [ ] User-facing error messages are helpful and don't leak internals.

## 5. Forms & mutations
- [ ] Server-side re-validation inside every Server Action / route handler.
- [ ] Pending state shown; submit disabled in flight; double-submit prevented.
- [ ] Affected data revalidated after success.
- [ ] Optimistic UI only where rollback on failure is handled.

## 6. Security
- [ ] No secret behind `NEXT_PUBLIC_`; no secret imported into client code.
- [ ] Authn/authz enforced server-side on every privileged path.
- [ ] Parameterized queries only; no string-built SQL/shell/HTML.
- [ ] Redirects, uploads, and user-supplied URLs validated/constrained.
- [ ] Rate limiting / abuse protection on public mutation endpoints.
- [ ] Secrets read from env at runtime on the server only; env validated at startup.

## 7. Performance
- [ ] Heavy/conditional client widgets behind `dynamic(() => import(...))`.
- [ ] `next/image` and `next/font` used; no layout shift from images/fonts.
- [ ] Memoization used to fix measured problems, not as ritual.
- [ ] No large dependencies pulled into the client bundle unnecessarily.

## 8. Accessibility
- [ ] Semantic elements; interactive things are real `button`/`a`.
- [ ] Inputs have associated labels; images have alt text.
- [ ] Visible focus states; full keyboard operability.
- [ ] Color contrast meets WCAG AA for text.

## 9. Code quality & maintainability
- [ ] Smallest diff that solves the problem; no speculative abstraction.
- [ ] No dead code, unused exports, or commented-out blocks left behind.
- [ ] Names reveal intent; magic numbers/strings named.
- [ ] Side effects isolated; pure logic separated from I/O where practical.

## 10. Observability & operability
- [ ] Errors logged with enough context to debug (not just `console.log`).
- [ ] No noisy logging of secrets or PII.
- [ ] Meaningful boundaries so one failing widget doesn't blank the page.
