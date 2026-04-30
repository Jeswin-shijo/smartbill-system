const { pool } = require('../config/db');
const { verifyToken } = require('../utils/auth');
const { createHttpError } = require('../utils/http');
const { serializeUser } = require('../utils/serializers');

const USER_SELECT = `
  SELECT
    id,
    full_name AS fullName,
    email,
    role,
    phone,
    business_name AS businessName,
    gstin,
    pan,
    address_line1 AS addressLine1,
    address_line2 AS addressLine2,
    city,
    state,
    state_code AS stateCode,
    pincode,
    country,
    currency,
    timezone,
    bank_name AS bankName,
    bank_account_number AS bankAccountNumber,
    bank_ifsc AS bankIfsc,
    invoice_prefix AS invoicePrefix,
    bio,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt,
    DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updatedAt
  FROM users
  WHERE id = ?
  LIMIT 1
`;

async function authenticate(req, _res, next) {
  try {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) {
      throw createHttpError(401, 'Authentication required.');
    }

    const token = authorization.slice('Bearer '.length);
    const payload = verifyToken(token);

    const [rows] = await pool.query(USER_SELECT, [payload.sub]);
    if (rows.length === 0) {
      throw createHttpError(401, 'Account no longer exists.');
    }

    req.user = serializeUser(rows[0]);
    next();
  } catch (error) {
    next(error.statusCode ? error : createHttpError(401, 'Invalid or expired session.'));
  }
}

module.exports = {
  authenticate,
  USER_SELECT,
};
