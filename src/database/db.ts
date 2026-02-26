import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('kasirgo.db');

// Initialize database tables synchronously at module load time
// This ensures tables exist before any component tries to query them
const initDatabaseSync = () => {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL,
        sku TEXT,
        barcode TEXT,
        category_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );
      
      -- Migration: Add barcode column if it doesn't exist (for existing databases)
      -- SQLite doesn't support IF NOT EXISTS for columns, so we use a workaround
      CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY);
      INSERT OR IGNORE INTO _migrations (id) VALUES ('add_barcode_column');
    `);

    // Check if barcode migration needed
    const migrationCheck = db.getFirstSync<{ id: string }>('SELECT id FROM _migrations WHERE id = ?', ['add_barcode_done']);
    if (!migrationCheck) {
      try {
        db.execSync('ALTER TABLE products ADD COLUMN barcode TEXT');
      } catch (e) {
        // Column might already exist, ignore error
      }
      db.runSync('INSERT OR REPLACE INTO _migrations (id) VALUES (?)', ['add_barcode_done']);
    }

    // Migration: Add tax and discount columns
    const taxMigrationCheck = db.getFirstSync<{ id: string }>('SELECT id FROM _migrations WHERE id = ?', ['add_tax_discount_done']);
    if (!taxMigrationCheck) {
      try {
        // Settings table updates
        db.execSync('ALTER TABLE settings ADD COLUMN tax_rate REAL DEFAULT 0');
        db.execSync('ALTER TABLE settings ADD COLUMN enable_tax INTEGER DEFAULT 0'); // 0 = false, 1 = true

        // Transactions table updates
        db.execSync('ALTER TABLE transactions ADD COLUMN discount_total INTEGER DEFAULT 0');
        db.execSync('ALTER TABLE transactions ADD COLUMN tax_total INTEGER DEFAULT 0');
        db.execSync('ALTER TABLE transactions ADD COLUMN discount_type TEXT DEFAULT "fixed"'); // 'fixed' or 'percentage'

        // Transaction items updates
        db.execSync('ALTER TABLE transaction_items ADD COLUMN discount INTEGER DEFAULT 0');
      } catch (e) {
        console.warn('Migration warning (tax/discount):', e);
      }
      db.runSync('INSERT OR REPLACE INTO _migrations (id) VALUES (?)', ['add_tax_discount_done']);
    }

    // Migration: Add cost_price, image, use_stock to products and cost_price to transaction_items
    const productEnhancementCheck = db.getFirstSync<{ id: string }>('SELECT id FROM _migrations WHERE id = ?', ['add_product_enhancements_done']);
    if (!productEnhancementCheck) {
      try {
        db.execSync('ALTER TABLE products ADD COLUMN cost_price INTEGER DEFAULT 0');
        db.execSync('ALTER TABLE products ADD COLUMN image TEXT');
        db.execSync('ALTER TABLE products ADD COLUMN use_stock INTEGER DEFAULT 1'); // 1 = true, 0 = false (unlimited)

        db.execSync('ALTER TABLE transaction_items ADD COLUMN cost_price INTEGER DEFAULT 0');
      } catch (e) {
        console.warn('Migration warning (product enhancements):', e);
      }
      db.runSync('INSERT OR REPLACE INTO _migrations (id) VALUES (?)', ['add_product_enhancements_done']);
    }

    db.execSync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total INTEGER NOT NULL,
        paid INTEGER NOT NULL,
        change INTEGER NOT NULL,
        discount_total INTEGER DEFAULT 0,
        tax_total INTEGER DEFAULT 0,
        discount_type TEXT DEFAULT 'fixed',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER,
        product_id INTEGER,
        price INTEGER NOT NULL,
        qty INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        discount INTEGER DEFAULT 0,
        FOREIGN KEY (transaction_id) REFERENCES transactions (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        store_name TEXT DEFAULT 'Toko Saya',
        store_address TEXT,
        tax_rate REAL DEFAULT 0,
        enable_tax INTEGER DEFAULT 0
      );
      INSERT OR IGNORE INTO settings (id, store_name, store_address, tax_rate, enable_tax) VALUES (1, 'Warung Ku', 'Jl. Merdeka No. 1', 0, 0);
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// Initialize immediately when module is imported
initDatabaseSync();

// Keep the exported function for backward compatibility (optional re-init)
export const initDatabase = initDatabaseSync;

export default db;
