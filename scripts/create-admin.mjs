import { createUser } from '../src/server/auth.mjs';
import { seed, getDb, closeDb } from '../src/server/db.mjs';

const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name = 'Store Administrator' } = process.env;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env.');
}

await seed();
const db = await getDb();
if (await db.collection('users').findOne({ email: email.trim().toLowerCase() })) {
  throw new Error('Email already exists; no account was changed.');
}

await createUser({ name, email, password, role: 'admin' });
console.log('Administrator created. Sign in at /admin/login. Remove ADMIN_PASSWORD from .env after setup.');
await closeDb();
