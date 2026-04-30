const { pool } = require('../config/db');
const { serializeBill, serializeHistory, toNumber } = require('../utils/serializers');

async function getDashboard(req, res) {
  const ownerId = req.user.id;

  const [[aggregate]] = await pool.query(
    `SELECT
        COUNT(*) AS totalBills,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) AS paidRevenue,
        COALESCE(SUM(CASE WHEN status IN ('Draft', 'Sent', 'Overdue') THEN total_amount ELSE 0 END), 0) AS openRevenue,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN total_amount ELSE 0 END), 0) AS overdueRevenue,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN cgst_total + sgst_total + igst_total ELSE 0 END), 0) AS gstCollected,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END), 0) AS overdueCount,
        COALESCE(SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END), 0) AS sentCount,
        COALESCE(SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END), 0) AS draftCount,
        COALESCE(AVG(CASE WHEN paid_date IS NOT NULL THEN DATEDIFF(paid_date, issue_date) END), 0) AS avgSettlementDays
      FROM bills WHERE owner_id = ?`,
    [ownerId],
  );

  const [recentBillRows] = await pool.query(
    `SELECT
        b.id, b.bill_number AS billNumber, b.customer_id AS customerId,
        c.name AS customerName,
        DATE_FORMAT(b.issue_date, '%Y-%m-%d') AS issueDate,
        DATE_FORMAT(b.due_date, '%Y-%m-%d') AS dueDate,
        b.subtotal, b.discount_total AS discountTotal, b.taxable_total AS taxableTotal,
        b.cgst_total AS cgstTotal, b.sgst_total AS sgstTotal, b.igst_total AS igstTotal,
        b.round_off AS roundOff, b.total_amount AS totalAmount,
        b.status, b.notes, b.terms,
        DATE_FORMAT(b.last_activity_at, '%Y-%m-%dT%H:%i:%sZ') AS lastActivityAt,
        DATE_FORMAT(b.created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt,
        DATE_FORMAT(b.updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updatedAt
     FROM bills b
     INNER JOIN customers c ON c.id = b.customer_id
     WHERE b.owner_id = ?
     ORDER BY b.issue_date DESC, b.id DESC
     LIMIT 6`,
    [ownerId],
  );

  const [breakdownRows] = await pool.query(
    `SELECT status, COUNT(*) AS total, COALESCE(SUM(total_amount), 0) AS amount
       FROM bills WHERE owner_id = ?
       GROUP BY status ORDER BY total DESC`,
    [ownerId],
  );

  const [historyRows] = await pool.query(
    `SELECT
        h.id, h.bill_id AS billId, b.bill_number AS billNumber, c.name AS customerName,
        h.status, h.title, h.description, u.full_name AS actorName,
        DATE_FORMAT(h.created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt
      FROM bill_status_history h
      INNER JOIN bills b ON b.id = h.bill_id
      INNER JOIN customers c ON c.id = b.customer_id
      INNER JOIN users u ON u.id = h.actor_user_id
      WHERE b.owner_id = ?
      ORDER BY h.created_at DESC LIMIT 8`,
    [ownerId],
  );

  const alerts = [];
  if (Number(aggregate.overdueCount) > 0) {
    alerts.push({ tone: 'danger', message: `${aggregate.overdueCount} invoice${Number(aggregate.overdueCount) > 1 ? 's are' : ' is'} overdue and need follow-up.` });
  }
  if (Number(aggregate.sentCount) > 0) {
    alerts.push({ tone: 'info', message: `${aggregate.sentCount} invoice${Number(aggregate.sentCount) > 1 ? 's are' : ' is'} awaiting payment.` });
  }
  if (Number(aggregate.draftCount) > 0) {
    alerts.push({ tone: 'warn', message: `${aggregate.draftCount} draft${Number(aggregate.draftCount) > 1 ? 's are' : ' is'} ready to send.` });
  }

  res.json({
    user: req.user,
    stats: [
      { key: 'totalBills', label: 'Total invoices', value: Number(aggregate.totalBills), helper: 'All invoices created' },
      { key: 'paidRevenue', label: 'Collected revenue', value: toNumber(aggregate.paidRevenue), helper: 'Sum of paid invoices' },
      { key: 'openRevenue', label: 'Open balance', value: toNumber(aggregate.openRevenue), helper: 'Draft + sent + overdue' },
      { key: 'overdueRevenue', label: 'Overdue', value: toNumber(aggregate.overdueRevenue), helper: 'Past due dates' },
      { key: 'gstCollected', label: 'GST collected', value: toNumber(aggregate.gstCollected), helper: 'CGST + SGST + IGST on paid invoices' },
      { key: 'avgSettlementDays', label: 'Avg settlement', value: Number(toNumber(aggregate.avgSettlementDays).toFixed(1)), helper: 'Days from issue to payment' },
    ],
    recentBills: recentBillRows.map((row) => ({
      ...serializeBill(row, [], null),
      customerName: row.customerName,
    })),
    breakdown: breakdownRows.map((row) => ({
      status: row.status,
      total: Number(row.total),
      amount: toNumber(row.amount),
    })),
    activity: historyRows.map(serializeHistory),
    alerts,
  });
}

module.exports = {
  getDashboard,
};
