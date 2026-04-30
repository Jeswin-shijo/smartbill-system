const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatINR(value: number | string | null | undefined, options?: { compact?: boolean }) {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return '₹0.00'
  return options?.compact ? inrCompactFormatter.format(num) : inrFormatter.format(num)
}

export function formatNumber(value: number | string | null | undefined) {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return '0.00'
  return numberFormatter.format(num)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getInitials(name: string) {
  if (!name) return ''
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function statusClassName(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

const inWords = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function below100(n: number): string {
  if (n < 20) return inWords[n] || ''
  const t = Math.floor(n / 10)
  const u = n % 10
  return tens[t] + (u ? '-' + inWords[u] : '')
}

function below1000(n: number): string {
  if (n < 100) return below100(n)
  const h = Math.floor(n / 100)
  const r = n % 100
  return inWords[h] + ' hundred' + (r ? ' and ' + below100(r) : '')
}

export function amountInWords(value: number): string {
  const num = Math.round(Number(value || 0))
  if (num === 0) return 'Zero rupees only'
  let n = num
  const crore = Math.floor(n / 10000000)
  n = n % 10000000
  const lakh = Math.floor(n / 100000)
  n = n % 100000
  const thousand = Math.floor(n / 1000)
  n = n % 1000
  const rest = n
  const parts: string[] = []
  if (crore) parts.push(below1000(crore) + ' crore')
  if (lakh) parts.push(below100(lakh) + ' lakh')
  if (thousand) parts.push(below100(thousand) + ' thousand')
  if (rest) parts.push(below1000(rest))
  const phrase = parts.join(' ').replace(/\s+/g, ' ').trim()
  return (phrase.charAt(0).toUpperCase() + phrase.slice(1)) + ' rupees only'
}
