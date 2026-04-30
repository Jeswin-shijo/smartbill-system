const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'smartbill_dev_secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  comparePassword,
  hashPassword,
  signToken,
  verifyToken,
};
