import { CATEGORIES } from '../data/catalog.js';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { getDb, catalog, product, saveProduct, getProduct, getNextProductId, settings, saveSettings, getCoupons, uid, record, audit, readOrder } from './db.mjs';
import { fail, requireUser, publicUser, createUser, verifyPassword, passwordHash, session, cookieToken, digest, clearCookie, rateLimit } from './auth.mjs';
import { addressSchema, quoteOrder, placeOrder, updateOrder, sellerOrder } from './commerce.mjs';

const password = z.string().min(8).max(128).regex(/[0-9]/, 'Password must contain a number.');
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const text = z.string().trim().min(1).max(200);
const json = (data, status = 200, cookie) => Response.json(data, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    ...(cookie ? { 'Set-Cookie': cookie } : {})
  }
});

const productSchema = z.object({
  product_name: text,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150),
  category: text,
  subcategory: text,
  regular_price: z.number().min(0.01).max(1000000),
  sale_price: z.number().min(0.01).nullable().optional(),
  brand: text,
  short_description: z.string().max(1000),
  full_description: z.string().max(10000),
  thumbnail: z.url().refine(s => s.startsWith('https://'), 'Use an HTTPS image URL.'),
  variants: z.array(z.object({
    color: z.string().min(1).max(80).nullable(),
    size: z.string().min(1).max(40).nullable(),
    stock: z.number().int().min(0).max(1000000)
  })).min(1).max(200),
  status: z.enum(['active', 'draft', 'archived']),
  sellerId: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  new_arrival: z.boolean().optional(),
  best_seller: z.boolean().optional(),
  collection: z.string().max(100).nullable().optional(),
  materials: z.string().max(500).optional()
}).refine(p => p.sale_price == null || p.sale_price <= p.regular_price, 'Sale price cannot exceed regular price.')
  .refine(p => new Set(p.variants.map(v => JSON.stringify([v.color, v.size]))).size === p.variants.length, 'Duplicate variants are not allowed.');

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function body(request) {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 100000) fail(413, 'Request too large.');
  try {
    return JSON.parse(raw || '{}');
  } catch {
    fail(400, 'Invalid JSON.');
  }
}

export async function handle(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const key = path.join('/');
    const method = request.method;
    const write = !['GET', 'HEAD'].includes(method);

    if (write) {
      const origin = request.headers.get('origin');
      if (!origin) fail(403, 'Invalid request origin.');

      const allowedOrigins = new Set();
      if (process.env.APP_ORIGIN) allowedOrigins.add(process.env.APP_ORIGIN.replace(/\/$/, ''));
      if (process.env.NEXT_PUBLIC_SITE_URL) allowedOrigins.add(process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''));
      if (url.origin) allowedOrigins.add(url.origin.replace(/\/$/, ''));

      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      if (host) {
        allowedOrigins.add(`http://${host}`);
        allowedOrigins.add(`https://${host}`);
      }

      if (process.env.VERCEL_URL) {
        allowedOrigins.add(`https://${process.env.VERCEL_URL.replace(/\/$/, '')}`);
        allowedOrigins.add(`http://${process.env.VERCEL_URL.replace(/\/$/, '')}`);
      }

      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch {}

      const isAllowed = allowedOrigins.has(origin.replace(/\/$/, '')) || (host && originHost === host);
      if (!isAllowed) fail(403, 'Invalid request origin.');

      if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'Use application/json.');
    }

    const b = write ? await body(request) : {};

    if (key === 'auth/signup' && method === 'POST') {
      const data = z.object({
        name: text,
        email,
        password,
        role: z.enum(['customer', 'seller']).default('customer')
      }).parse(b);
      await rateLimit('signup:' + data.email, 5);
      await rateLimit('signup:global', 100, 3600000);
      const db = await getDb();
      if (await db.collection('users').findOne({ email: data.email })) fail(409, 'An account with this email already exists.');
      const u = await createUser({ ...data, status: data.role === 'seller' ? 'pending' : 'active' });
      await audit(u, 'account.created', u.id);
      return json({ user: publicUser(u) }, 201, await session(u.id));
    }

    if (key === 'auth/login' && method === 'POST') {
      const data = z.object({
        email,
        password: z.string().min(1).max(128),
        role: z.enum(['customer', 'seller', 'admin']).optional(),
        remember: z.boolean().default(true)
      }).parse(b);
      await rateLimit('login:' + data.email);
      await rateLimit('login:global', 300, 900000);
      const db = await getDb();
      const u = await db.collection('users').findOne({ email: data.email });
      const valid = verifyPassword(data.password, u?.password);
      if (!valid || !u || u.status === 'suspended' || (data.role && data.role !== u.role)) fail(401, 'The email or password is incorrect for this sign-in.');
      const old = cookieToken(request);
      if (old) await db.collection('sessions').deleteOne({ hash: digest(old) });
      return json({ user: publicUser(u) }, 200, await session(u.id, data.remember));
    }

    if (key === 'auth/me' && method === 'GET') {
      const u = await requireUser(request);
      return json({ user: publicUser(u) });
    }

    if (key === 'auth/logout' && method === 'POST') {
      const token = cookieToken(request);
      if (token) {
        const db = await getDb();
        await db.collection('sessions').deleteOne({ hash: digest(token) });
      }
      return json({ ok: true }, 200, clearCookie());
    }

    if (key === 'auth/forgot' && method === 'POST') {
      const e = email.parse(b.email);
      await rateLimit('reset:' + e, 3, 3600000);
      if (!process.env.MAIL_WEBHOOK_URL) fail(503, 'Email recovery is not configured. Please contact the store administrator.');
      const db = await getDb();
      const u = await db.collection('users').findOne({ email: e });
      if (u) {
        const token = randomBytes(32).toString('hex');
        await db.collection('resets').deleteMany({
          $or: [{ userId: u.id }, { expires: { $lt: new Date() } }, { expires: { $lt: Date.now() } }]
        });
        await db.collection('resets').insertOne({
          hash: digest(token),
          userId: u.id,
          expires: new Date(Date.now() + 1800000)
        });
        const response = await fetch(process.env.MAIL_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.MAIL_WEBHOOK_TOKEN ? { Authorization: 'Bearer ' + process.env.MAIL_WEBHOOK_TOKEN } : {})
          },
          body: JSON.stringify({
            to: e,
            template: 'password-reset',
            resetUrl: (process.env.APP_ORIGIN || url.origin) + '/reset-password?token=' + token
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) fail(503, 'Email delivery is temporarily unavailable.');
      }
      return json({ ok: true });
    }

    if (key === 'auth/reset' && method === 'POST') {
      const data = z.object({ token: z.string().length(64), password }).parse(b);
      await rateLimit('reset-token:' + data.token, 5);
      const db = await getDb();
      const reset = await db.collection('resets').findOne({
        hash: digest(data.token),
        $or: [{ expires: { $gt: new Date() } }, { expires: { $gt: Date.now() } }]
      });
      if (!reset) fail(400, 'This reset link is invalid or expired.');
      await db.collection('users').updateOne({ id: reset.userId }, { $set: { password: passwordHash(data.password) } });
      await db.collection('sessions').deleteMany({ userId: reset.userId });
      await db.collection('resets').deleteMany({ userId: reset.userId });
      return json({ ok: true });
    }

    if (key === 'items/api' && method === 'GET') {
      let items = await catalog();
      const params = url.searchParams;
      const search = params.get('q')?.toLowerCase();
      if (params.get('slug')) {
        const p = items.find(p => p.slug === params.get('slug'));
        if (!p) fail(404, 'Product not found.');
        return json({ item: p });
      }
      for (const field of ['category', 'subcategory']) if (params.get(field)) items = items.filter(p => p[field + '_slug'] === params.get(field));
      if (params.get('collection')) items = items.filter(p => slug(p.collection || '') === params.get('collection'));
      for (const [param, field] of [['new', 'new_arrival'], ['best', 'best_seller'], ['sale', 'sale_status']]) if (params.get(param) === 'true') items = items.filter(p => p[field]);
      if (search) items = items.filter(p => search.split(/\s+/).every(w => `${p.product_name} ${p.category} ${p.subcategory} ${p.brand} ${p.tags.join(' ')}`.toLowerCase().includes(w)));
      const count = fn => { const m = {}; for (const p of items) for (const v of fn(p)) m[v] = (m[v] || 0) + 1; return m; };
      const price = p => p.sale_price ?? p.regular_price;
      const buckets = { 'under-50': [0, 50], '50-100': [50, 100], '100-150': [100, 150], '150-plus': [150, Infinity] };
      const facets = { subcategories: count(p => [p.subcategory + '|' + p.subcategory_slug]), sizes: count(p => p.sizes), colors: count(p => p.colors.map(c => c.name + '|' + c.hex)), brands: count(p => [p.brand]), price: Object.fromEntries(Object.entries(buckets).map(([k, [min, max]]) => [k, items.filter(p => price(p) >= min && price(p) < max).length])) };
      for (const [param, pick] of [['subcategories', p => [p.subcategory_slug]], ['size', p => p.sizes], ['color', p => p.colors.map(c => slug(c.name))], ['brand', p => [slug(p.brand)]]]) if (params.get(param)) { const values = params.get(param).split(','); items = items.filter(p => pick(p).some(v => values.includes(v))); }
      if (params.get('price')) items = items.filter(p => params.get('price').split(',').some(k => buckets[k] && price(p) >= buckets[k][0] && price(p) < buckets[k][1]));
      if (params.get('rating')) items = items.filter(p => p.rating >= Number(params.get('rating')));
      if (params.get('availability') === 'in-stock') items = items.filter(p => p.stock_quantity > 0);
      const sorts = { 'price-asc': (a, b) => price(a) - price(b), 'price-desc': (a, b) => price(b) - price(a), newest: (a, b) => b.created_date.localeCompare(a.created_date), rating: (a, b) => b.rating - a.rating, 'most-reviewed': (a, b) => b.review_count - a.review_count, 'best-selling': (a, b) => Number(b.best_seller) - Number(a.best_seller) || b.review_count - a.review_count };
      items.sort(sorts[params.get('sort')] || ((a, b) => Number(b.featured) - Number(a.featured) || Number(b.best_seller) - Number(a.best_seller)));
      const page = Math.max(1, parseInt(params.get('page')) || 1), size = Math.min(500, Math.max(1, parseInt(params.get('pageSize')) || 24));
      return json({ items: items.slice((page - 1) * size, page * size), total: items.length, page, pages: Math.max(1, Math.ceil(items.length / size)), facets });
    }

    if (key === 'store' && method === 'GET') {
      return json({ settings: await settings(), coupons: await getCoupons() });
    }

    if (path[0] === 'users') {
      const u = await requireUser(request);
      if (path[1] !== u.id) fail(403, 'You can only access your own account.');
      const db = await getDb();
      const data = typeof u.data === 'string' ? JSON.parse(u.data) : (u.data || {});

      if (path.length === 2 && method === 'PATCH') {
        const patch = z.object({
          name: text.optional(),
          email: email.optional(),
          phone: z.string().max(40).optional(),
          prefs: z.object({ news: z.boolean(), offers: z.boolean() }).optional(),
          currentPassword: z.string().max(128).optional(),
          newPassword: password.optional()
        }).strict().parse(b);
        if (patch.email && patch.email !== u.email) fail(400, 'Contact support to change your email address.');
        if (patch.newPassword && (!patch.currentPassword || !verifyPassword(patch.currentPassword, u.password))) fail(400, 'Your current password is incorrect.');
        let cookie;
        if (patch.newPassword) {
          await db.collection('users').updateOne({ id: u.id }, { $set: { password: passwordHash(patch.newPassword) } });
          await db.collection('sessions').deleteMany({ userId: u.id });
          await db.collection('resets').deleteMany({ userId: u.id });
          cookie = await session(u.id);
        }
        const updatedData = { ...data, ...(patch.phone !== undefined ? { phone: patch.phone } : {}), ...(patch.prefs ? { prefs: patch.prefs } : {}) };
        await db.collection('users').updateOne({ id: u.id }, { $set: { name: patch.name || u.name, data: updatedData } });
        const fresh = await db.collection('users').findOne({ id: u.id });
        return json({ user: publicUser(fresh) }, 200, cookie);
      }

      if (path[2] === 'wishlist' && method === 'GET') return json({ ids: data.wishlist || [] });
      if (path[2] === 'wishlist' && method === 'PUT') {
        data.wishlist = z.array(z.number().int().positive()).max(500).parse(b.ids);
        await db.collection('users').updateOne({ id: u.id }, { $set: { data } });
        return json({ ids: data.wishlist });
      }
      if (path[2] === 'addresses' && method === 'PUT') {
        data.addresses = z.array(addressSchema).max(20).parse(b.addresses);
        await db.collection('users').updateOne({ id: u.id }, { $set: { data } });
        const fresh = await db.collection('users').findOne({ id: u.id });
        return json({ user: publicUser(fresh) });
      }
      if (path[2] === 'payment-methods') fail(501, 'Saved cards require a payment provider. No card details are stored.');
    }

    if (path[0] === 'orders') {
      const u = await requireUser(request);
      if (key === 'orders/quote' && method === 'POST') {
        if (u.status !== 'active') fail(403, 'This account is not active.');
        return json({ quote: await quoteOrder(u, b) });
      }
      if (path.length === 1 && method === 'POST') {
        if (u.status !== 'active') fail(403, 'This account is not active.');
        return json({ order: await placeOrder(u, b) }, 201);
      }
      const db = await getDb();
      if (method === 'GET') {
        if (path.length === 1) {
          const orders = await db.collection('orders').find({ userId: u.id }).sort({ createdAt: -1 }).toArray();
          return json({ orders: orders.map(readOrder) });
        }
        const row = await db.collection('orders').findOne({ $or: [{ id: path[1] }, { number: path[1] }], userId: u.id });
        if (!row) fail(404, 'Order not found.');
        return json({ order: readOrder(row) });
      }
      if (path[2] === 'cancel' && method === 'POST') {
        const row = await db.collection('orders').findOne({ $or: [{ id: path[1] }, { number: path[1] }], userId: u.id });
        if (!row) fail(404, 'Order not found.');
        return json({ order: await updateOrder({ ...u, role: 'admin' }, path[1], { status: 'Cancelled' }) });
      }
      if (path[2] === 'return' && method === 'POST') {
        const row = await db.collection('orders').findOne({ $or: [{ id: path[1] }, { number: path[1] }], userId: u.id });
        if (!row) fail(404, 'Order not found.');
        const o = readOrder(row);
        if (!o.items.some(i => i.status === 'Delivered')) fail(409, 'Returns are available after delivery.');
        const reason = z.string().min(5).max(2000).parse(b.reason);
        const returns = await db.collection('records').find({ kind: 'returns', userId: u.id }).toArray();
        const duplicate = returns.some(r => {
          const d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
          return d.order === o.number && d.status === 'open';
        });
        if (duplicate) fail(409, 'A return request is already open for this order.');
        const id = await record('returns', { order: o.number, reason, status: 'open' }, u.id);
        return json({ id }, 201);
      }
    }

    if (['contact', 'subscribe', 'notify', 'reviews'].includes(key) && method === 'POST') {
      await rateLimit('engagement:global', 200, 3600000);
      let data, userId = null;
      if (key === 'subscribe') data = { email: email.parse(b.email) };
      if (key === 'contact') data = z.object({ name: text, email, subject: text, message: z.string().min(5).max(5000), orderNumber: z.string().max(100).optional() }).parse(b);
      if (key === 'notify') data = { email: email.parse(b.email), productId: z.number().int().positive().parse(Number(b.productId || b.product_id)), status: 'open' };
      if (key === 'reviews') {
        const u = await requireUser(request);
        userId = u.id;
        data = z.object({
          productId: z.number().int().positive(),
          rating: z.coerce.number().int().min(1).max(5),
          title: text,
          body: z.string().min(5).max(5000)
        }).parse({ ...b, productId: Number(b.productId || b.product_id), body: b.body || b.review || b.text });
        const p = await getProduct(data.productId);
        if (!p) fail(404, 'Product not found.');
        data.status = 'pending';
      }
      const id = await record(key, data, userId);
      return json({ ok: true, reference: id, status: data.status }, 201);
    }

    if (key === 'gift-cards') fail(501, 'Gift card purchases are unavailable until online payments are configured.');

    if (['admin', 'seller'].includes(path[0])) {
      const admin = path[0] === 'admin';
      const u = await requireUser(request, admin ? ['admin'] : ['seller', 'admin']);
      const area = path[1];
      const db = await getDb();

      if (area === 'overview' && method === 'GET') {
        const orders = (await db.collection('orders').find().sort({ createdAt: -1 }).toArray()).map(readOrder).filter(o => admin || o.items.some(i => i.sellerId === u.id));
        const productDocs = admin ? await db.collection('products').find().toArray() : await db.collection('products').find({ sellerId: u.id }).toArray();
        const products = productDocs.map(product);
        return json({
          products: products.length,
          orders: orders.length,
          revenue: orders.reduce((n, o) => n + o.items.filter(i => (admin || i.sellerId === u.id) && !['Cancelled', 'Returned'].includes(i.status)).reduce((s, i) => s + i.price * i.qty, 0), 0),
          lowStock: products.filter(p => p.stock_quantity < 10).length,
          ...(admin ? { users: await db.collection('users').countDocuments(), pendingSellers: await db.collection('users').countDocuments({ role: 'seller', status: 'pending' }) } : {})
        });
      }

      if (area === 'products') {
        if ((method === 'POST' && path.length !== 2) || (['PATCH', 'DELETE'].includes(method) && (path.length !== 3 || !/^\d+$/.test(path[2]))) || (method === 'GET' && path.length !== 2)) fail(404, 'Endpoint not found.');
        if (method === 'GET') {
          const productDocs = admin ? await db.collection('products').find().sort({ product_id: -1 }).toArray() : await db.collection('products').find({ sellerId: u.id }).sort({ product_id: -1 }).toArray();
          return json({ items: productDocs.map(product) });
        }
        if (method === 'POST' || method === 'PATCH') {
          const data = productSchema.parse(b);
          const category = CATEGORIES.find(c => c.name === data.category);
          if (!category || !category.subcategories.includes(data.subcategory)) fail(400, 'Choose a valid category and subcategory.');
          const old = path[2] ? await getProduct(Number(path[2])) : null;
          if (method === 'PATCH' && !old) fail(404, 'Product not found.');
          if (old && !admin && old.sellerId !== u.id) fail(404, 'Product not found.');
          const sellerId = admin ? (data.sellerId !== undefined ? data.sellerId : old?.sellerId ?? null) : u.id;
          if (sellerId) {
            const seller = await db.collection('users').findOne({ id: sellerId });
            if (!seller || !['seller', 'admin'].includes(seller.role) || seller.status !== 'active') fail(400, 'Select an active, approved seller.');
          }
          const colors = [...new Set(data.variants.map(v => v.color).filter(Boolean))].map(name => ({ name, hex: old?.colors?.find(c => c.name === name)?.hex || '#303030' }));
          const stock = data.variants.reduce((n, v) => n + v.stock, 0);
          const p = {
            rating: 0,
            review_count: 0,
            reviews: [],
            tags: [],
            created_date: new Date().toISOString(),
            care_instructions: 'Follow the care label.',
            currency: 'USD',
            ...old,
            ...data,
            sellerId,
            category_slug: category.slug,
            subcategory_slug: slug(data.subcategory),
            colors,
            sizes: [...new Set(data.variants.map(v => v.size).filter(Boolean))],
            stock_quantity: stock,
            availability: stock ? 'in_stock' : 'out_of_stock',
            sale_price: data.sale_price ?? null,
            sale_status: data.sale_price != null,
            discount_percentage: data.sale_price ? Math.round((1 - data.sale_price / data.regular_price) * 100) : 0,
            images: old?.thumbnail === data.thumbnail ? old.images : [{ src: data.thumbnail, alt: data.product_name }],
            SKU: old?.SKU || 'AT-' + uid().slice(0, 8)
          };
          if (old) {
            await saveProduct(p);
          } else {
            p.product_id = await getNextProductId();
            p.id = p.product_id;
            await db.collection('products').insertOne(p);
          }
          await audit(u, 'product.saved', String(p.product_id));
          return json({ item: p }, old ? 200 : 201);
        }
        if (method === 'DELETE') {
          const p = await getProduct(Number(path[2]));
          if (!p || (!admin && p.sellerId !== u.id)) fail(404, 'Product not found.');
          p.status = 'archived';
          await saveProduct(p);
          await audit(u, 'product.archived', String(p.product_id));
          return json({ ok: true });
        }
      }

      if (area === 'orders') {
        if (method === 'GET') {
          const orders = (await db.collection('orders').find().sort({ createdAt: -1 }).toArray()).map(readOrder);
          return json({ items: admin ? orders : orders.filter(o => o.items.some(i => i.sellerId === u.id)).map(o => sellerOrder(o, u)) });
        }
        if (method === 'PATCH') {
          const o = await updateOrder(u, path[2], b);
          return json({ order: admin ? o : sellerOrder(o, u) });
        }
      }

      if (admin && area === 'users') {
        if (method === 'GET') {
          const users = await db.collection('users').find().sort({ createdAt: -1 }).toArray();
          return json({ items: users.map(publicUser) });
        }
        if (method === 'PATCH') {
          const patch = z.object({ role: z.enum(['customer', 'seller', 'admin']), status: z.enum(['active', 'pending', 'suspended']) }).strict().parse(b);
          const target = await db.collection('users').findOne({ id: path[2] });
          if (!target) fail(404, 'User not found.');
          if (target.id === u.id) fail(400, 'You cannot change your own administrative access.');
          if (target.role === 'admin' && (patch.role !== 'admin' || patch.status !== 'active')) {
            const activeAdmins = await db.collection('users').countDocuments({ role: 'admin', status: 'active' });
            if (activeAdmins <= 1) fail(409, 'Keep at least one active administrator.');
          }
          await db.collection('users').updateOne({ id: target.id }, { $set: { role: patch.role, status: patch.status } });
          await db.collection('sessions').deleteMany({ userId: target.id });
          await audit(u, 'user.access.changed', target.id);
          return json({ ok: true });
        }
      }

      if (admin && area === 'coupons') {
        if (method === 'GET') {
          const coupons = await db.collection('coupons').find().toArray();
          return json({ items: coupons.map(r => {
            const d = r.data && typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || r);
            const { _id, ...rest } = d;
            return { ...rest, code: r.code };
          }) });
        }
        if (method === 'POST' || method === 'PATCH') {
          const data = z.object({ code: z.string().regex(/^[A-Z0-9_-]{3,30}$/), type: z.enum(['percent', 'shipping']), value: z.number().min(0).max(100), active: z.boolean(), label: text, minSubtotal: z.number().min(0).optional(), expires: z.string().nullable().optional() }).parse(b);
          if (data.expires && !Number.isFinite(Date.parse(data.expires))) fail(400, 'Enter a valid expiry date.');
          await db.collection('coupons').updateOne({ code: data.code }, { $set: { code: data.code, ...data, data } }, { upsert: true });
          await audit(u, 'coupon.saved', data.code);
          return json({ ok: true });
        }
      }

      if (admin && area === 'settings') {
        if (method === 'GET') return json(await settings());
        if (method === 'PATCH') {
          const data = z.object({ storeName: text, taxRate: z.number().min(0).max(1), standardShipping: z.number().min(0).max(10000), expressShipping: z.number().min(0).max(10000), freeShipping: z.number().min(0).max(100000), acceptOrders: z.boolean() }).strict().parse(b);
          await saveSettings(data);
          await audit(u, 'settings.updated', 'store');
          return json(data);
        }
      }

      if (admin && area === 'records') {
        if (method === 'GET') {
          const kind = z.enum(['contact', 'subscribe', 'notify', 'reviews', 'returns', 'audit']).parse(url.searchParams.get('kind') || 'contact');
          const docs = await db.collection('records').find({ kind }).sort({ createdAt: -1 }).limit(1000).toArray();
          return json({ items: docs.map(r => {
            const { _id, ...rest } = r;
            return { ...rest, data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data };
          }) });
        }
        if (method === 'PATCH') {
          const status = z.enum(['open', 'resolved', 'approved', 'rejected']).parse(b.status);
          const r = await db.collection('records').findOne({ id: path[2] });
          if (!r || ['audit', 'subscribe'].includes(r.kind)) fail(404, 'Record not found.');
          const rData = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
          await db.collection('records').updateOne({ id: r.id }, { $set: { data: { ...rData, status } } });
          await audit(u, 'record.updated', r.id);
          return json({ ok: true });
        }
      }
    }

    fail(404, 'Endpoint not found.');
  } catch (e) {
    if (e instanceof z.ZodError) {
      return json({ message: e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, 400);
    }
    if (e.code === 11000 || e.code?.startsWith?.('SQLITE_CONSTRAINT') || e.message?.includes?.('E11000') || e.message?.includes?.('duplicate key')) {
      return json({ message: 'This record already exists. Choose a unique email or product slug.' }, 409);
    }
    if (!e.status) console.error(e);
    return json({ message: e.status ? e.message : 'An unexpected server error occurred.' }, e.status || 500);
  }
}
