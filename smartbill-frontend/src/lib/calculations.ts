import type { LineItemDraft } from '../types'

const round = (value: number) => Math.round(value * 100) / 100

export type ComputedLine = {
  gross: number
  discount: number
  taxable: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export type ComputedTotals = {
  lines: ComputedLine[]
  subtotal: number
  discountTotal: number
  taxableTotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff: number
  totalAmount: number
}

export function computeLine(line: LineItemDraft, isInterState: boolean): ComputedLine {
  const quantity = Number(line.quantity) || 0
  const rate = Number(line.rate) || 0
  const discountPct = Number(line.discountPct) || 0
  const gstRate = Number(line.gstRate) || 0

  const gross = round(quantity * rate)
  const discount = round((gross * discountPct) / 100)
  const taxable = round(gross - discount)

  const cgst = isInterState ? 0 : round((taxable * gstRate) / 200)
  const sgst = isInterState ? 0 : round((taxable * gstRate) / 200)
  const igst = isInterState ? round((taxable * gstRate) / 100) : 0
  const total = round(taxable + cgst + sgst + igst)

  return { gross, discount, taxable, cgst, sgst, igst, total }
}

export function computeTotals(items: LineItemDraft[], isInterState: boolean): ComputedTotals {
  const lines = items.map((item) => computeLine(item, isInterState))
  const subtotal = round(lines.reduce((acc, l) => acc + l.gross, 0))
  const discountTotal = round(lines.reduce((acc, l) => acc + l.discount, 0))
  const taxableTotal = round(lines.reduce((acc, l) => acc + l.taxable, 0))
  const cgstTotal = round(lines.reduce((acc, l) => acc + l.cgst, 0))
  const sgstTotal = round(lines.reduce((acc, l) => acc + l.sgst, 0))
  const igstTotal = round(lines.reduce((acc, l) => acc + l.igst, 0))
  const raw = round(taxableTotal + cgstTotal + sgstTotal + igstTotal)
  const totalAmount = Math.round(raw)
  const roundOff = round(totalAmount - raw)
  return { lines, subtotal, discountTotal, taxableTotal, cgstTotal, sgstTotal, igstTotal, roundOff, totalAmount }
}

export function emptyLineItem(): LineItemDraft {
  return {
    itemId: null,
    description: '',
    hsnCode: '',
    unit: 'pcs',
    quantity: '1',
    rate: '0',
    discountPct: '0',
    gstRate: '18',
  }
}
