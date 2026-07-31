const BASE = '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const SESSION_EXPIRED_EVENT = 'session-expired'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw new ApiError(body.error ?? 'Algo deu errado. Tente novamente.', res.status)
  }
  return res.json() as Promise<T>
}

export interface User {
  id: string
  name: string
  email: string
  whatsappNumber: string | null
  usageType: string | null
  avatarUrl: string | null
  emailVerified: boolean
}

export interface HouseholdDto {
  id: string
  name: string
  inviteCode: string
}

export const auth = {
  signup: (data: { name: string; email: string; password: string; whatsappNumber: string; inviteCode?: string }) =>
    request<{ user: User; household: HouseholdDto }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ user: User | null }>('/auth/me'),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  verifyEmail: (token: string) =>
    request<{ ok: true }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: () => request<{ ok: true }>('/auth/resend-verification', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
}

export interface Member {
  id: string
  name: string
  role: string
  whatsapp_number: string | null
  avatar_url: string | null
  monthly_contribution_target: number | null
}

export interface RoutineSettings {
  lives_together: string | null
  has_pets: string | null
  has_children: string | null
  work_mode: string | null
  task_balance: string | null
  pet_count: number | null
  children_count: number | null
  age_ranges: string[]
}

export interface FinancialSettings {
  monthly_income: number | null
  split_method: string | null
  categories: {
    organization: string | null
    debts: string | null
    emergencyFund: string | null
    debtTypes: string[] | null
    priority: string | null
  } | null
  currency: string
  bill_reminder_days: number
}

export const household = {
  me: () => request<{ household: HouseholdDto | null }>('/household/me'),
  members: () => request<{ members: Member[] }>('/household/members'),
  join: (code: string) => request<{ household: HouseholdDto }>('/household/join', { method: 'POST', body: JSON.stringify({ code }) }),
  getRoutineSettings: () => request<{ settings: RoutineSettings | null }>('/household/routine-settings'),
  putRoutineSettings: (
    data: Partial<{
      livesTogether: string
      hasPets: string
      hasChildren: string
      workMode: string
      taskBalance: string
      petCount: number
      childrenCount: number
      ageRanges: string[]
    }>,
  ) => request<{ ok: true }>('/household/routine-settings', { method: 'PUT', body: JSON.stringify(data) }),
  getFinancialSettings: () => request<{ settings: FinancialSettings | null }>('/household/financial-settings'),
  putFinancialSettings: (
    data: Partial<{
      organization: string
      debts: string
      emergencyFund: string
      debtTypes: string[]
      priority: string
      monthlyIncome: number
      billReminderDays: number
    }>,
  ) => request<{ ok: true }>('/household/financial-settings', { method: 'PUT', body: JSON.stringify(data) }),
  leave: () => request<{ ok: true }>('/household/leave', { method: 'POST' }),
  rename: (name: string) => request<{ ok: true }>('/household/rename', { method: 'PUT', body: JSON.stringify({ name }) }),
  regenerateCode: () => request<{ inviteCode: string }>('/household/regenerate-code', { method: 'POST' }),
  setRole: (userId: string, role: 'member' | 'viewer') =>
    request<{ ok: true }>('/household/set-role', { method: 'POST', body: JSON.stringify({ userId, role }) }),
  removeMember: (userId: string) =>
    request<{ ok: true }>('/household/remove-member', { method: 'POST', body: JSON.stringify({ userId }) }),
  setContributionTarget: (userId: string, monthlyTarget: number | null) =>
    request<{ ok: true }>('/household/contribution-target', {
      method: 'POST',
      body: JSON.stringify({ userId, monthlyTarget }),
    }),
  resetMemberPassword: (userId: string, newPassword: string) =>
    request<{ ok: true }>('/household/reset-member-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    }),
  updateMemberWhatsapp: (userId: string, whatsappNumber: string | null) =>
    request<{ ok: true }>('/household/update-member-whatsapp', {
      method: 'POST',
      body: JSON.stringify({ userId, whatsappNumber }),
    }),
}

export const accountSettings = {
  setUsageType: (usageType: string) =>
    request<{ ok: true }>('/account/usage-type', { method: 'PUT', body: JSON.stringify({ usageType }) }),
  setAvatar: (avatarUrl: string | null) =>
    request<{ ok: true }>('/account/avatar', { method: 'PUT', body: JSON.stringify({ avatarUrl }) }),
}

export interface Goal {
  id: string
  title: string
  icon: string | null
  target_amount: number | null
  saved_amount: number
  assigned_to: string | null
  assignee_name: string | null
  sort_order: number
}

export const goals = {
  list: () => request<{ goals: Goal[] }>('/goals'),
  create: (titles: { title: string; icon: string }[]) =>
    request<{ ok: true }>('/goals', { method: 'POST', body: JSON.stringify({ titles }) }),
  createOne: (data: { title: string; icon?: string; targetAmount?: number | null; assignedTo?: string | null }) =>
    request<{ id: string }>('/goals/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ targetAmount: number | null; savedAmount: number; assignedTo: string | null }>) =>
    request<{ ok: true }>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/goals/${id}`, { method: 'DELETE' }),
  reorder: (ids: string[]) => request<{ ok: true }>('/goals/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
}

export interface Task {
  id: string
  title: string
  icon: string | null
  assigned_to: string | null
  assigned_dependent_id: string | null
  assignee_name: string | null
  status: 'pending' | 'done'
  due_date: string | null
  recurrence: string | null
  recurrence_days: string | null
  completed_at: string | null
  time_spent_minutes: number | null
  completed_by: string | null
  sort_order: number
}

export const tasks = {
  list: () => request<{ tasks: Task[] }>('/tasks'),
  reorder: (ids: string[]) => request<{ ok: true }>('/tasks/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
  create: (data: {
    title: string
    icon?: string
    assignedTo?: string | null
    assignedDependentId?: string | null
    dueDate?: string | null
    recurrence?: string | null
    recurrenceDays?: string | null
  }) => request<{ id: string }>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  setStatus: (id: string, status: 'pending' | 'done', timeSpentMinutes?: number) =>
    request<{ ok: true }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status, timeSpentMinutes }) }),
  update: (
    id: string,
    data: {
      title: string
      icon?: string
      assignedTo?: string | null
      assignedDependentId?: string | null
      dueDate?: string | null
      recurrence?: string | null
      recurrenceDays?: string | null
    },
  ) => request<{ ok: true }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/tasks/${id}`, { method: 'DELETE' }),
}

export interface Dependent {
  id: string
  name: string
  icon: string
}

export const dependents = {
  list: () => request<{ dependents: Dependent[] }>('/dependents'),
  create: (data: { name: string; icon?: string }) =>
    request<{ id: string }>('/dependents', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/dependents/${id}`, { method: 'DELETE' }),
}

export interface ShoppingItem {
  id: string
  category: string | null
  name: string
  quantity: string | null
  price: number | null
  checked: number
  added_by: string | null
  added_by_name: string | null
  recurrence: string | null
  sort_order: number
}

export const shopping = {
  list: () => request<{ items: ShoppingItem[]; nextTripDate: string | null }>('/shopping'),
  create: (data: { name: string; category?: string; quantity?: string; price?: number; recurrence?: string | null }) =>
    request<{ id: string }>('/shopping', { method: 'POST', body: JSON.stringify(data) }),
  setChecked: (id: string, checked: boolean) =>
    request<{ ok: true }>(`/shopping/${id}`, { method: 'PATCH', body: JSON.stringify({ checked }) }),
  update: (id: string, data: { name: string; category?: string; quantity?: string; price?: number; recurrence?: string | null }) =>
    request<{ ok: true }>(`/shopping/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/shopping/${id}`, { method: 'DELETE' }),
  clearChecked: () => request<{ ok: true }>('/shopping/clear-checked', { method: 'POST' }),
  frequency: (name: string) =>
    request<{ avgDays: number | null; lastPurchasedDaysAgo: number | null }>(
      `/shopping/frequency?name=${encodeURIComponent(name)}`,
    ),
  setTripDate: (date: string | null) =>
    request<{ ok: true }>('/shopping/trip', { method: 'PUT', body: JSON.stringify({ date }) }),
  reorder: (ids: string[]) => request<{ ok: true }>('/shopping/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
}

export interface Checkin {
  user_id: string
  user_name: string
  mood: string
  date: string
}

export const mood = {
  today: (date: string) => request<{ checkins: Checkin[] }>(`/mood?date=${date}`),
  weekly: () => request<{ checkins: Checkin[] }>('/mood/weekly'),
  month: (month: string) => request<{ checkins: Checkin[] }>(`/mood?month=${month}`),
  set: (moodValue: string, date: string) =>
    request<{ ok: true }>('/mood', { method: 'POST', body: JSON.stringify({ mood: moodValue, date }) }),
}

export const account = {
  delete: () => request<{ ok: true }>('/account/delete', { method: 'POST' }),
  updateWhatsapp: (whatsappNumber: string | null) =>
    request<{ ok: true }>('/account/whatsapp', { method: 'PUT', body: JSON.stringify({ whatsappNumber }) }),
}

export interface Transaction {
  id: string
  category: string
  description: string | null
  amount: number
  type: 'income' | 'expense'
  date: string
  created_by: string
  created_by_name: string
  payment_method: string | null
  recurrence: string | null
  account_id: string | null
  account_name: string | null
}

export const transactions = {
  list: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ transactions: Transaction[] }>(`/transactions${qs ? `?${qs}` : ''}`)
  },
  create: (data: {
    category: string
    description?: string
    amount: number
    type: 'income' | 'expense'
    date: string
    paymentMethod?: string
    recurrence?: string
    accountId?: string
    paidBy?: string
  }) => request<{ id: string }>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/transactions/${id}`, { method: 'DELETE' }),
}

export interface FinancialAccount {
  id: string
  name: string
  type: string
  color: string | null
  balance: number
  sort_order: number
}

export const accounts = {
  list: () => request<{ accounts: FinancialAccount[] }>('/accounts'),
  create: (data: { name: string; type?: string }) =>
    request<{ id: string }>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; type: string; balance: number }>) =>
    request<{ ok: true }>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/accounts/${id}`, { method: 'DELETE' }),
  reorder: (ids: string[]) => request<{ ok: true }>('/accounts/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
}

export interface WeeklyAnalytics {
  days: { date: string; entradas: number; saidas: number }[]
  categories: { category: string; total: number }[]
}

export interface MonthlyAnalytics {
  weeks: { week: string; entradas: number; saidas: number }[]
  categories: { category: string; total: number }[]
}

export interface MonthComparison {
  current: { entradas: number; saidas: number }
  previous: { entradas: number; saidas: number }
}

export const analytics = {
  weekly: () => request<WeeklyAnalytics>('/analytics/weekly'),
  monthly: () => request<MonthlyAnalytics>('/analytics/monthly'),
  comparison: () => request<MonthComparison>('/analytics/comparison'),
}

export interface Budget {
  category: string
  monthly_limit: number
}

export const budgets = {
  list: () => request<{ budgets: Budget[] }>('/budgets'),
  set: (category: string, monthlyLimit: number) =>
    request<{ ok: true }>('/budgets', { method: 'PUT', body: JSON.stringify({ category, monthlyLimit }) }),
  remove: (category: string) => request<{ ok: true }>(`/budgets/${encodeURIComponent(category)}`, { method: 'DELETE' }),
}

export interface Bill {
  id: string
  title: string
  amount: number
  due_date: string
  paid: number
  paid_amount: number
  assigned_to: string | null
  assignee_name: string | null
  recurrence: string | null
  account_id: string | null
  account_name: string | null
  reminder_days: number | null
  category: string | null
  installment_number: number | null
  installment_total: number | null
  sort_order: number
}

export const bills = {
  list: () => request<{ bills: Bill[] }>('/bills'),
  create: (data: {
    title: string
    amount: number
    dueDate: string
    recurrence?: string | null
    assignedTo?: string | null
    accountId?: string | null
    reminderDays?: number | null
    category?: string | null
    installmentTotal?: number | null
  }) => request<{ id: string }>('/bills', { method: 'POST', body: JSON.stringify(data) }),
  markPaid: (id: string, paid: boolean) =>
    request<{ ok: true }>(`/bills/${id}`, { method: 'PATCH', body: JSON.stringify({ paid }) }),
  recordPayment: (id: string, paidAmount: number) =>
    request<{ ok: true }>(`/bills/${id}`, { method: 'PATCH', body: JSON.stringify({ paidAmount }) }),
  update: (
    id: string,
    data: {
      title: string
      amount: number
      dueDate: string
      recurrence?: string | null
      assignedTo?: string | null
      accountId?: string | null
      reminderDays?: number | null
      category?: string | null
      installmentTotal?: number | null
    },
  ) => request<{ ok: true }>(`/bills/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/bills/${id}`, { method: 'DELETE' }),
  reorder: (ids: string[]) => request<{ ok: true }>('/bills/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
}

export interface Invite {
  id: string
  method: 'whatsapp' | 'link' | 'qrcode'
  email: string | null
  status: 'pending' | 'accepted'
  created_at: string
}

export const invites = {
  list: () => request<{ invites: Invite[] }>('/invites'),
  create: (data: { method: Invite['method'] }) =>
    request<{ id: string }>('/invites', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/invites/${id}`, { method: 'DELETE' }),
}

export interface Settlement {
  id: string
  from_user_id: string
  to_user_id: string
  amount: number
  settled_at: string
}

export const settlements = {
  list: (since?: string) => request<{ settlements: Settlement[] }>(`/settlements${since ? `?since=${since}` : ''}`),
  create: (data: { toUserId: string; amount: number }) =>
    request<{ id: string }>('/settlements', { method: 'POST', body: JSON.stringify(data) }),
}

export interface ActivityEntry {
  id: string
  type: string
  description: string
  icon: string | null
  created_at: string
  user_id: string
  user_name: string
  reactions: { emoji: string; user_id: string; user_name: string }[]
}

export const activity = {
  list: () => request<{ activity: ActivityEntry[] }>('/activity'),
  react: (activityId: string, emoji: string) =>
    request<{ ok: true }>(`/activity/${activityId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  latest: () => request<{ latestAt: string | null }>('/activity/latest'),
}

export const push = {
  publicKey: () => request<{ publicKey: string | null }>('/push/subscribe'),
  subscribe: (sub: PushSubscriptionJSON) =>
    request<{ id: string }>('/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
  unsubscribe: (endpoint: string) =>
    request<{ ok: true }>('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) }),
}
