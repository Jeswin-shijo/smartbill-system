const { pool } = require('../config/db');
const { createHttpError } = require('../utils/http');
const { computeBillTotals } = require('../utils/calculations');
const {
  serializeBill,
  serializeBillItem,
  serializeCustomer,
  serializeHistory,
} = require('../utils/serializers');
const { CUSTOMER_SELECT } = require('./customerController');

const ALLOWED_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

const BILL_SELECT = `
  SELECT
    b.id,
    b.customer_id AS customerId,
    b.bill_number AS billNumber,
    DATE_FORMAT(b.issue_date, '%Y-%m-%d') AS issueDate,
    DATE_FORMAT(b.due_date, '%Y-%m-%d') AS dueDate,
    b.place_of_supply AS placeOfSupply,
    b.place_of_supply_code AS placeOfSupplyCode,
    b.is_inter_state AS isInterState,
    b.subtotal,
    b.discount_total AS discountTotal,
    b.taxable_total AS taxableTotal,
    b.cgst_total AS cgstTotal,
    b.sgst_total AS sgstTotal,
    b.igst_total AS igstTotal,
    b.round_off AS roundOff,
    b.total_amount AS totalAmount,
    b.status,
    b.notes,
    b.terms,
    DATE_FORMAT(b.paid_date, '%Y-%m-%d') AS paidDate,
    b.paid_amount AS paidAmount,
    b.payment_method AS paymentMethod,
    DATE_FORMAT(b.last_activity_at, '%Y-%m-%dT%H:%i:%sZ') AS lastActivityAt,
    DATE_FORMAT(b.created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt,
    DATE_FORMAT(b.updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updatedAt
  FROM bills b
`;

const BILL_ITEMS_SELECT = `
  SELECT
    id,
    item_id AS itemId,
    position,
    description,
    hsn_code AS hsnCode,
    unit,
    quantity,
    rate,
    discount_pct AS discountPct,
    gst_rate AS gstRate,
    taxable_value AS taxableValue,
    cgst_amount AS cgstAmount,
    sgst_amount AS sgstAmount,
    igst_amount AS igstAmount,
    total_amount AS totalAmount
  FROM bill_items
  WHERE bill_id = ?
  ORDER BY position ASC, id ASC
`;

async function fetchBillRow(connection, ownerId, billId) {
  const [rows] = await connection.query(`${BILL_SELECT} WHERE b.id = ? AND b.owner_id = ? LIMIT 1`, [billId, ownerId]);
  return rows[0] || null;
}

async function fetchBillItems(connection, billId) {
  const [rows] = await connection.query(BILL_ITEMS_SELECT, [billId]);
  return rows;
}

async function fetchCustomerRow(connection, ownerId, customerId) {
  const [rows] = await connection.query(`${CUSTOMER_SELECT} WHERE id = ? AND owner_id = ? LIMIT 1`, [customerId, ownerId]);
  return rows[0] || null;
}

async function buildBillResponse(connection, ownerId, billId) {
  const row = await fetchBillRow(connection, ownerId, billId);
  if (!row) return null;
  const itemRows = await fetchBillItems(connection, billId);
  const customer = row.customerId ? await fetchCustomerRow(connection, ownerId, row.customerId) : null;
  return serializeBill(row, itemRows.map(serializeBillItem), customer ? serializeCustomer(customer) : null);
}

async function fetchBillHistory(connection, billId) {
  const [rows] = await connection.query(
    `SELECT
        h.id,
        h.bill_id AS billId,
        b.bill_number AS billNumber,
        c.name AS customerName,
        h.status,
        h.title,
        h.description,
        u.full_name AS actorName,
        DATE_FORMAT(h.created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt
      FROM bill_status_history h
      INNER JOIN bills b ON b.id = h.bill_id
      INNER JOIN customers c ON c.id = b.customer_id
      INNER JOIN users u ON u.id = h.actor_user_id
      WHERE h.bill_id = ?
      ORDER BY h.created_at DESC, h.id DESC`,
    [billId],
  );
  return rows.map(serializeHistory);
}

function normalizeLineItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createHttpError(400, 'Add at least one line item.');
  }
  return rawItems.map((line, idx) => {
    const description = String(line.description || '').trim();
    if (!description) {
      throw createHttpError(400, `Line ${idx + 1}: description is required.`);
    }
    const quantity = Number(line.quantity);
    const rate = Number(line.rate);
    const discountPct = Number(line.discountPct ?? 0);
    const gstRate = Number(line.gstRate ?? 0);
    if (Number.isNaN(quantity) || quantity <= 0) {
      throw createHttpError(400, `Line ${idx + 1}: quantity must be greater than 0.`);
    }
    if (Number.isNaN(rate) || rate < 0) {
      throw createHttpError(400, `Line ${idx + 1}: rate must be non-negative.`);
    }
    if (Number.isNaN(discountPct) || discountPct < 0 || discountPct > 100) {
      throw createHttpError(400, `Line ${idx + 1}: discount must be between 0 and 100.`);
    }
    if (Number.isNaN(gstRate) || gstRate < 0 || gstRate > 28) {
      throw createHttpError(400, `Line ${idx + 1}: GST rate must be between 0 and 28.`);
    }
    return {
      itemId: line.itemId ? Number(line.itemId) : null,
      position: idx,
      description,
      hsnCode: String(line.hsnCode || '').trim(),
      unit: String(line.unit || 'pcs').trim() || 'pcs',
      quantity,
      rate,
      discountPct,
      gstRate,
    };
  });
}

async function buildPayload(connection, ownerId, body, sellerStateCode) {
  const customerId = Number(body.customerId);
  if (!customerId) throw createHttpError(400, 'Customer is required.');

  const customer = await fetchCustomerRow(connection, ownerId, customerId);
  if (!customer) throw createHttpError(404, 'Customer not found.');

  const billNumber = String(body.billNumber || '').trim();
  if (!billNumber) throw createHttpError(400, 'Invoice number is required.');

  const issueDate = String(body.issueDate || '').trim();
  const dueDate = String(body.dueDate || '').trim();
  if (!issueDate || !dueDate) throw createHttpError(400, 'Issue date and due date are required.');

  const placeOfSupplyCode = String(body.placeOfSupplyCode || customer.stateCode || '').trim();
  const placeOfSupply = String(body.placeOfSupply || customer.state || '').trim();
  const isInterState = String(placeOfSupplyCode) !== String(sellerStateCode || '');

  const lineItems = normalizeLineItems(body.items);
  const totals = computeBillTotals(lineItems, isInterState);

  return {
    customerId,
    customer,
    billNumber,
    issueDate,
    dueDate,
    placeOfSupply,
    placeOfSupplyCode,
    isInterState,
    notes: String(body.notes || '').trim(),
    terms: String(body.terms || '').trim(),
    totals,
  };
}

async function listBills(req, res) {
  const ownerId = req.user.id;
  const status = String(req.query.status || '').trim();
  const search = String(req.query.search || '').trim();

  const filters = ['b.owner_id = ?'];
  const values = [ownerId];

  if (status) {
    filters.push('b.status = ?');
    values.push(status);
  }
  if (search) {
    filters.push('(b.bill_number LIKE ? OR c.name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `SELECT
        b.id,
        b.customer_id AS customerId,
        b.bill_number AS billNumber,
        DATE_FORMAT(b.issue_date, '%Y-%m-%d') AS issueDate,
        DATE_FORMAT(b.due_date, '%Y-%m-%d') AS dueDate,
        b.place_of_supply AS placeOfSupply,
        b.place_of_supply_code AS placeOfSupplyCode,
        b.is_inter_state AS isInterState,
        b.subtotal,
        b.discount_total AS discountTotal,
        b.taxable_total AS taxableTotal,
        b.cgst_total AS cgstTotal,
        b.sgst_total AS sgstTotal,
        b.igst_total AS igstTotal,
        b.round_off AS roundOff,
        b.total_amount AS totalAmount,
        b.status,
        b.notes,
        b.terms,
        DATE_FORMAT(b.paid_date, '%Y-%m-%d') AS paidDate,
        b.paid_amount AS paidAmount,
        b.payment_method AS paymentMethod,
        DATE_FORMAT(b.last_activity_at, '%Y-%m-%dT%H:%i:%sZ') AS lastActivityAt,
        DATE_FORMAT(b.created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt,
        DATE_FORMAT(b.updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updatedAt,
        c.name AS customerName
     FROM bills b
     INNER JOIN customers c ON c.id = b.customer_id
     WHERE ${filters.join(' AND ')}
     ORDER BY b.issue_date DESC, b.id DESC`,
    values,
  );

  const bills = rows.map((row) => ({
    ...serializeBill(row, [], null),
    customerName: row.customerName,
  }));

  res.json({ bills });
}

async function getBillDetails(req, res) {
  const billId = Number(req.params.billId);
  const connection = await pool.getConnection();
  try {
    const bill = await buildBillResponse(connection, req.user.id, billId);
    if (!bill) throw createHttpError(404, 'Invoice not found.');
    const history = await fetchBillHistory(connection, billId);
    res.json({ bill, history });
  } finally {
    connection.release();
  }
}

async function createBill(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const payload = await buildPayload(connection, req.user.id, req.body, req.user.stateCode);
    const { totals } = payload;

    const [insertResult] = await connection.query(
      `INSERT INTO bills (
        owner_id, customer_id, bill_number, issue_date, due_date,
        place_of_supply, place_of_supply_code, is_inter_state,
        subtotal, discount_total, taxable_total, cgst_total, sgst_total, igst_total,
        round_off, total_amount, status, notes, terms, last_activity_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, NOW())`,
      [
        req.user.id, payload.customerId, payload.billNumber, payload.issueDate, payload.dueDate,
        payload.placeOfSupply, payload.placeOfSupplyCode, payload.isInterState ? 1 : 0,
        totals.subtotal, totals.discountTotal, totals.taxableTotal,
        totals.cgstTotal, totals.sgstTotal, totals.igstTotal,
        totals.roundOff, totals.totalAmount,
        payload.notes, payload.terms,
      ],
    );

    const billId = insertResult.insertId;

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

    await connection.query(
      `INSERT INTO bill_status_history (bill_id, actor_user_id, status, title, description)
       VALUES (?, ?, 'Draft', 'Invoice created', 'A new draft invoice was created.')`,
      [billId, req.user.id],
    );

    await connection.commit();

    const bill = await buildBillResponse(connection, req.user.id, billId);
    const history = await fetchBillHistory(connection, billId);
    res.status(201).json({ bill, history });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'Invoice number already exists.');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function updateBill(req, res) {
  const billId = Number(req.params.billId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const existing = await fetchBillRow(connection, req.user.id, billId);
    if (!existing) throw createHttpError(404, 'Invoice not found.');

    const payload = await buildPayload(connection, req.user.id, req.body, req.user.stateCode);
    const { totals } = payload;

    await connection.query(
      `UPDATE bills SET
        customer_id = ?, bill_number = ?, issue_date = ?, due_date = ?,
        place_of_supply = ?, place_of_supply_code = ?, is_inter_state = ?,
        subtotal = ?, discount_total = ?, taxable_total = ?,
        cgst_total = ?, sgst_total = ?, igst_total = ?,
        round_off = ?, total_amount = ?,
        notes = ?, terms = ?, last_activity_at = NOW()
       WHERE id = ? AND owner_id = ?`,
      [
        payload.customerId, payload.billNumber, payload.issueDate, payload.dueDate,
        payload.placeOfSupply, payload.placeOfSupplyCode, payload.isInterState ? 1 : 0,
        totals.subtotal, totals.discountTotal, totals.taxableTotal,
        totals.cgstTotal, totals.sgstTotal, totals.igstTotal,
        totals.roundOff, totals.totalAmount,
        payload.notes, payload.terms,
        billId, req.user.id,
      ],
    );

    await connection.query('DELETE FROM bill_items WHERE bill_id = ?', [billId]);

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

    await connection.query(
      `INSERT INTO bill_status_history (bill_id, actor_user_id, status, title, description)
       VALUES (?, ?, ?, 'Invoice updated', 'Invoice details were edited.')`,
      [billId, req.user.id, existing.status],
    );

    await connection.commit();

    const bill = await buildBillResponse(connection, req.user.id, billId);
    const history = await fetchBillHistory(connection, billId);
    res.json({ bill, history });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'Invoice number already exists.');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function updateBillStatus(req, res) {
  const billId = Number(req.params.billId);
  const nextStatus = String(req.body.status || '').trim();
  const description = String(req.body.description || '').trim();
  const paymentMethod = String(req.body.paymentMethod || '').trim();

  if (!ALLOWED_STATUSES.includes(nextStatus)) {
    throw createHttpError(400, 'Choose a valid invoice status.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const existing = await fetchBillRow(connection, req.user.id, billId);
    if (!existing) throw createHttpError(404, 'Invoice not found.');

    const titleByStatus = {
      Draft: 'Marked as draft',
      Sent: 'Invoice sent',
      Paid: 'Payment received',
      Overdue: 'Marked overdue',
      Cancelled: 'Invoice cancelled',
    };

    const isPaid = nextStatus === 'Paid';
    const paidDate = isPaid ? new Date().toISOString().slice(0, 10) : null;
    const paidAmount = isPaid ? Number(existing.totalAmount) : 0;

    await connection.query(
      `UPDATE bills SET status = ?, paid_date = ?, paid_amount = ?, payment_method = ?, last_activity_at = NOW()
       WHERE id = ? AND owner_id = ?`,
      [nextStatus, paidDate, paidAmount, isPaid ? (paymentMethod || 'Bank transfer') : '', billId, req.user.id],
    );

    await connection.query(
      `INSERT INTO bill_status_history (bill_id, actor_user_id, status, title, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        billId,
        req.user.id,
        nextStatus,
        titleByStatus[nextStatus],
        description || `Status changed from ${existing.status} to ${nextStatus}.`,
      ],
    );

    await connection.commit();

    const bill = await buildBillResponse(connection, req.user.id, billId);
    const history = await fetchBillHistory(connection, billId);
    res.json({ bill, history });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteBill(req, res) {
  const billId = Number(req.params.billId);
  const connection = await pool.getConnection();
  try {
    const existing = await fetchBillRow(connection, req.user.id, billId);
    if (!existing) throw createHttpError(404, 'Invoice not found.');
    await connection.query('DELETE FROM bills WHERE id = ? AND owner_id = ?', [billId, req.user.id]);
    res.json({ message: `${existing.billNumber} deleted.`, billId });
  } finally {
    connection.release();
  }
}

async function listHistory(req, res) {
  const [rows] = await pool.query(
    `SELECT
        h.id,
        h.bill_id AS billId,
        b.bill_number AS billNumber,
        c.name AS customerName,
        h.status,
        h.title,
        h.description,
        u.full_name AS actorName,
        DATE_FORMAT(h.created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt
      FROM bill_status_history h
      INNER JOIN bills b ON b.id = h.bill_id
      INNER JOIN customers c ON c.id = b.customer_id
      INNER JOIN users u ON u.id = h.actor_user_id
      WHERE b.owner_id = ?
      ORDER BY h.created_at DESC, h.id DESC
      LIMIT 200`,
    [req.user.id],
  );
  res.json({ history: rows.map(serializeHistory) });
}

async function nextBillNumber(req, res) {
  const prefix = String(req.user.invoicePrefix || 'INV').trim() || 'INV';
  const [rows] = await pool.query(
    `SELECT bill_number AS billNumber FROM bills
      WHERE owner_id = ? AND bill_number LIKE ?
      ORDER BY id DESC LIMIT 1`,
    [req.user.id, `${prefix}-%`],
  );

  let next = 1;
  if (rows.length > 0) {
    const match = String(rows[0].billNumber).match(/(\d+)\s*$/);
    if (match) next = Number(match[1]) + 1;
  }
  const padded = String(next).padStart(4, '0');
  res.json({ billNumber: `${prefix}-${padded}` });
}

module.exports = {
  ALLOWED_STATUSES,
  createBill,
  deleteBill,
  getBillDetails,
  listBills,
  listHistory,
  nextBillNumber,
  updateBill,
  updateBillStatus,
};
