'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, User, Trash2, RefreshCw, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react'
import {
  getStudentDeletionRequests,
  approveStudentDeletionRequest,
  rejectStudentDeletionRequest,
  deleteStudentDeletionRequest,
  StudentDeletionRequest,
} from '@/lib/api/student-deletion-requests'
import { Pagination } from '@/lib/api-client'
import { useAdminStore } from '@/store/useAdminStore'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import SearchableStudentSelect from '@/components/admin/SearchableStudentSelect'
import StudentAdminActions from '@/components/admin/StudentAdminActions'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'

export default function StudentDeletionRequestsPage() {
  const { canManageStudentDeletionRequests } = useAdminPermissions()
  const { teachers, fetchTeachers, students, fetchStudents } = useAdminStore()
  const [requests, setRequests] = useState<StudentDeletionRequest[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'approved' | 'rejected' | '',
    teacher_id: '',
    student_id: '',
  })

  useEffect(() => {
    fetchTeachers(1, 1000)
    fetchStudents({ per_page: 1000, page: 1 })
  }, [])

  useEffect(() => {
    loadRequests()
  }, [currentPage, filters.status, filters.teacher_id, filters.student_id])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const apiFilters: any = {
        page: currentPage,
        per_page: 15,
      }
      if (filters.status) apiFilters.status = filters.status
      if (filters.teacher_id) apiFilters.teacher_id = parseInt(filters.teacher_id)
      if (filters.student_id) apiFilters.student_id = parseInt(filters.student_id)

      const data = await getStudentDeletionRequests(apiFilters)
      setRequests(data?.requests || [])
      setPagination(data?.pagination || null)
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number, type?: 'full' | 'partial') => {
    if (!canManageStudentDeletionRequests) {
      alert('ليس لديك صلاحية إدارة طلبات حذف الطلاب')
      return
    }
    const fullConfirm =
      'تحذير: الموافقة على هذا الطلب سيؤدي إلى حذف الطالب وجميع بياناته بشكل دائم (الحصص، الاشتراكات، الآراء، إلخ). هل أنت متأكد؟'
    const partialConfirm =
      'تحذير: الموافقة على هذا الطلب ستنفّذ حذفاً جزئياً للبيانات المرتبطة بالطالب. هل أنت متأكد؟'
    if (!confirm(type === 'partial' ? partialConfirm : fullConfirm)) {
      return
    }

    setProcessingId(id)
    try {
      await approveStudentDeletionRequest(id)
      await loadRequests()
      alert(type === 'partial' ? 'تمت الموافقة على الطلب بنجاح' : 'تم حذف الطالب بنجاح')
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على الطلب')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    if (!canManageStudentDeletionRequests) {
      alert('ليس لديك صلاحية إدارة طلبات حذف الطلاب')
      return
    }
    const reason = prompt('يرجى إدخال سبب الرفض (اختياري):')
    if (reason === null) return // User cancelled
    
    setProcessingId(id)
    try {
      await rejectStudentDeletionRequest(id, reason || undefined)
      await loadRequests()
    } catch (error: any) {
      alert(error.message || 'فشل رفض الطلب')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!canManageStudentDeletionRequests) {
      alert('ليس لديك صلاحية إدارة طلبات حذف الطلاب')
      return
    }
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return
    
    setDeletingId(id)
    try {
      await deleteStudentDeletionRequest(id)
      await loadRequests()
    } catch (error: any) {
      alert(error.message || 'فشل حذف الطلب')
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

  const getDeletionTypeBadge = (type: 'full' | 'partial') => {
    if (type === 'full') {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-medium">
          حذف كامل
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
        حذف جزئي
      </span>
    )
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900">طلبات حذف الطلاب</h1>
        <button
          onClick={loadRequests}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
        >
          <RefreshCw className="w-5 h-5" />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم</label>
            <SearchableTeacherSelect
              value={filters.teacher_id}
              onChange={(value) => {
                setFilters({ ...filters, teacher_id: value })
                setCurrentPage(1)
              }}
              teachers={teachers}
              placeholder="جميع المعلمين"
            />
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الطالب</label>
            <SearchableStudentSelect
              value={filters.student_id}
              onChange={(value) => {
                setFilters({ ...filters, student_id: value })
                setCurrentPage(1)
              }}
              students={students}
              placeholder="جميع الطلاب"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-primary-600 bg-white rounded-xl border-2 border-primary-200 px-4">
          لا توجد طلبات
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 shadow-lg"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-4 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-2 sm:gap-4 mb-3">
                    {getStatusBadge(request.status)}
                    {request.type && getDeletionTypeBadge(request.type)}
                    <span className="text-xs sm:text-sm text-primary-600">
                      {new Date(request.created_at || '').toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-primary-600 mb-1">المعلم</p>
                      <p className="text-sm sm:text-base font-semibold text-primary-900 break-words">{request.teacher?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-primary-600 mb-1">الطالب</p>
                      <p className="text-sm sm:text-base font-semibold text-primary-900 break-words">{request.student?.name}</p>
                      {request.student?.phone && (
                        <p className="text-xs sm:text-sm text-primary-600 break-words">{request.student.phone}</p>
                      )}
                    </div>
                  </div>
                  {request.student?.id && (
                    <div className="mb-4 pt-3 border-t border-primary-100">
                      <p className="text-sm font-semibold text-primary-700 mb-2">إجراءات الطالب</p>
                      <StudentAdminActions
                        studentId={request.student.id}
                        student={request.student}
                        hideDeleteActions={true}
                      />
                    </div>
                  )}
                  {request.reason && (
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200 mb-4">
                      <p className="text-xs sm:text-sm font-semibold text-yellow-700 mb-1">السبب</p>
                      <p className="text-xs sm:text-sm text-yellow-900 break-words">{request.reason}</p>
                    </div>
                  )}
                  {request.rejection_reason && (
                    <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
                      <p className="text-xs sm:text-sm font-semibold text-red-700 mb-1">سبب الرفض</p>
                      <p className="text-xs sm:text-sm text-red-900 break-words">{request.rejection_reason}</p>
                    </div>
                  )}
                  {request.status === 'pending' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border-2 border-red-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-red-900 break-words">
                        <strong>تحذير:</strong>{' '}
                        {request.type === 'partial' ? (
                          <>الموافقة على هذا الطلب ستنفّذ حذفاً جزئياً للبيانات المرتبطة بالطالب، وليس بالضرورة حذف الطالب وجميع بياناته بالكامل.</>
                        ) : (
                          <>الموافقة على هذا الطلب سيؤدي إلى حذف الطالب وجميع بياناته بشكل دائم.</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-2 w-full sm:w-auto lg:w-auto">
                  {canManageStudentDeletionRequests && request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id, request.type)}
                        disabled={processingId === request.id || deletingId === request.id}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>موافقة وحذف</span>
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id || deletingId === request.id}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </>
                  )}
                  {canManageStudentDeletionRequests && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      disabled={processingId === request.id || deletingId === request.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      title="حذف"
                    >
                      {deletingId === request.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border-2 border-primary-200 hover:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm sm:text-base text-primary-700 text-center">
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

