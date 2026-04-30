const ROUND = (value) => Math.round((Number(value) || 0) * 100) / 100;

function computeLineItem(line, isInterState) {
  const quantity = Number(line.quantity) || 0;
  const rate = Number(line.rate) || 0;
  const discountPct = Number(line.discountPct) || 0;
  const gstRate = Number(line.gstRate) || 0;

  const gross = ROUND(quantity * rate);
  const discount = ROUND((gross * discountPct) / 100);
  const taxable = ROUND(gross - discount);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = ROUND((taxable * gstRate) / 100);
  } else {
    cgst = ROUND((taxable * gstRate) / 200);
    sgst = ROUND((taxable * gstRate) / 200);
  }

  const total = ROUND(taxable + cgst + sgst + igst);

  return {
    quantity,
    rate,
    discountPct,
    gstRate,
    gross,
    discount,
    taxableValue: taxable,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    totalAmount: total,
  };
}

function computeBillTotals(lineItems, isInterState) {
  const computed = lineItems.map((line) => ({
    ...line,
    ...computeLineItem(line, isInterState),
  }));

  const subtotal = ROUND(computed.reduce((acc, l) => acc + l.gross, 0));
  const discountTotal = ROUND(computed.reduce((acc, l) => acc + l.discount, 0));
  const taxableTotal = ROUND(computed.reduce((acc, l) => acc + l.taxableValue, 0));
  const cgstTotal = ROUND(computed.reduce((acc, l) => acc + l.cgstAmount, 0));
  const sgstTotal = ROUND(computed.reduce((acc, l) => acc + l.sgstAmount, 0));
  const igstTotal = ROUND(computed.reduce((acc, l) => acc + l.igstAmount, 0));

  const rawTotal = ROUND(taxableTotal + cgstTotal + sgstTotal + igstTotal);
  const rounded = Math.round(rawTotal);
  const roundOff = ROUND(rounded - rawTotal);
  const totalAmount = rounded;

  return {
    items: computed,
    subtotal,
    discountTotal,
    taxableTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    roundOff,
    totalAmount,
  };
}

module.exports = {
  computeBillTotals,
  computeLineItem,
};
