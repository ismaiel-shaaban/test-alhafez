'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
} from 'lucide-react'
import {
  getExpenses,
  getIncomes,
  getProfit,
  createExpense,
  updateExpense,
  deleteExpense,
  createIncome,
  updateIncome,
  deleteIncome,
  Expense,
  Income,
  Profit,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateIncomeRequest,
  UpdateIncomeRequest,
} from '@/lib/api/accounting'
import { Pagination } from '@/lib/api-client'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'expenses' | 'incomes' | 'profit'

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function AccountingPage() {
  const currentMonth = getCurrentMonth()
  
  const [activeTab, setActiveTab] = useState<Tab>('expenses')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [profit, setProfit] = useState<Profit | null>(null)
  const [expensesPagination, setExpensesPagination] = useState<Pagination | null>(null)
  const [incomesPagination, setIncomesPagination] = useState<Pagination | null>(null)
  const [expensesPage, setExpensesPage] = useState(1)
  const [incomesPage, setIncomesPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Filters - default to current month
  const [expenseMonth, setExpenseMonth] = useState<string>(currentMonth)
  const [expenseMonthFrom, setExpenseMonthFrom] = useState<string>('')
  const [expenseMonthTo, setExpenseMonthTo] = useState<string>('')
  const [incomeMonth, setIncomeMonth] = useState<string>(currentMonth)
  const [incomeMonthFrom, setIncomeMonthFrom] = useState<string>('')
  const [incomeMonthTo, setIncomeMonthTo] = useState<string>('')
  const [profitMonth, setProfitMonth] = useState<string>(currentMonth)
  const [profitMonthFrom, setProfitMonthFrom] = useState<string>('')
  const [profitMonthTo, setProfitMonthTo] = useState<string>('')

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  // Form states
  const [expenseForm, setExpenseForm] = useState<CreateExpenseRequest>({
    month: currentMonth,
    amount: 0,
    description: '',
  })
  const [incomeForm, setIncomeForm] = useState<CreateIncomeRequest>({
    month: currentMonth,
    amount: 0,
    description: '',
  })

  // Load data based on active tab
  useEffect(() => {
    loadData()
  }, [activeTab, expensesPage, incomesPage, expenseMonth, expenseMonthFrom, expenseMonthTo, incomeMonth, incomeMonthFrom, incomeMonthTo])

  // Load profit when profit tab is active or filters change
  useEffect(() => {
    if (activeTab === 'profit') {
      loadProfit()
    }
  }, [activeTab, profitMonth, profitMonthFrom, profitMonthTo])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'expenses') {
        const data = await getExpenses({
          month: expenseMonth || undefined,
          month_from: expenseMonthFrom || undefined,
          month_to: expenseMonthTo || undefined,
          page: expensesPage,
          per_page: 15,
        })
        setExpenses(data?.expenses || [])
        setExpensesPagination(data?.pagination || null)
      } else if (activeTab === 'incomes') {
        const data = await getIncomes({
          month: incomeMonth || undefined,
          month_from: incomeMonthFrom || undefined,
          month_to: incomeMonthTo || undefined,
          page: incomesPage,
          per_page: 15,
        })
        setIncomes(data?.incomes || [])
        setIncomesPagination(data?.pagination || null)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const loadProfit = async () => {
    setLoading(true)
    try {
      const data = await getProfit({
        month: profitMonth || undefined,
        month_from: profitMonthFrom || undefined,
        month_to: profitMonthTo || undefined,
      })
      setProfit(data)
    } catch (error) {
      console.error('Error loading profit:', error)
      alert('حدث خطأ أثناء تحميل بيانات الربح')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'expenses') {
      setExpensesPage(1)
    } else if (tab === 'incomes') {
      setIncomesPage(1)
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseForm)
      } else {
        await createExpense(expenseForm)
      }
      setIsExpenseModalOpen(false)
      setEditingExpense(null)
      setExpenseForm({ month: getCurrentMonth(), amount: 0, description: '' })
      loadData()
    } catch (error: any) {
      console.error('Error saving expense:', error)
      alert(error.message || 'حدث خطأ أثناء حفظ المصروف')
    }
  }

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingIncome) {
        await updateIncome(editingIncome.id, incomeForm)
      } else {
        await createIncome(incomeForm)
      }
      setIsIncomeModalOpen(false)
      setEditingIncome(null)
      setIncomeForm({ month: getCurrentMonth(), amount: 0, description: '' })
      loadData()
    } catch (error: any) {
      console.error('Error saving income:', error)
      alert(error.message || 'حدث خطأ أثناء حفظ الإيراد')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      month: expense.month,
      amount: expense.amount,
      description: expense.description,
    })
    setIsExpenseModalOpen(true)
  }

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income)
    setIncomeForm({
      month: income.month,
      amount: income.amount,
      description: income.description,
    })
    setIsIncomeModalOpen(true)
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return
    setDeletingId(id)
    try {
      await deleteExpense(id)
      loadData()
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      alert(error.message || 'حدث خطأ أثناء حذف المصروف')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteIncome = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإيراد؟')) return
    setDeletingId(id)
    try {
      await deleteIncome(id)
      loadData()
    } catch (error: any) {
      console.error('Error deleting income:', error)
      alert(error.message || 'حدث خطأ أثناء حذف الإيراد')
    } finally {
      setDeletingId(null)
    }
  }

  const openExpenseModal = () => {
    setEditingExpense(null)
    setExpenseForm({ month: getCurrentMonth(), amount: 0, description: '' })
    setIsExpenseModalOpen(true)
  }

  const openIncomeModal = () => {
    setEditingIncome(null)
    setIncomeForm({ month: getCurrentMonth(), amount: 0, description: '' })
    setIsIncomeModalOpen(true)
  }

  const resetFilters = () => {
    const now = getCurrentMonth()
    if (activeTab === 'expenses') {
      setExpenseMonth(now)
      setExpenseMonthFrom('')
      setExpenseMonthTo('')
    } else if (activeTab === 'incomes') {
      setIncomeMonth(now)
      setIncomeMonthFrom('')
      setIncomeMonthTo('')
    } else if (activeTab === 'profit') {
      setProfitMonth(now)
      setProfitMonthFrom('')
      setProfitMonthTo('')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })
  }

  return (
    <div className="px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">المحاسبة</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl border-2 border-primary-200 shadow-lg mb-6">
        <div className="flex flex-wrap border-b border-primary-200">
          <button
            onClick={() => handleTabChange('expenses')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
              activeTab === 'expenses'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-primary-700 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>المصروفات</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('incomes')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
              activeTab === 'incomes'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-primary-700 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الإيرادات</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('profit')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
              activeTab === 'profit'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-primary-700 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الربح</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div>
              {/* Filters and Add Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    <span className="text-sm sm:text-base font-semibold text-primary-900">الفلترة:</span>
                  </div>
                  <input
                    type="month"
                    value={expenseMonth}
                    onChange={(e) => {
                      setExpenseMonth(e.target.value)
                      setExpenseMonthFrom('')
                      setExpenseMonthTo('')
                      setExpensesPage(1)
                    }}
                    className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    placeholder="الشهر"
                  />
                  <input
                    type="month"
                    value={expenseMonthFrom}
                    onChange={(e) => {
                      setExpenseMonthFrom(e.target.value)
                      setExpenseMonth('')
                      setExpensesPage(1)
                    }}
                    className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    placeholder="من"
                  />
                  <input
                    type="month"
                    value={expenseMonthTo}
                    onChange={(e) => {
                      setExpenseMonthTo(e.target.value)
                      setExpenseMonth('')
                      setExpensesPage(1)
                    }}
                    className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    placeholder="إلى"
                  />
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة تعيين</span>
                  </button>
                </div>
                <button
                  onClick={openExpenseModal}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>إضافة مصروف</span>
                </button>
              </div>

              {/* Expenses List */}
              {loading ? (
                <div className="text-center py-12 text-primary-600">
                  <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm sm:text-base">جاري التحميل...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-12 text-primary-600">
                  <TrendingDown className="w-16 h-16 mx-auto mb-4 text-primary-300" />
                  <p className="text-base sm:text-lg">لا توجد مصروفات</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4 mb-6">
                    {expenses.map((expense) => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary-50 p-4 sm:p-6 rounded-lg border-2 border-primary-200 hover:border-primary-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-red-100 p-2 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-primary-900">{formatCurrency(expense.amount)}</h3>
                                <p className="text-sm sm:text-base text-primary-600">{formatMonth(expense.month)}</p>
                              </div>
                            </div>
                            <p className="text-sm sm:text-base text-primary-700 mt-2 break-words">{expense.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* <button
                              onClick={() => handleEditExpense(expense)}
                              className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button> */}
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={deletingId === expense.id}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              title="حذف"
                            >
                              {deletingId === expense.id ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {expensesPagination && expensesPagination.total_pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm sm:text-base text-primary-600">
                        صفحة {expensesPagination.current_page} من {expensesPagination.total_pages} ({expensesPagination.total} مصروف)
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpensesPage((p) => Math.max(1, p - 1))}
                          disabled={expensesPagination.current_page === 1}
                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          السابق
                        </button>
                        <button
                          onClick={() => setExpensesPage((p) => Math.min(expensesPagination!.total_pages, p + 1))}
                          disabled={expensesPagination.current_page === expensesPagination.total_pages}
                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Incomes Tab */}
          {activeTab === 'incomes' && (
            <div>
              {/* Filters and Add Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    <span className="text-sm sm:text-base font-semibold text-primary-900">الفلترة:</span>
                  </div>
                  <input
                    type="month"
                    value={incomeMonth}
                    onChange={(e) => {
                      setIncomeMonth(e.target.value)
                      setIncomeMonthFrom('')
                      setIncomeMonthTo('')
                      setIncomesPage(1)
                    }}
                    className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    placeholder="الشهر"
                  />
                  <input
                    type="month"
                    value={incomeMonthFrom}
                    onChange={(e) => {
                      setIncomeMonthFrom(e.target.value)
                      setIncomeMonth('')
                      setIncomesPage(1)
                    }}
                    className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    placeholder="من"
                  />
                  <input
                    type="month"
                    value={incomeMonthTo}
                    onChange={(e) => {
                      setIncomeMonthTo(e.target.value)
                      setIncomeMonth('')
                      setIncomesPage(1)
                    }}
                    className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    placeholder="إلى"
                  />
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة تعيين</span>
                  </button>
                </div>
                <button
                  onClick={openIncomeModal}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>إضافة إيراد</span>
                </button>
              </div>

              {/* Incomes List */}
              {loading ? (
                <div className="text-center py-12 text-primary-600">
                  <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm sm:text-base">جاري التحميل...</p>
                </div>
              ) : incomes.length === 0 ? (
                <div className="text-center py-12 text-primary-600">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-primary-300" />
                  <p className="text-base sm:text-lg">لا توجد إيرادات</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4 mb-6">
                    {incomes.map((income) => (
                      <motion.div
                        key={income.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary-50 p-4 sm:p-6 rounded-lg border-2 border-primary-200 hover:border-primary-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-primary-900">{formatCurrency(income.amount)}</h3>
                                <p className="text-sm sm:text-base text-primary-600">{formatMonth(income.month)}</p>
                              </div>
                            </div>
                            <p className="text-sm sm:text-base text-primary-700 mt-2 break-words">{income.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* <button
                              onClick={() => handleEditIncome(income)}
                              className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button> */}
                            <button
                              onClick={() => handleDeleteIncome(income.id)}
                              disabled={deletingId === income.id}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              title="حذف"
                            >
                              {deletingId === income.id ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {incomesPagination && incomesPagination.total_pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm sm:text-base text-primary-600">
                        صفحة {incomesPagination.current_page} من {incomesPagination.total_pages} ({incomesPagination.total} إيراد)
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIncomesPage((p) => Math.max(1, p - 1))}
                          disabled={incomesPagination.current_page === 1}
                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          السابق
                        </button>
                        <button
                          onClick={() => setIncomesPage((p) => Math.min(incomesPagination!.total_pages, p + 1))}
                          disabled={incomesPagination.current_page === incomesPagination.total_pages}
                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Profit Tab */}
          {activeTab === 'profit' && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  <span className="text-sm sm:text-base font-semibold text-primary-900">الفلترة:</span>
                </div>
                <input
                  type="month"
                  value={profitMonth}
                  onChange={(e) => {
                    setProfitMonth(e.target.value)
                    setProfitMonthFrom('')
                    setProfitMonthTo('')
                  }}
                  className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  placeholder="الشهر"
                />
                <input
                  type="month"
                  value={profitMonthFrom}
                  onChange={(e) => {
                    setProfitMonthFrom(e.target.value)
                    setProfitMonth('')
                  }}
                  className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  placeholder="من"
                />
                <input
                  type="month"
                  value={profitMonthTo}
                  onChange={(e) => {
                    setProfitMonthTo(e.target.value)
                    setProfitMonth('')
                  }}
                  className="px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  placeholder="إلى"
                />
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة تعيين</span>
                </button>
              </div>

              {/* Profit Display */}
              {loading ? (
                <div className="text-center py-12 text-primary-600">
                  <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm sm:text-base">جاري التحميل...</p>
                </div>
              ) : profit ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-green-50 p-4 sm:p-6 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-green-700">إجمالي الإيرادات</h3>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900">{formatCurrency(profit.total_income)}</p>
                  </div>
                  <div className="bg-red-50 p-4 sm:p-6 rounded-lg border-2 border-red-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-red-700">إجمالي المصروفات</h3>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-900">{formatCurrency(profit.total_expense)}</p>
                  </div>
                  <div className={`p-4 sm:p-6 rounded-lg border-2 ${profit.net_profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${profit.net_profit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                        <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${profit.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                      </div>
                      <h3 className={`text-sm sm:text-base font-semibold ${profit.net_profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>صافي الربح</h3>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold ${profit.net_profit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      {formatCurrency(profit.net_profit)}
                    </p>
                    <div className="mt-3 pt-3 border-t border-primary-200 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-primary-600">عدد الإيرادات: <span className="font-semibold text-primary-900">{profit.income_count}</span></span>
                      <span className="text-primary-600">عدد المصروفات: <span className="font-semibold text-primary-900">{profit.expense_count}</span></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-primary-600">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-primary-300" />
                  <p className="text-base sm:text-lg">لا توجد بيانات للعرض</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsExpenseModalOpen(false)
              setEditingExpense(null)
              setExpenseForm({ month: getCurrentMonth(), amount: 0, description: '' })
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900">
                  {editingExpense ? 'تعديل مصروف' : 'إضافة مصروف'}
                </h2>
                <button
                  onClick={() => {
                    setIsExpenseModalOpen(false)
                    setEditingExpense(null)
                    setExpenseForm({ month: getCurrentMonth(), amount: 0, description: '' })
                  }}
                  className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <X className="w-5 h-5 text-primary-700" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">الشهر</label>
                  <input
                    type="month"
                    value={expenseForm.month}
                    onChange={(e) => setExpenseForm({ ...expenseForm, month: e.target.value })}
                    required
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">المبلغ</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount === 0 ? '' : expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder=""
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">الوصف</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-semibold"
                  >
                    {editingExpense ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpenseModalOpen(false)
                      setEditingExpense(null)
                      setExpenseForm({ month: getCurrentMonth(), amount: 0, description: '' })
                    }}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Income Modal */}
      <AnimatePresence>
        {isIncomeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsIncomeModalOpen(false)
              setEditingIncome(null)
              setIncomeForm({ month: getCurrentMonth(), amount: 0, description: '' })
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900">
                  {editingIncome ? 'تعديل إيراد' : 'إضافة إيراد'}
                </h2>
                <button
                  onClick={() => {
                    setIsIncomeModalOpen(false)
                    setEditingIncome(null)
                    setIncomeForm({ month: getCurrentMonth(), amount: 0, description: '' })
                  }}
                  className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <X className="w-5 h-5 text-primary-700" />
                </button>
              </div>

              <form onSubmit={handleIncomeSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">الشهر</label>
                  <input
                    type="month"
                    value={incomeForm.month}
                    onChange={(e) => setIncomeForm({ ...incomeForm, month: e.target.value })}
                    required
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">المبلغ</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={incomeForm.amount === 0 ? '' : incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder=""
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">الوصف</label>
                  <textarea
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-semibold"
                  >
                    {editingIncome ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsIncomeModalOpen(false)
                      setEditingIncome(null)
                      setIncomeForm({ month: getCurrentMonth(), amount: 0, description: '' })
                    }}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
