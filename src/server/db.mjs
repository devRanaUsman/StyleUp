import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

export const uid = () => randomUUID();

const uri = process.env.MONGODB_URI || 'mongodb://thetonyst:ironman7@ac-thpbanu-shard-00-00.prexbjw.mongodb.net:27017,ac-thpbanu-shard-00-01.prexbjw.mongodb.net:27017,ac-thpbanu-shard-00-02.prexbjw.mongodb.net:27017/styleup?authSource=admin&replicaSet=atlas-915uel-shard-0&ssl=true&retryWrites=true&w=majority';

// Serverless connection caching pattern
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });
  global._mongoClientPromise = client.connect();
}

export async function getClient() {
  return await global._mongoClientPromise;
}

let initPromise = null;

export async function getDb() {
  const client = await getClient();
  const db = client.db();
  if (!initPromise) {
    initPromise = ensureInitialized(db).catch(err => {
      initPromise = null;
      console.warn('Database initialization warning:', err.message);
    });
  }
  await initPromise;
  return db;
}

export async function closeDb() {
  if (global._mongoClientPromise) {
    const client = await global._mongoClientPromise;
    await client.close();
    delete global._mongoClientPromise;
    initPromise = null;
  }
}

export async function ensureInitialized(db) {
  try {
    await Promise.allSettled([
      db.collection('users').createIndex({ id: 1 }, { unique: true }),
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('products').createIndex({ product_id: 1 }, { unique: true }),
      db.collection('products').createIndex({ slug: 1 }, { unique: true }),
      db.collection('products').createIndex({ sellerId: 1 }),
      db.collection('products').createIndex({ status: 1 }),
      db.collection('orders').createIndex({ idempotency: 1 }, { unique: true }),
      db.collection('orders').createIndex({ id: 1 }, { unique: true }),
      db.collection('orders').createIndex({ userId: 1 }),
      db.collection('coupons').createIndex({ code: 1 }, { unique: true }),
      db.collection('records').createIndex({ id: 1 }, { unique: true }),
      db.collection('records').createIndex({ kind: 1 }),
      db.collection('sessions').createIndex({ hash: 1 }, { unique: true }),
      db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
      db.collection('rate_limits').createIndex({ key: 1 }, { unique: true }),
      db.collection('rate_limits').createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
      db.collection('resets').createIndex({ hash: 1 }, { unique: true }),
      db.collection('resets').createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
    ]);
  } catch (e) {
    console.warn('Index initialization note:', e.message);
  }

  // Ensure default store settings
  const settingsDoc = await db.collection('settings').findOne({ $or: [{ _id: 'store_settings' }, { id: 1 }] });
  if (!settingsDoc) {
    const defaultSettings = {
      storeName: 'StyleUp',
      taxRate: 0.08,
      standardShipping: 5.95,
      expressShipping: 14.95,
      freeShipping: 50,
      acceptOrders: true
    };
    await db.collection('settings').updateOne(
      { _id: 'store_settings' },
      { $setOnInsert: { id: 1, ...defaultSettings, data: defaultSettings } },
      { upsert: true }
    );
  }

  // Auto-seed if products collection is empty
  const count = await db.collection('products').countDocuments();
  if (count === 0) {
    await seedInternal(db);
  }
}

async function seedInternal(db) {
  const count = await db.collection('products').countDocuments();
  if (count > 0) return;

  const productsRaw = JSON.parse(readFileSync(new URL('../data/products.json', import.meta.url), 'utf8'));
  const productsToInsert = productsRaw.map(p => ({
    ...p,
    id: p.product_id,
    sellerId: p.sellerId ?? null,
    status: p.status || 'active'
  }));

  if (productsToInsert.length > 0) {
    await db.collection('products').insertMany(productsToInsert, { ordered: false }).catch(() => {});
  }

  const defaultCoupons = {
    WELCOME10: { code: 'WELCOME10', type: 'percent', value: 10, label: '10% off', active: true },
    STYLE15: { code: 'STYLE15', type: 'percent', value: 15, label: '15% off', active: true },
    FREESHIP: { code: 'FREESHIP', type: 'shipping', value: 0, label: 'Free standard shipping', active: true }
  };

  for (const [code, data] of Object.entries(defaultCoupons)) {
    await db.collection('coupons').updateOne(
      { code },
      { $setOnInsert: { code, ...data, data } },
      { upsert: true }
    );
  }
}

export async function seed() {
  const client = await getClient();
  const db = client.db();
  await ensureInitialized(db);
  await seedInternal(db);
}

export async function transaction(fn) {
  return await fn();
}

export async function settings() {
  const client = await getClient();
  const db = client.db();
  const defaultSettings = {
    storeName: 'StyleUp',
    taxRate: 0.08,
    standardShipping: 5.95,
    expressShipping: 14.95,
    freeShipping: 50,
    acceptOrders: true
  };
  const doc = await db.collection('settings').findOne({ $or: [{ _id: 'store_settings' }, { id: 1 }] });
  if (!doc) {
    await db.collection('settings').updateOne(
      { _id: 'store_settings' },
      { $setOnInsert: { id: 1, ...defaultSettings, data: defaultSettings } },
      { upsert: true }
    );
    return defaultSettings;
  }
  const s = doc.data && typeof doc.data === 'string' ? JSON.parse(doc.data) : (doc.data || doc);
  const { _id, id, data, ...rest } = s;
  return { ...defaultSettings, ...rest };
}

export async function saveSettings(data) {
  const client = await getClient();
  const db = client.db();
  await db.collection('settings').updateOne(
    { _id: 'store_settings' },
    { $set: { id: 1, ...data, data } },
    { upsert: true }
  );
  return data;
}

export function product(doc) {
  if (!doc) return null;
  const p = doc.data && typeof doc.data === 'string' ? JSON.parse(doc.data) : (doc.data || doc);
  const { _id, ...rest } = p;
  return {
    ...rest,
    product_id: Number(doc.product_id ?? doc.id ?? rest.product_id ?? rest.id),
    sellerId: doc.sellerId ?? rest.sellerId ?? null,
    status: doc.status || rest.status || 'active'
  };
}

export async function getProduct(idOrSlug) {
  if (idOrSlug === null || idOrSlug === undefined) return null;
  const client = await getClient();
  const db = client.db();
  const num = Number(idOrSlug);
  const query = !isNaN(num) && String(idOrSlug).trim() !== ''
    ? { $or: [{ product_id: num }, { id: num }, { slug: String(idOrSlug) }] }
    : { slug: String(idOrSlug) };
  const doc = await db.collection('products').findOne(query);
  return product(doc);
}

export async function getNextProductId() {
  const client = await getClient();
  const db = client.db();
  const highest = await db.collection('products').find().sort({ product_id: -1 }).limit(1).toArray();
  if (highest.length > 0 && typeof highest[0].product_id === 'number') {
    return highest[0].product_id + 1;
  }
  return 1;
}

export async function saveProduct(p) {
  const client = await getClient();
  const db = client.db();
  const productId = Number(p.product_id ?? p.id);
  const sellerId = p.sellerId ?? null;
  const status = p.status || 'active';
  const { _id, ...rest } = p;
  const toSave = {
    ...rest,
    product_id: productId,
    id: productId,
    sellerId,
    status
  };
  await db.collection('products').updateOne(
    { $or: [{ product_id: productId }, { id: productId }] },
    { $set: toSave },
    { upsert: true }
  );
  return toSave;
}

export async function catalog() {
  const client = await getClient();
  const db = client.db();

  const users = await db.collection('users').find({}).toArray();
  const userMap = new Map(users.map(u => [u.id, u]));

  const reviewRecords = await db.collection('records').find({ kind: 'reviews' }).toArray();
  const reviews = reviewRecords
    .map(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
      const u = r.userId ? userMap.get(r.userId) : null;
      return {
        ...data,
        id: r.id,
        author: u?.name || 'Customer',
        date: r.createdAt
      };
    })
    .filter(r => r.status === 'approved');

  const productDocs = await db.collection('products').find({ status: 'active' }).toArray();
  const activeProducts = [];

  for (const doc of productDocs) {
    const p = product(doc);
    if (!p || p.status !== 'active') continue;
    if (p.sellerId) {
      const seller = userMap.get(p.sellerId);
      if (!seller || seller.status !== 'active' || !['seller', 'admin'].includes(seller.role)) {
        continue;
      }
    }
    const added = reviews
      .filter(r => r.productId === p.product_id)
      .map(r => ({
        id: r.id,
        author: r.author,
        date: r.date,
        title: r.title,
        text: r.body,
        rating: r.rating,
        verified: false
      }));

    if (added.length) {
      const currentRating = p.rating || 0;
      const currentCount = p.review_count || 0;
      p.rating = Math.round(((currentRating * currentCount) + added.reduce((n, r) => n + r.rating, 0)) / (currentCount + added.length) * 10) / 10;
      p.review_count = currentCount + added.length;
      p.reviews = [...added, ...(p.reviews || [])];
    }
    activeProducts.push(p);
  }

  return activeProducts;
}

export async function getCoupons() {
  const client = await getClient();
  const db = client.db();
  const coupons = await db.collection('coupons').find({ active: true }).toArray();
  const now = Date.now();
  const map = {};
  for (const c of coupons) {
    const data = c.data && typeof c.data === 'string' ? JSON.parse(c.data) : (c.data || c);
    const { _id, ...rest } = data;
    if (!rest.expires || Date.parse(rest.expires) > now) {
      map[c.code] = { ...rest, code: c.code };
    }
  }
  return map;
}

export async function record(kind, data, userId = null) {
  const id = uid();
  const client = await getClient();
  const db = client.db();
  const doc = {
    id,
    kind,
    userId,
    data,
    createdAt: new Date().toISOString()
  };
  await db.collection('records').insertOne(doc);
  return id;
}

export async function audit(actor, action, target) {
  return await record('audit', { action, target }, actor?.id || null);
}

export function readOrder(doc) {
  if (!doc) return null;
  if (doc.data && typeof doc.data === 'string') {
    return JSON.parse(doc.data);
  }
  if (doc.data && typeof doc.data === 'object' && doc.data.number) {
    return doc.data;
  }
  const { _id, ...rest } = doc;
  return rest;
}

export const db = getDb;
