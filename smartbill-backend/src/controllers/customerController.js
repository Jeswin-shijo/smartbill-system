const { pool } = require('../config/db');
const { createHttpError } = require('../utils/http');
const { serializeCustomer } = require('../utils/serializers');

const CUSTOMER_SELECT = `
  SELECT
    id,
    name,
    email,
    phone,
    gstin,
    address_line1 AS addressLine1,
    address_line2 AS addressLine2,
    city,
    state,
    state_code AS stateCode,
    pincode,
    country,
    notes,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt,
    DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updatedAt
  FROM customers
`;

function normalize(body) {
  if (!body.name || !String(body.name).trim()) {
    throw createHttpError(400, 'Customer name is required.');
  }
  return {
    name: String(body.name).trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    gstin: String(body.gstin || '').trim().toUpperCase(),
    addressLine1: String(body.addressLine1 || '').trim(),
    addressLine2: String(body.addressLine2 || '').trim(),
    city: String(body.city || '').trim(),
    state: String(body.state || '').trim(),
    stateCode: String(body.stateCode || '').trim(),
    pincode: String(body.pincode || '').trim(),
    country: String(body.country || 'India').trim(),
    notes: String(body.notes || '').trim(),
  };
}

async function fetchCustomer(ownerId, customerId) {
  const [rows] = await pool.query(`${CUSTOMER_SELECT} WHERE id = ? AND owner_id = ? LIMIT 1`, [customerId, ownerId]);
  return rows[0] || null;
}

async function listCustomers(req, res) {
  const search = String(req.query.search || '').trim();
  const filters = ['owner_id = ?'];
  const values = [req.user.id];
  if (search) {
    filters.push('(name LIKE ? OR email LIKE ? OR gstin LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const [rows] = await pool.query(`${CUSTOMER_SELECT} WHERE ${filters.join(' AND ')} ORDER BY name ASC`, values);
  res.json({ customers: rows.map(serializeCustomer) });
}

async function getCustomer(req, res) {
  const customerId = Number(req.params.customerId);
  const row = await fetchCustomer(req.user.id, customerId);
  if (!row) throw createHttpError(404, 'Customer not found.');
  res.json({ customer: serializeCustomer(row) });
}

async function createCustomer(req, res) {
  const payload = normalize(req.body);
  try {
    const [result] = await pool.query(
      `INSERT INTO customers (
        owner_id, name, email, phone, gstin,
        address_line1, address_line2, city, state, state_code, pincode, country, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, payload.name, payload.email, payload.phone, payload.gstin,
        payload.addressLine1, payload.addressLine2, payload.city, payload.state, payload.stateCode, payload.pincode, payload.country, payload.notes,
      ],
    );
    const row = await fetchCustomer(req.user.id, result.insertId);
    res.status(201).json({ customer: serializeCustomer(row) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'A customer with this name already exists.');
    }
    throw error;
  }
}

async function updateCustomer(req, res) {
  const customerId = Number(req.params.customerId);
  const existing = await fetchCustomer(req.user.id, customerId);
  if (!existing) throw createHttpError(404, 'Customer not found.');

  const payload = normalize({ ...existing, ...req.body });
  try {
    await pool.query(
      `UPDATE customers SET
        name = ?, email = ?, phone = ?, gstin = ?,
        address_line1 = ?, address_line2 = ?, city = ?, state = ?, state_code = ?, pincode = ?, country = ?, notes = ?
       WHERE id = ? AND owner_id = ?`,
      [
        payload.name, payload.email, payload.phone, payload.gstin,
        payload.addressLine1, payload.addressLine2, payload.city, payload.state, payload.stateCode, payload.pincode, payload.country, payload.notes,
        customerId, req.user.id,
      ],
    );
    const row = await fetchCustomer(req.user.id, customerId);
    res.json({ customer: serializeCustomer(row) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'A customer with this name already exists.');
    }
    throw error;
  }
}

async function deleteCustomer(req, res) {
  const customerId = Number(req.params.customerId);
  const existing = await fetchCustomer(req.user.id, customerId);
  if (!existing) throw createHttpError(404, 'Customer not found.');

  const [billsUsing] = await pool.query(
    'SELECT COUNT(*) AS total FROM bills WHERE customer_id = ? AND owner_id = ?',
    [customerId, req.user.id],
  );
  if (Number(billsUsing[0].total) > 0) {
    throw createHttpError(409, 'This customer has invoices. Delete or reassign those invoices first.');
  }

  await pool.query('DELETE FROM customers WHERE id = ? AND owner_id = ?', [customerId, req.user.id]);
  res.json({ message: `${existing.name} removed.`, customerId });
}

module.exports = {
  CUSTOMER_SELECT,
  createCustomer,
  deleteCustomer,
  fetchCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
};
