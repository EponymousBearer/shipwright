# 🛠️ Shipwright

**Claude skills that make your AI ship _production-grade_ code, not demos.**

[![Claude Skill](https://img.shields.io/badge/Claude-Skill-d97757)](https://github.com/anthropics/skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

AI coding agents write code that _looks_ done. It runs in the demo, the happy
path works, the screenshot looks great — and then it leaks a secret to the
browser, swallows an error, ships the whole page to the client, and falls over
the first time a real user hits an empty state.

**Shipwright** is a Claude skill that fixes that. Drop it in, and Claude starts
writing and reviewing your **Next.js (App Router) + React + TypeScript** code
like a senior engineer who has been paged at 2 a.m. It bakes in the unhappy
paths, kills the footguns, and refuses to call a feature "done" until it
actually is.

> Demo: _add a 15-second GIF here of Claude catching a `NEXT_PUBLIC_` secret
> leak and adding the missing loading/error/empty states. The GIF is the single
> highest-leverage thing in this README — record it before launch._

---

## What it catches (a taste)

| AI usually writes… | Shipwright makes Claude… |
|---|---|
| `"use client"` on the whole page, fetch in `useEffect` | Keep it a Server Component; push `"use client"` to the leaves |
| `NEXT_PUBLIC_STRIPE_SECRET_KEY` | Never prefix secrets; guard server modules with `server-only` |
| `formData.get("title") as string` | Validate every input at the boundary with Zod |
| `Promise<any>` from `res.json()` | Parse + type the response; no `any` |
| `try { ... } catch {}` | Log-and-rethrow or surface; never swallow |
| Sequential `await`s | `Promise.all` to kill waterfalls |
| Only the success path | Loading + empty + error + unauthorized states |

Full list in [`checklist.md`](./plugins/shipwright/skills/nextjs-production/references/checklist.md);
copy-pasteable before/after fixes in
[`anti-patterns.md`](./plugins/shipwright/skills/nextjs-production/references/anti-patterns.md).

---

## Install

### Option A — Claude Code plugin marketplace (recommended)

```bash
# In Claude Code:
/plugin marketplace add EponymousBearer/shipwright
/plugin install shipwright@shipwright
```

That's it. The skill auto-activates whenever you work on Next.js / React / TS.
You can also invoke it explicitly: `/shipwright:nextjs-production`.

### Option B — Manual (Claude Code, no marketplace)

```bash
git clone https://github.com/EponymousBearer/shipwright.git
cp -r shipwright/plugins/shipwright/skills/nextjs-production ~/.claude/skills/
# (use .claude/skills/ inside a project to scope it to that project)
```

Restart Claude Code, then run `/skills` to confirm it loaded.

### Option C — Claude.ai (web / desktop)

1. Zip the `plugins/shipwright/skills/nextjs-production` folder (must contain
   `SKILL.md` at its root).
2. In Claude.ai: **Settings → Capabilities/Skills → Upload skill**, and select
   the zip. _(Available on paid plans; verify the exact menu in current docs.)_

---

## How to use it

You don't have to do anything special. Once installed, just build:

> "Add a server action to create a post and show it in the list."

Claude will apply the standards automatically — validating input, enforcing
authz server-side, wiring loading/error/empty states, and revalidating the data
after the mutation. For a deliberate deep audit:

> "Use the nextjs-production skill to review this file for production
> readiness."

---

## What's inside

```
shipwright/
├── .claude-plugin/
│   └── marketplace.json              # makes this repo a plugin marketplace
└── plugins/
    └── shipwright/
        ├── .claude-plugin/
        │   └── plugin.json           # plugin manifest
        └── skills/
            └── nextjs-production/
                ├── SKILL.md          # the skill (standards + workflow)
                └── references/
                    ├── checklist.md      # exhaustive review checklist
                    └── anti-patterns.md  # before/after fixes
```

---

## Roadmap

Shipwright starts focused and grows into a small, opinionated collection:

- [x] `nextjs-production` — Next.js / React / TS production standards
- [ ] `api-hardening` — Node/Express route + input + auth hardening
- [ ] `db-discipline` — PostgreSQL/Prisma query, migration & N+1 review
- [ ] `test-pragmatist` — the tests worth writing, in the right order

⭐ **Star the repo** if you want these — it tells me what to build next.

---

## Contributing

Found a footgun Claude keeps stepping on? PRs and issues welcome.

- New anti-patterns (with a real before/after) are the most valuable contribution.
- Keep `SKILL.md` tight (< ~300 lines); push depth into `references/`.
- Validate locally: `node scripts/validate.mjs`.

## A note on trust

Skills can influence everything Claude writes for you. Read any skill — this one
included — before installing it, the same way you'd review any dependency.
Everything here is plain Markdown; there's no executable code in the skill
itself.

## License

[MIT](./LICENSE). Build on it, fork it, ship it.
