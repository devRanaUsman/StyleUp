# StyleUp backend verification — 9 October 2026

The customer, seller and administrator interfaces use the SQLite-backed API. Existing accounts, products and order history were preserved.

## Corrections

- Product creation only accepts the collection route. Sellers cannot overwrite another seller's product by posting to an item URL. Product updates enforce ownership independently of the HTTP method.
- Products owned by demoted, suspended or unapproved sellers cannot be purchased or listed publicly. New ownership assignments require an approved seller.
- Checkout reviews current server prices, promotions, delivery costs and stock before submission. A changed total requires another review. Inventory is reserved only when the order is saved, and retries use the existing order.
- Staff can fulfil selected order items independently. The interface offers valid next stages and limits payment and return controls to administrators. Removed variants are restored when their sold items are cancelled or returned, without double-restocking repeated requests.
- Rejected account updates do not partially change passwords or revoke sessions. Successful password changes also invalidate outstanding reset links. Remember-me controls persistent versus session cookies.
- Signed-in wishlists use separate local cache keys. Account and order fetch errors are visible instead of leaving a loading skeleton forever.
- Customer screens show saved order, payment and item statuses. Cancelled/returned orders do not display a delivery-in-progress timeline. Newsletter confirmation reports a saved subscription rather than claiming an email was sent.

## Verification

`npm test`: 10 passing tests, including permissions, seller isolation, quotes, stock rollback, mixed-seller fulfilment, returns, authentication, profile changes, moderation and store operations.

Production build succeeds. Browser checks covered all three demo logins, administrator overview/user/order controls, seller product editing, seller order processing, customer order details, a saved checkout address, server price review and successful demo order placement.

## Local demonstration data

- Administrator: `admin.demo@styleup.test` at `/admin/login`.
- Seller: `seller.demo@styleup.test` at `/seller/login`.
- Customer: `customer.demo@styleup.test` at `/login`.

Generated passwords were delivered in the chat; they are not stored in source. The seller has an active demo product and a draft product. The customer has a fictional saved address and demo orders, visible to the corresponding seller and administrator. Testing changed the draft product price to $36 and advanced one demo order to Processing.

`node --env-file-if-exists=.env scripts/create-demo.mjs --local-demo` creates demonstration accounts on a fresh database. It refuses to overwrite accounts that already exist.

## Integration limits

Payment is cash on delivery. Online card payments, saved cards and purchased gift cards require a payment-provider integration. Email recovery requires `MAIL_WEBHOOK_URL`; newsletter records do not send mail automatically. Carrier tracking and collection of money are manual operations.
