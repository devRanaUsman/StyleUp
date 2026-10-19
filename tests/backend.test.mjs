import test from 'node:test';
import assert from 'node:assert/strict';

const testDbName = `styleup_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const baseUri = process.env.MONGODB_URI || 'mongodb://thetonyst:ironman7@ac-thpbanu-shard-00-00.prexbjw.mongodb.net:27017,ac-thpbanu-shard-00-01.prexbjw.mongodb.net:27017,ac-thpbanu-shard-00-02.prexbjw.mongodb.net:27017/styleup?authSource=admin&replicaSet=atlas-915uel-shard-0&ssl=true&retryWrites=true&w=majority';
process.env.MONGODB_URI = baseUri.replace(/\/[a-zA-Z0-9_-]+(\?|$)/, `/${testDbName}$1`);

const { handle } = await import('../src/server/api.mjs');
const { getDb, seed, closeDb } = await import('../src/server/db.mjs');
const { createUser, session } = await import('../src/server/auth.mjs');

await seed();
const admin = await createUser({ name: 'Admin', email: 'admin@example.test', password: 'Securepass123!', role: 'admin' });
const adminCookie = (await session(admin.id)).split(';')[0];

async function call(path, { method = 'GET', body, cookie, origin = 'http://localhost:3000' } = {}) {
  const response = await handle(new Request('http://localhost:3000/api/' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  }));
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0]
  };
}

async function signup(email, role = 'customer') {
  const r = await call('auth/signup', { method: 'POST', body: { name: 'Test User', email, password: 'Password123!', role } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return r;
}

const productInput = {
  product_name: 'Test product',
  slug: 'test-product',
  category: 'Women',
  subcategory: 'Dresses',
  regular_price: 50,
  sale_price: null,
  brand: 'Test',
  short_description: 'Test product',
  full_description: 'A test product description.',
  thumbnail: 'https://example.com/image.jpg',
  variants: [{ color: 'Black', size: 'M', stock: 3 }],
  status: 'active'
};

test('Shared sign-in accepts customer, seller and admin accounts and preserves permissions', async () => {
  for (const role of ['customer', 'seller', 'admin']) {
    const email = role + '-shared@example.test';
    await createUser({ name: 'Shared login', email, password: 'Password123!', role });
    const result = await call('auth/login', { method: 'POST', body: { email, password: 'Password123!', remember: true } });
    assert.equal(result.status, 200);
    assert.equal(result.data.user.role, role);
    assert.equal((await call('auth/me', { cookie: result.cookie })).data.user.role, role);
    assert.equal((await call('admin/overview', { cookie: result.cookie })).status, role === 'admin' ? 200 : 403);
    assert.equal((await call('seller/overview', { cookie: result.cookie })).status, role === 'customer' ? 403 : 200);
  }
});

test('Product creation cannot be used to overwrite another seller product', async () => {
  const a = await createUser({ name: 'Owner', email: 'owner@example.test', password: 'Password123!', role: 'seller' });
  const b = await createUser({ name: 'Other', email: 'other@example.test', password: 'Password123!', role: 'seller' });
  const ownerCookie = (await session(a.id)).split(';')[0], otherCookie = (await session(b.id)).split(';')[0];
  const created = await call('seller/products', { method: 'POST', cookie: ownerCookie, body: { ...productInput, slug: 'protected-product' } });
  assert.equal(created.status, 201);
  const id = created.data.item.product_id;
  const attack = await call('seller/products/' + id, { method: 'POST', cookie: otherCookie, body: { ...productInput, slug: 'stolen-product' } });
  assert.equal(attack.status, 404);
  const unchanged = (await call('items/api?slug=protected-product')).data.item;
  assert.equal(unchanged.sellerId, a.id);
  assert.equal(unchanged.product_name, productInput.product_name);
  assert.equal((await call('seller/products/' + id, { method: 'PATCH', cookie: ownerCookie, body: { ...productInput, slug: 'protected-product', regular_price: 60 } })).status, 200);
  assert.equal((await call('items/api?slug=protected-product')).data.item.regular_price, 60);
});

test('Rejected profile updates leave passwords and sessions unchanged', async () => {
  const c = await signup('atomic-profile@example.test');
  const patch = await call('users/' + c.data.user.id, { method: 'PATCH', cookie: c.cookie, body: { email: 'new@example.test', currentPassword: 'Password123!', newPassword: 'Changed456!' } });
  assert.equal(patch.status, 400);
  assert.equal((await call('auth/me', { cookie: c.cookie })).status, 200);
  assert.equal((await call('auth/login', { method: 'POST', body: { email: '  ATOMIC-PROFILE@example.test  ', password: 'Password123!', role: 'customer' } })).status, 200);
});

test('Remember-me controls cookie persistence and demoted sellers cannot keep selling', async () => {
  const customer = await signup('remember@example.test');
  for (const remember of [false, true]) {
    const response = await handle(new Request('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify({ email: customer.data.user.email, password: 'Password123!', role: 'customer', remember }) }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('set-cookie').includes('Max-Age=604800'), remember);
  }
  const seller = await createUser({ name: 'Demoted seller', email: 'demoted@example.test', password: 'Password123!', role: 'seller' });
  const cookie = (await session(seller.id)).split(';')[0];
  const p = await call('seller/products', { method: 'POST', cookie, body: { ...productInput, slug: 'demoted-seller-product' } });
  assert.equal(p.status, 201);
  assert.equal((await call('admin/users/' + seller.id, { method: 'PATCH', cookie: adminCookie, body: { role: 'customer', status: 'active' } })).status, 200);
  assert.equal((await call('items/api?slug=demoted-seller-product')).status, 404);
  assert.equal((await call('seller/products', { cookie })).status, 401);
});

test('Quotes do not reserve stock, changed totals require review, retries do not duplicate orders', async () => {
  const c = await signup('quote@example.test');
  const created = await call('admin/products', { method: 'POST', cookie: adminCookie, body: { ...productInput, slug: 'quoted-product', regular_price: 20 } });
  const p = created.data.item;
  const payload = { idempotencyKey: crypto.randomUUID(), items: [{ productId: p.product_id, color: 'Black', size: 'M', qty: 1 }], contact: { email: c.data.user.email }, shipping: { firstName: 'Test', lastName: 'Buyer', address1: 'Demo Street', city: 'City', state: 'State', postal: '12345', country: 'US' }, method: { id: 'standard' }, payment: { type: 'cod' } };
  const quote = await call('orders/quote', { method: 'POST', cookie: c.cookie, body: payload });
  assert.equal(quote.status, 200); assert.equal(quote.data.quote.totals.total, 27.55);
  assert.equal((await call('items/api?slug=quoted-product')).data.item.stock_quantity, 3);
  await call('admin/products/' + p.product_id, { method: 'PATCH', cookie: adminCookie, body: { ...productInput, slug: 'quoted-product', regular_price: 30 } });
  assert.equal((await call('orders', { method: 'POST', cookie: c.cookie, body: { ...payload, expectedTotal: quote.data.quote.totals.total } })).status, 409);
  assert.equal((await call('items/api?slug=quoted-product')).data.item.stock_quantity, 3);
  const refreshed = await call('orders/quote', { method: 'POST', cookie: c.cookie, body: payload });
  const placed = await call('orders', { method: 'POST', cookie: c.cookie, body: { ...payload, expectedTotal: refreshed.data.quote.totals.total } });
  assert.equal(placed.status, 201);
  assert.equal((await call('orders', { method: 'POST', cookie: c.cookie, body: payload })).data.order.number, placed.data.order.number);
  assert.equal((await call('items/api?slug=quoted-product')).data.item.stock_quantity, 2);
});

test('Multi-seller orders support item-level fulfilment, returns and isolated seller views', async () => {
  const c = await signup('mixed-order@example.test');
  const sellers = await Promise.all(['first', 'second'].map(n => createUser({ name: n, email: n + '-fulfil@example.test', password: 'Password123!', role: 'seller' })));
  const cookies = await Promise.all(sellers.map(async s => (await session(s.id)).split(';')[0]));
  const products = [];
  for (let i = 0; i < 2; i++) {
    const r = await call('seller/products', { method: 'POST', cookie: cookies[i], body: { ...productInput, slug: 'mixed-product-' + i } });
    assert.equal(r.status, 201);
    products.push(r.data.item);
  }
  const placed = await call('orders', { method: 'POST', cookie: c.cookie, body: { idempotencyKey: crypto.randomUUID(), items: products.map(p => ({ productId: p.product_id, color: 'Black', size: 'M', qty: 1 })), contact: { email: c.data.user.email }, shipping: { firstName: 'Test', lastName: 'Buyer', address1: 'Demo Street', city: 'City', state: 'State', postal: '12345', country: 'US' }, method: { id: 'standard' }, payment: { type: 'cod' } } });
  assert.equal(placed.status, 201); const o = placed.data.order;
  const endpoint = 'seller/orders/' + o.number;
  assert.equal((await call(endpoint, { method: 'PATCH', cookie: cookies[0], body: { status: 'Processing', itemKeys: [o.items[1].key] } })).status, 404);
  assert.equal((await call(endpoint, { method: 'PATCH', cookie: cookies[0], body: { status: 'Processing', itemKeys: [o.items[0].key] } })).status, 200);
  const sellerView = (await call('seller/orders', { cookie: cookies[0] })).data.items.find(x => x.number === o.number);
  assert.equal(sellerView.items.length, 1); assert.equal(sellerView.payment, undefined); assert.equal(sellerView.contact, undefined);
  const adminEndpoint = 'admin/orders/' + o.number;
  for (const status of ['Shipped', 'Out for delivery', 'Delivered']) assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { status, itemKeys: [o.items[0].key] } })).status, 200);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { status: 'Processing', itemKeys: [o.items[1].key] } })).status, 200);
  await call('seller/products/' + products[0].product_id, { method: 'PATCH', cookie: cookies[0], body: { ...productInput, slug: 'mixed-product-0', variants: [{ color: 'Blue', size: 'L', stock: 2 }] } });
  assert.equal((await call('orders/' + o.number + '/return', { method: 'POST', cookie: c.cookie, body: { reason: 'Please return the delivered item.' } })).status, 201);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { status: 'Returned', itemKeys: [o.items[0].key] } })).status, 200);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { status: 'Returned', itemKeys: [o.items[0].key] } })).status, 200);
  const restored = (await call('items/api?slug=mixed-product-0')).data.item;
  assert.equal(restored.variants.find(v => v.color === 'Black' && v.size === 'M').stock, 1);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { paymentStatus: 'refunded' } })).status, 409);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { paymentStatus: 'paid' } })).status, 200);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { paymentStatus: 'unpaid' } })).status, 409);
  assert.equal((await call(adminEndpoint, { method: 'PATCH', cookie: adminCookie, body: { paymentStatus: 'refunded' } })).status, 200);
});

test('Authentication, marketplace ownership, checkout and administration', async () => {
  const customer = await signup('customer@example.test'); const stranger = await signup('stranger@example.test'); const seller = await signup('seller@example.test', 'seller'); const otherSeller = await signup('other-seller@example.test', 'seller');
  assert.equal((await call('auth/signup', { method: 'POST', body: { name: 'Intruder', email: 'intruder@example.test', password: 'Password123!', role: 'admin' } })).status, 400);
  assert.equal((await call('admin/users', { cookie: customer.cookie })).status, 403);
  assert.equal((await call('admin/users')).status, 401);
  assert.equal((await call('seller/products', { cookie: seller.cookie })).status, 403);
  assert.equal((await call('auth/login', { method: 'POST', body: { email: 'admin@example.test', password: 'Securepass123!', role: 'customer' } })).status, 401);
  assert.equal((await call('auth/login', { method: 'POST', body: { email: 'customer@example.test', password: 'Password123!' }, origin: 'https://evil.test' })).status, 403);
  assert.equal((await call('users/' + stranger.data.user.id, { method: 'PATCH', cookie: customer.cookie, body: { name: 'Taken over' } })).status, 403);
  assert.equal((await call('users/' + customer.data.user.id, { method: 'PATCH', cookie: customer.cookie, body: { role: 'admin' } })).status, 400);
  for (const s of [seller, otherSeller]) assert.equal((await call('admin/users/' + s.data.user.id, { method: 'PATCH', cookie: adminCookie, body: { role: 'seller', status: 'active' } })).status, 200);
  const sellerLogin = await call('auth/login', { method: 'POST', body: { email: 'seller@example.test', password: 'Password123!', role: 'seller' } }); const sellerCookie = sellerLogin.cookie;
  const otherLogin = await call('auth/login', { method: 'POST', body: { email: 'other-seller@example.test', password: 'Password123!', role: 'seller' } }); const otherCookie = otherLogin.cookie;
  const created = await call('seller/products', { method: 'POST', cookie: sellerCookie, body: { ...productInput, sellerId: otherSeller.data.user.id } }); assert.equal(created.status, 201, JSON.stringify(created.data)); const p = created.data.item; assert.equal(p.sellerId, seller.data.user.id);
  assert.equal((await call('seller/products/' + p.product_id, { method: 'PATCH', cookie: otherCookie, body: productInput })).status, 404);
  assert.equal((await call('seller/products/' + p.product_id, { method: 'DELETE', cookie: otherCookie, body: {} })).status, 404);
  assert.equal((await call('items/api?slug=test-product')).data.item.product_id, p.product_id);
  const base = { idempotencyKey: crypto.randomUUID(), items: [{ productId: p.product_id, color: 'Black', size: 'M', qty: 2, price: 0.01 }], contact: { email: 'spoof@example.test' }, shipping: { firstName: 'Test', lastName: 'Customer', address1: '123 Street', city: 'City', state: 'Region', postal: '12345', country: 'US' }, method: { id: 'standard' }, payment: { type: 'cod' }, totals: { total: 0.01 } };
  const placed = await call('orders', { method: 'POST', cookie: customer.cookie, body: base }); assert.equal(placed.status, 201, JSON.stringify(placed.data)); const o = placed.data.order; assert.equal(o.totals.subtotal, 100); assert.equal(o.totals.total, 108); assert.equal(o.contact.email, 'customer@example.test'); assert.equal(o.payment.status, 'unpaid');
  assert.equal((await call('orders', { method: 'POST', cookie: customer.cookie, body: base })).data.order.number, o.number);
  assert.equal((await call('items/api?slug=test-product')).data.item.variants[0].stock, 1);
  assert.equal((await call('orders/' + o.number, { cookie: stranger.cookie })).status, 404);
  assert.equal((await call('orders?email=customer@example.test', { cookie: stranger.cookie })).data.orders.length, 0);
  assert.equal((await call('orders', { method: 'POST', cookie: stranger.cookie, body: base })).status, 409);
  assert.equal((await call('orders', { method: 'POST', cookie: customer.cookie, body: { ...base, idempotencyKey: crypto.randomUUID() } })).status, 409);
  assert.equal((await call('orders', { method: 'POST', cookie: customer.cookie, body: { ...base, idempotencyKey: crypto.randomUUID(), items: [{ ...base.items[0], qty: -2 }] } })).status, 400);
  assert.equal((await call('orders', { method: 'POST', cookie: customer.cookie, body: { ...base, idempotencyKey: crypto.randomUUID(), payment: { type: 'card' } } })).status, 400);
  assert.equal((await call('seller/orders/' + o.number, { method: 'PATCH', cookie: otherCookie, body: { status: 'Processing' } })).status, 404);
  assert.equal((await call('seller/orders/' + o.number, { method: 'PATCH', cookie: sellerCookie, body: { paymentStatus: 'paid' } })).status, 403);
  assert.equal((await call('seller/orders/' + o.number, { method: 'PATCH', cookie: sellerCookie, body: { status: 'Delivered' } })).status, 409);
  assert.equal((await call('seller/orders/' + o.number, { method: 'PATCH', cookie: sellerCookie, body: { status: 'Processing' } })).status, 200);
  assert.equal((await call('admin/orders/' + o.number, { method: 'PATCH', cookie: adminCookie, body: { status: 'Cancelled' } })).status, 200);
  assert.equal((await call('items/api?slug=test-product')).data.item.variants[0].stock, 3);
  await call('admin/orders/' + o.number, { method: 'PATCH', cookie: adminCookie, body: { status: 'Cancelled' } });
  assert.equal((await call('items/api?slug=test-product')).data.item.variants[0].stock, 3);
  assert.equal((await call('admin/users/' + admin.id, { method: 'PATCH', cookie: adminCookie, body: { role: 'customer', status: 'active' } })).status, 400);
  const db = await getDb();
  const raw = await db.collection('users').findOne({ id: customer.data.user.id });
  assert.notEqual(raw.password, 'Password123!');
  assert.ok(raw.password.includes(':'));
  assert.equal(customer.data.user.password, undefined);
  assert.equal((await call('auth/logout', { method: 'POST', cookie: customer.cookie, body: {} })).status, 200);
  assert.equal((await call('auth/me', { cookie: customer.cookie })).status, 401);
  assert.equal((await call('admin/users/' + seller.data.user.id, { method: 'PATCH', cookie: adminCookie, body: { role: 'seller', status: 'suspended' } })).status, 200);
  assert.equal((await call('auth/me', { cookie: sellerCookie })).status, 401);
  assert.equal((await call('items/api?slug=test-product')).status, 404);
});

test('Inventory rolls back completely on invalid promo and unavailable second item', async () => {
  const customer = await signup('rollback@example.test'); const cookie = customer.cookie;
  const p = (await call('items/api?pageSize=1')).data.items[0]; const v = p.variants.find(v => v.stock > 0); const initial = v.stock;
  const base = { idempotencyKey: crypto.randomUUID(), items: [{ productId: p.product_id, color: v.color, size: v.size, qty: 1 }], contact: { email: customer.data.user.email }, shipping: { firstName: 'A', lastName: 'B', address1: 'Street', city: 'City', state: 'State', postal: '123', country: 'US' }, method: { id: 'standard' }, payment: { type: 'cod' }, totals: { promoCode: 'INVALID' } };
  assert.equal((await call('orders', { method: 'POST', cookie, body: base })).status, 400);
  assert.equal((await call('items/api?slug=' + p.slug)).data.item.variants.find(x => x.color === v.color && x.size === v.size).stock, initial);
  assert.equal((await call('orders', { method: 'POST', cookie, body: { ...base, totals: {}, items: [...base.items, { productId: 999999, color: null, size: null, qty: 1 }] } })).status, 409);
  assert.equal((await call('items/api?slug=' + p.slug)).data.item.variants.find(x => x.color === v.color && x.size === v.size).stock, initial);
});

test('Account data persists, password changes revoke old sessions, and reviews require moderation', async () => {
  const c = await signup('profile@example.test'); const id = c.data.user.id;
  const address = { id: 'home', firstName: 'Test', lastName: 'Buyer', address1: 'Street 1', city: 'City', state: 'State', postal: '12345', country: 'US', isDefault: true };
  assert.equal((await call('users/' + id + '/addresses', { method: 'PUT', cookie: c.cookie, body: { addresses: [address] } })).status, 200);
  assert.equal((await call('users/' + id + '/wishlist', { method: 'PUT', cookie: c.cookie, body: { ids: [1, 2] } })).status, 200);
  assert.deepEqual((await call('auth/me', { cookie: c.cookie })).data.user.addresses, [address]);
  assert.deepEqual((await call('auth/me', { cookie: c.cookie })).data.user.wishlist, [1, 2]);
  const before = (await call('items/api?slug=linen-blend-midi-dress')).data.item;
  const review = await call('reviews', { method: 'POST', cookie: c.cookie, body: { productId: 1, rating: 5, title: 'Integration review', body: 'A review awaiting approval.' } });
  assert.equal(review.status, 201);
  assert.equal((await call('items/api?slug=linen-blend-midi-dress')).data.item.review_count, before.review_count);
  assert.equal((await call('admin/records/' + review.data.reference, { method: 'PATCH', cookie: adminCookie, body: { status: 'approved' } })).status, 200);
  const approved = (await call('items/api?slug=linen-blend-midi-dress')).data.item;
  assert.equal(approved.review_count, before.review_count + 1); assert.ok(approved.reviews.some(r => r.title === 'Integration review'));
  const changed = await call('users/' + id, { method: 'PATCH', cookie: c.cookie, body: { currentPassword: 'Password123!', newPassword: 'NewPassword456!' } });
  assert.equal(changed.status, 200); assert.equal((await call('auth/me', { cookie: c.cookie })).status, 401); assert.equal((await call('auth/me', { cookie: changed.cookie })).status, 200);
  assert.equal((await call('auth/login', { method: 'POST', body: { email: 'profile@example.test', password: 'Password123!' } })).status, 401);
  assert.equal((await call('auth/login', { method: 'POST', body: { email: 'profile@example.test', password: 'NewPassword456!' } })).status, 200);
  assert.equal((await call('users/' + id + '/payment-methods', { method: 'PUT', cookie: changed.cookie, body: { paymentMethods: [{ cardNumber: '4242424242424242' }] } })).status, 501);
});

test('Admin controls promotions, store availability, and customer cancellation restores inventory', async () => {
  const c = await signup('operations@example.test'); const p = (await call('items/api?slug=linen-blend-midi-dress')).data.item; const v = p.variants.find(v => v.stock > 0);
  const storeSettings = (await call('admin/settings', { cookie: adminCookie })).data;
  assert.equal((await call('admin/settings', { method: 'PATCH', cookie: adminCookie, body: { ...storeSettings, acceptOrders: false } })).status, 200);
  const base = { idempotencyKey: crypto.randomUUID(), items: [{ productId: p.product_id, color: v.color, size: v.size, qty: 1 }], contact: { email: c.data.user.email }, shipping: { firstName: 'A', lastName: 'B', address1: 'Street', city: 'City', state: 'State', postal: '123', country: 'US' }, method: { id: 'standard' }, payment: { type: 'cod' }, totals: { promoCode: 'TEST25' } };
  assert.equal((await call('orders', { method: 'POST', cookie: c.cookie, body: base })).status, 409);
  await call('admin/settings', { method: 'PATCH', cookie: adminCookie, body: { ...storeSettings, acceptOrders: true } });
  assert.equal((await call('admin/coupons', { method: 'POST', cookie: adminCookie, body: { code: 'TEST25', label: 'Test promotion', type: 'percent', value: 25, active: true } })).status, 200);
  const placed = await call('orders', { method: 'POST', cookie: c.cookie, body: base }); assert.equal(placed.status, 201); assert.equal(placed.data.order.totals.discount, 28.5);
  const cancelled = await call('orders/' + placed.data.order.number + '/cancel', { method: 'POST', cookie: c.cookie, body: {} }); assert.equal(cancelled.status, 200); assert.equal(cancelled.data.order.status, 'Cancelled');
  assert.equal((await call('items/api?slug=' + p.slug)).data.item.variants.find(x => x.color === v.color && x.size === v.size).stock, v.stock);
  assert.equal((await call('orders/' + placed.data.order.number + '/return', { method: 'POST', cookie: c.cookie, body: { reason: 'Not required' } })).status, 409);
  const contact = await call('contact', { method: 'POST', body: { name: 'Test', email: 'contact@example.test', subject: 'Support request', message: 'A test support message' } }); assert.equal(contact.status, 201);
  assert.ok((await call('admin/records?kind=contact', { cookie: adminCookie })).data.items.some(r => r.id === contact.data.reference));
});

test('Cleanup MongoDB test database', async () => {
  const db = await getDb();
  await db.dropDatabase();
  await closeDb();
});
