const { pool } = require('../config/db');
const { hashPassword } = require('../utils/auth');
const { computeBillTotals } = require('../utils/calculations');

const SCHEMA_VERSION = 2;

const seedUser = {
  fullName: 'Jeswin Shijo',
  email: process.env.SEED_USER_EMAIL || 'owner@smartbill.app',
  password: process.env.SEED_USER_PASSWORD || 'SmartBill@123',
  role: 'Founder',
  phone: '+91 98765 43210',
  businessName: 'Smart Bill Studio',
  gstin: '32ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  addressLine1: '14 Ledger Street',
  addressLine2: 'Marine Drive',
  city: 'Kochi',
  state: 'Kerala',
  stateCode: '32',
  pincode: '682011',
  country: 'India',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  bankName: 'HDFC Bank',
  bankAccountNumber: '50100123456789',
  bankIfsc: 'HDFC0001234',
  invoicePrefix: 'INV',
  bio: 'Operations director — handles billing, GST returns and client renewals.',
};

const seedCustomers = [
  {
    name: 'Lumen Labs Pvt Ltd',
    email: 'accounts@lumenlabs.in',
    phone: '+91 80456 11223',
    gstin: '29AABCL1234M1Z5',
    addressLine1: '402, Brigade Tech Park',
    addressLine2: 'Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    stateCode: '29',
    pincode: '560066',
    notes: 'Monthly automation retainer',
  },
  {
    name: 'Northstar Retail Pvt Ltd',
    email: 'billing@northstar.in',
    phone: '+91 22311 90880',
    gstin: '27AAGCN8899L1Z3',
    addressLine1: 'A-21, Lower Parel',
    addressLine2: 'Senapati Bapat Marg',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400013',
    notes: 'Phase 2 POS rollout',
  },
  {
    name: 'Harbor Health LLP',
    email: 'payables@harborhealth.in',
    phone: '+91 44989 31100',
    gstin: '33AAEFH7766P1Z9',
    addressLine1: '5th Floor, Marina Towers',
    addressLine2: 'Anna Salai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '600002',
    notes: 'Maintenance retainer',
  },
  {
    name: 'Apex Legal Advisors',
    email: 'ops@apexlegal.in',
    phone: '+91 11406 32100',
    gstin: '07AAJCA1122B1Z2',
    addressLine1: '12, Connaught Place',
    addressLine2: 'Outer Circle',
    city: 'New Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110001',
    notes: 'Case intake automation',
  },
  {
    name: 'Oakline Studio',
    email: 'finance@oakline.in',
    phone: '+91 79224 51200',
    gstin: '24AAACO5544Q1Z7',
    addressLine1: '203, Iscon Cross Roads',
    addressLine2: 'SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    stateCode: '24',
    pincode: '380015',
    notes: 'Creative ops audit',
  },
];

const seedItems = [
  { name: 'Automation Consulting Retainer', hsnCode: '998313', unit: 'month', rate: 75000, gstRate: 18, type: 'service', description: 'Monthly automation engineering retainer' },
  { name: 'POS Implementation Sprint', hsnCode: '998314', unit: 'sprint', rate: 125000, gstRate: 18, type: 'service', description: 'Two-week implementation sprint' },
  { name: 'Dashboard Maintenance', hsnCode: '998313', unit: 'month', rate: 32000, gstRate: 18, type: 'service', description: 'Monitoring + minor improvements' },
  { name: 'Workflow Audit Report', hsnCode: '998311', unit: 'report', rate: 45000, gstRate: 18, type: 'service', description: 'Detailed workflow audit deliverable' },
  { name: 'Training Workshop', hsnCode: '999293', unit: 'session', rate: 18000, gstRate: 18, type: 'service', description: 'Half-day onsite training' },
  { name: 'Custom Plugin Licence', hsnCode: '997331', unit: 'licence', rate: 9500, gstRate: 18, type: 'product', description: 'Annual licence for SmartBill plugins' },
];

function timestampDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function dateDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

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
    `INSERT INTO users (
      full_name, email, password_hash, role, phone,
      business_name, gstin, pan,
      address_line1, address_line2, city, state, state_code, pincode, country,
      currency, timezone, bank_name, bank_account_number, bank_ifsc, invoice_prefix, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      seedUser.fullName, seedUser.email, passwordHash, seedUser.role, seedUser.phone,
      seedUser.businessName, seedUser.gstin, seedUser.pan,
      seedUser.addressLine1, seedUser.addressLine2, seedUser.city, seedUser.state, seedUser.stateCode, seedUser.pincode, seedUser.country,
      seedUser.currency, seedUser.timezone, seedUser.bankName, seedUser.bankAccountNumber, seedUser.bankIfsc, seedUser.invoicePrefix, seedUser.bio,
    ],
  );

  return result.insertId;
}

async function ensureSeedCustomers(connection, ownerId) {
  const [existing] = await connection.query('SELECT COUNT(*) AS total FROM customers WHERE owner_id = ?', [ownerId]);
  if (Number(existing[0].total) > 0) return;

  for (const c of seedCustomers) {
    await connection.query(
      `INSERT INTO customers (
        owner_id, name, email, phone, gstin,
        address_line1, address_line2, city, state, state_code, pincode, country, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ownerId, c.name, c.email, c.phone, c.gstin,
        c.addressLine1, c.addressLine2, c.city, c.state, c.stateCode, c.pincode, c.country || 'India', c.notes || '',
      ],
    );
  }
}

async function ensureSeedItems(connection, ownerId) {
  const [existing] = await connection.query('SELECT COUNT(*) AS total FROM items WHERE owner_id = ?', [ownerId]);
  if (Number(existing[0].total) > 0) return;

  for (const it of seedItems) {
    await connection.query(
      `INSERT INTO items (owner_id, name, description, hsn_code, unit, rate, gst_rate, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, it.name, it.description, it.hsnCode, it.unit, it.rate, it.gstRate, it.type],
    );
  }
}

async function ensureSeedBills(connection, ownerId) {
  const [existing] = await connection.query('SELECT COUNT(*) AS total FROM bills WHERE owner_id = ?', [ownerId]);
  if (Number(existing[0].total) > 0) return;

  const [customerRows] = await connection.query(
    'SELECT id, name, state_code FROM customers WHERE owner_id = ? ORDER BY id ASC',
    [ownerId],
  );
  const [itemRows] = await connection.query(
    'SELECT id, name, hsn_code, unit, rate, gst_rate FROM items WHERE owner_id = ? ORDER BY id ASC',
    [ownerId],
  );

  if (customerRows.length === 0 || itemRows.length === 0) return;

  const sellerStateCode = seedUser.stateCode;
  const itemByName = new Map(itemRows.map((it) => [it.name, it]));

  const billPlans = [
    {
      billNumber: 'INV-2401',
      customerName: 'Lumen Labs Pvt Ltd',
      issueDays: -22,
      dueDays: 4,
      status: 'Sent',
      lines: [
        { itemName: 'Automation Consulting Retainer', quantity: 1, discountPct: 0 },
        { itemName: 'Custom Plugin Licence', quantity: 2, discountPct: 5 },
      ],
      history: [
        { status: 'Draft', title: 'Invoice drafted', description: 'Prepared from monthly retainer template.', daysAgo: 22 },
        { status: 'Sent', title: 'Invoice sent', description: 'Emailed to accounts@lumenlabs.in.', daysAgo: 21 },
      ],
    },
    {
      billNumber: 'INV-2402',
      customerName: 'Northstar Retail Pvt Ltd',
      issueDays: -25,
      dueDays: 8,
      status: 'Sent',
      lines: [
        { itemName: 'POS Implementation Sprint', quantity: 1, discountPct: 0 },
        { itemName: 'Training Workshop', quantity: 3, discountPct: 0 },
      ],
      history: [
        { status: 'Draft', title: 'Invoice drafted', description: 'Phase 2 milestone invoice.', daysAgo: 25 },
        { status: 'Sent', title: 'Invoice sent', description: 'Shared with finance via portal.', daysAgo: 24 },
      ],
    },
    {
      billNumber: 'INV-2403',
      customerName: 'Harbor Health LLP',
      issueDays: -38,
      dueDays: -3,
      status: 'Overdue',
      lines: [
        { itemName: 'Dashboard Maintenance', quantity: 1, discountPct: 0 },
      ],
      history: [
        { status: 'Draft', title: 'Invoice drafted', description: 'March maintenance invoice.', daysAgo: 38 },
        { status: 'Sent', title: 'Invoice sent', description: 'Sent to payables team.', daysAgo: 37 },
        { status: 'Overdue', title: 'Payment overdue', description: 'Due date passed without remittance.', daysAgo: 1 },
      ],
    },
    {
      billNumber: 'INV-2404',
      customerName: 'Apex Legal Advisors',
      issueDays: -3,
      dueDays: 27,
      status: 'Draft',
      lines: [
        { itemName: 'Workflow Audit Report', quantity: 1, discountPct: 10 },
      ],
      history: [
        { status: 'Draft', title: 'Invoice drafted', description: 'Awaiting partner approval.', daysAgo: 3 },
      ],
    },
    {
      billNumber: 'INV-2405',
      customerName: 'Oakline Studio',
      issueDays: -40,
      dueDays: -10,
      status: 'Paid',
      paidDays: 14,
      lines: [
        { itemName: 'Workflow Audit Report', quantity: 1, discountPct: 0 },
        { itemName: 'Training Workshop', quantity: 2, discountPct: 0 },
      ],
      history: [
        { status: 'Draft', title: 'Invoice drafted', description: 'Audit deliverable wrapped.', daysAgo: 40 },
        { status: 'Sent', title: 'Invoice sent', description: 'Sent to finance@oakline.in.', daysAgo: 39 },
        { status: 'Paid', title: 'Payment received', description: 'Received via NEFT, UTR captured.', daysAgo: 14 },
      ],
    },
  ];

  const customerByName = new Map(customerRows.map((c) => [c.name, c]));

  for (const plan of billPlans) {
    const customer = customerByName.get(plan.customerName);
    if (!customer) continue;

    const isInterState = String(customer.state_code) !== String(sellerStateCode);

    const lines = plan.lines.map((l, idx) => {
      const item = itemByName.get(l.itemName);
      return {
        position: idx,
        itemId: item ? item.id : null,
        description: l.itemName,
        hsnCode: item?.hsn_code || '',
        unit: item?.unit || 'pcs',
        quantity: l.quantity,
        rate: Number(item?.rate || 0),
        discountPct: l.discountPct,
        gstRate: Number(item?.gst_rate || 18),
      };
    });

    const totals = computeBillTotals(lines, isInterState);
    const issueDate = dateDaysFromNow(plan.issueDays);
    const dueDate = dateDaysFromNow(plan.dueDays);
    const paidDate = plan.status === 'Paid' && plan.paidDays != null ? dateDaysFromNow(-plan.paidDays) : null;
    const paidAmount = plan.status === 'Paid' ? totals.totalAmount : 0;

    const [billResult] = await connection.query(
      `INSERT INTO bills (
        owner_id, customer_id, bill_number, issue_date, due_date,
        place_of_supply, place_of_supply_code, is_inter_state,
        subtotal, discount_total, taxable_total, cgst_total, sgst_total, igst_total,
        round_off, total_amount, status, notes, terms,
        paid_date, paid_amount, payment_method, last_activity_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ownerId, customer.id, plan.billNumber, issueDate, dueDate,
        '', customer.state_code, isInterState ? 1 : 0,
        totals.subtotal, totals.discountTotal, totals.taxableTotal,
        totals.cgstTotal, totals.sgstTotal, totals.igstTotal,
        totals.roundOff, totals.totalAmount, plan.status,
        'Thank you for the partnership.', 'Payment due within 30 days. Late payments attract 1.5% interest per month.',
        paidDate, paidAmount, plan.status === 'Paid' ? 'Bank transfer' : '',
        timestampDaysAgo(1),
      ],
    );

    const billId = billResult.insertId;

    for (const line of totals.items) {
      await connection.query(
        `INSERT INTO bill_items (
          bill_id, item_id, position, description, hsn_code, unit,
          quantity, rate, discount_pct, gst_rate,
          taxable_value, cgst_amount, sgst_amount, igst_amount, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          billId, line.itemId, line.position, line.description, line.hsnCode, line.unit,
          line.quantity, line.rate, line.discountPct, line.gstRate,
          line.taxableValue, line.cgstAmount, line.sgstAmount, line.igstAmount, line.totalAmount,
        ],
      );
    }

    for (const ev of plan.history) {
      await connection.query(
        `INSERT INTO bill_status_history (bill_id, actor_user_id, status, title, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [billId, ownerId, ev.status, ev.title, ev.description, timestampDaysAgo(ev.daysAgo)],
      );
    }
  }
}

async function bootstrapDatabase() {
  const connection = await pool.getConnection();
  try {
    await detectAndResetIfNeeded(connection);
    await ensureTables(connection);
    const ownerId = await ensureSeedUser(connection);
    await ensureSeedCustomers(connection, ownerId);
    await ensureSeedItems(connection, ownerId);
    await ensureSeedBills(connection, ownerId);
  } finally {
    connection.release();
  }
}

module.exports = {
  bootstrapDatabase,
  seedUser,
};
