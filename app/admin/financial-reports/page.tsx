'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  PieChart,
  Calendar,
  Building2,
  X,
  RotateCcw,
  LayoutDashboard,
  Shield,
} from 'lucide-react'
import type { Pagination } from '@/lib/api-client'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import { isSupervisorUser } from '@/lib/admin-access'
import { CURRENCY_CODES, getCurrencyLabel, getCurrencyOptionLabel } from '@/lib/currencies'
import { useAdminStore } from '@/store/useAdminStore'
import {
  type FinancialFilters,
  type FinancialMeta,
  type FinancialPreset,
  type MoneyTotal,
  type FinancialPayment,
  type FinancialOutstandingItem,
  type FinancialTeacherLiability,
  type CollectionRateItem,
  type TopBankItem,
  getFinancialSummary,
  getFinancialCash,
  getFinancialCashPayments,
  getFinancialCashStudents,
  type FinancialCashStudentItem,
  type FinancialPaymentAccount,
  getFinancialCollection,
  getFinancialOutstanding,
  getFinancialOverdue,
  getFinancialLiabilities,
  getFinancialTeacherLiabilities,
  getRevenueByDay,
  getRevenueByWeek,
  getRevenueByMonth,
  getRevenueByCurrency,
  getRevenueByBank,
  getRevenueByPaymentMethod,
  getTopStudents,
  getTopBanks,
  getTopCurrencies,
} from '@/lib/api/financial'

type TabId = 'summary' | 'cash' | 'collection' | 'liabilities' | 'analytics'

const PRESET_OPTIONS: { value: FinancialPreset | ''; label: string }[] = [
  { value: 'this_month', label: 'هذا الشهر' },
  { value: 'last_month', label: 'الشهر الماضي' },
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'this_week', label: 'هذا الأسبوع' },
  { value: 'last_week', label: 'الأسبوع الماضي' },
  { value: 'custom', label: 'مخصص' },
]

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  visa: 'فيزا',
  wallet: 'محفظة',
  cliq: 'كليك',
  instapay: 'InstaPay',
  other: 'أخرى',
  unknown: 'غير محدد',
}

const NUM = 'tabular-nums font-mono'

function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function formatAmount(amount: number, currency: string) {
  return `${formatNumber(amount)} ${getCurrencyLabel(currency)}`
}

function formatPercent(rate: number | null) {
  if (rate == null) return '—'
  return `${formatNumber(rate * 100, 1)}%`
}

function StatCard({
  label,
  icon: Icon,
  accent = 'primary',
  children,
}: {
  label: string
  icon: typeof DollarSign
  accent?: 'primary' | 'green' | 'red' | 'amber' | 'blue'
  children: ReactNode
}) {
  const iconBg = {
    primary: 'bg-primary-600',
    green: 'bg-emerald-600',
    red: 'bg-red-600',
    amber: 'bg-amber-500',
    blue: 'bg-blue-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl shadow-sm ${iconBg[accent]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-semibold text-primary-700">{label}</p>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

type MetricAccent = 'primary' | 'green' | 'amber' | 'blue'

const SUMMARY_METRIC_THEMES: Record<
  MetricAccent,
  { bar: string; iconWrap: string; icon: string; value: string }
> = {
  green: {
    bar: 'bg-emerald-500',
    iconWrap: 'bg-emerald-50 text-emerald-600',
    icon: 'text-emerald-600',
    value: 'text-emerald-700',
  },
  primary: {
    bar: 'bg-primary-600',
    iconWrap: 'bg-primary-50 text-primary-600',
    icon: 'text-primary-600',
    value: 'text-primary-900',
  },
  amber: {
    bar: 'bg-amber-500',
    iconWrap: 'bg-amber-50 text-amber-600',
    icon: 'text-amber-600',
    value: 'text-amber-700',
  },
  blue: {
    bar: 'bg-blue-600',
    iconWrap: 'bg-blue-50 text-blue-600',
    icon: 'text-blue-600',
    value: 'text-blue-800',
  },
}

function SummaryMetricCard({
  label,
  hint,
  icon: Icon,
  accent = 'primary',
  totals,
  amount,
  currency,
}: {
  label: string
  hint?: string
  icon: typeof DollarSign
  accent?: MetricAccent
  totals?: MoneyTotal[]
  amount?: number
  currency?: string
}) {
  const theme = SUMMARY_METRIC_THEMES[accent]
  const hasTotals = !!totals?.length
  const hasSingle = amount != null && currency

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary-200/80 bg-white shadow-sm hover:shadow-md transition-all">
      <div className={`absolute top-0 inset-x-0 h-1 ${theme.bar}`} />
      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary-900">{label}</p>
            {hint && <p className="text-xs text-primary-500 mt-1">{hint}</p>}
          </div>
          <div className={`shrink-0 p-2.5 rounded-xl ${theme.iconWrap}`}>
            <Icon className={`w-5 h-5 ${theme.icon}`} />
          </div>
        </div>

        {!hasTotals && !hasSingle ? (
          <p className={`text-sm text-primary-400 ${NUM}`}>—</p>
        ) : hasSingle ? (
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <span className={`text-2xl sm:text-3xl font-bold ${theme.value} ${NUM}`} dir="ltr">
              {formatNumber(amount!)}
            </span>
            <span className="text-sm font-medium text-primary-600">{getCurrencyLabel(currency!)}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {totals!.map((t) => (
              <div
                key={t.currency}
                className="flex items-center justify-between gap-3 pb-3 border-b border-primary-100 last:border-0 last:pb-0"
              >
                <span className="text-sm text-primary-600">{getCurrencyLabel(t.currency)}</span>
                <span className={`text-xl font-bold ${theme.value} ${NUM}`} dir="ltr">
                  {formatNumber(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryMetricsGrid({ summary }: { summary: NonNullable<Awaited<ReturnType<typeof getFinancialSummary>>['data']> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
      <SummaryMetricCard
        label="إيراد نقدي"
        hint="إجمالي المدفوعات المحصّلة"
        icon={ArrowUpCircle}
        accent="green"
        totals={summary.cash_revenue}
      />
      <SummaryMetricCard
        label="صافي الإيراد"
        hint="بعد خصم المرتجعات"
        icon={DollarSign}
        accent="primary"
        totals={summary.net_revenue}
      />
      <SummaryMetricCard
        label="متبقي التحصيل"
        hint="مبالغ لم تُحصّل بعد"
        icon={Clock}
        accent="amber"
        totals={summary.outstanding}
      />
      {summary.teacher_liabilities && (
        <SummaryMetricCard
          label="مستحقات المعلمين"
          hint="إجمالي مستحقات الفترة"
          icon={Users}
          accent="blue"
          amount={summary.teacher_liabilities.total}
          currency={summary.teacher_liabilities.currency}
        />
      )}
    </div>
  )
}

function Panel({
  title,
  description,
  children,
  className = '',
  noPadding = false,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border border-primary-200/90 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-primary-100 bg-gradient-to-l from-primary-50/60 to-white">
          <h3 className="font-bold text-primary-900">{title}</h3>
          {description && <p className="text-sm text-primary-600 mt-1">{description}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-primary-900">{title}</h2>
      {description && <p className="text-sm text-primary-600 mt-1">{description}</p>}
    </div>
  )
}

function MethodBadge({ method }: { method?: string | null }) {
  const label = PAYMENT_METHOD_LABELS[method ?? 'unknown'] ?? method ?? '—'
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
      {label}
    </span>
  )
}

function MoneyValues({ totals, empty = '—' }: { totals?: MoneyTotal[]; empty?: string }) {
  if (!totals?.length) {
    return <p className={`text-primary-400 text-sm ${NUM}`}>{empty}</p>
  }
  return (
    <>
      {totals.map((t) => (
        <p key={t.currency} className="leading-tight">
          <span className={`text-2xl font-bold text-primary-900 ${NUM}`} dir="ltr">
            {formatNumber(t.amount)}
          </span>
          <span className="block text-sm font-medium text-primary-600 mt-1">{getCurrencyLabel(t.currency)}</span>
        </p>
      ))}
    </>
  )
}

function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-primary-50 rounded-xl border border-primary-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 sm:flex-none min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            active === tab.id
              ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-200'
              : 'text-primary-600 hover:text-primary-900 hover:bg-white/70'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function CollectionRateCard({ items }: { items: CollectionRateItem[] }) {
  if (!items?.length) return null
  return (
    <StatCard label="معدل التحصيل" icon={TrendingUp} accent="blue">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.currency} className="rounded-lg bg-white/70 p-3 border border-primary-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-primary-900">{getCurrencyLabel(item.currency)}</span>
                <span className={`text-xs text-primary-500 shrink-0 ${NUM}`} dir="ltr">
                  ({item.currency})
                </span>
              </div>
              <span className={`text-lg font-bold text-blue-700 shrink-0 ${NUM}`}>{formatPercent(item.rate)}</span>
            </div>
            <div className="h-2 bg-primary-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (item.rate ?? 0) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-primary-600">
              محصّل: <span className={`${NUM} font-semibold`} dir="ltr">{formatNumber(item.collected_to_date)}</span>
              {' · '}
              مفوتر: <span className={`${NUM} font-semibold`} dir="ltr">{formatNumber(item.billed_to_date)}</span>
            </p>
          </div>
        ))}
      </div>
    </StatCard>
  )
}

function topBankRowKey(item: TopBankItem, index: number) {
  return `${item.payment_account?.id ?? 'na'}-${item.currency}-${index}`
}

function TopBanksPanel({
  items,
  selectedKey,
  onSelect,
}: {
  items?: TopBankItem[]
  selectedKey?: string | null
  onSelect?: (item: TopBankItem, index: number) => void
}) {
  if (!items?.length) {
    return (
      <div className="py-12 text-center">
        <Building2 className="w-10 h-10 text-primary-300 mx-auto mb-3" />
        <p className="text-primary-500 text-sm">لا توجد بيانات للبنوك / الحسابات في هذه الفترة</p>
      </div>
    )
  }

  return (
    <DataTable>
      <table className="w-full text-sm text-right">
        <TableHead cols={['#', 'الحساب / البنك', 'المبلغ']} />
        <tbody>
          {items.map((item, i) => {
            const rowKey = topBankRowKey(item, i)
            const isSelected = selectedKey === rowKey
            const canSelect = onSelect != null && item.payment_account?.id != null
            return (
              <tr
                key={rowKey}
                onClick={canSelect ? () => onSelect(item, i) : undefined}
                className={`border-t border-primary-100 transition-colors ${
                  canSelect ? 'cursor-pointer hover:bg-primary-50/60' : ''
                } ${isSelected ? 'bg-primary-100/80 ring-1 ring-inset ring-primary-300' : ''}`}
              >
                <td className={`px-5 py-3.5 w-14 ${NUM}`}>
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                    {formatInteger(i + 1)}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium text-primary-900">
                  {item.payment_account?.title ?? '—'}
                  {canSelect && (
                    <span className="block text-xs font-normal text-primary-500 mt-0.5">اضغط لعرض الطلاب</span>
                  )}
                </td>
                <td className={`px-5 py-3.5 font-semibold text-emerald-700 ${NUM}`} dir="ltr">
                  {formatAmount(item.amount, item.currency)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </DataTable>
  )
}

function BankStudentsModal({
  open,
  account,
  items,
  pagination,
  loading,
  error,
  onClose,
  onPageChange,
}: {
  open: boolean
  account: FinancialPaymentAccount | null
  items: FinancialCashStudentItem[]
  pagination: Pagination | null
  loading?: boolean
  error?: string | null
  onClose: () => void
  onPageChange: (page: number) => void
}) {
  if (!open) return null

  const accountTitle = account?.title ?? account?.name ?? '—'
  const rowOffset = pagination ? (pagination.current_page - 1) * pagination.per_page : 0

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-primary-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-primary-900">طلاب الحساب</h2>
            <p className="text-sm font-medium text-primary-800 mt-1 break-words">{accountTitle}</p>
            {account?.bank_name && (
              <p className="text-xs text-primary-500 mt-0.5">{account.bank_name}</p>
            )}
            <p className="text-xs text-primary-500 mt-1">مدفوعات الطلاب عبر هذا الحساب في الفترة المحددة</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-primary-700" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-sm text-red-700 bg-red-50 m-4 rounded-xl">{error}</div>
          ) : (
            <DataTable count={pagination?.total ?? items.length}>
              <table className="w-full text-sm text-right">
                <TableHead cols={['#', 'الطالب', 'عدد المدفوعات', 'آخر دفعة', 'المبلغ']} />
                <tbody>
                  {items.length === 0 ? (
                    <EmptyRow cols={5} message="لا توجد مدفوعات طلاب لهذا الحساب" />
                  ) : (
                    items.map((row, i) => (
                      <tr
                        key={`${row.student?.id}-${i}`}
                        className="border-t border-primary-100 hover:bg-primary-50/60"
                      >
                        <td className={`px-5 py-3.5 w-14 ${NUM}`}>{formatInteger(rowOffset + i + 1)}</td>
                        <td className="px-5 py-3.5 font-medium text-primary-900">{row.student?.name ?? '—'}</td>
                        <td className={`px-5 py-3.5 ${NUM}`}>
                          {row.payments_count != null ? formatInteger(row.payments_count) : '—'}
                        </td>
                        <td className={`px-5 py-3.5 text-primary-700 ${NUM}`} dir="ltr">
                          {row.last_payment_date ?? '—'}
                        </td>
                        <TotalsCell totals={row.totals} />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <PaginationBar pagination={pagination} onPageChange={onPageChange} disabled={loading} />
            </DataTable>
          )}
        </div>
      </div>
    </div>
  )
}

function TotalsCell({ totals }: { totals: MoneyTotal[] }) {
  if (!totals?.length) {
    return <td className="px-5 py-3.5 text-primary-400">—</td>
  }
  return (
    <td className={`px-5 py-3.5 font-semibold text-emerald-700 ${NUM}`} dir="ltr">
      {totals.map((t) => formatAmount(t.amount, t.currency)).join(' · ')}
    </td>
  )
}

function AnalyticsBlock({
  title,
  description,
  tabs,
  active,
  onChange,
  empty,
  emptyMessage = 'لا توجد بيانات',
  children,
}: {
  title: string
  description?: string
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
  empty?: boolean
  emptyMessage?: string
  children: ReactNode
}) {
  return (
    <Panel title={title} description={description} noPadding>
      <div className="px-5 pt-4 pb-2">
        <SubTabBar tabs={tabs} active={active} onChange={onChange} />
      </div>
      {empty ? (
        <div className="py-14 text-center text-primary-500 text-sm border-t border-primary-100">{emptyMessage}</div>
      ) : (
        children
      )}
    </Panel>
  )
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold ${NUM}`}>
      {formatInteger(rank)}
    </span>
  )
}

function PaginationBar({
  pagination,
  onPageChange,
  disabled,
}: {
  pagination: Pagination | null
  onPageChange: (page: number) => void
  disabled?: boolean
}) {
  if (!pagination || pagination.total_pages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary-50 border-t border-primary-200">
      <p className={`text-sm text-primary-600 ${NUM}`}>
        صفحة {formatInteger(pagination.current_page)} من {formatInteger(pagination.total_pages)} — إجمالي{' '}
        {formatInteger(pagination.total)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || pagination.current_page <= 1}
          onClick={() => onPageChange(pagination.current_page - 1)}
          className="p-2 border border-primary-200 rounded-lg bg-white disabled:opacity-40 hover:bg-primary-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={disabled || pagination.current_page >= pagination.total_pages}
          onClick={() => onPageChange(pagination.current_page + 1)}
          className="p-2 border border-primary-200 rounded-lg bg-white disabled:opacity-40 hover:bg-primary-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function DataTable({ children, title, count }: { children: ReactNode; title?: string; count?: number }) {
  return (
    <div className="rounded-xl border border-primary-200/90 overflow-hidden bg-white">
      {title && (
        <div className="px-5 py-3 border-b border-primary-100 bg-primary-50/40 flex items-center justify-between gap-2">
          <span className="font-semibold text-primary-900 text-sm">{title}</span>
          {count != null && (
            <span className={`text-xs text-primary-600 bg-white px-2.5 py-1 rounded-full border border-primary-200 ${NUM}`}>
              {formatInteger(count)} سجل
            </span>
          )}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-primary-50 border-b border-primary-200">
        {cols.map((col) => (
          <th key={col} className="px-5 py-3.5 text-right text-xs font-bold text-primary-700 uppercase tracking-wide whitespace-nowrap">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-primary-500">
        {message}
      </td>
    </tr>
  )
}

export default function FinancialReportsPage() {
  const router = useRouter()
  const { admin, teachers, fetchTeachers } = useAdminStore()
  const isSupervisor = isSupervisorUser(admin.userType, admin.user)

  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<FinancialMeta | null>(null)

  const [preset, setPreset] = useState<FinancialPreset | ''>('this_month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [currency, setCurrency] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const [listPage, setListPage] = useState(1)
  const [collectionSubTab, setCollectionSubTab] = useState<'overview' | 'outstanding' | 'overdue'>('overview')
  const [analyticsTimeView, setAnalyticsTimeView] = useState<'day' | 'week' | 'month'>('day')
  const [analyticsBreakdownView, setAnalyticsBreakdownView] = useState<'currency' | 'bank' | 'method'>('currency')
  const [analyticsTopView, setAnalyticsTopView] = useState<'students' | 'banks' | 'currencies'>('students')

  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getFinancialSummary>>['data'] | null>(null)
  const [cash, setCash] = useState<Awaited<ReturnType<typeof getFinancialCash>>['data'] | null>(null)
  const [payments, setPayments] = useState<FinancialPayment[]>([])
  const [paymentsPagination, setPaymentsPagination] = useState<Pagination | null>(null)
  const [collection, setCollection] = useState<Awaited<ReturnType<typeof getFinancialCollection>>['data'] | null>(null)
  const [outstanding, setOutstanding] = useState<FinancialOutstandingItem[]>([])
  const [outstandingPagination, setOutstandingPagination] = useState<Pagination | null>(null)
  const [overdue, setOverdue] = useState<FinancialOutstandingItem[]>([])
  const [overduePagination, setOverduePagination] = useState<Pagination | null>(null)
  const [liabilities, setLiabilities] = useState<Awaited<ReturnType<typeof getFinancialLiabilities>>['data'] | null>(null)
  const [teacherLiabilities, setTeacherLiabilities] = useState<FinancialTeacherLiability[]>([])
  const [teacherLiabilitiesPagination, setTeacherLiabilitiesPagination] = useState<Pagination | null>(null)
  const [revenueByDay, setRevenueByDay] = useState<Awaited<ReturnType<typeof getRevenueByDay>>['data'] | null>(null)
  const [revenueByWeek, setRevenueByWeek] = useState<Awaited<ReturnType<typeof getRevenueByWeek>>['data'] | null>(null)
  const [revenueByMonth, setRevenueByMonth] = useState<Awaited<ReturnType<typeof getRevenueByMonth>>['data'] | null>(null)
  const [revenueByCurrency, setRevenueByCurrency] = useState<Awaited<ReturnType<typeof getRevenueByCurrency>>['data'] | null>(null)
  const [revenueByBank, setRevenueByBank] = useState<Awaited<ReturnType<typeof getRevenueByBank>>['data'] | null>(null)
  const [revenueByMethod, setRevenueByMethod] = useState<Awaited<ReturnType<typeof getRevenueByPaymentMethod>>['data'] | null>(null)
  const [topStudents, setTopStudents] = useState<Awaited<ReturnType<typeof getTopStudents>>['data'] | null>(null)
  const [topBanks, setTopBanks] = useState<Awaited<ReturnType<typeof getTopBanks>>['data'] | null>(null)
  const [topCurrencies, setTopCurrencies] = useState<Awaited<ReturnType<typeof getTopCurrencies>>['data'] | null>(null)

  const [selectedBank, setSelectedBank] = useState<TopBankItem | null>(null)
  const [selectedBankKey, setSelectedBankKey] = useState<string | null>(null)
  const [bankStudentsAccount, setBankStudentsAccount] = useState<FinancialPaymentAccount | null>(null)
  const [bankStudents, setBankStudents] = useState<FinancialCashStudentItem[]>([])
  const [bankStudentsPagination, setBankStudentsPagination] = useState<Pagination | null>(null)
  const [bankStudentsPage, setBankStudentsPage] = useState(1)
  const [bankStudentsLoading, setBankStudentsLoading] = useState(false)
  const [bankStudentsError, setBankStudentsError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeachers(1, 1000)
  }, [fetchTeachers])

  const apiFilters = useMemo((): FinancialFilters => {
    const f: FinancialFilters = { page: listPage, per_page: 15 }
    if (preset) f.preset = preset as FinancialPreset
    if (preset === 'custom') {
      if (from) f.from = from
      if (to) f.to = to
    }
    if (currency) f.currency = currency
    if (teacherId) f.teacher_id = parseInt(teacherId, 10)
    return f
  }, [preset, from, to, currency, teacherId, listPage])

  const bankStudentsFilters = useMemo((): FinancialFilters => {
    const f: FinancialFilters = { page: bankStudentsPage, per_page: 15 }
    if (preset) f.preset = preset as FinancialPreset
    if (preset === 'custom') {
      if (from) f.from = from
      if (to) f.to = to
    }
    if (currency) f.currency = currency
    if (teacherId) f.teacher_id = parseInt(teacherId, 10)
    if (selectedBank?.payment_account?.id != null) {
      f.bank_account_id = selectedBank.payment_account.id
    }
    return f
  }, [preset, from, to, currency, teacherId, bankStudentsPage, selectedBank])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'summary') {
        const [summaryRes, topBanksRes] = await Promise.all([
          getFinancialSummary(apiFilters),
          getTopBanks({ ...apiFilters, limit: 10 }),
        ])
        setSummary(summaryRes.data)
        setTopBanks(topBanksRes.data)
        setMeta(summaryRes.meta ?? topBanksRes.meta ?? null)
      } else if (activeTab === 'cash') {
        const [cashRes, paymentsRes] = await Promise.all([
          getFinancialCash(apiFilters),
          getFinancialCashPayments(apiFilters),
        ])
        setCash(cashRes.data)
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
        setPaymentsPagination(paymentsRes.pagination ?? null)
        setMeta(cashRes.meta ?? paymentsRes.meta ?? null)
      } else if (activeTab === 'collection') {
        if (collectionSubTab === 'overview') {
          const res = await getFinancialCollection(apiFilters)
          setCollection(res.data)
          setMeta(res.meta ?? null)
        } else if (collectionSubTab === 'outstanding') {
          const res = await getFinancialOutstanding(apiFilters)
          setOutstanding(Array.isArray(res.data) ? res.data : [])
          setOutstandingPagination(res.pagination ?? null)
          setMeta(res.meta ?? null)
        } else {
          const res = await getFinancialOverdue(apiFilters)
          setOverdue(Array.isArray(res.data) ? res.data : [])
          setOverduePagination(res.pagination ?? null)
          setMeta(res.meta ?? null)
        }
      } else if (activeTab === 'liabilities') {
        const [liabRes, teachersRes] = await Promise.all([
          getFinancialLiabilities(apiFilters),
          getFinancialTeacherLiabilities(apiFilters),
        ])
        setLiabilities(liabRes.data)
        setTeacherLiabilities(Array.isArray(teachersRes.data) ? teachersRes.data : [])
        setTeacherLiabilitiesPagination(teachersRes.pagination ?? null)
        setMeta(liabRes.meta ?? teachersRes.meta ?? null)
      } else if (activeTab === 'analytics') {
        const [dayRes, weekRes, monthRes, currRes, bankRes, methodRes, topRes, topBanksRes, topCurrRes] =
          await Promise.all([
            getRevenueByDay(apiFilters),
            getRevenueByWeek(apiFilters),
            getRevenueByMonth(apiFilters),
            getRevenueByCurrency(apiFilters),
            getRevenueByBank(apiFilters),
            getRevenueByPaymentMethod(apiFilters),
            getTopStudents({ ...apiFilters, limit: 10 }),
            getTopBanks({ ...apiFilters, limit: 10 }),
            getTopCurrencies({ ...apiFilters, limit: 10 }),
          ])
        setRevenueByDay(dayRes.data)
        setRevenueByWeek(weekRes.data)
        setRevenueByMonth(monthRes.data)
        setRevenueByCurrency(currRes.data)
        setRevenueByBank(bankRes.data)
        setRevenueByMethod(methodRes.data)
        setTopStudents(topRes.data)
        setTopBanks(topBanksRes.data)
        setTopCurrencies(topCurrRes.data)
        setMeta(dayRes.meta ?? null)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير')
    } finally {
      setLoading(false)
    }
  }, [activeTab, apiFilters, collectionSubTab])

  useEffect(() => {
    if (isSupervisor) return
    loadData()
  }, [loadData, isSupervisor])

  const closeBankStudentsModal = useCallback(() => {
    setSelectedBank(null)
    setSelectedBankKey(null)
    setBankStudentsPage(1)
    setBankStudents([])
    setBankStudentsAccount(null)
    setBankStudentsPagination(null)
    setBankStudentsError(null)
  }, [])

  const loadBankStudents = useCallback(async () => {
    if (selectedBank?.payment_account?.id == null) return
    setBankStudentsLoading(true)
    setBankStudentsError(null)
    try {
      const res = await getFinancialCashStudents(bankStudentsFilters)
      const payload = res.data
      setBankStudents(Array.isArray(payload?.students) ? payload.students : [])
      setBankStudentsAccount(payload?.payment_account ?? selectedBank.payment_account ?? null)
      setBankStudentsPagination(res.pagination ?? null)
    } catch (e: unknown) {
      setBankStudentsError(e instanceof Error ? e.message : 'فشل تحميل طلاب الحساب')
      setBankStudents([])
      setBankStudentsAccount(null)
      setBankStudentsPagination(null)
    } finally {
      setBankStudentsLoading(false)
    }
  }, [bankStudentsFilters, selectedBank])

  useEffect(() => {
    if (isSupervisor || activeTab !== 'summary' || !selectedBank?.payment_account?.id) return
    loadBankStudents()
  }, [loadBankStudents, isSupervisor, activeTab, selectedBank])

  useEffect(() => {
    closeBankStudentsModal()
  }, [preset, from, to, currency, teacherId, activeTab, closeBankStudentsModal])

  const handleSelectBank = useCallback(
    (item: TopBankItem, index: number) => {
      const key = topBankRowKey(item, index)
      if (selectedBankKey === key) {
        closeBankStudentsModal()
        return
      }
      setSelectedBank(item)
      setSelectedBankKey(key)
      setBankStudentsPage(1)
      setBankStudents([])
      setBankStudentsAccount(null)
      setBankStudentsPagination(null)
      setBankStudentsError(null)
    },
    [selectedBankKey, closeBankStudentsModal]
  )

  useEffect(() => {
    if (isSupervisor) {
      router.replace('/admin/dashboard')
    }
  }, [isSupervisor, router])

  const resetListPage = () => setListPage(1)

  const resetAllFilters = () => {
    setPreset('this_month')
    setFrom('')
    setTo('')
    setCurrency('')
    setTeacherId('')
    resetListPage()
  }

  const hasCustomFilters = preset !== 'this_month' || !!currency || !!teacherId
  const activePresetLabel = PRESET_OPTIONS.find((o) => o.value === preset)?.label ?? '—'

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; desc: string }[] = [
    { id: 'summary', label: 'الملخص', icon: BarChart3, desc: 'نظرة عامة على الإيراد والتحصيل' },
    { id: 'cash', label: 'النقدية', icon: Wallet, desc: 'المدفوعات النقدية' },
    { id: 'collection', label: 'التحصيل', icon: TrendingUp, desc: 'المتبقي والمتأخر ومعدل التحصيل' },
    { id: 'liabilities', label: 'مستحقات المعلمين', icon: Users, desc: 'أرباح وخصومات المعلمين' },
    { id: 'analytics', label: 'التحليلات', icon: PieChart, desc: 'اتجاهات وتقسيمات الإيراد' },
  ]

  const activeTabInfo = tabs.find((t) => t.id === activeTab)

  if (isSupervisor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center" dir="rtl">
        <div className="p-4 rounded-2xl bg-primary-50 mb-4">
          <Shield className="w-10 h-10 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-primary-900 mb-2">غير مصرح بالدخول</h2>
        <p className="text-primary-600 max-w-md text-sm">
          صفحة التقارير المالية متاحة للمسؤول فقط. سيتم تحويلك إلى لوحة التحكم.
        </p>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-0 pb-8" dir="rtl">
      {/* Page header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary-600 shadow-sm">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">التقارير المالية</h1>
              <p className="text-sm text-primary-600 mt-0.5">لوحة متابعة الإيراد والتحصيل ومستحقات المعلمين</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث التقرير
        </button>
      </div>

      {/* Filters */}
      <Panel title="تصفية التقرير" description="اختر الفترة والعملة والمعلم — التغييرات تُطبَّق تلقائياً" className="mb-6">
        <div className="mb-4">
          <p className="text-xs font-semibold text-primary-600 mb-2">فترة سريعة</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.filter((o) => o.value !== 'custom').map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setPreset(o.value as FinancialPreset)
                  resetListPage()
                }}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  preset === o.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200/80'
                }`}
              >
                {o.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPreset('custom')
                resetListPage()
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                preset === 'custom'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200/80'
              }`}
            >
              مخصص
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary-600 mb-1.5">الفترة</label>
            <select
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value as FinancialPreset | '')
                resetListPage()
              }}
              className="w-full px-3 py-2.5 border border-primary-200 rounded-xl text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {PRESET_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {preset === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-primary-600 mb-1.5">من تاريخ</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    resetListPage()
                  }}
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-600 mb-1.5">إلى تاريخ</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value)
                    resetListPage()
                  }}
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
                  dir="ltr"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-primary-600 mb-1.5">العملة</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value)
                resetListPage()
              }}
              className="w-full px-3 py-2.5 border border-primary-200 rounded-xl text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">جميع العملات</option>
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {getCurrencyOptionLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-600 mb-1.5">المعلم</label>
            <SearchableTeacherSelect
              value={teacherId}
              onChange={(v) => {
                setTeacherId(v)
                resetListPage()
              }}
              teachers={teachers}
              placeholder="جميع المعلمين"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {activePresetLabel}
            </span>
            {currency && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-medium">
                {getCurrencyOptionLabel(currency)}
                <button type="button" onClick={() => setCurrency('')} className="hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {teacherId && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-50 text-violet-800 text-xs font-medium">
                {teachers.find((t) => t.id.toString() === teacherId)?.name ?? 'معلم'}
                <button type="button" onClick={() => setTeacherId('')} className="hover:text-violet-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {meta && (
              <span className="text-xs text-primary-500" dir="ltr">
                {meta.from} → {meta.to}
              </span>
            )}
          </div>
          {hasCustomFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>
      </Panel>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main report */}
      <div className="bg-white rounded-2xl border border-primary-200/90 shadow-sm overflow-hidden">
        <div className="border-b border-primary-200 bg-primary-50/30">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    resetListPage()
                  }}
                  className={`shrink-0 px-5 py-4 text-sm font-semibold transition-all border-b-2 ${
                    isActive
                      ? 'border-primary-600 text-primary-800 bg-white'
                      : 'border-transparent text-primary-600 hover:text-primary-800 hover:bg-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : ''}`} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {activeTabInfo && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-l from-primary-50/80 to-white border border-primary-100">
              <h2 className="font-bold text-primary-900">{activeTabInfo.label}</h2>
              <p className="text-sm text-primary-600 mt-1">{activeTabInfo.desc}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-11 h-11 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-primary-600">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              {activeTab === 'summary' && summary && (
                <div className="space-y-6">
                  <SummaryMetricsGrid summary={summary} />

                  {meta?.omitted_sections?.includes('teacher_liabilities') && (
                    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      قسم مستحقات المعلمين غير متاح لصلاحياتك الحالية.
                    </div>
                  )}

                  <Panel
                    title="أعلى البنوك / الحسابات"
                    description="اضغط على حساب لعرض مدفوعات الطلاب المرتبطة به"
                    noPadding
                  >
                    <TopBanksPanel
                      items={topBanks?.items}
                      selectedKey={selectedBankKey}
                      onSelect={handleSelectBank}
                    />
                  </Panel>
                </div>
              )}

              {activeTab === 'cash' && cash && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard label="إيراد نقدي" icon={ArrowUpCircle} accent="green">
                      <MoneyValues totals={cash.cash_revenue} />
                    </StatCard>
                    <StatCard label="صافي الإيراد" icon={DollarSign} accent="primary">
                      <MoneyValues totals={cash.net_revenue} />
                    </StatCard>
                    <StatCard label="متوسط الدفعة" icon={TrendingUp} accent="blue">
                      <MoneyValues totals={cash.average_payment} />
                    </StatCard>
                    <StatCard label="عدد المدفوعات" icon={Wallet} accent="primary">
                      <p className={`text-2xl font-bold text-primary-900 ${NUM}`}>
                        {formatInteger(cash.payments_count)}
                      </p>
                      {cash.payments_count_by_currency?.map((c) => (
                        <p key={c.currency} className={`text-xs text-primary-600 ${NUM}`}>
                          {getCurrencyLabel(c.currency)}: {formatInteger(c.count)}
                        </p>
                      ))}
                    </StatCard>
                  </div>

                  <Panel title="قائمة المدفوعات" description="تفاصيل كل دفعة في الفترة المحددة" noPadding>
                    <DataTable count={paymentsPagination?.total ?? payments.length}>
                      <table className="w-full text-sm text-right">
                        <TableHead cols={['التاريخ', 'الطالب', 'المبلغ', 'الاشتراك', 'طريقة الدفع', 'الحساب']} />
                        <tbody>
                          {payments.length === 0 ? (
                            <EmptyRow cols={6} message="لا توجد مدفوعات في هذه الفترة" />
                          ) : (
                            payments.map((p) => (
                              <tr key={p.id} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                <td className={`px-5 py-3.5 whitespace-nowrap text-primary-700 ${NUM}`} dir="ltr">
                                  {p.payment_date}
                                  {p.payment_time ? ` ${p.payment_time}` : ''}
                                </td>
                                <td className="px-5 py-3.5 font-medium text-primary-900">{p.student?.name ?? '—'}</td>
                                <td className={`px-5 py-3.5 font-bold text-emerald-700 ${NUM}`} dir="ltr">
                                  {formatAmount(p.amount, p.currency)}
                                </td>
                                <td className={`px-5 py-3.5 text-xs text-primary-600 ${NUM}`} dir="ltr">
                                  {p.subscription?.subscription_code ?? '—'}
                                </td>
                                <td className="px-5 py-3.5">
                                  <MethodBadge method={p.payment_method} />
                                </td>
                                <td className="px-5 py-3.5 text-sm text-primary-700">
                                  {p.payment_account?.title ?? '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      <PaginationBar pagination={paymentsPagination} onPageChange={setListPage} disabled={loading} />
                    </DataTable>
                  </Panel>
                </div>
              )}

              {activeTab === 'collection' && (
                <>
                  <SubTabBar
                    tabs={[
                      { id: 'overview' as const, label: 'ملخص التحصيل' },
                      { id: 'outstanding' as const, label: 'المتبقي' },
                      { id: 'overdue' as const, label: 'المتأخر' },
                    ]}
                    active={collectionSubTab}
                    onChange={(id) => {
                      setCollectionSubTab(id)
                      resetListPage()
                    }}
                  />
                  {collectionSubTab === 'overview' && collection && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      <StatCard label="محصّل في الفترة" icon={ArrowUpCircle} accent="green">
                        <MoneyValues totals={collection.period_collected} />
                      </StatCard>
                      <StatCard label="إجمالي المتبقي" icon={Clock} accent="amber">
                        <MoneyValues totals={collection.outstanding} />
                      </StatCard>
                      <StatCard label="متأخر" icon={AlertTriangle} accent="red">
                        <MoneyValues totals={collection.overdue} />
                      </StatCard>
                      <CollectionRateCard items={collection.collection_rate} />
                      {collection.as_of && (
                        <StatCard label="حتى تاريخ" icon={Calendar} accent="primary">
                          <p className={`font-bold text-primary-900 ${NUM}`} dir="ltr">
                            {collection.as_of}
                          </p>
                        </StatCard>
                      )}
                    </div>
                  )}
                  {(collectionSubTab === 'outstanding' || collectionSubTab === 'overdue') && (
                    <OutstandingTable
                      title={collectionSubTab === 'outstanding' ? 'اشتراكات بمبالغ متبقية' : 'اشتراكات متأخرة السداد'}
                      items={collectionSubTab === 'outstanding' ? outstanding : overdue}
                      pagination={collectionSubTab === 'outstanding' ? outstandingPagination : overduePagination}
                      onPageChange={setListPage}
                      loading={loading}
                      showOverdue={collectionSubTab === 'overdue'}
                    />
                  )}
                </>
              )}

              {activeTab === 'liabilities' && liabilities && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="إجمالي المستحقات" icon={DollarSign} accent="primary">
                      <p className={`text-xl font-bold text-primary-900 ${NUM}`} dir="ltr">
                        {formatAmount(liabilities.total, liabilities.currency)}
                      </p>
                    </StatCard>
                    <StatCard label="أرباح الحصص" icon={TrendingUp} accent="green">
                      <p className={`text-lg font-semibold ${NUM}`} dir="ltr">
                        {formatNumber(liabilities.breakdown.session_earnings)}
                      </p>
                    </StatCard>
                    <StatCard label="مكافآت" icon={ArrowUpCircle} accent="blue">
                      <p className={`text-lg font-semibold ${NUM}`} dir="ltr">
                        {formatNumber(liabilities.breakdown.rewards)}
                      </p>
                    </StatCard>
                    <StatCard label="خصومات" icon={ArrowDownCircle} accent="red">
                      <p className={`text-lg font-semibold ${NUM}`} dir="ltr">
                        {formatNumber(liabilities.breakdown.deductions)}
                      </p>
                    </StatCard>
                  </div>
                  <Panel title="تفصيل المعلمين" noPadding>
                    <div className="px-5 py-3 border-b border-primary-100 bg-primary-50/40 flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary-800">قائمة المستحقات</span>
                      <span className={`text-xs text-primary-600 bg-white px-2.5 py-1 rounded-full border border-primary-200 ${NUM}`}>
                        {formatInteger(liabilities.teachers_count)} معلم
                      </span>
                    </div>
                    <table className="w-full text-sm text-right">
                      <TableHead cols={['المعلم', 'حصص مكتملة', 'تجريبية', 'أرباح', 'مكافآت', 'خصومات', 'الإجمالي']} />
                      <tbody>
                        {teacherLiabilities.length === 0 ? (
                          <EmptyRow cols={7} message="لا توجد بيانات للمعلمين" />
                        ) : (
                          teacherLiabilities.map((t) => (
                            <tr key={t.teacher.id} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                              <td className="px-5 py-3.5 font-medium text-primary-900">{t.teacher.name}</td>
                              <td className={`px-5 py-3.5 ${NUM}`}>{formatInteger(t.completed_sessions_count)}</td>
                              <td className={`px-5 py-3.5 ${NUM}`}>{formatInteger(t.completed_trial_sessions_count)}</td>
                              <td className={`px-5 py-3.5 ${NUM}`} dir="ltr">
                                {formatNumber(t.session_earnings)}
                              </td>
                              <td className={`px-5 py-3.5 ${NUM}`} dir="ltr">
                                {formatNumber(t.rewards)}
                              </td>
                              <td className={`px-5 py-3.5 text-red-600 ${NUM}`} dir="ltr">
                                {formatNumber(t.deductions)}
                              </td>
                              <td className={`px-5 py-3.5 font-bold text-primary-900 ${NUM}`} dir="ltr">
                                {formatAmount(t.total, t.currency)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <PaginationBar
                      pagination={teacherLiabilitiesPagination}
                      onPageChange={setListPage}
                      disabled={loading}
                    />
                  </Panel>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <AnalyticsBlock
                    title="الاتجاه الزمني"
                    description="مقارنة الإيراد حسب اليوم أو الأسبوع أو الشهر"
                    tabs={[
                      { id: 'day', label: 'يومي' },
                      { id: 'week', label: 'أسبوعي' },
                      { id: 'month', label: 'شهري' },
                    ]}
                    active={analyticsTimeView}
                    onChange={(id) => setAnalyticsTimeView(id as 'day' | 'week' | 'month')}
                    empty={
                      analyticsTimeView === 'day'
                        ? !revenueByDay?.series?.length
                        : analyticsTimeView === 'week'
                          ? !revenueByWeek?.series?.length
                          : !revenueByMonth?.series?.length
                    }
                  >
                    <DataTable
                      count={
                        analyticsTimeView === 'day'
                          ? revenueByDay?.series?.length
                          : analyticsTimeView === 'week'
                            ? revenueByWeek?.series?.length
                            : revenueByMonth?.series?.length
                      }
                    >
                      <table className="w-full text-sm text-right">
                        {analyticsTimeView === 'day' && (
                          <>
                            <TableHead cols={['التاريخ', 'الإيراد']} />
                            <tbody>
                              {revenueByDay?.series?.map((row) => (
                                <tr key={row.date} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                  <td className={`px-5 py-3.5 text-primary-800 ${NUM}`} dir="ltr">
                                    {row.date}
                                  </td>
                                  <TotalsCell totals={row.totals} />
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                        {analyticsTimeView === 'week' && (
                          <>
                            <TableHead cols={['الأسبوع', 'من', 'إلى', 'الإيراد']} />
                            <tbody>
                              {revenueByWeek?.series?.map((row) => (
                                <tr key={row.iso_week} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                  <td className={`px-5 py-3.5 font-medium text-primary-900 ${NUM}`} dir="ltr">
                                    {row.iso_week}
                                  </td>
                                  <td className={`px-5 py-3.5 text-primary-700 ${NUM}`} dir="ltr">
                                    {row.week_start}
                                  </td>
                                  <td className={`px-5 py-3.5 text-primary-700 ${NUM}`} dir="ltr">
                                    {row.week_end}
                                  </td>
                                  <TotalsCell totals={row.totals} />
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                        {analyticsTimeView === 'month' && (
                          <>
                            <TableHead cols={['الشهر', 'الإيراد']} />
                            <tbody>
                              {revenueByMonth?.series?.map((row) => (
                                <tr key={row.month} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                  <td className={`px-5 py-3.5 font-medium text-primary-900 ${NUM}`} dir="ltr">
                                    {row.month}
                                  </td>
                                  <TotalsCell totals={row.totals} />
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                      </table>
                    </DataTable>
                  </AnalyticsBlock>

                  <AnalyticsBlock
                    title="التقسيم حسب المصدر"
                    description="توزيع الإيراد حسب العملة أو الحساب أو طريقة الدفع"
                    tabs={[
                      { id: 'currency', label: 'العملة' },
                      { id: 'bank', label: 'البنك / الحساب' },
                      { id: 'method', label: 'طريقة الدفع' },
                    ]}
                    active={analyticsBreakdownView}
                    onChange={(id) => setAnalyticsBreakdownView(id as 'currency' | 'bank' | 'method')}
                    empty={
                      analyticsBreakdownView === 'currency'
                        ? !revenueByCurrency?.totals?.length
                        : analyticsBreakdownView === 'bank'
                          ? !revenueByBank?.items?.length
                          : !revenueByMethod?.items?.length
                    }
                  >
                    <DataTable
                      count={
                        analyticsBreakdownView === 'currency'
                          ? revenueByCurrency?.totals?.length
                          : analyticsBreakdownView === 'bank'
                            ? revenueByBank?.items?.length
                            : revenueByMethod?.items?.length
                      }
                    >
                      <table className="w-full text-sm text-right">
                        {analyticsBreakdownView === 'currency' && (
                          <>
                            <TableHead cols={['العملة', 'الإيراد']} />
                            <tbody>
                              {revenueByCurrency?.totals?.map((t) => (
                                <tr key={t.currency} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                  <td className="px-5 py-3.5 font-medium text-primary-900">
                                    {getCurrencyLabel(t.currency)}
                                    <span className={`text-xs text-primary-500 mr-2 ${NUM}`} dir="ltr">
                                      ({t.currency})
                                    </span>
                                  </td>
                                  <TotalsCell totals={[t]} />
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                        {analyticsBreakdownView === 'bank' && (
                          <>
                            <TableHead cols={['الحساب / البنك', 'الإيراد']} />
                            <tbody>
                              {revenueByBank?.items?.map((item, i) => (
                                <tr key={i} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                  <td className="px-5 py-3.5 font-medium text-primary-900">
                                    {item.payment_account?.title ?? '—'}
                                  </td>
                                  <TotalsCell totals={item.totals} />
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                        {analyticsBreakdownView === 'method' && (
                          <>
                            <TableHead cols={['طريقة الدفع', 'الإيراد']} />
                            <tbody>
                              {revenueByMethod?.items?.map((item, i) => (
                                <tr key={i} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                                  <td className="px-5 py-3.5">
                                    <MethodBadge method={item.payment_method} />
                                  </td>
                                  <TotalsCell totals={item.totals} />
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                      </table>
                    </DataTable>
                  </AnalyticsBlock>

                  <AnalyticsBlock
                    title="أعلى القيم"
                    description="أعلى 10 طلاب أو حسابات أو عملات من حيث الإيراد"
                    tabs={[
                      { id: 'students', label: 'الطلاب' },
                      { id: 'banks', label: 'البنوك / الحسابات' },
                      { id: 'currencies', label: 'العملات' },
                    ]}
                    active={analyticsTopView}
                    onChange={(id) => setAnalyticsTopView(id as 'students' | 'banks' | 'currencies')}
                    empty={
                      analyticsTopView === 'students'
                        ? !topStudents?.items?.length
                        : analyticsTopView === 'banks'
                          ? !topBanks?.items?.length
                          : !topCurrencies?.items?.length
                    }
                  >
                    {analyticsTopView === 'banks' ? (
                      <TopBanksPanel items={topBanks?.items} />
                    ) : (
                      <DataTable
                        count={
                          analyticsTopView === 'students'
                            ? topStudents?.items?.length
                            : topCurrencies?.items?.length
                        }
                      >
                        <table className="w-full text-sm text-right">
                          {analyticsTopView === 'students' && (
                            <>
                              <TableHead cols={['#', 'الطالب', 'المبلغ']} />
                              <tbody>
                                {topStudents?.items?.map((item, i) => (
                                  <tr
                                    key={`${item.student?.id}-${item.currency}-${i}`}
                                    className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors"
                                  >
                                    <td className="px-5 py-3.5 w-14">
                                      <RankBadge rank={i + 1} />
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-primary-900">
                                      {item.student?.name ?? '—'}
                                    </td>
                                    <td className={`px-5 py-3.5 font-semibold text-emerald-700 ${NUM}`} dir="ltr">
                                      {formatAmount(item.amount, item.currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </>
                          )}
                          {analyticsTopView === 'currencies' && (
                            <>
                              <TableHead cols={['#', 'العملة', 'المبلغ']} />
                              <tbody>
                                {topCurrencies?.items?.map((item, i) => (
                                  <tr
                                    key={item.currency}
                                    className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors"
                                  >
                                    <td className="px-5 py-3.5 w-14">
                                      <RankBadge rank={i + 1} />
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-primary-900">
                                      {getCurrencyLabel(item.currency)}
                                    </td>
                                    <td className={`px-5 py-3.5 font-semibold text-emerald-700 ${NUM}`} dir="ltr">
                                      {formatAmount(item.amount, item.currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </>
                          )}
                        </table>
                      </DataTable>
                    )}
                  </AnalyticsBlock>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BankStudentsModal
        open={selectedBank != null}
        account={bankStudentsAccount ?? selectedBank?.payment_account ?? null}
        items={bankStudents}
        pagination={bankStudentsPagination}
        loading={bankStudentsLoading}
        error={bankStudentsError}
        onClose={closeBankStudentsModal}
        onPageChange={setBankStudentsPage}
      />
    </div>
  )
}

function OutstandingTable({
  title,
  items,
  pagination,
  onPageChange,
  loading,
  showOverdue,
}: {
  title: string
  items: FinancialOutstandingItem[]
  pagination: Pagination | null
  onPageChange: (p: number) => void
  loading?: boolean
  showOverdue?: boolean
}) {
  return (
    <Panel title={title} noPadding>
      <DataTable count={pagination?.total ?? items.length}>
        <table className="w-full text-sm text-right">
          <TableHead
            cols={['الطالب', 'المعلم', 'الاشتراك', 'المفوتر', 'المحصّل', 'المتبقي', 'الانتهاء', 'التأخير']}
          />
          <tbody>
            {items.length === 0 ? (
              <EmptyRow cols={8} message="لا توجد سجلات" />
            ) : (
              items.map((row) => (
                <tr key={row.subscription_id} className="border-t border-primary-100 hover:bg-primary-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-primary-900">{row.student?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-primary-700">{row.teacher?.name ?? '—'}</td>
                  <td className={`px-5 py-3.5 text-xs text-primary-600 ${NUM}`} dir="ltr">
                    {row.subscription_code}
                  </td>
                  <td className={`px-5 py-3.5 ${NUM}`} dir="ltr">
                    {formatAmount(row.billed_amount, row.currency)}
                  </td>
                  <td className={`px-5 py-3.5 text-emerald-700 ${NUM}`} dir="ltr">
                    {formatAmount(row.collected_to_date, row.currency)}
                  </td>
                  <td className={`px-5 py-3.5 font-semibold text-amber-700 ${NUM}`} dir="ltr">
                    {formatAmount(row.remaining_amount, row.currency)}
                  </td>
                  <td className={`px-5 py-3.5 text-primary-700 ${NUM}`} dir="ltr">
                    {row.end_date}
                  </td>
                  <td className="px-5 py-3.5">
                    {row.is_overdue || showOverdue ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 ${NUM}`}>
                        {formatInteger(row.days_overdue)} يوم
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationBar pagination={pagination} onPageChange={onPageChange} disabled={loading} />
      </DataTable>
    </Panel>
  )
}
