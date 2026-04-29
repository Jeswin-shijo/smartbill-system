const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

const dashboard = {
  company: {
    name: 'Smart Bill',
    plan: 'Growth',
    currency: 'USD',
  },
  stats: [
    { label: 'Invoices sent', value: '184', change: '+12% this month' },
    { label: 'Collected revenue', value: '$42,860', change: '+8.4% vs target' },
    { label: 'Pending payments', value: '$9,720', change: '14 clients awaiting payment' },
    { label: 'Average payment time', value: '4.2 days', change: '0.6 days faster' },
  ],
  bills: [
    {
      id: 'INV-2401',
      client: 'Lumen Labs',
      amount: '$4,850',
      dueDate: '2026-05-04',
      status: 'Due soon',
    },
    {
      id: 'INV-2398',
      client: 'Northstar Retail',
      amount: '$7,200',
      dueDate: '2026-05-08',
      status: 'Sent',
    },
    {
      id: 'INV-2394',
      client: 'Harbor Health',
      amount: '$2,175',
      dueDate: '2026-04-28',
      status: 'Overdue',
    },
    {
      id: 'INV-2387',
      client: 'Apex Legal',
      amount: '$3,940',
      dueDate: '2026-05-12',
      status: 'Draft',
    },
  ],
  alerts: [
    '2 invoices became overdue in the last 48 hours.',
    'Auto-reminders are scheduled for 6 unpaid invoices today.',
  ],
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'smartbill-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', (_req, res) => {
  res.json({
    ...dashboard,
    generatedAt: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Smart Bill backend running on http://localhost:${port}`);
});
