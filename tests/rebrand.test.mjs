import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateAttiraBrand } from '../src/server/rebrand.mjs';

test('existing stores adopt Attira without losing settings, inventory or product identity', () => {
  const connection = new DatabaseSync(':memory:');
  try {
    connection.exec('CREATE TABLE settings(id INTEGER PRIMARY KEY,data TEXT); CREATE TABLE products(id INTEGER PRIMARY KEY,data TEXT)');
    const originalSettings = { storeName: 'Style Hub', taxRate: 0.12, acceptOrders: false };
    const originalProduct = { brand: 'Style Hub Home', slug: 'linen-cushion', full_description: 'Packed in a Style Hub pouch.', variants: [{ stock: 7 }], SKU: 'SH-123' };
    connection.prepare('INSERT INTO settings VALUES (1,?)').run(JSON.stringify(originalSettings));
    connection.prepare('INSERT INTO products VALUES (1,?)').run(JSON.stringify(originalProduct));
    connection.prepare('INSERT INTO products VALUES (2,?)').run(JSON.stringify({ brand: 'Other Brand' }));
    migrateAttiraBrand(connection);
    assert.deepEqual(JSON.parse(connection.prepare('SELECT data FROM settings').get().data), { ...originalSettings, storeName: 'Attira' });
    assert.deepEqual(JSON.parse(connection.prepare('SELECT data FROM products WHERE id=1').get().data), { ...originalProduct, brand: 'Attira Home', full_description: 'Packed in an Attira pouch.' });
    assert.equal(JSON.parse(connection.prepare('SELECT data FROM products WHERE id=2').get().data).brand, 'Other Brand');
    connection.prepare('UPDATE settings SET data=?').run(JSON.stringify({ storeName: 'Custom Store' }));
    migrateAttiraBrand(connection);
    assert.equal(JSON.parse(connection.prepare('SELECT data FROM settings').get().data).storeName, 'Custom Store');
    assert.equal(connection.prepare('SELECT count(*) n FROM migrations').get().n, 1);
  } finally {
    connection.close();
  }
});
