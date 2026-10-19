import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { getDb, uid } from './db.mjs';

export const COOKIE = 'stylehub_session';
export const digest = s => createHash('sha256').update(s).digest('hex');
export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

export function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}

const dummy = passwordHash('dummy-password-not-a-real-user');
export function verifyPassword(password, stored = dummy) {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  return timingSafeEqual(scryptSync(password, salt, 64), expected);
}

export function publicUser(row) {
  if (!row) return null;
  const extra = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
  const { password, _id, ...safeRow } = row;
  return {
    ...extra,
    id: safeRow.id,
    email: safeRow.email,
    name: safeRow.name,
    role: safeRow.role,
    status: safeRow.status,
    createdAt: safeRow.createdAt
  };
}

export function cookieToken(request) {
  return request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
}

export async function userFromToken(token) {
  if (!token) return null;
  const db = await getDb();
  const hashed = digest(token);
  const now = new Date();
  const sessionDoc = await db.collection('sessions').findOne({
    hash: hashed,
    $or: [{ expires: { $gt: now } }, { expires: { $gt: Date.now() } }]
  });
  if (!sessionDoc) return null;
  const user = await db.collection('users').findOne({
    id: sessionDoc.userId,
    status: { $ne: 'suspended' }
  });
  return user || null;
}

export async function requireUser(request, roles) {
  const token = cookieToken(request);
  const u = await userFromToken(token);
  if (!u) fail(401, 'Please sign in to continue.');
  if (roles && (!roles.includes(u.role) || u.status !== 'active')) {
    fail(403, 'You do not have access to this area.');
  }
  return u;
}

export async function session(userId, remember = true) {
  const token = randomBytes(32).toString('hex');
  const db = await getDb();
  const expiresDate = new Date(Date.now() + (remember ? 7 : 1) * 86400000);
  await db.collection('sessions').deleteMany({
    $or: [{ expires: { $lt: new Date() } }, { expires: { $lt: Date.now() } }]
  });
  await db.collection('sessions').insertOne({
    hash: digest(token),
    userId,
    expires: expiresDate
  });
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${remember ? '; Max-Age=604800' : ''}${(process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false')) ? '; Secure' : ''}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${(process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false')) ? '; Secure' : ''}`;

export async function createUser({ name, email, password, role = 'customer', status = 'active' }) {
  const id = uid();
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const initialData = { phone: '', addresses: [], paymentMethods: [], wishlist: [], prefs: { news: false, offers: false } };
  const user = {
    id,
    email: normalizedEmail,
    password: passwordHash(password),
    name,
    role,
    status,
    data: initialData,
    createdAt: new Date().toISOString()
  };
  await db.collection('users').insertOne(user);
  return user;
}

export async function rateLimit(key, max = 10, period = 900000) {
  const db = await getDb();
  const hashed = digest(key);
  const now = new Date();
  const expires = new Date(Date.now() + period);
  await db.collection('rate_limits').deleteMany({
    $or: [{ expires: { $lt: now } }, { expires: { $lt: Date.now() } }]
  });
  const res = await db.collection('rate_limits').findOneAndUpdate(
    { key: hashed },
    { $inc: { count: 1 }, $setOnInsert: { key: hashed, expires } },
    { upsert: true, returnDocument: 'after' }
  );
  const count = res?.count ?? (res?.value?.count ?? 1);
  if (count > max) {
    fail(429, 'Too many attempts. Please try again later.');
  }
}
