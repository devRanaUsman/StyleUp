import { randomBytes } from 'node:crypto';
import { createUser } from '../src/server/auth.mjs';
import { getDb, seed, closeDb, getNextProductId } from '../src/server/db.mjs';
import { placeOrder } from '../src/server/commerce.mjs';

if (!process.argv.includes('--local-demo')) throw new Error('Use --local-demo to create local testing accounts.');
await seed();
const db = await getDb();
const credentials = [];
const accounts = {};

for (const role of ['admin', 'seller', 'customer']) {
  const email = `${role}.demo@styleup.test`;
  if (await db.collection('users').findOne({ email })) throw new Error(`${email} already exists; no accounts were changed.`);
  const password = `At9!${randomBytes(10).toString('base64url')}`;
  accounts[role] = await createUser({ name: `Demo ${role[0].toUpperCase() + role.slice(1)}`, email, password, role, status: 'active' });
  credentials.push({ role, email, password, path: role === 'customer' ? '/login' : `/${role}/login` });
}

const sample = await db.collection('products').findOne({});
const { _id, product_id, id, ...base } = sample;

for (const [name, slug, price, status] of [['Demo Linen Dress', 'demo-linen-dress', 49, 'active'], ['Demo Everyday Dress', 'demo-everyday-dress', 35, 'draft']]) {
  const nextId = await getNextProductId();
  const p = {
    ...base,
    product_id: nextId,
    id: nextId,
    sellerId: accounts.seller.id,
    product_name: name,
    slug,
    status,
    SKU: 'AT-DEMO-' + slug,
    brand: 'StyleUp',
    regular_price: price,
    sale_price: null,
    sale_status: false,
    discount_percentage: 0,
    short_description: 'A demonstration product for testing the seller and customer experience.',
    full_description: 'This local demo product lets you test editing, inventory, checkout and fulfilment.',
    variants: [{ color: 'Black', size: 'M', stock: 20 }],
    colors: [{ name: 'Black', hex: '#1B1B1B' }],
    sizes: ['M'],
    stock_quantity: 20,
    availability: 'in_stock',
    rating: 0,
    review_count: 0,
    reviews: [],
    featured: false,
    best_seller: false,
    new_arrival: true,
    created_date: new Date().toISOString()
  };
  await db.collection('products').insertOne(p);
}

const address = { id: 'demo-home', label: 'Demo home', firstName: 'Demo', lastName: 'Customer', address1: '123 Demo Lane', city: 'Demo City', state: 'Test State', postal: '10001', country: 'United States', phone: '2025550100', isDefault: true };
const customerData = typeof accounts.customer.data === 'string' ? JSON.parse(accounts.customer.data) : (accounts.customer.data || {});
customerData.addresses = [address];
await db.collection('users').updateOne({ id: accounts.customer.id }, { $set: { data: customerData } });

const customer = await db.collection('users').findOne({ email: 'customer.demo@styleup.test' });
const p = await db.collection('products').findOne({ slug: 'demo-linen-dress' });
const order = await placeOrder(customer, {
  idempotencyKey: crypto.randomUUID(),
  items: [{ productId: p.product_id, color: 'Black', size: 'M', qty: 1 }],
  shipping: address,
  contact: { email: customer.email, phone: address.phone },
  method: { id: 'standard' },
  payment: { type: 'cod' }
});

console.log(JSON.stringify({ credentials, demoOrder: order.number }, null, 2));
await closeDb();
