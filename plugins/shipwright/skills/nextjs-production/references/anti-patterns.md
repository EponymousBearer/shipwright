# Common AI Anti-Patterns → Production Fixes

Load this for concrete examples of the mistakes AI coding agents (including
this one) most often produce, and the corrected version. Each shows the
*plausible-looking wrong* code and the fix.

---

## 1. Fetching in `useEffect` on a page that should be a Server Component

**Anti-pattern**
```tsx
"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setData);
  }, []);
  if (!data) return <p>Loading...</p>;
  return <List items={data} />;
}
```
Problems: ships the page to the client, loading flicker, no SEO, extra round
trip, race conditions on refetch.

**Fix**
```tsx
// Server Component (no "use client")
export default async function Page() {
  const products = await getProducts(); // runs on the server
  if (products.length === 0) return <EmptyState />;
  return <List items={products} />;
}
```
Keep only the genuinely interactive bits as small Client Components.

---

## 2. Leaking a secret through `NEXT_PUBLIC_`

**Anti-pattern**
```ts
// .env
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_...   // embedded in the browser bundle!
```
Any `NEXT_PUBLIC_` value is shipped to every visitor.

**Fix**
```ts
// .env  — no NEXT_PUBLIC_ prefix; stays server-side
STRIPE_SECRET_KEY=sk_live_...
```
```ts
import "server-only";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // server only
```

---

## 3. Trusting client-validated input in a Server Action

**Anti-pattern**
```ts
"use server";
export async function createPost(formData: FormData) {
  const title = formData.get("title") as string; // unchecked, cast to string
  await db.post.create({ data: { title } });
}
```

**Fix**
```ts
"use server";
import { z } from "zod";

const Schema = z.object({ title: z.string().min(1).max(200) });

export async function createPost(formData: FormData) {
  const parsed = Schema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { ok: false, error: "Invalid title" } as const;

  const user = await requireUser(); // authz on the server, every time
  await db.post.create({ data: { title: parsed.data.title, userId: user.id } });
  revalidatePath("/posts");
  return { ok: true } as const;
}
```

---

## 4. `any` hiding a real bug

**Anti-pattern**
```ts
async function getUser(id: string): Promise<any> {
  const res = await fetch(`/api/users/${id}`);
  return res.json(); // any — every downstream access is unchecked
}
```

**Fix**
```ts
const User = z.object({ id: z.string(), email: z.string().email() });
type User = z.infer<typeof User>;

async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`getUser failed: ${res.status}`);
  return User.parse(await res.json()); // validated at the boundary
}
```

---

## 5. Swallowed error

**Anti-pattern**
```ts
try {
  await sendEmail(user);
} catch {} // silent — you'll never know email is broken
```

**Fix**
```ts
try {
  await sendEmail(user);
} catch (err) {
  logger.error("sendEmail failed", { userId: user.id, err });
  throw new EmailError("Could not send welcome email", { cause: err });
}
```

---

## 6. Sequential awaits creating a waterfall

**Anti-pattern**
```ts
const user = await getUser(id);
const orders = await getOrders(id);   // waits for getUser unnecessarily
const cart = await getCart(id);       // waits again
```

**Fix**
```ts
const [user, orders, cart] = await Promise.all([
  getUser(id),
  getOrders(id),
  getCart(id),
]);
```

---

## 7. Whole page marked `"use client"` to use one button

**Anti-pattern**: `"use client"` at the top of a 300-line page so a single
`onClick` works — shipping all of it to the browser.

**Fix**: keep the page a Server Component; extract just the interactive piece.
```tsx
// LikeButton.tsx
"use client";
export function LikeButton({ postId }: { postId: string }) {
  const [pending, start] = useTransition();
  return <button disabled={pending} onClick={() => start(() => like(postId))}>Like</button>;
}
```

---

## 8. "Done" without the unhappy paths

**Anti-pattern**: a component that renders `data.map(...)` and nothing else —
no loading, no empty, no error. Looks done; isn't.

**Fix**: implement and verify all four — loading (`loading.tsx`/Suspense),
empty (`data.length === 0`), error (`error.tsx`/typed result), and
unauthorized — before reporting completion.
