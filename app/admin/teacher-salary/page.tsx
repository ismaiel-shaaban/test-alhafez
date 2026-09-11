'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { DollarSign, Calendar, CheckCircle, XCircle, Search, X, Mail, Phone, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import SelectedPaymentMethodDetails from '@/components/admin/SelectedPaymentMethodDetails'
import PaymentProofFilesField from '@/components/admin/PaymentProofFilesField'
import PaymentProofManager from '@/components/admin/PaymentProofManager'
import {
  getDefaultTeacherSalaryMonth,
  readTeacherSalaryListState,
  writeTeacherSalaryListState,
} from '@/lib/teacher-salary-list-state'

export default function TeacherSalaryPage() {
  const { 
    teachers,
    teachersMeta,
    isLoadingTeachers,
    fetchTeachers,
    getTeacherSalary,
    markPaymentAsPaid,
    getTeacherPayments,
    getTeacherPaymentMethods,
    error 
  } = useAdminStore()
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [salaryData, setSalaryData] = useState<any>(null)
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [salaryStatusFilter, setSalaryStatusFilter] = useState<'pending' | 'paid' | ''>('')
  const [paymentMethodTypeFilter, setPaymentMethodTypeFilter] = useState<'wallet' | 'insta' | 'bank' | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [listReady, setListReady] = useState(false)
  const skipPageResetRef = useRef(true)
  const [paymentForm, setPaymentForm] = useState({
    payment_proof_images: [] as File[],
    payment_method_id: '' as string | '',
    notes: '',
  })
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  // Restore filters & pagination from session (survives navigation to teacher details)
  useEffect(() => {
    const saved = readTeacherSalaryListState()
    setCurrentPage(saved.page ?? 1)
    setSelectedMonth(saved.month ?? getDefaultTeacherSalaryMonth())
    setSalaryStatusFilter(saved.salary_status ?? '')
    setPaymentMethodTypeFilter(saved.payment_method_type ?? '')
    setSearchTerm(saved.search ?? '')
    setListReady(true)
  }, [])

  // Reset page when search or filters change (skip once after restore)
  useEffect(() => {
    if (!listReady) return
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false
      return
    }
    setCurrentPage(1)
  }, [searchTerm, salaryStatusFilter, selectedMonth, paymentMethodTypeFilter, listReady])

  // Fetch teachers with search and pagination
  useEffect(() => {
    if (!listReady) return
    const search = searchTerm.trim() || undefined
    writeTeacherSalaryListState({
      page: currentPage,
      month: selectedMonth,
      salary_status: salaryStatusFilter,
      payment_method_type: paymentMethodTypeFilter,
      search: searchTerm,
    })
    fetchTeachers(
      currentPage,
      15,
      search,
      undefined,
      undefined,
      selectedMonth || undefined,
      salaryStatusFilter || undefined,
      paymentMethodTypeFilter || undefined
    )
  }, [fetchTeachers, listReady, currentPage, searchTerm, selectedMonth, salaryStatusFilter, paymentMethodTypeFilter])

  // Teachers are now filtered on the API side, so we use them directly
  const filteredTeachers = teachers

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => String(method.id) === paymentForm.payment_method_id) ?? null,
    [paymentMethods, paymentForm.payment_method_id]
  )

  const handleViewSalary = async (teacherId: number) => {
    if (!selectedMonth) {
      alert('يرجى اختيار الشهر')
      return
    }
    setIsLoading(true)
    try {
      const data = await getTeacherSalary(teacherId, selectedMonth)
      setSelectedTeacher(teacherId)
      setSalaryData(data)
      setShowSalaryModal(true)
      setShowPaymentForm(false)
      // Load payment methods for this teacher
      loadPaymentMethods(teacherId)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل حساب الراتب')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPaymentMethods = async (teacherId: number) => {
    setIsLoadingPaymentMethods(true)
    try {
      const methods = await getTeacherPaymentMethods(teacherId)
      setPaymentMethods(methods || [])
    } catch (error: any) {
      console.error('Error loading payment methods:', error)
      setPaymentMethods([])
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }

  const handleViewPayments = async (teacherId: number, page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await getTeacherPayments(teacherId, page)
      setSelectedTeacher(teacherId)
      setPaymentsHistory(response.payments || [])
      setPagination(response.pagination)
      setShowPaymentModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل سجل المدفوعات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher || !selectedMonth) {
      alert('يرجى اختيار المعلم والشهر')
      return
    }
    if (paymentForm.payment_proof_images.length === 0) {
      alert('يرجى اختيار ملف واحد على الأقل لإثبات الدفع')
      return
    }
    setIsLoading(true)
    try {
      await markPaymentAsPaid(selectedTeacher, {
        month: selectedMonth,
        payment_proof_images: paymentForm.payment_proof_images,
        payment_method_id: paymentForm.payment_method_id ? parseInt(paymentForm.payment_method_id) : undefined,
        notes: paymentForm.notes || undefined,
      })
      alert('تم تسجيل السداد بنجاح')
      setShowPaymentForm(false)
      setPaymentForm({ payment_proof_images: [], payment_method_id: '', notes: '' })
      // Refresh salary data
      if (selectedTeacher && selectedMonth) {
        const data = await getTeacherSalary(selectedTeacher, selectedMonth)
        setSalaryData(data)
      }
    } catch (error: any) {
      alert(error.message || 'فشل تسجيل السداد')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">حسابات المعلمين</h1>
        <div className="flex items-center gap-4">
          <div className="text-primary-600 font-medium">
            إجمالي المعلمين: {teachersMeta?.total || teachers.length}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Month Selector & Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-4">
            <label className="text-primary-900 font-semibold shrink-0">اختر الشهر:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-primary-900 font-semibold shrink-0">حالة الراتب:</label>
            <select
              value={salaryStatusFilter}
              onChange={(e) => setSalaryStatusFilter(e.target.value as 'pending' | 'paid' | '')}
              className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">غير مسدد</option>
              <option value="paid">مسدد</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-primary-900 font-semibold shrink-0">طريقة الدفع:</label>
            <select
              value={paymentMethodTypeFilter}
              onChange={(e) => setPaymentMethodTypeFilter(e.target.value as 'wallet' | 'insta' | 'bank' | '')}
              className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الطرق</option>
              <option value="wallet">محفظة</option>
              <option value="insta">انستا</option>
              <option value="bank">بنك</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 mb-6 shadow-lg">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن معلم..."
            className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
            dir="rtl"
          />
        </div>
      </div>

      {/* Teachers List */}
      {isLoadingTeachers ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm || salaryStatusFilter || paymentMethodTypeFilter ? 'لا توجد نتائج' : 'لا يوجد معلمون مسجلون بعد'}
              </div>
            ) : (
              filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-700">
                  {teacher?.name?.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2 text-center">{teacher.name}</h3>
              <p className="text-primary-700 mb-4 text-center">{teacher.specialization || teacher.specialization_ar || '-'}</p>
              <div className="flex flex-col items-center gap-2">
                <Link
                  href={`/admin/teachers/${teacher.id}`}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  عرض التفاصيل
                </Link>
                <div className="flex items-center justify-center gap-2 w-full">
                  <button
                    onClick={() => handleViewSalary(teacher.id)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    disabled={isLoading || !selectedMonth}
                  >
                    <DollarSign className="w-4 h-4" />
                    حساب الراتب
                  </button>
                  <button
                    onClick={() => handleViewPayments(teacher.id)}
                    className="flex-1 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green-dark transition-colors flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <Calendar className="w-4 h-4" />
                    سجل المدفوعات
                  </button>
                </div>
              </div>
            </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {teachersMeta && teachersMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200 mt-6">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {teachersMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= teachersMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Salary Details Modal */}
      <AnimatePresence>
        {showSalaryModal && salaryData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowSalaryModal(false)
              setShowPaymentForm(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-primary-900">
                    حساب الراتب - {salaryData.teacher.name}
                  </h2>
                  <p className="text-primary-600 mt-1">
                    {salaryData.teacher.specialization || salaryData.teacher.specialization_ar || ''} - {salaryData.month}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSalaryModal(false)
                    setShowPaymentForm(false)
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Students Table */}
                {salaryData.students && salaryData.students.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-4">الطلاب</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border-2 border-primary-200">
                        <thead>
                          <tr className="bg-primary-100">
                            <th className="border border-primary-200 p-3 text-right text-primary-900 font-semibold">الطالب</th>
                            <th className="border border-primary-200 p-3 text-right text-primary-900 font-semibold">البريد</th>
                            <th className="border border-primary-200 p-3 text-right text-primary-900 font-semibold">الهاتف</th>
                            <th className="border border-primary-200 p-3 text-center text-primary-900 font-semibold">عدد الحصص</th>
                            <th className="border border-primary-200 p-3 text-center text-primary-900 font-semibold">إجمالي الساعات</th>
                            <th className="border border-primary-200 p-3 text-center text-primary-900 font-semibold">سعر الساعة</th>
                            <th className="border border-primary-200 p-3 text-center text-primary-900 font-semibold">المبلغ الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salaryData.students.map((student: any) => (
                            <tr key={student.id} className="hover:bg-primary-50">
                              <td className="border border-primary-200 p-3 text-primary-900 font-medium">{student.name}</td>
                              <td className="border border-primary-200 p-3 text-primary-700">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-primary-500" />
                                  {student.email}
                                </div>
                              </td>
                              <td className="border border-primary-200 p-3 text-primary-700">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-primary-500" />
                                  {student.phone}
                                </div>
                              </td>
                              <td className="border border-primary-200 p-3 text-center text-primary-700">{student.sessions_count}</td>
                              <td className="border border-primary-200 p-3 text-center text-primary-700">{student.total_hours.toFixed(2)}</td>
                              <td className="border border-primary-200 p-3 text-center text-primary-700">{student.hourly_rate.toFixed(2)} جنيه</td>
                              <td className="border border-primary-200 p-3 text-center font-semibold text-primary-900">{student.total_amount.toFixed(2)} جنيه</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-primary-600 bg-primary-50 rounded-lg">
                    لا توجد حصص مكتملة لهذا الشهر
                  </div>
                )}

                {/* Summary */}
                {salaryData.summary && (
                  <div className="bg-gradient-to-r from-primary-50 to-accent-green/10 p-6 rounded-lg border-2 border-primary-200">
                    <h3 className="text-lg font-semibold text-primary-900 mb-4">الملخص</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-primary-600 text-sm mb-1">إجمالي الطلاب</p>
                        <p className="text-primary-900 font-bold text-2xl">{salaryData.summary.total_students}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-primary-600 text-sm mb-1">إجمالي الحصص</p>
                        <p className="text-primary-900 font-bold text-2xl">{salaryData.summary.total_sessions}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-primary-600 text-sm mb-1">إجمالي الساعات</p>
                        <p className="text-primary-900 font-bold text-2xl">{salaryData.summary.total_hours.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-2 border-accent-green">
                        <p className="text-primary-600 text-sm mb-1">المبلغ الإجمالي</p>
                        <p className="font-bold text-2xl text-accent-green">{salaryData.summary.total_amount.toFixed(2)} جنيه</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                {salaryData.payment ? (
                  <div className="bg-accent-green/10 p-6 rounded-lg border-2 border-accent-green">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-accent-green" />
                      <h3 className="text-lg font-semibold text-primary-900">تم السداد</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-primary-600 text-sm mb-1">تاريخ السداد</p>
                        <p className="text-primary-900 font-medium">
                          {salaryData.payment.paid_at 
                            ? new Date(salaryData.payment.paid_at).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-sm mb-1">المبلغ المدفوع</p>
                        <p className="text-primary-900 font-bold text-xl">{salaryData.payment.total_amount.toFixed(2)} جنيه</p>
                      </div>
                      {salaryData.payment.payment_method && (
                        <div>
                          <p className="text-primary-600 text-sm mb-1">طريقة الدفع</p>
                          <p className="text-primary-900 font-medium">
                            {salaryData.payment.payment_method.type_label || (salaryData.payment.payment_method.type === 'wallet' ? 'محفظة' : (salaryData.payment.payment_method.type === 'insta' || salaryData.payment.payment_method.type === 'instapay' ? 'انستا' : 'InstaPay'))} - {salaryData.payment.payment_method.name}
                            {salaryData.payment.payment_method.phone && ` (${salaryData.payment.payment_method.phone})`}
                          </p>
                        </div>
                      )}
                    </div>
                    {salaryData.payment.notes && (
                      <div className="mt-4">
                        <p className="text-primary-600 text-sm mb-1">ملاحظات</p>
                        <p className="text-primary-700">{salaryData.payment.notes}</p>
                      </div>
                    )}
                    <PaymentProofManager
                      teacherId={salaryData.teacher.id}
                      payment={salaryData.payment}
                      className="mt-4"
                      onUpdated={(updated) =>
                        setSalaryData((prev: any) => (prev ? { ...prev, payment: updated } : prev))
                      }
                    />
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-primary-900">لم يتم السداد بعد</h3>
                    </div>
                    {!showPaymentForm ? (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        تسجيل السداد
                      </button>
                    ) : (
                      <form onSubmit={handleMarkAsPaid} className="mt-4 space-y-4">
                        {paymentMethods.length > 0 && (
                          <div>
                            <label className="block text-primary-900 font-semibold mb-2 text-right">حساب البنك / طريقة الدفع (اختياري)</label>
                            <select
                              value={paymentForm.payment_method_id}
                              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method_id: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                              dir="rtl"
                            >
                              <option value="">اختر حساب البنك / طريقة الدفع (اختياري)</option>
                              {paymentMethods.map((method) => (
                                <option key={method.id} value={method.id}>
                                  {method.type_label || (method.type === 'wallet' ? 'محفظة' : (method.type === 'insta' || method.type === 'instapay' ? 'انستا' : 'InstaPay'))} - {method.name}
                                  {method.phone && ` (${method.phone})`}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-primary-600 mt-1">اختر حساب التحويل المسجل للمعلم (اختياري)</p>
                            <SelectedPaymentMethodDetails method={selectedPaymentMethod} />
                          </div>
                        )}
                        <PaymentProofFilesField
                          files={paymentForm.payment_proof_images}
                          onChange={(payment_proof_images) =>
                            setPaymentForm({ ...paymentForm, payment_proof_images })
                          }
                        />
                        <div>
                          <label className="block text-primary-900 font-semibold mb-2 text-right">ملاحظات</label>
                          <textarea
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                            dir="rtl"
                            placeholder="ملاحظات اختيارية..."
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'جاري الحفظ...' : 'تسجيل السداد'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPaymentForm(false)
                              setPaymentForm({ payment_proof_images: [], payment_method_id: '', notes: '' })
                            }}
                            className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-all"
                          >
                            إلغاء
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment History Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">سجل المدفوعات</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : paymentsHistory.length === 0 ? (
                <div className="text-center py-12 text-primary-600">
                  لا توجد مدفوعات مسجلة
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {paymentsHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-primary-50 p-6 rounded-lg border-2 border-primary-200 hover:border-primary-300 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-primary-900 mb-2">{payment.month}</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-primary-600 text-sm mb-1">المبلغ</p>
                                <p className="text-primary-900 font-bold text-xl">{payment.total_amount.toFixed(2)} جنيه</p>
                              </div>
                              {payment.paid_at && (
                                <div>
                                  <p className="text-primary-600 text-sm mb-1">تاريخ السداد</p>
                                  <p className="text-primary-700">
                                    {new Date(payment.paid_at).toLocaleDateString('ar-EG', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              )}
                              {payment.payment_method && (
                                <div>
                                  <p className="text-primary-600 text-sm mb-1">طريقة الدفع</p>
                                  <p className="text-primary-700">
                                    {payment.payment_method.type_label || (payment.payment_method.type === 'wallet' ? 'محفظة' : (payment.payment_method.type === 'insta' || payment.payment_method.type === 'instapay' ? 'انستا' : 'InstaPay'))} - {payment.payment_method.name}
                                    {payment.payment_method.phone && ` (${payment.payment_method.phone})`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            {payment.is_paid ? (
                              <CheckCircle className="w-8 h-8 text-accent-green" />
                            ) : (
                              <XCircle className="w-8 h-8 text-red-500" />
                            )}
                          </div>
                        </div>
                        {payment.notes && (
                          <div className="mt-4 pt-4 border-t border-primary-200">
                            <p className="text-primary-600 text-sm mb-1">ملاحظات</p>
                            <p className="text-primary-700">{payment.notes}</p>
                          </div>
                        )}
                        <PaymentProofManager
                          teacherId={selectedTeacher}
                          payment={payment}
                          className="mt-4"
                          onUpdated={(updated) =>
                            setPaymentsHistory((prev) =>
                              prev.map((item) => (item.id === updated.id ? updated : item))
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4 border-t border-primary-200">
                      <button
                        onClick={() => handleViewPayments(selectedTeacher, (pagination.current_page || 1) - 1)}
                        disabled={!pagination.current_page || pagination.current_page <= 1}
                        className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        السابق
                      </button>
                      <span className="px-4 py-2 text-primary-700">
                        صفحة {pagination.current_page || 1} من {pagination.total_pages || 1}
                      </span>
                      <button
                        onClick={() => handleViewPayments(selectedTeacher, (pagination.current_page || 1) + 1)}
                        disabled={!pagination.current_page || pagination.current_page >= (pagination.total_pages || 1)}
                        className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
