'use client'

import { useEffect, useState, useRef } from 'react'
import { Award, CheckCircle, XCircle, Clock, User, RefreshCw, GraduationCap, ChevronRight, ChevronLeft, BookOpen, Image as ImageIcon, Trash2, X, Upload, Link2 } from 'lucide-react'
import {
  getParentCertificates,
  getStudentCertificates,
  updateParentCertificateStatus,
  updateStudentCertificateStatus,
  deleteParentCertificate,
  deleteStudentCertificate,
  Certificate,
} from '@/lib/api/certificates'
import { motion, AnimatePresence } from 'framer-motion'
import { Pagination, getCurrentLocale } from '@/lib/api-client'

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student')
  const [parentCertificates, setParentCertificates] = useState<Certificate[]>([])
  const [studentCertificates, setStudentCertificates] = useState<Certificate[]>([])
  const [parentPagination, setParentPagination] = useState<Pagination | null>(null)
  const [studentPagination, setStudentPagination] = useState<Pagination | null>(null)
  const [parentPage, setParentPage] = useState(1)
  const [studentPage, setStudentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [approveModal, setApproveModal] = useState<{ id: number; type: 'parent' | 'student' } | null>(null)
  const [approveFile, setApproveFile] = useState<File | null>(null)
  const [approvePreview, setApprovePreview] = useState<string | null>(null)
  const [approveCertificateUrl, setApproveCertificateUrl] = useState('')
  const approveFileInputRef = useRef<HTMLInputElement>(null)

  // Load certificates based on active tab
  useEffect(() => {
    loadCertificates()
  }, [activeTab, parentPage, studentPage])

  const loadCertificates = async () => {
    setLoading(true)
    try {
      if (activeTab === 'parent') {
        const data = await getParentCertificates(parentPage)
        setParentCertificates(data?.certificates || [])
        setParentPagination(data?.pagination || null)
      } else {
        const data = await getStudentCertificates(studentPage)
        setStudentCertificates(data?.certificates || [])
        setStudentPagination(data?.pagination || null)
      }
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'parent' | 'student') => {
    setActiveTab(tab)
    // Reset page when switching tabs
    if (tab === 'parent') {
      setParentPage(1)
    } else {
      setStudentPage(1)
    }
  }

  const closeApproveModal = () => {
    setApproveModal(null)
    setApproveFile(null)
    setApproveCertificateUrl('')
    if (approvePreview) {
      URL.revokeObjectURL(approvePreview)
      setApprovePreview(null)
    }
    if (approveFileInputRef.current) approveFileInputRef.current.value = ''
  }

  const handleApproveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (approvePreview) {
      URL.revokeObjectURL(approvePreview)
      setApprovePreview(null)
    }
    if (file) {
      setApproveFile(file)
      setApprovePreview(URL.createObjectURL(file))
    } else {
      setApproveFile(null)
    }
  }

  const reloadAfterStatus = async (type: 'parent' | 'student') => {
    if (type === 'parent') {
      const data = await getParentCertificates(parentPage)
      setParentCertificates(data?.certificates || [])
      setParentPagination(data?.pagination || null)
    } else {
      const data = await getStudentCertificates(studentPage)
      setStudentCertificates(data?.certificates || [])
      setStudentPagination(data?.pagination || null)
    }
  }

  const handleStatusUpdate = async (
    id: number,
    status: 'pending' | 'accept' | 'cancel',
    type: 'parent' | 'student'
  ) => {
    if (status === 'accept') {
      setApprovePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setApproveFile(null)
      setApproveCertificateUrl('')
      setApproveModal({ id, type })
      setTimeout(() => {
        if (approveFileInputRef.current) approveFileInputRef.current.value = ''
      }, 0)
      return
    }

    setUpdatingId(id)
    const locale = getCurrentLocale()
    try {
      if (type === 'parent') {
        await updateParentCertificateStatus(id, status, locale)
      } else {
        await updateStudentCertificateStatus(id, status, locale)
      }
      await reloadAfterStatus(type)
    } catch (error) {
      console.error('Error updating certificate status:', error)
      alert('حدث خطأ أثناء تحديث حالة الشهادة')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleConfirmApprove = async () => {
    if (!approveModal) return
    if (!approveFile) {
      alert('يرجى رفع صورة الشهادة قبل القبول')
      return
    }
    const { id, type } = approveModal
    const locale = getCurrentLocale()
    setUpdatingId(id)
    try {
      const url = approveCertificateUrl.trim()
      if (type === 'parent') {
        await updateParentCertificateStatus(id, 'accept', locale, approveFile, url || undefined)
      } else {
        await updateStudentCertificateStatus(id, 'accept', locale, approveFile, url || undefined)
      }
      closeApproveModal()
      await reloadAfterStatus(type)
    } catch (error: any) {
      console.error('Error approving certificate:', error)
      alert(error?.message || 'حدث خطأ أثناء قبول الشهادة')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (
    id: number,
    type: 'parent' | 'student'
  ) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشهادة؟ سيتم حذفها بشكل دائم.')) return
    
    setDeletingId(id)
    try {
      if (type === 'parent') {
        await deleteParentCertificate(id)
      } else {
        await deleteStudentCertificate(id)
      }
      // Reload certificates - keep current page
      if (type === 'parent') {
        const data = await getParentCertificates(parentPage)
        setParentCertificates(data?.certificates || [])
        setParentPagination(data?.pagination || null)
      } else {
        const data = await getStudentCertificates(studentPage)
        setStudentCertificates(data?.certificates || [])
        setStudentPagination(data?.pagination || null)
      }
    } catch (error: any) {
      console.error('Error deleting certificate:', error)
      alert(error.message || 'حدث خطأ أثناء حذف الشهادة')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string, statusLabel?: string) => {
    const label = statusLabel || status
    switch (status) {
      case 'accept':
        return (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1 sm:gap-2">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            {label === 'accept' ? 'مقبولة' : label}
          </span>
        )
      case 'cancel':
        return (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800 flex items-center gap-1 sm:gap-2">
            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            {label === 'cancel' ? 'ملغاة' : label}
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1 sm:gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            {label === 'pending' ? 'قيد الانتظار' : label}
          </span>
        )
    }
  }

  const currentCertificates = activeTab === 'parent' ? parentCertificates : studentCertificates
  const currentPagination = activeTab === 'parent' ? parentPagination : studentPagination
  const currentPage = activeTab === 'parent' ? parentPage : studentPage
  const setCurrentPage = activeTab === 'parent' ? setParentPage : setStudentPage

  return (
    <div className="px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">شهادات التقدير</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg mb-6">
        <div className="flex border-b border-primary-200">
        <button
            onClick={() => handleTabChange('student')}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors ${
              activeTab === 'student'
                ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                : 'text-primary-700 hover:bg-primary-50'
            }`}
          >
            شهادات الطلاب
          </button>
          <button
            onClick={() => handleTabChange('parent')}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors ${
              activeTab === 'parent'
                ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                : 'text-primary-700 hover:bg-primary-50'
            }`}
          >
            شهادات أولياء الأمور
          </button>
        
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-12 text-primary-600">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm sm:text-base">جاري تحميل شهادات التقدير...</p>
            </div>
          ) : currentCertificates.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-primary-600">
              <Award className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-primary-300" />
              <p className="text-base sm:text-lg">لا توجد شهادات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentCertificates.map((certificate) => (
                <motion.div
                  key={certificate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary-50 p-4 sm:p-6 rounded-lg border-2 border-primary-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="bg-primary-200 p-2 sm:p-3 rounded-lg">
                          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary-700" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-primary-900 break-words">
                            {activeTab === 'parent'
                              ? certificate.parent_name || 'ولي أمر'
                              : certificate.student_name || 'طالب'}
                          </h3>
                          <p className="text-xs sm:text-sm text-primary-600">
                            {activeTab === 'parent' ? 'ولي أمر' : 'طالب'}
                          </p>
                        </div>
                      </div>

                      {/* Student Image */}
                      {activeTab === 'student' && certificate.student_image && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs text-primary-600 mb-1 font-medium">صورة الطالب</p>
                          <img
                            src={certificate.student_image}
                            alt={certificate.student_name || 'صورة الطالب'}
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-primary-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      {certificate.certificate_image && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs text-primary-600 mb-1 font-medium flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            صورة الشهادة (بعد القبول)
                          </p>
                          <a
                            href={certificate.certificate_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={certificate.certificate_image}
                              alt="صورة الشهادة"
                              className="max-w-full sm:max-w-xs max-h-48 object-contain rounded-lg border-2 border-primary-200 hover:border-primary-400 transition-colors"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </a>
                        </div>
                      )}

                      {certificate.certificate_url && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs text-primary-600 mb-1 font-medium flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" />
                            رابط الشهادة
                          </p>
                          <a
                            href={certificate.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-800 underline break-all"
                            dir="ltr"
                          >
                            {certificate.certificate_url}
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        {activeTab === 'parent' && certificate.parent_name && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-primary-700 font-medium">ولي الأمر:</span>
                            <span className="text-xs sm:text-sm text-primary-900 break-words">{certificate.parent_name}</span>
                          </div>
                        )}
                        {activeTab === 'parent' && certificate.student_name && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-primary-700 font-medium">الطالب:</span>
                            <span className="text-xs sm:text-sm text-primary-900 break-words">{certificate.student_name}</span>
                          </div>
                        )}
                        {activeTab === 'student' && certificate.student_name && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-primary-700 font-medium">الطالب:</span>
                            <span className="text-xs sm:text-sm text-primary-900 break-words">{certificate.student_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-primary-700 font-medium">الجنس:</span>
                          <span className="text-xs sm:text-sm text-primary-900 break-words">
                            {certificate.gender_label ||
                              (certificate.gender === 'male' ? 'ذكر' : certificate.gender === 'female' ? 'أنثى' : '-')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-primary-700 font-medium">العمر:</span>
                          <span className="text-xs sm:text-sm text-primary-900 break-words">
                            {certificate.age != null ? certificate.age : '-'}
                          </span>
                        </div>
                        {certificate.teacher_name && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <GraduationCap className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-primary-700 font-medium">المعلم:</span>
                            <span className="text-xs sm:text-sm text-primary-900 break-words">{certificate.teacher_name}</span>
                          </div>
                        )}
                        {activeTab === 'student' && certificate.memorization_amount && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <BookOpen className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-primary-700 font-medium">مقدار الحفظ:</span>
                            <span className="text-xs sm:text-sm text-primary-900 font-semibold break-words">{certificate.memorization_amount}</span>
                          </div>
                        )}
                        {certificate.created_at && (
                          <div className="text-xs sm:text-sm text-primary-600 col-span-1 sm:col-span-2">
                            تاريخ الإنشاء: {new Date(certificate.created_at).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
                      <div className="flex-shrink-0">
                        {getStatusBadge(certificate.status, certificate.status_label)}
                      </div>

                      {/* Status Actions */}
                      <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <div className="flex flex-wrap gap-2">
                          {certificate.status !== 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(certificate.id, 'pending', activeTab)}
                              disabled={updatingId === certificate.id || deletingId === certificate.id}
                              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingId === certificate.id ? (
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                'قيد الانتظار'
                              )}
                            </button>
                          )}
                          {certificate.status !== 'accept' && (
                            <button
                              onClick={() => handleStatusUpdate(certificate.id, 'accept', activeTab)}
                              disabled={updatingId === certificate.id || deletingId === certificate.id}
                              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingId === certificate.id ? (
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                'قبول'
                              )}
                            </button>
                          )}
                          {certificate.status !== 'cancel' && (
                            <button
                              onClick={() => handleStatusUpdate(certificate.id, 'cancel', activeTab)}
                              disabled={updatingId === certificate.id || deletingId === certificate.id}
                              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingId === certificate.id ? (
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                'إلغاء'
                              )}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(certificate.id, activeTab)}
                          disabled={deletingId === certificate.id || updatingId === certificate.id}
                          className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {deletingId === certificate.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              <span className="hidden sm:inline">جاري الحذف...</span>
                              <span className="sm:hidden">حذف...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>حذف</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {currentPagination && currentPagination.total_pages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border-2 border-primary-300 hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-primary-700" />
              </button>
              
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-base text-primary-700 font-medium text-center">
                  صفحة {currentPage} من {currentPagination.total_pages}
                </span>
                <span className="text-xs sm:text-sm text-primary-600 text-center">
                  (إجمالي: {currentPagination.total})
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(currentPagination.total_pages, currentPage + 1))}
                disabled={currentPage === currentPagination.total_pages || loading}
                className="p-2 rounded-lg border-2 border-primary-300 hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-primary-700" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Approve modal: required certificate image upload */}
      <AnimatePresence>
        {approveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !updatingId && closeApproveModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border-2 border-primary-200 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-primary-200 flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-primary-900">قبول الشهادة</h2>
                <button
                  type="button"
                  onClick={() => !updatingId && closeApproveModal()}
                  className="p-2 rounded-lg hover:bg-primary-100 text-primary-700"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <p className="text-sm text-primary-700 text-right">
                  يرجى رفع صورة الشهادة النهائية لإتمام القبول. يمكنك إضافة رابط إضافي للشهادة (اختياري).
                </p>
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-2 text-right">رابط الشهادة (اختياري)</label>
                  <input
                    type="url"
                    value={approveCertificateUrl}
                    onChange={(e) => setApproveCertificateUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={updatingId === approveModal.id}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-800 mb-2 text-right">صورة الشهادة *</label>
                  <input
                    ref={approveFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleApproveFileChange}
                    disabled={!!updatingId && updatingId === approveModal.id}
                    className="hidden"
                    id="certificate-approve-image"
                  />
                  <label
                    htmlFor="certificate-approve-image"
                    className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-primary-300 rounded-xl cursor-pointer hover:bg-primary-50 transition-colors ${updatingId === approveModal.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Upload className="w-8 h-8 text-primary-600" />
                    <span className="text-sm text-primary-700 text-center">اضغط لاختيار صورة</span>
                  </label>
                  {approvePreview && (
                    <div className="mt-3 rounded-lg border border-primary-200 overflow-hidden bg-primary-50 p-2">
                      <img src={approvePreview} alt="معاينة" className="max-h-48 mx-auto object-contain w-full" />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleConfirmApprove}
                    disabled={updatingId === approveModal.id || !approveFile}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {updatingId === approveModal.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    تأكيد القبول
                  </button>
                  <button
                    type="button"
                    onClick={() => !updatingId && closeApproveModal()}
                    disabled={updatingId === approveModal.id}
                    className="flex-1 py-2.5 border-2 border-primary-300 text-primary-800 rounded-lg font-medium hover:bg-primary-50 disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

