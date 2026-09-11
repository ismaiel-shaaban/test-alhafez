'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Wallet,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Copy,
} from 'lucide-react'
import {
  listPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  getPaymentAccount,
  copyPaymentAccountDetails,
  type PaymentAccount,
  type PaymentAccountPayload,
} from '@/lib/api/payment-accounts'

const emptyForm = (): PaymentAccountPayload & { is_active: boolean } => ({
  title: '',
  account_number: '',
  bank_name: '',
  notes: '',
  is_active: true,
})

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedAccount, setViewedAccount] = useState<PaymentAccount | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyForm())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pagination, setPagination] = useState<{
    total: number
    per_page: number
    current_page: number
    total_pages: number
  } | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: { per_page: number; is_active?: 0 | 1 } = { per_page: 500 }
      if (filterActive !== null) filters.is_active = filterActive ? 1 : 0
      const data = await listPaymentAccounts(filters)
      setAccounts(data.payment_accounts ?? [])
      setPagination(data.pagination ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الحسابات')
      setAccounts([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [filterActive])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleOpenModal = (account?: PaymentAccount) => {
    if (account) {
      setEditingId(account.id)
      setFormData({
        title: account.title,
        account_number: account.account_number ?? '',
        bank_name: account.bank_name ?? '',
        notes: account.notes ?? '',
        is_active: account.is_active,
      })
    } else {
      setEditingId(null)
      setFormData(emptyForm())
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData(emptyForm())
  }

  const handleView = async (id: number) => {
    try {
      const acc = await getPaymentAccount(id)
      setViewedAccount(acc)
      setShowViewModal(true)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'فشل تحميل الحساب')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('يرجى إدخال اسم صاحب الحساب')
      return
    }
    setIsSubmitting(true)
    try {
      const payload: PaymentAccountPayload = {
        title: formData.title.trim(),
        account_number: formData.account_number?.trim() || undefined,
        bank_name: formData.bank_name?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        is_active: formData.is_active,
      }
      if (editingId) {
        await updatePaymentAccount(editingId, payload)
      } else {
        await createPaymentAccount(payload)
      }
      handleCloseModal()
      await loadAccounts()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'فشل الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyDetails = async (acc: PaymentAccount) => {
    const ok = await copyPaymentAccountDetails(acc)
    alert(ok ? 'تم نسخ بيانات الدفع' : 'تعذّر النسخ')
  }

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'هل أنت متأكد من حذف هذا الحساب؟ سيتم إزالة الربط من الطلاب المرتبطين به تلقائياً.'
      )
    ) {
      return
    }
    try {
      await deletePaymentAccount(id)
      await loadAccounts()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'فشل الحذف')
    }
  }

  const renderAccountDetails = (acc: PaymentAccount) => (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div>
        <dt className="text-primary-600 text-xs mb-0.5">اسم صاحب الحساب</dt>
        <dd className="font-semibold text-primary-900">{acc.title}</dd>
      </div>
      {acc.bank_name && (
        <div>
          <dt className="text-primary-600 text-xs mb-0.5">نوع الحساب</dt>
          <dd className="text-primary-900">{acc.bank_name}</dd>
        </div>
      )}
      {acc.account_number && (
        <div className="sm:col-span-2">
          <dt className="text-primary-600 text-xs mb-0.5">رقم الحساب</dt>
          <dd className="text-primary-900 font-mono break-all" dir="ltr">
            {acc.account_number}
          </dd>
        </div>
      )}
      {acc.phone && (
        <div>
          <dt className="text-primary-600 text-xs mb-0.5">رقم التحويل</dt>
          <dd className="text-primary-900 font-mono break-all" dir="ltr">
            {acc.phone}
          </dd>
        </div>
      )}
      {acc.students_count != null && (
        <div>
          <dt className="text-primary-600 text-xs mb-0.5">عدد الطلاب المرتبطين</dt>
          <dd className="text-primary-900 font-semibold tabular-nums">{acc.students_count}</dd>
        </div>
      )}
      <div className="sm:col-span-2">
        <dt className="text-primary-600 text-xs mb-0.5">ملاحظات</dt>
        <dd className="text-primary-900 whitespace-pre-wrap">{acc.notes || '—'}</dd>
      </div>
    </dl>
  )

  return (
    <div className="px-2 sm:px-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 flex items-center gap-2">
          <Wallet className="w-8 h-8 sm:w-9 sm:h-9 text-primary-600" />
          حسابات التحويل
        </h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadAccounts}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary-200 rounded-lg hover:bg-primary-50 text-primary-800"
          >
            <RefreshCw className="w-5 h-5" />
            تحديث
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            إضافة حساب
          </button>
        </div>
      </div>

      <p className="text-sm text-primary-600 mb-4 max-w-3xl">
        أضف حسابات التحويل التي يحوّل عليها الطلاب الأموال. عند إضافة أو تعديل طالب يمكن ربطه بحساب
        معيّن ليظهر في بياناته في التطبيق.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-900">فلترة</h3>
          </div>
          {pagination && (
            <p className="text-sm text-primary-600">
              إجمالي {pagination.total} حساب
              {pagination.total_pages > 1 &&
                ` — صفحة ${pagination.current_page} من ${pagination.total_pages}`}
            </p>
          )}
        </div>
        <select
          value={filterActive === null ? '' : filterActive ? '1' : '0'}
          onChange={(e) => {
            const v = e.target.value
            setFilterActive(v === '' ? null : v === '1')
          }}
          className="w-full max-w-xs px-4 py-2 border-2 border-primary-200 rounded-lg text-right"
          dir="rtl"
        >
          <option value="">جميع الحسابات</option>
          <option value="1">النشطة فقط</option>
          <option value="0">غير النشطة</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-primary-200 text-primary-600">
          لا توجد حسابات تحويل
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-primary-900 truncate">{acc.title}</h2>
                  {acc.bank_name && (
                    <p className="text-sm text-primary-600 mt-0.5">{acc.bank_name}</p>
                  )}
                </div>
                {acc.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    نشط
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold shrink-0">
                    <XCircle className="w-3.5 h-3.5" />
                    غير نشط
                  </span>
                )}
              </div>
              <div className="text-sm text-primary-700 space-y-1 mb-4">
                {acc.account_number && (
                  <p>
                    <span className="text-primary-500">رقم الحساب: </span>
                    <span dir="ltr" className="font-mono break-all">
                      {acc.account_number}
                    </span>
                  </p>
                )}
                {acc.phone && (
                  <p>
                    <span className="text-primary-500">رقم التحويل: </span>
                    <span dir="ltr" className="font-mono break-all">
                      {acc.phone}
                    </span>
                  </p>
                )}
                {acc.notes && (
                  <p>
                    <span className="text-primary-500">ملاحظات: </span>
                    {acc.notes}
                  </p>
                )}
                {acc.students_count != null && (
                  <p>
                    <span className="text-primary-500">طلاب مرتبطون: </span>
                    <span className="font-semibold tabular-nums">{acc.students_count}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-primary-100">
                <button
                  type="button"
                  onClick={() => handleCopyDetails(acc)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="نسخ بيانات الدفع"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleView(acc.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="عرض"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal(acc)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  title="تعديل"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(acc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary-900">
                  {editingId ? 'تعديل حساب تحويل' : 'إضافة حساب تحويل'}
                </h2>
                <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-primary-50 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">اسم صاحب الحساب *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg text-right"
                    dir="rtl"
                    required
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">نوع الحساب</label>
                  <input
                    type="text"
                    value={formData.bank_name ?? ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg text-right"
                    dir="rtl"
                    placeholder="مثال: بنك، محفظة، انستا باي"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">رقم الحساب</label>
                  <input
                    type="text"
                    value={formData.account_number ?? ''}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg"
                    dir="ltr"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">ملاحظات</label>
                  <textarea
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg text-right"
                    dir="rtl"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-primary-300"
                  />
                  <span className="text-primary-900 font-medium">حساب نشط (يظهر عند ربط الطلاب)</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && viewedAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary-900">تفاصيل الحساب</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopyDetails(viewedAccount)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="نسخ بيانات الدفع"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="p-2 hover:bg-primary-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {renderAccountDetails(viewedAccount)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
