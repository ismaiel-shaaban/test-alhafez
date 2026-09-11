'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import {
  getScheduleChangeRequests,
  approveScheduleChangeRequest,
  rejectScheduleChangeRequest,
  deleteScheduleChangeRequest,
  ScheduleChangeRequest,
} from '@/lib/api/schedule-change-requests'
import { Pagination } from '@/lib/api-client'
import { useAdminStore } from '@/store/useAdminStore'
import SearchableStudentSelect from '@/components/admin/SearchableStudentSelect'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'

export default function ScheduleChangeRequestsPage() {
  const { students, fetchStudents, teachers, fetchTeachers } = useAdminStore()
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([])
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
    fetchStudents({ per_page: 10000, page: 1 })
  }, [fetchTeachers, fetchStudents])

  useEffect(() => {
    loadRequests()
  }, [currentPage, filters.status, filters.teacher_id, filters.student_id])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const apiFilters: Parameters<typeof getScheduleChangeRequests>[0] = {
        page: currentPage,
        per_page: 15,
      }
      if (filters.status) apiFilters.status = filters.status
      if (filters.teacher_id) apiFilters.teacher_id = parseInt(filters.teacher_id, 10)
      if (filters.student_id) apiFilters.student_id = parseInt(filters.student_id, 10)

      const data = await getScheduleChangeRequests(apiFilters)
      setRequests(data?.requests || [])
      setPagination(data?.pagination || null)
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm('هل أنت متأكد من الموافقة على طلب تغيير الموعد؟ سيتم تحديث جدول الطالب تلقائياً.')) return
    
    setProcessingId(id)
    try {
      await approveScheduleChangeRequest(id)
      await loadRequests()
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على الطلب')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('يرجى إدخال سبب الرفض (اختياري):')
    if (reason === null) return // User cancelled
    
    setProcessingId(id)
    try {
      await rejectScheduleChangeRequest(id, reason || undefined)
      await loadRequests()
    } catch (error: any) {
      alert(error.message || 'فشل رفض الطلب')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return
    
    setDeletingId(id)
    try {
      await deleteScheduleChangeRequest(id)
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

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900">طلبات تغيير المواعيد</h1>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3">
                    {getStatusBadge(request.status)}
                    <span className="text-xs sm:text-sm text-primary-600">
                      {new Date(request.created_at || '').toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-primary-600 mb-1">المعلم</p>
                      <p className="text-sm sm:text-base font-semibold text-primary-900 break-words">{request.teacher?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-primary-600 mb-1">الطالب</p>
                      <p className="text-sm sm:text-base font-semibold text-primary-900 break-words">{request.student?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-red-50 p-3 sm:p-4 rounded-lg border-2 border-red-200">
                      <p className="text-xs sm:text-sm font-semibold text-red-700 mb-2">الجدول القديم</p>
                      <div className="space-y-1">
                        {request.old_schedule.map((schedule, idx) => (
                          <p key={idx} className="text-xs sm:text-sm text-red-900 break-words">
                            {schedule.day} - {schedule.time}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                      <p className="text-xs sm:text-sm font-semibold text-green-700 mb-2">الجدول الجديد</p>
                      <div className="space-y-1">
                        {request.new_schedule.map((schedule, idx) => (
                          <p key={idx} className="text-xs sm:text-sm text-green-900 break-words">
                            {schedule.day} - {schedule.time}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  {request.rejection_reason && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs sm:text-sm font-semibold text-red-700 mb-1">سبب الرفض</p>
                      <p className="text-xs sm:text-sm text-red-900 break-words">{request.rejection_reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-2 w-full sm:w-auto lg:w-auto">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id || deletingId === request.id}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">موافقة</span>
                        <span className="sm:hidden">موافقة</span>
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id || deletingId === request.id}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">رفض</span>
                        <span className="sm:hidden">رفض</span>
                      </button>
                    </>
                  )}
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

