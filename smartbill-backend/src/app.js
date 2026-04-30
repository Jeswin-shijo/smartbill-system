const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, dbConfig } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const billRoutes = require('./routes/billRoutes');
const customerRoutes = require('./routes/customerRoutes');
const itemRoutes = require('./routes/itemRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { asyncHandler } = require('./utils/http');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1');
      res.json({
        status: 'ok',
        service: 'smartbill-backend',
        database: dbConfig.database,
        timestamp: new Date().toISOString(),
      });
    } finally {
      connection.release();
    }
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/profile', profileRoutes);

const staticDir = process.env.STATIC_DIR || path.resolve(__dirname, '..', 'public');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.use(errorHandler);

module.exports = {
  app,
};
