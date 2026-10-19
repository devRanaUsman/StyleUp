import { z } from 'zod';
import { getDb, product, saveProduct, getProduct, settings, uid, audit, readOrder } from './db.mjs';
import { fail } from './auth.mjs';

export const addressSchema = z.object({
  id: z.string().max(100).optional(),
  label: z.string().max(100).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  address1: z.string().trim().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postal: z.string().trim().min(1).max(30),
  country: z.string().trim().min(1).max(100),
  phone: z.string().max(40).optional(),
  isDefault: z.boolean().optional()
});

const orderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    color: z.string().max(100).nullable().optional(),
    size: z.string().max(100).nullable().optional(),
    qty: z.number().int().min(1).max(99)
  })).min(1).max(100),
  shipping: addressSchema,
  contact: z.object({
    email: z.email(),
    phone: z.string().max(40).optional()
  }),
  method: z.object({
    id: z.enum(['standard', 'express', 'pickup'])
  }),
  payment: z.object({
    type: z.literal('cod')
  }),
  totals: z.object({
    promoCode: z.string().max(40).nullable().optional()
  }).optional(),
  expectedTotal: z.number().nonnegative().optional()
});

const round = n => Math.round(n * 100) / 100;

export async function quoteOrder(user, input) {
  return await priceOrder(user, orderSchema.parse(input));
}

async function priceOrder(user, b) {
  const config = await settings();
  if (!config.acceptOrders) fail(409, 'The store is temporarily not accepting orders.');

  const db = await getDb();
  const items = [];
  const merged = new Map();

  for (const i of b.items) {
    const key = JSON.stringify([i.productId, i.color ?? null, i.size ?? null]);
    const prev = merged.get(key);
    merged.set(key, { ...i, qty: i.qty + (prev?.qty || 0) });
  }

  for (const i of merged.values()) {
    const p = await getProduct(i.productId);
    if (!p || p.status !== 'active') fail(409, 'A product is no longer available.');
    if (p.sellerId) {
      const seller = await db.collection('users').findOne({ id: p.sellerId });
      if (seller?.status !== 'active' || !['seller', 'admin'].includes(seller.role)) {
        fail(409, 'This seller is unavailable.');
      }
    }
    const v = p.variants.find(v => (v.color ?? null) === (i.color ?? null) && (v.size ?? null) === (i.size ?? null));
    if (!v || v.stock < i.qty || i.qty > 99) fail(409, `Insufficient stock for ${p.product_name}.`);

    items.push({
      key: `${p.product_id}|${i.color ?? ''}|${i.size ?? ''}`,
      productId: p.product_id,
      sellerId: p.sellerId,
      slug: p.slug,
      name: p.product_name,
      image: p.thumbnail,
      category: p.category_slug,
      subcategory: p.subcategory_slug,
      color: i.color ?? null,
      size: i.size ?? null,
      qty: i.qty,
      price: p.sale_price ?? p.regular_price,
      status: 'Order placed'
    });
  }

  const subtotal = round(items.reduce((n, i) => n + i.price * i.qty, 0));
  let discount = 0;
  const code = b.totals?.promoCode?.toUpperCase() || null;

  let promo = null;
  if (code) {
    const couponDoc = await db.collection('coupons').findOne({ code });
    promo = couponDoc ? (couponDoc.data && typeof couponDoc.data === 'string' ? JSON.parse(couponDoc.data) : (couponDoc.data || couponDoc)) : null;
  }

  if (code && (!promo?.active || (promo.expires && Date.parse(promo.expires) <= Date.now()) || subtotal < (promo.minSubtotal || 0))) {
    fail(400, 'This promo code is unavailable.');
  }

  if (promo?.type === 'percent') discount = round(subtotal * promo.value / 100);

  const method = b.method.id;
  const shipping = method === 'pickup' ? 0 : method === 'express' ? config.expressShipping : (subtotal >= config.freeShipping || promo?.type === 'shipping' ? 0 : config.standardShipping);
  const tax = round((subtotal - discount) * config.taxRate);
  const total = round(subtotal - discount + shipping + tax);
  const eta = method === 'pickup' ? 'Ready in 2 hours' : method === 'express' ? '1–2 business days' : '3–6 business days';

  return {
    userId: user.id,
    contact: { email: user.email, phone: b.contact.phone || b.shipping.phone || '' },
    shipping: b.shipping,
    items,
    method: {
      id: method,
      name: { standard: 'Standard shipping', express: 'Express shipping', pickup: 'Store pickup' }[method],
      eta
    },
    payment: { type: 'cod', status: 'unpaid' },
    status: 'Order placed',
    totals: { subtotal, discount, shipping, tax, total, promoCode: code },
    eta
  };
}

export async function placeOrder(user, input) {
  const b = orderSchema.parse(input);
  const db = await getDb();

  const existing = await db.collection('orders').findOne({
    $or: [{ idempotency: b.idempotencyKey }, { idempotencyKey: b.idempotencyKey }]
  });
  if (existing) {
    if (existing.userId !== user.id) fail(409, 'Request already used.');
    return readOrder(existing);
  }

  const quote = await priceOrder(user, b);
  if (b.expectedTotal !== undefined && round(b.expectedTotal) !== quote.totals.total) {
    fail(409, 'The order total changed. Review the updated price before placing your order.');
  }

  // Deduct inventory
  for (const i of quote.items) {
    const p = await getProduct(i.productId);
    if (!p) fail(409, 'A product is no longer available.');
    const v = p.variants.find(v => (v.color ?? null) === i.color && (v.size ?? null) === i.size);
    if (!v || v.stock < i.qty) fail(409, `Insufficient stock for ${p.product_name}.`);
    v.stock -= i.qty;
    p.stock_quantity = p.variants.reduce((n, v) => n + v.stock, 0);
    p.availability = p.stock_quantity ? 'in_stock' : 'out_of_stock';
    await saveProduct(p);
  }

  const orderNumber = 'AT-' + uid().replaceAll('-', '').slice(0, 16).toUpperCase();
  const placedAt = new Date().toISOString();
  const order = {
    ...quote,
    id: orderNumber,
    number: orderNumber,
    placedAt
  };

  await db.collection('orders').insertOne({
    id: order.number,
    number: order.number,
    userId: user.id,
    idempotency: b.idempotencyKey,
    idempotencyKey: b.idempotencyKey,
    data: order,
    ...order,
    createdAt: order.placedAt
  });

  await audit(user, 'order.created', order.number);
  return order;
}

export const stages = ['Order placed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];

export async function updateOrder(user, id, input) {
  const db = await getDb();
  const row = await db.collection('orders').findOne({ $or: [{ id }, { number: id }] });
  if (!row) fail(404, 'Order not found.');
  const o = readOrder(row);

  const b = z.object({
    status: z.enum([...stages, 'Cancelled', 'Returned']).optional(),
    paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
    tracking: z.string().max(200).optional(),
    itemKeys: z.array(z.string().min(1).max(300)).min(1).max(100).optional()
  }).strict().refine(b => b.status !== undefined || b.paymentStatus !== undefined || b.tracking !== undefined, 'Choose an order update.').parse(input);

  if (user.role !== 'admin' && !o.items.some(i => i.sellerId === user.id)) fail(404, 'Order not found.');
  if (user.role !== 'admin' && (b.paymentStatus || b.status === 'Returned')) fail(403, 'Only an administrator can change payment or return status.');

  if (b.paymentStatus && b.paymentStatus !== o.payment.status) {
    const allowed = { unpaid: ['paid'], paid: ['refunded'], refunded: [] };
    if (!allowed[o.payment.status]?.includes(b.paymentStatus)) fail(409, 'Payment can move from unpaid to paid, then refunded.');
  }

  const owned = o.items.filter(i => user.role === 'admin' || i.sellerId === user.id);
  if (b.itemKeys?.some(key => !owned.some(i => i.key === key))) fail(404, 'Order item not found.');

  for (const i of owned.filter(i => !b.itemKeys || b.itemKeys.includes(i.key))) {
    if (b.status && b.status !== i.status) {
      if (['Cancelled', 'Returned'].includes(i.status)) fail(409, 'Closed order items cannot be reopened.');
      if (b.status === 'Returned' && i.status !== 'Delivered') fail(409, 'Only delivered items can be returned.');
      if (b.status === 'Cancelled' && stages.indexOf(i.status) >= 2) fail(409, 'Shipped items must be returned instead of cancelled.');
      if (stages.includes(b.status) && stages.indexOf(b.status) !== stages.indexOf(i.status) + 1) fail(409, 'Move the order forward one stage at a time.');

      if (['Cancelled', 'Returned'].includes(b.status)) {
        const p = await getProduct(i.productId);
        if (p) {
          let v = p.variants.find(v => (v.color ?? null) === (i.color ?? null) && (v.size ?? null) === (i.size ?? null));
          if (!v) {
            v = { color: i.color, size: i.size, stock: 0 };
            p.variants.push(v);
            if (i.color && !p.colors.some(c => c.name === i.color)) p.colors.push({ name: i.color, hex: '#303030' });
            if (i.size && !p.sizes.includes(i.size)) p.sizes.push(i.size);
          }
          v.stock += i.qty;
          p.stock_quantity = p.variants.reduce((n, v) => n + v.stock, 0);
          p.availability = 'in_stock';
          await saveProduct(p);
        }
      }
      i.status = b.status;
    }
    if (b.tracking !== undefined) i.tracking = b.tracking;
  }

  const active = o.items.filter(i => !['Cancelled', 'Returned'].includes(i.status));
  o.status = active.length ? stages[Math.min(...active.map(i => stages.indexOf(i.status)))] : (o.items.every(i => i.status === 'Cancelled') ? 'Cancelled' : 'Returned');

  if (b.paymentStatus) o.payment.status = b.paymentStatus;

  await db.collection('orders').updateOne(
    { $or: [{ id }, { number: id }] },
    { $set: { data: o, ...o } }
  );

  await audit(user, 'order.updated', id);
  return o;
}

export function sellerOrder(o, user) {
  const items = o.items.filter(i => i.sellerId === user.id);
  return {
    number: o.number,
    placedAt: o.placedAt,
    shipping: o.shipping,
    items,
    status: [...new Set(items.map(i => i.status))].join(', '),
    totals: { total: round(items.reduce((n, i) => n + i.qty * i.price, 0)) },
    method: o.method
  };
}
