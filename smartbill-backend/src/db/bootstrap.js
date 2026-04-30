const { pool } = require('../config/db');
const { hashPassword } = require('../utils/auth');

const SCHEMA_VERSION = 4;

const seedUser = {
  fullName: 'Jeswin',
  email: process.env.SEED_USER_EMAIL || 'jeswindonoo7@gmail.com',
  password: process.env.SEED_USER_PASSWORD || 'Jeswin@123',
  role: 'Owner',
};

async function detectAndResetIfNeeded(connection) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()`,
  );
  const names = new Set(tables.map((row) => row.TABLE_NAME || row.table_name));

  if (names.has('_meta')) {
    const [rows] = await connection.query('SELECT schema_version FROM _meta LIMIT 1');
    if (rows.length > 0 && Number(rows[0].schema_version) >= SCHEMA_VERSION) {
      return;
    }
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'bill_status_history',
    'bill_items',
    'bills',
    'customers',
    'items',
    'password_resets',
    'users',
    '_meta',
  ]) {
    await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function ensureTables(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS _meta (
      schema_version INT PRIMARY KEY
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(60) NOT NULL DEFAULT 'Owner',
      phone VARCHAR(40) DEFAULT '',
      business_name VARCHAR(160) DEFAULT '',
      gstin VARCHAR(20) DEFAULT '',
      pan VARCHAR(15) DEFAULT '',
      address_line1 VARCHAR(255) DEFAULT '',
      address_line2 VARCHAR(255) DEFAULT '',
      city VARCHAR(100) DEFAULT '',
      state VARCHAR(80) DEFAULT '',
      state_code VARCHAR(5) DEFAULT '',
      pincode VARCHAR(15) DEFAULT '',
      country VARCHAR(80) DEFAULT 'India',
      currency VARCHAR(10) DEFAULT 'INR',
      timezone VARCHAR(80) DEFAULT 'Asia/Kolkata',
      bank_name VARCHAR(120) DEFAULT '',
      bank_account_number VARCHAR(40) DEFAULT '',
      bank_ifsc VARCHAR(20) DEFAULT '',
      invoice_prefix VARCHAR(10) DEFAULT 'INV',
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      owner_id INT NOT NULL,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(190) DEFAULT '',
      phone VARCHAR(40) DEFAULT '',
      gstin VARCHAR(20) DEFAULT '',
      address_line1 VARCHAR(255) DEFAULT '',
      address_line2 VARCHAR(255) DEFAULT '',
      city VARCHAR(100) DEFAULT '',
      state VARCHAR(80) DEFAULT '',
      state_code VARCHAR(5) DEFAULT '',
      pincode VARCHAR(15) DEFAULT '',
      country VARCHAR(80) DEFAULT 'India',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_customer_owner_name (owner_id, name)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      owner_id INT NOT NULL,
      name VARCHAR(160) NOT NULL,
      description TEXT,
      hsn_code VARCHAR(20) DEFAULT '',
      unit VARCHAR(20) DEFAULT 'pcs',
      rate DECIMAL(12,2) NOT NULL DEFAULT 0,
      gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18,
      type VARCHAR(20) NOT NULL DEFAULT 'service',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_item_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_item_owner_name (owner_id, name)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id INT PRIMARY KEY AUTO_INCREMENT,
      owner_id INT NOT NULL,
      customer_id INT NOT NULL,
      bill_number VARCHAR(40) NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      place_of_supply VARCHAR(80) DEFAULT '',
      place_of_supply_code VARCHAR(5) DEFAULT '',
      is_inter_state TINYINT(1) NOT NULL DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      taxable_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      cgst_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      sgst_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      igst_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      round_off DECIMAL(8,2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'Draft',
      notes TEXT,
      terms TEXT,
      paid_date DATE DEFAULT NULL,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      payment_method VARCHAR(40) DEFAULT '',
      last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_bill_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_bill_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      UNIQUE KEY uniq_bill_owner_number (owner_id, bill_number)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      bill_id INT NOT NULL,
      item_id INT DEFAULT NULL,
      position INT NOT NULL DEFAULT 0,
      description VARCHAR(255) NOT NULL,
      hsn_code VARCHAR(20) DEFAULT '',
      unit VARCHAR(20) DEFAULT 'pcs',
      quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
      rate DECIMAL(12,2) NOT NULL DEFAULT 0,
      discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
      gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
      taxable_value DECIMAL(12,2) NOT NULL DEFAULT 0,
      cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      CONSTRAINT fk_billitem_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      CONSTRAINT fk_billitem_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS bill_status_history (
      id INT PRIMARY KEY AUTO_INCREMENT,
      bill_id INT NOT NULL,
      actor_user_id INT NOT NULL,
      status VARCHAR(40) NOT NULL,
      title VARCHAR(160) NOT NULL,
      description VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_history_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      CONSTRAINT fk_history_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pwreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_pwreset_user (user_id, used_at)
    )
  `);

  await connection.query(
    'INSERT INTO _meta (schema_version) VALUES (?) ON DUPLICATE KEY UPDATE schema_version = VALUES(schema_version)',
    [SCHEMA_VERSION],
  );
}

async function ensureSeedUser(connection) {
  const [rows] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [seedUser.email]);
  if (rows.length > 0) return rows[0].id;

  const passwordHash = await hashPassword(seedUser.password);
  const [result] = await connection.query(
    `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [seedUser.fullName, seedUser.email, passwordHash, seedUser.role],
  );

  return result.insertId;
}

async function bootstrapDatabase() {
  const connection = await pool.getConnection();
  try {
    await detectAndResetIfNeeded(connection);
    await ensureTables(connection);
    await ensureSeedUser(connection);
  } finally {
    connection.release();
  }
}

module.exports = {
  bootstrapDatabase,
  seedUser,
};
