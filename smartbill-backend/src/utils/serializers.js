function toNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

function serializeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    phone: row.phone || '',
    businessName: row.businessName || '',
    gstin: row.gstin || '',
    pan: row.pan || '',
    addressLine1: row.addressLine1 || '',
    addressLine2: row.addressLine2 || '',
    city: row.city || '',
    state: row.state || '',
    stateCode: row.stateCode || '',
    pincode: row.pincode || '',
    country: row.country || 'India',
    currency: row.currency || 'INR',
    timezone: row.timezone || 'Asia/Kolkata',
    bankName: row.bankName || '',
    bankAccountNumber: row.bankAccountNumber || '',
    bankIfsc: row.bankIfsc || '',
    invoicePrefix: row.invoicePrefix || 'INV',
    bio: row.bio || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    gstin: row.gstin || '',
    addressLine1: row.addressLine1 || '',
    addressLine2: row.addressLine2 || '',
    city: row.city || '',
    state: row.state || '',
    stateCode: row.stateCode || '',
    pincode: row.pincode || '',
    country: row.country || 'India',
    notes: row.notes || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    hsnCode: row.hsnCode || '',
    unit: row.unit || 'pcs',
    rate: toNumber(row.rate),
    gstRate: toNumber(row.gstRate),
    type: row.type || 'service',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeBillItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.itemId,
    position: Number(row.position) || 0,
    description: row.description,
    hsnCode: row.hsnCode || '',
    unit: row.unit || 'pcs',
    quantity: toNumber(row.quantity),
    rate: toNumber(row.rate),
    discountPct: toNumber(row.discountPct),
    gstRate: toNumber(row.gstRate),
    taxableValue: toNumber(row.taxableValue),
    cgstAmount: toNumber(row.cgstAmount),
    sgstAmount: toNumber(row.sgstAmount),
    igstAmount: toNumber(row.igstAmount),
    totalAmount: toNumber(row.totalAmount),
  };
}

function serializeBill(row, items = [], customer = null) {
  if (!row) return null;
  return {
    id: row.id,
    billNumber: row.billNumber,
    customerId: row.customerId,
    customer,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    placeOfSupply: row.placeOfSupply || '',
    placeOfSupplyCode: row.placeOfSupplyCode || '',
    isInterState: Number(row.isInterState) === 1,
    subtotal: toNumber(row.subtotal),
    discountTotal: toNumber(row.discountTotal),
    taxableTotal: toNumber(row.taxableTotal),
    cgstTotal: toNumber(row.cgstTotal),
    sgstTotal: toNumber(row.sgstTotal),
    igstTotal: toNumber(row.igstTotal),
    roundOff: toNumber(row.roundOff),
    totalAmount: toNumber(row.totalAmount),
    status: row.status,
    notes: row.notes || '',
    terms: row.terms || '',
    paidDate: row.paidDate || null,
    paidAmount: toNumber(row.paidAmount),
    paymentMethod: row.paymentMethod || '',
    lastActivityAt: row.lastActivityAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items,
  };
}

function serializeHistory(row) {
  return {
    id: row.id,
    billId: row.billId,
    billNumber: row.billNumber,
    customerName: row.customerName,
    status: row.status,
    title: row.title,
    description: row.description || '',
    actorName: row.actorName,
    createdAt: row.createdAt,
  };
}

module.exports = {
  serializeBill,
  serializeBillItem,
  serializeCustomer,
  serializeHistory,
  serializeItem,
  serializeUser,
  toNumber,
};
