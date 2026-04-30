const { pool } = require('../config/db');
const { createHttpError } = require('../utils/http');
const { serializeItem } = require('../utils/serializers');

const ITEM_SELECT = `
  SELECT
    id,
    name,
    description,
    hsn_code AS hsnCode,
    unit,
    rate,
    gst_rate AS gstRate,
    type,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt,
    DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updatedAt
  FROM items
`;

const VALID_TYPES = new Set(['product', 'service']);

function normalize(body) {
  if (!body.name || !String(body.name).trim()) {
    throw createHttpError(400, 'Item name is required.');
  }
  const rate = Number(body.rate);
  if (Number.isNaN(rate) || rate < 0) {
    throw createHttpError(400, 'Rate must be a non-negative number.');
  }
  const gstRate = Number(body.gstRate ?? 18);
  if (Number.isNaN(gstRate) || gstRate < 0 || gstRate > 28) {
    throw createHttpError(400, 'GST rate must be between 0 and 28.');
  }
  const type = String(body.type || 'service').toLowerCase();
  if (!VALID_TYPES.has(type)) {
    throw createHttpError(400, 'Type must be product or service.');
  }
  return {
    name: String(body.name).trim(),
    description: String(body.description || '').trim(),
    hsnCode: String(body.hsnCode || '').trim(),
    unit: String(body.unit || 'pcs').trim() || 'pcs',
    rate,
    gstRate,
    type,
  };
}

async function fetchItem(ownerId, itemId) {
  const [rows] = await pool.query(`${ITEM_SELECT} WHERE id = ? AND owner_id = ? LIMIT 1`, [itemId, ownerId]);
  return rows[0] || null;
}

async function listItems(req, res) {
  const search = String(req.query.search || '').trim();
  const filters = ['owner_id = ?'];
  const values = [req.user.id];
  if (search) {
    filters.push('(name LIKE ? OR hsn_code LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }
  const [rows] = await pool.query(`${ITEM_SELECT} WHERE ${filters.join(' AND ')} ORDER BY name ASC`, values);
  res.json({ items: rows.map(serializeItem) });
}

async function getItem(req, res) {
  const id = Number(req.params.itemId);
  const row = await fetchItem(req.user.id, id);
  if (!row) throw createHttpError(404, 'Item not found.');
  res.json({ item: serializeItem(row) });
}

async function createItem(req, res) {
  const payload = normalize(req.body);
  try {
    const [result] = await pool.query(
      `INSERT INTO items (owner_id, name, description, hsn_code, unit, rate, gst_rate, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, payload.name, payload.description, payload.hsnCode, payload.unit, payload.rate, payload.gstRate, payload.type],
    );
    const row = await fetchItem(req.user.id, result.insertId);
    res.status(201).json({ item: serializeItem(row) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'An item with this name already exists.');
    }
    throw error;
  }
}

async function updateItem(req, res) {
  const id = Number(req.params.itemId);
  const existing = await fetchItem(req.user.id, id);
  if (!existing) throw createHttpError(404, 'Item not found.');

  const payload = normalize({ ...existing, ...req.body });
  try {
    await pool.query(
      `UPDATE items SET name = ?, description = ?, hsn_code = ?, unit = ?, rate = ?, gst_rate = ?, type = ?
       WHERE id = ? AND owner_id = ?`,
      [payload.name, payload.description, payload.hsnCode, payload.unit, payload.rate, payload.gstRate, payload.type, id, req.user.id],
    );
    const row = await fetchItem(req.user.id, id);
    res.json({ item: serializeItem(row) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'An item with this name already exists.');
    }
    throw error;
  }
}

async function deleteItem(req, res) {
  const id = Number(req.params.itemId);
  const existing = await fetchItem(req.user.id, id);
  if (!existing) throw createHttpError(404, 'Item not found.');
  await pool.query('DELETE FROM items WHERE id = ? AND owner_id = ?', [id, req.user.id]);
  res.json({ message: `${existing.name} removed.`, itemId: id });
}

module.exports = {
  ITEM_SELECT,
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
};
