require('dotenv').config();

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'smartbill_user',
  password: process.env.DB_PASSWORD || 'smartbill_password',
  database: process.env.DB_NAME || 'smartbill',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

module.exports = {
  dbConfig,
  pool,
};
