const { pool } = require('../config/db');
const { comparePassword, hashPassword, signToken } = require('../utils/auth');
const { createHttpError } = require('../utils/http');
const { serializeUser } = require('../utils/serializers');
const { USER_SELECT } = require('../middleware/authenticate');
const { generateCode, passwordResetEmail, sendEmail } = require('../utils/email');

const RESET_CODE_EXPIRY_MINUTES = Number(process.env.RESET_CODE_EXPIRY_MINUTES || 15);
const GENERIC_RESET_RESPONSE = {
  message: 'If an account exists for this email, a password reset code has been sent.',
};

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw createHttpError(400, 'Email and password are required.');
  }

  const [rows] = await pool.query(
    'SELECT id, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1',
    [String(email).trim().toLowerCase()],
  );

  if (rows.length === 0) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  const candidate = rows[0];
  const isValid = await comparePassword(password, candidate.passwordHash);
  if (!isValid) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  const [userRows] = await pool.query(USER_SELECT, [candidate.id]);
  const user = serializeUser(userRows[0]);

  res.json({
    token: signToken({ id: user.id, email: user.email, role: user.role }),
    user,
  });
}

async function getCurrentUser(req, res) {
  res.json({ user: req.user });
}

async function forgotPassword(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) throw createHttpError(400, 'Email is required.');

  const [rows] = await pool.query(
    'SELECT id, full_name AS fullName, email FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  if (rows.length === 0) {
    res.json(GENERIC_RESET_RESPONSE);
    return;
  }

  const user = rows[0];
  const code = generateCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [user.id],
  );
  await pool.query(
    'INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES (?, ?, ?)',
    [user.id, codeHash, expiresAt],
  );

  const mail = passwordResetEmail({ name: user.fullName, code, minutes: RESET_CODE_EXPIRY_MINUTES });
  try {
    await sendEmail({ to: user.email, ...mail });
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
  }

  res.json(GENERIC_RESET_RESPONSE);
}

async function resetPassword(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!email || !code || !newPassword) {
    throw createHttpError(400, 'Email, code, and new password are required.');
  }
  if (newPassword.length < 8) {
    throw createHttpError(400, 'New password must be at least 8 characters.');
  }

  const [userRows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (userRows.length === 0) {
    throw createHttpError(400, 'Invalid or expired reset code.');
  }
  const userId = userRows[0].id;

  const [resetRows] = await pool.query(
    `SELECT id, code_hash AS codeHash, expires_at AS expiresAt, used_at AS usedAt
       FROM password_resets
       WHERE user_id = ? AND used_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
    [userId],
  );

  if (resetRows.length === 0) {
    throw createHttpError(400, 'Invalid or expired reset code.');
  }

  const reset = resetRows[0];
  const expiresAt = reset.expiresAt instanceof Date ? reset.expiresAt : new Date(reset.expiresAt);
  if (expiresAt.getTime() < Date.now()) {
    await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);
    throw createHttpError(400, 'Invalid or expired reset code.');
  }

  const codeMatches = await comparePassword(code, reset.codeHash);
  if (!codeMatches) {
    throw createHttpError(400, 'Invalid or expired reset code.');
  }

  const newHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
  await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);

  res.json({ message: 'Password updated. You can sign in with your new password.' });
}

module.exports = {
  forgotPassword,
  getCurrentUser,
  login,
  resetPassword,
};
