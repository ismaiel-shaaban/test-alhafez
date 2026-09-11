'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronRight, ChevronLeft, Eye, Trash2 } from 'lucide-react'
import {
  getPaymentReceipts,
  approvePaymentReceipt,
  rejectPaymentReceipt,
  deletePaymentReceipt,
  PaymentReceipt,
} from '@/lib/api/payment-receipts'
import { Pagination } from '@/lib/api-client'
import ReceiptRelatedStudentsPanel, {
  invalidateReceiptRelatedStudentsCache,
} from '@/components/admin/ReceiptRelatedStudentsPanel'

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'approved' | 'rejected' | '',
    student_id: '',
    date_from: '',
    date_to: '',
  })

  useEffect(() => {
    loadReceipts()
  }, [currentPage, filters.status, filters.student_id, filters.date_from, filters.date_to])

  const loadReceipts = async () => {
    setLoading(true)
    try {
      const apiFilters: any = {
        page: currentPage,
        per_page: 15,
      }
      if (filters.status) apiFilters.status = filters.status
      if (filters.student_id) apiFilters.student_id = parseInt(filters.student_id)
      if (filters.date_from) apiFilters.date_from = filters.date_from
      if (filters.date_to) apiFilters.date_to = filters.date_to

      const data = await getPaymentReceipts(apiFilters)
      setReceipts(data?.receipts || [])
      setPagination(data?.pagination || null)
    } catch (error) {
      console.error('Error loading receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm('هل أنت متأكد من الموافقة على إيصال الدفع هذا؟')) return

    const receipt = receipts.find((item) => item.id === id)
    setProcessingId(id)
    try {
      await approvePaymentReceipt(id)
      if (receipt?.student?.phone) invalidateReceiptRelatedStudentsCache(receipt.student.phone)
      await loadReceipts()
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على الإيصال')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('يرجى إدخال سبب الرفض (اختياري):')
    if (reason === null) return // User cancelled

    const receipt = receipts.find((item) => item.id === id)
    setProcessingId(id)
    try {
      await rejectPaymentReceipt(id, reason || undefined)
      if (receipt?.student?.phone) invalidateReceiptRelatedStudentsCache(receipt.student.phone)
      await loadReceipts()
    } catch (error: any) {
      alert(error.message || 'فشل رفض الإيصال')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإيصال؟')) return

    const receipt = receipts.find((item) => item.id === id)
    setDeletingId(id)
    try {
      await deletePaymentReceipt(id)
      if (receipt?.student?.phone) invalidateReceiptRelatedStudentsCache(receipt.student.phone)
      await loadReceipts()
    } catch (error: any) {
      alert(error.message || 'فشل حذف الإيصال')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />قيد الانتظار</span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />موافق عليه</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"><XCircle className="w-3 h-3" />مرفوض</span>
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">إيصالات الدفع</h1>
        <button
          onClick={loadReceipts}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value as 'pending' | 'approved' | 'rejected' | '' })
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">من تاريخ</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => {
                setFilters({ ...filters, date_from: e.target.value })
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">إلى تاريخ</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => {
                setFilters({ ...filters, date_to: e.target.value })
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Receipts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-12 text-primary-600 bg-white rounded-xl border-2 border-primary-200">
          لا توجد إيصالات
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-primary-200 p-6 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    {getStatusBadge(receipt.status)}
                    <span className="text-sm text-primary-600">
                      {new Date(receipt.created_at || '').toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-primary-600 mb-1">الطالب</p>
                      <p className="font-semibold text-primary-900">{receipt.student?.name}</p>
                      {receipt.student?.phone && (
                        <p className="text-sm text-primary-600">{receipt.student.phone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-primary-600 mb-1">المبلغ</p>
                      <p className="font-semibold text-primary-900 text-lg">{receipt.amount} جنيه</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-600 mb-1">تاريخ الدفع</p>
                      <p className="font-semibold text-primary-900">{receipt.payment_date}</p>
                    </div>
                  </div>
                  {receipt.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">ملاحظات</p>
                      <p className="text-sm text-gray-900">{receipt.notes}</p>
                    </div>
                  )}
                  {receipt.rejection_reason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-red-700 mb-1">سبب الرفض</p>
                      <p className="text-sm text-red-900">{receipt.rejection_reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {receipt.receipt_image && (
                    <button
                      onClick={() => setViewingImage(receipt.receipt_image)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      عرض الصورة
                    </button>
                  )}
                  {receipt.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(receipt.id)}
                        disabled={processingId === receipt.id || deletingId === receipt.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        موافقة
                      </button>
                      <button
                        onClick={() => handleReject(receipt.id)}
                        disabled={processingId === receipt.id || deletingId === receipt.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        رفض
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(receipt.id)}
                    disabled={processingId === receipt.id || deletingId === receipt.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="حذف"
                  >
                    {deletingId === receipt.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {receipt.student?.phone && (
                <ReceiptRelatedStudentsPanel phone={receipt.student.phone} />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 left-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <XCircle className="w-6 h-6 text-gray-800" />
            </button>
            <img
              src={viewingImage}
              alt="Payment Receipt"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border-2 border-primary-200 hover:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-primary-700">
            صفحة {currentPage} من {pagination.total_pages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
            disabled={currentPage === pagination.total_pages}
            className="p-2 rounded-lg border-2 border-primary-200 hover:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

