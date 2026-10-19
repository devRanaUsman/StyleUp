// Apply the brand change once without replacing the database or customer data.
export function migrateAttiraBrand(connection) {
  connection.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)');
  connection.exec('BEGIN IMMEDIATE');
  try {
    if (!connection.prepare('SELECT name FROM migrations WHERE name=?').get('attira-brand')) {
      const row = connection.prepare('SELECT data FROM settings WHERE id=1').get();
      if (row) {
        const settings = JSON.parse(row.data);
        if (/^style[ -]?hub$/i.test(settings.storeName)) {
          settings.storeName = 'Attira';
          connection.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(settings));
        }
      }
      const update = connection.prepare('UPDATE products SET data=? WHERE id=?');
      for (const row of connection.prepare('SELECT id,data FROM products').all()) {
        const product = JSON.parse(row.data);
        let changed = false;
        for (const field of ['brand', 'product_name', 'short_description', 'full_description']) {
          if (typeof product[field] !== 'string') continue;
          const value = product[field].replace(/\bstyle[ -]?hub\b/gi, 'Attira').replace(/\ba Attira\b/g, 'an Attira');
          if (value !== product[field]) { product[field] = value; changed = true; }
        }
        if (changed) update.run(JSON.stringify(product), row.id);
      }
      connection.prepare('INSERT INTO migrations (name) VALUES (?)').run('attira-brand');
    }
    connection.exec('COMMIT');
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
}

// Rename the storefront to StyleUp in place, keeping every account and order.
export function migrateStyleUpBrand(connection) {
  connection.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)');
  connection.exec('BEGIN IMMEDIATE');
  try {
    if (!connection.prepare('SELECT name FROM migrations WHERE name=?').get('styleup-brand')) {
      const row = connection.prepare('SELECT data FROM settings WHERE id=1').get();
      if (row) {
        const settings = JSON.parse(row.data);
        if (/^(attira|style[ -]?hub)$/i.test(settings.storeName)) {
          settings.storeName = 'StyleUp';
          connection.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(settings));
        }
      }
      const update = connection.prepare('UPDATE products SET data=? WHERE id=?');
      for (const row of connection.prepare('SELECT id,data FROM products').all()) {
        const product = JSON.parse(row.data);
        let changed = false;
        for (const field of ['brand', 'product_name', 'short_description', 'full_description']) {
          if (typeof product[field] !== 'string') continue;
          const value = product[field]
            .replace(/\ban attira\b/gi, 'a StyleUp')
            .replace(/\battira\b/gi, 'StyleUp')
            .replace(/\bstyle[ -]?hub\b/gi, 'StyleUp');
          if (value !== product[field]) { product[field] = value; changed = true; }
        }
        if (changed) update.run(JSON.stringify(product), row.id);
      }
      connection.prepare('INSERT INTO migrations (name) VALUES (?)').run('styleup-brand');
    }
    connection.exec('COMMIT');
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
}

