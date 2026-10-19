# Style Hub — Backend Architecture

Phase 2 deliverable. Describes the API that backs the existing React/Vite storefront, the
decisions behind it, and the places where reality differs from the original plan.

---

## 1. Stack and shape

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | Node 22, TypeScript 5 (strict, `noUncheckedIndexedAccess`) | Matches the Phase 3 database package |
| Framework | NestJS 11 | Module graph gives per-feature isolation and testable DI |
| ORM | Prisma 7.10, `prisma-client` generator + `@prisma/adapter-pg` | Fixed by the Phase 3 handoff; types come from `src/generated/prisma` |
| Cache / rate limit / locks | Redis (ioredis) | Session versions, facet caches, throttler storage, vote dedupe |
| Queues | BullMQ | Email, notifications, inventory release, search index |
| Payments | Stripe, behind a port | A `test` provider reproduces the demo's decline behaviour without network |
| Logs | nestjs-pino with redaction | Credentials and card fields never reach the log stream |

Single deployable. Queue workers run in-process by default and can be split out by setting
`QUEUE_WORKERS=false` on web dynos.

```
main.ts ─ raw-body route → helmet → compression → cookies → CORS
        └─ AppModule
             ├─ global: Config, Prisma, Redis, Settings, Audit, Queue, Mail
             ├─ guards (in order): Throttler → JwtAuth → Roles
             ├─ interceptor: ResponseInterceptor (envelope, opt-out per route)
             ├─ filter: HttpExceptionFilter (uniform error body)
             └─ feature modules (auth, products, cart, checkout, orders, payments, …)
```

**138 API routes** are registered under `/api/v1` (verified by booting the container and
reading the Express router — see `BACKEND-QA-REPORT.md`).

---

## 2. Compatibility with the unmodified storefront

`BACKEND-AUDIT.md` recorded 14 risks. The API is deliberately shaped so the current
frontend works **without edits**, and the risky behaviours are fixed server-side:

| Audit finding | How the API handles it |
| --- | --- |
| Storefront calls unversioned paths; `VITE_API_URL` supplies `/api/v1` | Global prefix `api/v1`; nothing else needed |
| `GET /auth/me` must return 200 when anonymous | `@OptionalAuth()`, returns `{ user: null }` |
| `POST /auth/signup` sends `role:"customer"` | Lenient `ValidationPipe` on that route *strips* `role` instead of 400-ing. Role is never taken from a request body |
| `POST /auth/forgot` | Alias alongside `/auth/forgot-password` |
| `GET /items/api` | Alias mapped onto the products/search handler |
| Unwrappers read top-level `items`/`total`/`facets` | Those routes are marked `@RawResponse()` and skip the `{success,data,meta}` envelope |
| 40-key snake_case product DTO | `product.mapper.ts` produces it exactly, including `variant_ids` |
| Order status derived from order age in the browser | Server returns `status`, `fulfillmentStatus` and `shipments[]`, computed from real shipment rows |
| Ownership checked in the client; `?email=` IDOR | Ownership enforced server-side. Signed in → own orders only, `?email` ignored. Guest → must present the exact email, else **404** (not 403, so the endpoint can't confirm an order exists) |
| PAN typed into a form to "save a card" | Replaced by a Stripe SetupIntent. Only provider token + brand/last4/expiry are stored |
| Totals computed in the browser | `PricingService` is the single source of truth; a client-sent total is never read |

---

## 3. Authentication

- **Access token**: JWT, 15 minutes, claims `{ sub, role, email, sv }`.
- **`sv` (session version)** lives in Redis at `auth:sv:<userId>`. Bumped on logout-all and
  on password change, which invalidates live access tokens **without a schema migration** —
  `User` has no such column and Phase 3 is frozen.
- **Refresh token**: 48 random bytes, SHA-256 at rest, cookie `sh_rt`, httpOnly, SameSite=Lax,
  path-scoped to `/api/v1/auth`. Rotated on every use; presenting a already-rotated token
  revokes the whole family (reuse detection).
- **Passwords**: argon2id, 19456 KiB / 2 iterations / 1 lane — identical to `seed.ts`, so the
  seeded accounts log in. Login runs a dummy hash for unknown emails to equalise timing.
- **Throttling**: login 10/15 min, register 5/h, forgot 5/h, reset 10/h, keyed on IP **and**
  submitted email so one attacker can't lock out an inbox by burning the IP budget.
- **Role escalation**: `SELLER` is granted only by `SellersService.decide()` inside a
  transaction that moves profile status and user role together. There is no self-service path.

---

## 4. Money

**Every amount is an integer number of cents.** Major units appear only at the public DTO
boundary via `toMajor()`. `allocate()` implements largest-remainder apportionment, used for
order-level discount, tax, shipping-across-sellers and commission reversal — never
`Math.round` per line, which drifts.

Pricing order of operations (`PricingService`, used by both cart view and checkout):

```
line subtotals
  → coupon discount (apportioned across lines)
  → shipping (free over threshold, from settings)
  → tax on (discounted lines + shipping)
  → gift card applied last
```

Anything that would change a total is recomputed server-side at checkout under the same
transaction that reserves stock, so the price shown and the price charged cannot diverge.

---

## 5. Inventory

All mutations go through `InventoryService`, which takes `SELECT … FOR UPDATE` on `Inventory`
rows **ordered by `variantId`** — consistent lock ordering is what prevents deadlocks when two
carts contain the same two variants in different orders. Every change writes an
`InventoryMovement` row (`stockBefore/After`, `reservedBefore/After`).

Lifecycle: `reserve` at create-payment (expires after `inventory.reservationMinutes`, default
30) → `consume` on the paid webhook → `release` on failure, cancellation or the every-minute
expiry cron.

---

## 6. Checkout and payments

```
POST /checkout/validate          reprice + report blockers
POST /checkout/shipping-options  quotes for the entered address
POST /checkout/create-payment    reserve stock, snapshot pricing, return client secret
        ↓ (browser confirms with Stripe)
POST /payments/webhooks/stripe   ← the ONLY thing that creates an order
```

**Idempotency has two layers.** `CheckoutSession.idempotencyKey` is unique, so a retried call
finds the existing session; the same key is passed to the provider, so the provider returns the
same intent rather than creating a second one.

**Deviation from `REMAINING-WORK.md` §2.5.** The spec puts the PaymentIntent creation *inside*
the reservation transaction. It is instead issued after that transaction commits, with the
reservations released if the provider then fails. Holding row locks across a network round trip
serialises checkout under load and risks lock-timeout cascades when the provider is slow. The
compensating path is explicit and logged. Flag this if you want the spec followed literally.

Webhooks: every event is inserted into `PaymentEvent` first; the unique
`(provider, providerEventId)` index makes duplicate delivery a no-op returning 200. Handler
failures are recorded on the row and rethrown so the provider retries. The route is registered
with `express.raw` **before** the JSON parser so signature verification sees the original bytes.

Order creation from a paid session, in one transaction: split lines per seller into
`SellerOrder`s → `OrderItem`s carrying a **commission rate snapshot** (so changing a rule later
never rewrites history) → consume reservations → consume coupon under a row lock → debit gift
card → write `SALE_CREDIT` / `COMMISSION_DEBIT` ledger entries with
`availableAt = now + payouts.holdDays`.

---

## 7. Marketplace money

The seller ledger is **append-only**; a balance is never a stored number, always
`SUM(amountCents)` split by whether `availableAt` has passed. Entry types: `SALE_CREDIT`,
`COMMISSION_DEBIT`, `REFUND_DEBIT`, `COMMISSION_REVERSAL_CREDIT`, `PAYOUT_DEBIT`,
`PAYOUT_REVERSAL_CREDIT`. Every entry carries an `idempotencyKey`, and writes use
`skipDuplicates`, so a replayed webhook cannot double-credit.

Commission resolution order: `SELLER` rule → `CATEGORY` rule → `GLOBAL` rule → seller profile
override → `commission.defaultBps` setting.

Payout requests lock the cleared rows (`FOR UPDATE`) and write the `PAYOUT_DEBIT` in the same
transaction, so two simultaneous requests cannot both pass the balance check. A failed or
rejected payout writes a compensating credit.

Refunds reverse commission **pro rata**: the platform returns exactly the commission it charged
on the refunded units.

---

## 8. Catalog and search

- Listing filters build one `Prisma.ProductWhereInput`; facets are computed from a **bounded id
  scan** (`FACET_ID_CAP = 10_000`) plus 2 `groupBy` calls and 1 raw UNION query for
  colours/sizes with `COUNT(DISTINCT productId)`. Never per-row. Beyond the cap the response
  sets `facetsApproximate: true`.
- Price buckets are parsed permissively (`under-50`, `50-100`, `over-500`, `500+`, `100to200`,
  named tiers) because the storefront's exact vocabulary wasn't visible in the audit.
- Search uses `pg_trgm` `similarity()` for "did you mean" correction plus category hits.
- `minPriceCents`/`maxPriceCents`/`ratingAvg` are denormalised and refreshed on write, which is
  what makes `price-asc` / `rating` sorts indexable.

`GET /storefront/config` serves the merchandising data the storefront currently hard-codes in
`src/data/catalog.js`, so nav, hero, collections and shipping thresholds can change without a
redeploy.

---

## 9. Errors, envelopes, observability

Success (default): `{ success: true, data, meta }`. Routes the storefront already consumes opt
out with `@RawResponse()`.

Errors, always: `{ success: false, error: { code, message, details }, requestId }`. Prisma
`P2002 → 409`, `P2025 → 404`. 5xx bodies are scrubbed in production. `requestId` comes from
`RequestIdMiddleware` and is echoed in the `X-Request-Id` header and every log line.

`GET /health` is liveness and touches nothing. `GET /health/ready` probes Postgres and Redis.

---

## 10. Known gaps

- **Media**: product images are "register an existing URL", not signed direct-to-S3 upload —
  there is no object storage in this deployment. `Media` rows are shaped so a real uploader can
  replace `MediaService.register()` without touching callers.
- **Tax** is a flat-rate provider reading `TaxRate` (most-specific match wins). No external tax
  engine.
- **Shipping** quotes come from `ShippingMethod` rows, not a carrier API.
- No integration or e2e test run has happened. See `BACKEND-QA-REPORT.md`.
