const { pool } = require('../config/db');
const { comparePassword, hashPassword } = require('../utils/auth');
const { createHttpError } = require('../utils/http');
const { serializeUser } = require('../utils/serializers');
const { USER_SELECT } = require('../middleware/authenticate');

const PROFILE_FIELDS = [
  'fullName',
  'phone',
  'businessName',
  'gstin',
  'pan',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'stateCode',
  'pincode',
  'country',
  'currency',
  'timezone',
  'bankName',
  'bankAccountNumber',
  'bankIfsc',
  'invoicePrefix',
  'bio',
];

async function getProfile(req, res) {
  res.json({ profile: req.user });
}

async function updateProfile(req, res) {
  const body = req.body || {};
  const get = (key, fallback = '') => String(body[key] ?? fallback ?? '').trim();

  const fullName = get('fullName');
  if (!fullName) throw createHttpError(400, 'Full name is required.');

  const values = {
    fullName,
    phone: get('phone'),
    businessName: get('businessName'),
    gstin: get('gstin').toUpperCase(),
    pan: get('pan').toUpperCase(),
    addressLine1: get('addressLine1'),
    addressLine2: get('addressLine2'),
    city: get('city'),
    state: get('state'),
    stateCode: get('stateCode'),
    pincode: get('pincode'),
    country: get('country', 'India'),
    currency: (get('currency', 'INR') || 'INR').toUpperCase(),
    timezone: get('timezone', 'Asia/Kolkata'),
    bankName: get('bankName'),
    bankAccountNumber: get('bankAccountNumber'),
    bankIfsc: get('bankIfsc').toUpperCase(),
    invoicePrefix: (get('invoicePrefix', 'INV') || 'INV').toUpperCase(),
    bio: get('bio'),
  };

  await pool.query(
    `UPDATE users SET
      full_name = ?, phone = ?, business_name = ?, gstin = ?, pan = ?,
      address_line1 = ?, address_line2 = ?, city = ?, state = ?, state_code = ?, pincode = ?, country = ?,
      currency = ?, timezone = ?, bank_name = ?, bank_account_number = ?, bank_ifsc = ?, invoice_prefix = ?, bio = ?
     WHERE id = ?`,
    [
      values.fullName, values.phone, values.businessName, values.gstin, values.pan,
      values.addressLine1, values.addressLine2, values.city, values.state, values.stateCode, values.pincode, values.country,
      values.currency, values.timezone, values.bankName, values.bankAccountNumber, values.bankIfsc, values.invoicePrefix, values.bio,
      req.user.id,
    ],
  );

  const [rows] = await pool.query(USER_SELECT, [req.user.id]);
  res.json({ profile: serializeUser(rows[0]) });
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw createHttpError(400, 'Current password and new password are required.');
  }
  if (String(newPassword).length < 8) {
    throw createHttpError(400, 'New password must be at least 8 characters.');
  }

  const [rows] = await pool.query('SELECT password_hash AS passwordHash FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  const isValid = await comparePassword(currentPassword, rows[0].passwordHash);
  if (!isValid) throw createHttpError(401, 'Current password is incorrect.');

  const nextHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [nextHash, req.user.id]);

  res.json({ message: 'Password updated successfully.' });
}

module.exports = {
  PROFILE_FIELDS,
  getProfile,
  updatePassword,
  updateProfile,
};
