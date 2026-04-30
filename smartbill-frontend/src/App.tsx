import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { CustomerFormView, type CustomerDraft } from './components/CustomerFormView'
import { CustomersView } from './components/CustomersView'
import { DashboardView } from './components/DashboardView'
import { InvoiceDetailView } from './components/InvoiceDetailView'
import { InvoiceFormView } from './components/InvoiceFormView'
import { InvoicesView } from './components/InvoicesView'
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen'
import { ItemFormView, type ItemDraft } from './components/ItemFormView'
import { ItemsView } from './components/ItemsView'
import { Layout } from './components/Layout'
import { LoginScreen } from './components/LoginScreen'
import { SettingsView, type ProfileDraft } from './components/SettingsView'
import { ApiError, apiRequest, clearStoredToken, getStoredToken, setStoredToken } from './lib/api'
import { navigate, useRoute, type Route } from './lib/router'
import type {
  AuthResponse,
  Bill,
  BillDetailResponse,
  BillDraft,
  BillsResponse,
  Customer,
  CustomerResponse,
  CustomersResponse,
  DashboardData,
  HistoryEntry,
  Item,
  ItemResponse,
  ItemsResponse,
  NextNumberResponse,
  PasswordResponse,
  ProfileResponse,
  UserProfile,
} from './types'

type FlashMessage = { tone: 'success' | 'error'; message: string } | null

const TITLES: Record<Route['name'], { title: string; subtitle?: string }> = {
  'dashboard': { title: 'Dashboard', subtitle: 'Revenue, GST and pending invoices at a glance' },
  'invoices': { title: 'Invoices', subtitle: 'All invoices, filters and quick actions' },
  'invoice-new': { title: 'New invoice', subtitle: 'Create a GST-compliant invoice' },
  'invoice-edit': { title: 'Edit invoice', subtitle: 'Update line items, totals or details' },
  'invoice-detail': { title: 'Invoice detail', subtitle: 'View, send, mark paid or print' },
  'customers': { title: 'Customers', subtitle: 'Bill-to parties for your invoices' },
  'customer-new': { title: 'New customer' },
  'customer-edit': { title: 'Edit customer' },
  'items': { title: 'Items & Services', subtitle: 'Reusable catalog with HSN/SAC and GST' },
  'item-new': { title: 'New item' },
  'item-edit': { title: 'Edit item' },
  'settings': { title: 'Settings', subtitle: 'Business profile, GSTIN, bank details, password' },
}

function App() {
  const route = useRoute()
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState<UserProfile | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [activeBill, setActiveBill] = useState<Bill | null>(null)
  const [activeBillHistory, setActiveBillHistory] = useState<HistoryEntry[]>([])
  const [nextBillNumber, setNextBillNumber] = useState('')
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)
  const [activeItem, setActiveItem] = useState<Item | null>(null)
  const [loginError, setLoginError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login')
  const [flash, setFlash] = useState<FlashMessage>(null)
  const [isBooting, setIsBooting] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApiFailure = useCallback((error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback
    if (error instanceof ApiError && error.status === 401) {
      clearStoredToken()
      setToken('')
      setUser(null)
      setDashboard(null)
      setBills([])
      setCustomers([])
      setItems([])
      setLoginError('Your session expired. Please sign in again.')
      return
    }
    setFlash({ tone: 'error', message })
  }, [])

  const loadCore = useCallback(
    async (sessionToken: string) => {
      const [dashboardRes, billsRes, customersRes, itemsRes, profileRes] = await Promise.all([
        apiRequest<DashboardData>('/api/dashboard', { token: sessionToken }),
        apiRequest<BillsResponse>('/api/bills', { token: sessionToken }),
        apiRequest<CustomersResponse>('/api/customers', { token: sessionToken }),
        apiRequest<ItemsResponse>('/api/items', { token: sessionToken }),
        apiRequest<ProfileResponse>('/api/profile', { token: sessionToken }),
      ])
      setDashboard(dashboardRes)
      setUser(dashboardRes.user)
      setBills(billsRes.bills)
      setCustomers(customersRes.customers)
      setItems(itemsRes.items)
      setUser(profileRes.profile)
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!token) {
        setIsBooting(false)
        return
      }
      setIsBooting(true)
      try {
        await loadCore(token)
        if (!cancelled) setLoginError('')
      } catch (error) {
        if (!cancelled) handleApiFailure(error, 'Unable to load your workspace.')
      } finally {
        if (!cancelled) setIsBooting(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [token, loadCore, handleApiFailure])

  // Load entity-specific data based on the current route
  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      try {
        if (route.name === 'invoice-new') {
          const res = await apiRequest<NextNumberResponse>('/api/bills/next-number', { token })
          if (!cancelled) {
            setNextBillNumber(res.billNumber)
            setActiveBill(null)
            setActiveBillHistory([])
          }
        } else if (route.name === 'invoice-edit' || route.name === 'invoice-detail') {
          const res = await apiRequest<BillDetailResponse>(`/api/bills/${route.id}`, { token })
          if (!cancelled) {
            setActiveBill(res.bill)
            setActiveBillHistory(res.history)
          }
        } else if (route.name === 'customer-edit') {
          const res = await apiRequest<CustomerResponse>(`/api/customers/${route.id}`, { token })
          if (!cancelled) setActiveCustomer(res.customer)
        } else if (route.name === 'customer-new') {
          if (!cancelled) setActiveCustomer(null)
        } else if (route.name === 'item-edit') {
          const res = await apiRequest<ItemResponse>(`/api/items/${route.id}`, { token })
          if (!cancelled) setActiveItem(res.item)
        } else if (route.name === 'item-new') {
          if (!cancelled) setActiveItem(null)
        }
      } catch (error) {
        if (!cancelled) handleApiFailure(error, 'Unable to load the requested record.')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, route, handleApiFailure])

  function dismissFlash() {
    setFlash(null)
  }

  async function handleLogin(email: string, password: string) {
    setIsSubmitting(true)
    setLoginError('')
    setFlash(null)
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      setStoredToken(response.token)
      setToken(response.token)
      setUser(response.user)
      navigate('/dashboard')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    clearStoredToken()
    setToken('')
    setUser(null)
    setDashboard(null)
    setBills([])
    setCustomers([])
    setItems([])
    setFlash(null)
    navigate('/dashboard')
  }

  async function refreshAfterMutation(message: string) {
    if (!token) return
    try {
      await loadCore(token)
      setFlash({ tone: 'success', message })
    } catch (error) {
      handleApiFailure(error, 'Saved, but failed to refresh data.')
    }
  }

  // ----- Invoices -----

  async function handleSaveInvoice(draft: BillDraft) {
    if (!token) return
    setIsSubmitting(true)
    setFlash(null)
    try {
      const payload = {
        billNumber: draft.billNumber,
        customerId: draft.customerId,
        issueDate: draft.issueDate,
        dueDate: draft.dueDate,
        placeOfSupply: draft.placeOfSupply,
        placeOfSupplyCode: draft.placeOfSupplyCode,
        notes: draft.notes,
        terms: draft.terms,
        items: draft.items.map((line) => ({
          itemId: line.itemId,
          description: line.description,
          hsnCode: line.hsnCode,
          unit: line.unit,
          quantity: Number(line.quantity),
          rate: Number(line.rate),
          discountPct: Number(line.discountPct),
          gstRate: Number(line.gstRate),
        })),
      }

      let response: BillDetailResponse
      if (route.name === 'invoice-edit') {
        response = await apiRequest<BillDetailResponse>(`/api/bills/${route.id}`, {
          method: 'PUT',
          token,
          body: payload,
        })
      } else {
        response = await apiRequest<BillDetailResponse>('/api/bills', {
          method: 'POST',
          token,
          body: payload,
        })
      }

      await loadCore(token)
      setFlash({ tone: 'success', message: `${response.bill.billNumber} saved.` })
      navigate(`/invoices/${response.bill.id}`)
    } catch (error) {
      handleApiFailure(error, 'Unable to save the invoice.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateInvoiceStatus(billId: number, status: string, description: string, paymentMethod?: string) {
    if (!token) return
    setIsSubmitting(true)
    setFlash(null)
    try {
      const response = await apiRequest<BillDetailResponse>(`/api/bills/${billId}/status`, {
        method: 'PATCH',
        token,
        body: { status, description, paymentMethod },
      })
      setActiveBill(response.bill)
      setActiveBillHistory(response.history)
      await loadCore(token)
      setFlash({ tone: 'success', message: `${response.bill.billNumber} marked as ${status}.` })
    } catch (error) {
      handleApiFailure(error, 'Unable to update the invoice status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteInvoice(billId: number) {
    if (!token) return
    const target = bills.find((b) => b.id === billId) ?? activeBill
    const label = target?.billNumber ?? 'this invoice'
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return

    setIsSubmitting(true)
    setFlash(null)
    try {
      await apiRequest<{ message: string }>(`/api/bills/${billId}`, { method: 'DELETE', token })
      await loadCore(token)
      setFlash({ tone: 'success', message: `${label} deleted.` })
      navigate('/invoices')
    } catch (error) {
      handleApiFailure(error, 'Unable to delete the invoice.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----- Customers -----

  async function handleSaveCustomer(draft: CustomerDraft) {
    if (!token) return
    setIsSubmitting(true)
    setFlash(null)
    try {
      let res: CustomerResponse
      if (route.name === 'customer-edit') {
        res = await apiRequest<CustomerResponse>(`/api/customers/${route.id}`, { method: 'PUT', token, body: draft })
      } else {
        res = await apiRequest<CustomerResponse>('/api/customers', { method: 'POST', token, body: draft })
      }
      await refreshAfterMutation(`${res.customer.name} saved.`)
      navigate('/customers')
    } catch (error) {
      handleApiFailure(error, 'Unable to save the customer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteCustomer(customerId: number) {
    if (!token) return
    const target = customers.find((c) => c.id === customerId)
    if (!target) return
    if (!window.confirm(`Delete ${target.name}?`)) return

    setIsSubmitting(true)
    setFlash(null)
    try {
      await apiRequest<{ message: string }>(`/api/customers/${customerId}`, { method: 'DELETE', token })
      await refreshAfterMutation(`${target.name} removed.`)
    } catch (error) {
      handleApiFailure(error, 'Unable to delete the customer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----- Items -----

  async function handleSaveItem(draft: ItemDraft) {
    if (!token) return
    setIsSubmitting(true)
    setFlash(null)
    try {
      const body = {
        ...draft,
        rate: Number(draft.rate),
        gstRate: Number(draft.gstRate),
      }
      let res: ItemResponse
      if (route.name === 'item-edit') {
        res = await apiRequest<ItemResponse>(`/api/items/${route.id}`, { method: 'PUT', token, body })
      } else {
        res = await apiRequest<ItemResponse>('/api/items', { method: 'POST', token, body })
      }
      await refreshAfterMutation(`${res.item.name} saved.`)
      navigate('/items')
    } catch (error) {
      handleApiFailure(error, 'Unable to save the item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!token) return
    const target = items.find((i) => i.id === itemId)
    if (!target) return
    if (!window.confirm(`Delete ${target.name}?`)) return

    setIsSubmitting(true)
    setFlash(null)
    try {
      await apiRequest<{ message: string }>(`/api/items/${itemId}`, { method: 'DELETE', token })
      await refreshAfterMutation(`${target.name} removed.`)
    } catch (error) {
      handleApiFailure(error, 'Unable to delete the item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----- Profile -----

  async function handleSaveProfile(draft: ProfileDraft) {
    if (!token) return
    setIsSubmitting(true)
    setFlash(null)
    try {
      const res = await apiRequest<ProfileResponse>('/api/profile', { method: 'PUT', token, body: draft })
      setUser(res.profile)
      setFlash({ tone: 'success', message: 'Profile updated.' })
    } catch (error) {
      handleApiFailure(error, 'Unable to save your profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleChangePassword(currentPassword: string, newPassword: string) {
    if (!token) return
    setIsSubmitting(true)
    setFlash(null)
    try {
      const res = await apiRequest<PasswordResponse>('/api/profile/password', {
        method: 'PUT',
        token,
        body: { currentPassword, newPassword },
      })
      setFlash({ tone: 'success', message: res.message })
    } catch (error) {
      handleApiFailure(error, 'Unable to change your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    if (authMode === 'forgot') {
      return (
        <ForgotPasswordScreen
          onBackToLogin={() => setAuthMode('login')}
          onResetSuccess={() => {
            setAuthMode('login')
            setLoginError('')
          }}
        />
      )
    }
    return (
      <LoginScreen
        isLoading={isSubmitting}
        errorMessage={loginError}
        onLogin={handleLogin}
        onForgotPassword={() => { setLoginError(''); setAuthMode('forgot') }}
      />
    )
  }

  if (isBooting || !user || !dashboard) {
    return (
      <div className="loading-stage">
        <div className="spinner" />
      </div>
    )
  }

  const titles = TITLES[route.name]
  const headerActions = renderHeaderActions(route)

  return (
    <Layout
      route={route}
      user={user}
      title={titles.title}
      subtitle={titles.subtitle}
      actions={headerActions}
      flash={flash}
      onDismissFlash={dismissFlash}
      onLogout={handleLogout}
    >
      {route.name === 'dashboard' ? <DashboardView data={dashboard} /> : null}

      {route.name === 'invoices' ? <InvoicesView bills={bills} /> : null}

      {route.name === 'invoice-new' ? (
        <InvoiceFormView
          user={user}
          customers={customers}
          items={items}
          initialBill={null}
          initialNumber={nextBillNumber}
          isSubmitting={isSubmitting}
          onSave={handleSaveInvoice}
          onCancel={() => navigate('/invoices')}
        />
      ) : null}

      {route.name === 'invoice-edit' && activeBill && activeBill.id === route.id ? (
        <InvoiceFormView
          user={user}
          customers={customers}
          items={items}
          initialBill={activeBill}
          initialNumber={activeBill.billNumber}
          isSubmitting={isSubmitting}
          onSave={handleSaveInvoice}
          onCancel={() => navigate(`/invoices/${activeBill.id}`)}
        />
      ) : null}

      {route.name === 'invoice-detail' && activeBill && activeBill.id === route.id ? (
        <InvoiceDetailView
          user={user}
          bill={activeBill}
          history={activeBillHistory}
          isSubmitting={isSubmitting}
          onUpdateStatus={(status, description, paymentMethod) => handleUpdateInvoiceStatus(activeBill.id, status, description, paymentMethod)}
          onDelete={() => handleDeleteInvoice(activeBill.id)}
        />
      ) : null}

      {(route.name === 'invoice-detail' || route.name === 'invoice-edit') && (!activeBill || activeBill.id !== route.id) ? (
        <div className="loading-stage" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : null}

      {route.name === 'customers' ? (
        <CustomersView customers={customers} isSubmitting={isSubmitting} onDelete={handleDeleteCustomer} />
      ) : null}

      {route.name === 'customer-new' ? (
        <CustomerFormView initial={null} isSubmitting={isSubmitting} onSave={handleSaveCustomer} onCancel={() => navigate('/customers')} />
      ) : null}

      {route.name === 'customer-edit' ? (
        <CustomerFormView initial={activeCustomer} isSubmitting={isSubmitting} onSave={handleSaveCustomer} onCancel={() => navigate('/customers')} />
      ) : null}

      {route.name === 'items' ? (
        <ItemsView items={items} isSubmitting={isSubmitting} onDelete={handleDeleteItem} />
      ) : null}

      {route.name === 'item-new' ? (
        <ItemFormView initial={null} isSubmitting={isSubmitting} onSave={handleSaveItem} onCancel={() => navigate('/items')} />
      ) : null}

      {route.name === 'item-edit' ? (
        <ItemFormView initial={activeItem} isSubmitting={isSubmitting} onSave={handleSaveItem} onCancel={() => navigate('/items')} />
      ) : null}

      {route.name === 'settings' ? (
        <SettingsView profile={user} isSubmitting={isSubmitting} onSaveProfile={handleSaveProfile} onChangePassword={handleChangePassword} />
      ) : null}
    </Layout>
  )
}

function renderHeaderActions(route: Route) {
  if (route.name === 'invoices') {
    return (
      <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/invoices/new')}>
        + New invoice
      </button>
    )
  }
  if (route.name === 'customers') {
    return (
      <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/customers/new')}>
        + Add customer
      </button>
    )
  }
  if (route.name === 'items') {
    return (
      <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/items/new')}>
        + Add item
      </button>
    )
  }
  if (route.name === 'invoice-detail' || route.name === 'invoice-edit' || route.name === 'invoice-new') {
    return (
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/invoices')}>
        ← All invoices
      </button>
    )
  }
  if (route.name === 'customer-edit' || route.name === 'customer-new') {
    return (
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/customers')}>
        ← All customers
      </button>
    )
  }
  if (route.name === 'item-edit' || route.name === 'item-new') {
    return (
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/items')}>
        ← All items
      </button>
    )
  }
  return null
}

export default App
