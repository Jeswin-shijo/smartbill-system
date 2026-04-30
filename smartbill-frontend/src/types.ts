export const BILL_STATUS_OPTIONS = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'] as const
export type BillStatus = (typeof BILL_STATUS_OPTIONS)[number]

export type UserProfile = {
  id: number
  fullName: string
  email: string
  role: string
  phone: string
  businessName: string
  gstin: string
  pan: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  stateCode: string
  pincode: string
  country: string
  currency: string
  timezone: string
  bankName: string
  bankAccountNumber: string
  bankIfsc: string
  invoicePrefix: string
  bio: string
  createdAt: string
  updatedAt: string
}

export type Customer = {
  id: number
  name: string
  email: string
  phone: string
  gstin: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  stateCode: string
  pincode: string
  country: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type Item = {
  id: number
  name: string
  description: string
  hsnCode: string
  unit: string
  rate: number
  gstRate: number
  type: 'product' | 'service'
  createdAt: string
  updatedAt: string
}

export type BillLineItem = {
  id?: number
  itemId: number | null
  position: number
  description: string
  hsnCode: string
  unit: string
  quantity: number
  rate: number
  discountPct: number
  gstRate: number
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
}

export type Bill = {
  id: number
  billNumber: string
  customerId: number
  customer: Customer | null
  customerName?: string
  issueDate: string
  dueDate: string
  placeOfSupply: string
  placeOfSupplyCode: string
  isInterState: boolean
  subtotal: number
  discountTotal: number
  taxableTotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff: number
  totalAmount: number
  status: BillStatus
  notes: string
  terms: string
  paidDate: string | null
  paidAmount: number
  paymentMethod: string
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  items: BillLineItem[]
}

export type HistoryEntry = {
  id: number
  billId: number
  billNumber: string
  customerName: string
  status: string
  title: string
  description: string
  actorName: string
  createdAt: string
}

export type DashboardStat = {
  key: string
  label: string
  value: number
  helper: string
}

export type DashboardAlert = {
  tone: 'danger' | 'warn' | 'info'
  message: string
}

export type DashboardData = {
  user: UserProfile
  stats: DashboardStat[]
  recentBills: Bill[]
  breakdown: Array<{ status: string; total: number; amount: number }>
  activity: HistoryEntry[]
  alerts: DashboardAlert[]
}

export type AuthResponse = { token: string; user: UserProfile }
export type MeResponse = { user: UserProfile }
export type CustomersResponse = { customers: Customer[] }
export type CustomerResponse = { customer: Customer }
export type ItemsResponse = { items: Item[] }
export type ItemResponse = { item: Item }
export type BillsResponse = { bills: Bill[] }
export type BillDetailResponse = { bill: Bill; history: HistoryEntry[] }
export type HistoryResponse = { history: HistoryEntry[] }
export type ProfileResponse = { profile: UserProfile }
export type PasswordResponse = { message: string }
export type NextNumberResponse = { billNumber: string }

export type LineItemDraft = {
  itemId: number | null
  description: string
  hsnCode: string
  unit: string
  quantity: string
  rate: string
  discountPct: string
  gstRate: string
}

export type BillDraft = {
  billNumber: string
  customerId: number | null
  issueDate: string
  dueDate: string
  placeOfSupply: string
  placeOfSupplyCode: string
  notes: string
  terms: string
  items: LineItemDraft[]
}
