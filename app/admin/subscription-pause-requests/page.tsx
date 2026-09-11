'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronRight, ChevronLeft, Calendar, User, GraduationCap, Trash2 } from 'lucide-react'
import {
  getSubscriptionPauseRequests,
  approveSubscriptionPauseRequest,
  rejectSubscriptionPauseRequest,
  deleteSubscriptionPauseRequest,
  SubscriptionPauseRequest,
} from '@/lib/api/subscription-pause-requests'
import { Pagination } from '@/lib/api-client'
import { useAdminStore } from '@/store/useAdminStore'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import SearchableStudentSelect from '@/components/admin/SearchableStudentSelect'
import StudentAdminActions from '@/components/admin/StudentAdminActions'

type RequestTypeTab = 'pause' | 'resume'

export default function SubscriptionPauseRequestsPage() {
  const { teachers, fetchTeachers, students, fetchStudents } = useAdminStore()
  const [activeTab, setActiveTab] = useState<RequestTypeTab>('pause')
  const [requests, setRequests] = useState<SubscriptionPauseRequest[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'approved' | 'rejected' | '',
    teacher_id: '',
    student_id: '',
    date_from: '',
    date_to: '',
  })

  useEffect(() => {
    fetchTeachers(1, 1000)
    fetchStudents({ per_page: 10000, page: 1 })
  }, [])

  useEffect(() => {
    loadRequests()
  }, [activeTab, currentPage, filters.status, filters.teacher_id, filters.student_id, filters.date_from, filters.date_to])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const apiFilters: any = {
        type: activeTab,
        page: currentPage,
        per_page: 15,
      }
      if (filters.status) apiFilters.status = filters.status
      if (filters.teacher_id) apiFilters.teacher_id = parseInt(filters.teacher_id)
      if (filters.student_id) apiFilters.student_id = parseInt(filters.student_id)
      if (filters.date_from) apiFilters.date_from = filters.date_from
      if (filters.date_to) apiFilters.date_to = filters.date_to

      const data = await getSubscriptionPauseRequests(apiFilters)
      setRequests(data?.requests || [])
      setPagination(data?.pagination || null)
    } catch (error) {
      console.error('Error loading pause requests:', error)
      alert('حدث خطأ أثناء تحميل طلبات إيقاف الاشتراكات')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm('هل أنت متأكد من الموافقة على طلب إيقاف الاشتراك هذا؟ سيتم إيقاف الاشتراك وحذف الحصص غير المكتملة في فترة الإيقاف.')) return
    
    setProcessingId(id)
    try {
      await approveSubscriptionPauseRequest(id)
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
      await rejectSubscriptionPauseRequest(id, reason || undefined)
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
      await deleteSubscriptionPauseRequest(id)
      await loadRequests()
    } catch (error: any) {
      alert(error.message || 'فشل حذف الطلب')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTabChange = (tab: RequestTypeTab) => {
    setActiveTab(tab)
    setCurrentPage(1)
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-primary-900">طلبات إيقاف الاشتراكات</h1>
        <button
          onClick={loadRequests}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          تحديث
        </button>
      </div>

      {/* Tabs: Pause / Resume */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-2 mb-6 shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('pause')}
            className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'pause'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            طلبات الإيقاف
          </button>
          <button
            onClick={() => handleTabChange('resume')}
            className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'resume'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            طلبات الاستئناف
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-primary-600 bg-white rounded-xl border-2 border-primary-200">
          لا توجد طلبات
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-primary-200 p-6 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    {getStatusBadge(request.status)}
                    <span className="text-sm text-primary-600">
                      {new Date(request.created_at || '').toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4 text-primary-600" />
                        <p className="text-sm text-primary-600">المعلم</p>
                      </div>
                      <p className="font-semibold text-primary-900">{request.teacher?.name}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-primary-600" />
                        <p className="text-sm text-primary-600">الطالب</p>
                      </div>
                      <p className="font-semibold text-primary-900">{request.student?.name}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <p className="text-sm text-primary-600">كود الاشتراك</p>
                      </div>
                      <p className="font-semibold text-primary-900">{request.subscription?.subscription_code}</p>
                    </div>
                  </div>
                  {request.student?.id && (
                    <div className="mb-4 pt-3 border-t border-primary-100">
                      <p className="text-sm font-semibold text-primary-700 mb-2">إجراءات الطالب</p>
                      <StudentAdminActions
                        studentId={request.student.id}
                        student={request.student}
                        hideDeleteActions={false}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-primary-600 mb-1">من تاريخ</p>
                      <p className="font-semibold text-primary-900">{request.pause_from}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-600 mb-1">إلى تاريخ</p>
                      <p className="font-semibold text-primary-900">{request.pause_to}</p>
                    </div>
                  </div>
                  <div className="bg-primary-50 p-3 rounded-lg border border-primary-200 mb-4">
                    <p className="text-sm font-semibold text-primary-700 mb-1">سبب الطلب</p>
                    <p className="text-sm text-primary-900 whitespace-pre-wrap">{request.reason?.trim() || '—'}</p>
                  </div>
                  {request.rejection_reason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
                      <p className="text-sm font-semibold text-red-700 mb-1">سبب الرفض</p>
                      <p className="text-sm text-red-900">{request.rejection_reason}</p>
                    </div>
                  )}
                  {request.approved_by && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
                      <p className="text-sm font-semibold text-green-700 mb-1">تمت الموافقة بواسطة</p>
                      <p className="text-sm text-green-900">{request.approved_by.name} - {request.approved_at}</p>
                    </div>
                  )}
                  {request.rejected_by && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
                      <p className="text-sm font-semibold text-red-700 mb-1">تم الرفض بواسطة</p>
                      <p className="text-sm text-red-900">{request.rejected_by.name} - {request.rejected_at}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id || deletingId === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        موافقة
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id || deletingId === request.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        رفض
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(request.id)}
                    disabled={processingId === request.id || deletingId === request.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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

