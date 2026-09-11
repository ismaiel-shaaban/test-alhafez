'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  RefreshCw,
  User,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Phone,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import { getComplaints, updateComplaint, Complaint, ComplaintType, ComplaintStatus } from '@/lib/api/complaints'
import { getSessionEvaluations, SessionEvaluation } from '@/lib/api/session-evaluations'
import { Pagination } from '@/lib/api-client'
import { useAdminStore } from '@/store/useAdminStore'
import SearchableStudentSelect from '@/components/admin/SearchableStudentSelect'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import { Star, MessageSquareReply, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

const COMPLAINT_TYPE_OPTIONS: { value: ComplaintType; label: string }[] = [
  { value: 'student', label: 'شكاوى الطلاب' },
  { value: 'teacher', label: 'شكاوى المعلمين' },
]

const SATISFACTION_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'جميع المستويات' },
  { value: 'excellent', label: 'ممتاز جداً' },
  { value: 'very_good', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'average', label: 'متوسط' },
  { value: 'bad', label: 'سيء' },
]

type MainTab = ComplaintType | 'evaluations'

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلق' },
]

export default function ComplaintsPage() {
  const { students, fetchStudents, teachers, fetchTeachers } = useAdminStore()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [evaluations, setEvaluations] = useState<SessionEvaluation[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('student')
  const [filters, setFilters] = useState<{
    status: ComplaintStatus | ''
    student_id: string
    teacher_id: string
  }>({
    status: '',
    student_id: '',
    teacher_id: '',
  })
  const [evalFilters, setEvalFilters] = useState<{
    student_id: string
    satisfaction_level: string
    date_from: string
    date_to: string
  }>({
    student_id: '',
    satisfaction_level: '',
    date_from: '',
    date_to: '',
  })
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedComplaintForResponse, setSelectedComplaintForResponse] = useState<Complaint | null>(null)
  const [responseForm, setResponseForm] = useState<{ status: ComplaintStatus; admin_response: string }>({
    status: 'pending',
    admin_response: '',
  })
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)

  useEffect(() => {
    fetchTeachers(1, 1000)
    fetchStudents({ per_page: 10000, page: 1 })
  }, [fetchTeachers, fetchStudents])

  useEffect(() => {
    if (activeTab === 'evaluations') {
      loadEvaluations()
    } else {
      loadComplaints()
    }
  }, [activeTab, currentPage, filters.status, filters.student_id, filters.teacher_id, evalFilters.student_id, evalFilters.satisfaction_level, evalFilters.date_from, evalFilters.date_to])

  const loadComplaints = async () => {
    if (activeTab === 'evaluations') return
    setLoading(true)
    try {
      const apiFilters: any = {
        complaint_type: activeTab,
        page: currentPage,
        per_page: 15,
      }
      if (filters.status) apiFilters.status = filters.status
      if (filters.student_id) apiFilters.student_id = parseInt(filters.student_id)
      if (filters.teacher_id) apiFilters.teacher_id = parseInt(filters.teacher_id)

      const data = await getComplaints(apiFilters)
      setComplaints(data?.complaints || [])
      setPagination(data?.pagination || null)
    } catch (error) {
      console.error('Error loading complaints:', error)
      setComplaints([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const loadEvaluations = async () => {
    if (activeTab !== 'evaluations') return
    setLoading(true)
    try {
      const apiFilters: any = {
        page: currentPage,
        per_page: 15,
      }
      if (evalFilters.student_id) apiFilters.student_id = parseInt(evalFilters.student_id)
      if (evalFilters.satisfaction_level) apiFilters.satisfaction_level = evalFilters.satisfaction_level
      if (evalFilters.date_from) apiFilters.date_from = evalFilters.date_from
      if (evalFilters.date_to) apiFilters.date_to = evalFilters.date_to

      const data = await getSessionEvaluations(apiFilters)
      setEvaluations(data?.evaluations || [])
      setPagination(data?.pagination || null)
    } catch (error) {
      console.error('Error loading evaluations:', error)
      setEvaluations([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenResponseModal = (complaint: Complaint) => {
    setSelectedComplaintForResponse(complaint)
    setResponseForm({
      status: (complaint.status as ComplaintStatus) || 'pending',
      admin_response: complaint.admin_response || '',
    })
    setShowResponseModal(true)
  }

  const handleCloseResponseModal = () => {
    setShowResponseModal(false)
    setSelectedComplaintForResponse(null)
    setResponseForm({ status: 'pending', admin_response: '' })
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplaintForResponse) return
    setIsSubmittingResponse(true)
    try {
      await updateComplaint(selectedComplaintForResponse.id, {
        status: responseForm.status,
        admin_response: responseForm.admin_response || null,
      })
      handleCloseResponseModal()
      loadComplaints()
    } catch (error: any) {
      alert(error.message || 'فشل تحديث الشكوى')
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            قيد الانتظار
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            قيد المعالجة
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            تم الحل
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            مغلق
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-800 rounded-lg text-xs font-semibold">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 flex items-center gap-2">
          <AlertCircle className="w-8 h-8 sm:w-9 sm:h-9 text-primary-600" />
          الشكاوى
        </h1>
        <button
          onClick={() => activeTab === 'evaluations' ? loadEvaluations() : loadComplaints()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
        >
          <RefreshCw className="w-5 h-5" />
          تحديث
        </button>
      </div>

      {/* Tabs: Student / Teacher / Evaluations */}
      <div className="flex flex-wrap gap-2 mb-6">
        {COMPLAINT_TYPE_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value)
              setCurrentPage(1)
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === tab.value
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white border-2 border-primary-200 text-primary-700 hover:border-primary-400'
            }`}
          >
            {tab.value === 'student' ? (
              <User className="w-5 h-5" />
            ) : (
              <GraduationCap className="w-5 h-5" />
            )}
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => {
            setActiveTab('evaluations')
            setCurrentPage(1)
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            activeTab === 'evaluations'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white border-2 border-primary-200 text-primary-700 hover:border-primary-400'
          }`}
        >
          <Star className="w-5 h-5" />
          تقييمات الطلاب
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg">
        {activeTab === 'evaluations' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">الطالب</label>
              <SearchableStudentSelect
                value={evalFilters.student_id}
                onChange={(value) => {
                  setEvalFilters({ ...evalFilters, student_id: value })
                  setCurrentPage(1)
                }}
                students={students}
                placeholder="جميع الطلاب"
              />
            </div>
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">مستوى الرضا</label>
              <select
                value={evalFilters.satisfaction_level}
                onChange={(e) => {
                  setEvalFilters({ ...evalFilters, satisfaction_level: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              >
                {SATISFACTION_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">من تاريخ</label>
              <input
                type="date"
                value={evalFilters.date_from}
                onChange={(e) => {
                  setEvalFilters({ ...evalFilters, date_from: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">إلى تاريخ</label>
              <input
                type="date"
                value={evalFilters.date_to}
                onChange={(e) => {
                  setEvalFilters({ ...evalFilters, date_to: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value as ComplaintStatus | '' })
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              >
                <option value="">جميع الحالات</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'student' && (
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
            )}
            {activeTab === 'teacher' && (
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
            )}
          </div>
        )}
      </div>

      {/* Evaluations List */}
      {activeTab === 'evaluations' && (
        loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-primary-600 bg-white rounded-xl border-2 border-primary-200 px-4">
            لا توجد تقييمات
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map((ev) => {
              const studentFromStore = students.find((s) => s.id === ev.student_id)
              const studentName = ev.student?.name ?? studentFromStore?.name
              const studentPhone = ev.student?.phone ?? studentFromStore?.phone
              const teacherFromStore =
                ev.teacher_id != null ? teachers.find((t) => t.id === ev.teacher_id) : undefined
              const teacherName = ev.teacher?.name ?? teacherFromStore?.name
              const teacherPhone = ev.teacher?.phone
              const shortQuestions: { num: string; label: string; value: string | null | undefined }[] = [
                { num: '١', label: 'مستوى الرضا عن الدروس', value: ev.satisfaction_level_label },
                { num: '٢', label: 'تقدم مستوى الطالب', value: ev.student_progress_label },
                { num: '٣', label: 'ضوضاء في الحصة', value: ev.noise_in_session_label },
                { num: '٤', label: 'جودة الإنترنت', value: ev.internet_quality_label },
                { num: '٥', label: 'فتح الكاميرا من المعلم في الحصة', value: ev.teacher_camera_on_label },
                { num: '٦', label: 'مشاركة الشاشة (شير الشاشة)', value: ev.screen_sharing_on_label },
              ]
              return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="group relative overflow-hidden rounded-2xl border border-primary-200/70 bg-white shadow-md shadow-primary-900/[0.06] transition-all duration-300 hover:border-primary-300/80 hover:shadow-lg hover:shadow-primary-900/[0.08]"
              >
                <div className="h-1.5 bg-gradient-to-l from-primary-600 via-primary-400 to-emerald-500" aria-hidden />
                <div className="p-4 sm:p-6" dir="rtl">
                  <div className="mb-5 flex flex-col gap-3 border-b border-primary-100/90 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {ev.is_monthly_subscription_evaluation && ev.evaluation_period ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
                          <Star className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                          تقييم شهري · {ev.evaluation_period}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 ring-1 ring-primary-200/70">
                          <ClipboardList className="h-3.5 w-3.5 text-primary-600" aria-hidden />
                          تقييم حصة
                        </span>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-primary-700">
                      <Calendar className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                      <span className="font-medium tabular-nums">
                        {ev.created_at
                          ? new Date(ev.created_at).toLocaleString('ar-EG', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="relative overflow-hidden rounded-xl border border-primary-100/90 bg-gradient-to-br from-primary-50/90 via-white to-white p-4 shadow-sm ring-1 ring-primary-900/[0.03]">
                      <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary-200/25 blur-2xl" aria-hidden />
                      <div className="relative flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 shadow-inner shadow-primary-900/5">
                          <User className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <p className="text-xs font-bold tracking-wide text-primary-600/90">الطالب</p>
                          <p className="truncate text-lg font-bold text-primary-950">
                            {studentName ? studentName : <span className="text-primary-400">—</span>}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-primary-600">الهاتف</span>
                            {studentPhone ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-sm font-semibold text-primary-900 shadow-sm ring-1 ring-primary-200/60"
                                dir="ltr"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0 text-primary-500" aria-hidden />
                                {studentPhone}
                              </span>
                            ) : (
                              <span className="text-sm text-primary-400">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 shadow-sm ring-1 ring-emerald-900/[0.03]">
                      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-200/20 blur-2xl" aria-hidden />
                      <div className="relative flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-inner shadow-emerald-900/5">
                          <GraduationCap className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <p className="text-xs font-bold tracking-wide text-emerald-700/90">المعلم</p>
                          <p className="truncate text-lg font-bold text-emerald-950">
                            {teacherName ? teacherName : <span className="text-emerald-400/80">—</span>}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-emerald-700">الهاتف</span>
                            {teacherPhone ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-sm font-semibold text-emerald-950 shadow-sm ring-1 ring-emerald-200/70"
                                dir="ltr"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                                {teacherPhone}
                              </span>
                            ) : (
                              <span className="text-sm text-emerald-400/90">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-b from-slate-50/80 to-transparent p-1 sm:p-2">
                    <h3 className="mb-4 flex items-center gap-2 px-1 text-base font-bold text-primary-950">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                        <ClipboardList className="h-4 w-4" aria-hidden />
                      </span>
                      أسئلة التقييم
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {shortQuestions.map((q) => (
                        <div
                          key={q.num}
                          className="flex gap-3 rounded-xl border border-primary-100/70 bg-white/90 p-3.5 shadow-sm transition-colors hover:border-primary-200 hover:bg-white"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-800">
                            {q.num}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs leading-snug text-primary-600">{q.label}</p>
                            <p className="text-sm font-semibold leading-relaxed text-primary-950">{q.value ?? '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 space-y-3">
                      <div className="rounded-xl border border-primary-100/80 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-800">
                            ٧
                          </span>
                          <p className="text-sm font-semibold text-primary-800">مميزات الأكاديمية</p>
                        </div>
                        <p className="whitespace-pre-wrap pr-1 text-sm leading-relaxed text-primary-900 sm:pr-10">
                          {ev.academy_advantages?.trim() ? ev.academy_advantages : '—'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-100/80 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-800">
                            ٨
                          </span>
                          <p className="text-sm font-semibold text-primary-800">ملاحظات على الأكاديمية / المعلم</p>
                        </div>
                        <p className="whitespace-pre-wrap pr-1 text-sm leading-relaxed text-primary-900 sm:pr-10">
                          {ev.notes?.trim() ? ev.notes : '—'}
                        </p>
                      </div>
                      <div className="flex gap-3 rounded-xl border border-primary-100/70 bg-gradient-to-l from-primary-50/50 to-white p-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-800">
                          ٩
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs text-primary-600">بترشحونا للناس</p>
                          <p className="text-sm font-bold text-primary-950">{ev.would_recommend_label ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              )
            })}
          </div>
        )
      )}

      {/* Complaints List */}
      {activeTab !== 'evaluations' && (loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-primary-600 bg-white rounded-xl border-2 border-primary-200 px-4">
          لا توجد شكاوى
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {complaint.complaint_type_label && (
                    <span className="px-2.5 py-1 bg-primary-100 text-primary-800 rounded-lg text-xs font-semibold">
                      {complaint.complaint_type_label}
                    </span>
                  )}
                  {getStatusBadge(complaint.status)}
                  <span className="text-xs sm:text-sm text-primary-600">
                    {complaint.created_at
                      ? new Date(complaint.created_at).toLocaleString('ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '-'}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">{complaint.subject}</h3>
              <p className="text-primary-700 text-sm mb-4 whitespace-pre-wrap">{complaint.message}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                {complaint.complaint_type === 'teacher' && complaint.teacher && (
                  <div>
                    <p className="text-primary-600 mb-0.5">المعلم (المُشتكي)</p>
                    <p className="font-semibold text-primary-900">{complaint.teacher.name}</p>
                  </div>
                )}
                {complaint.complaint_type === 'student' && complaint.student && (
                  <div>
                    <p className="text-primary-600 mb-0.5">الطالب (المُشتكي)</p>
                    <p className="font-semibold text-primary-900">{complaint.student.name}</p>
                  </div>
                )}
                {complaint.against_student && (
                  <div>
                    <p className="text-primary-600 mb-0.5">ضد الطالب</p>
                    <p className="font-semibold text-primary-900">{complaint.against_student.name}</p>
                  </div>
                )}
                {complaint.against_teacher && (
                  <div>
                    <p className="text-primary-600 mb-0.5">ضد المعلم</p>
                    <p className="font-semibold text-primary-900">{complaint.against_teacher.name}</p>
                  </div>
                )}
              </div>
              {complaint.admin_response && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-xs font-semibold text-primary-700 mb-1">رد الإدارة</p>
                  <p className="text-sm text-primary-800 whitespace-pre-wrap">{complaint.admin_response}</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-primary-200">
                <button
                  type="button"
                  onClick={() => handleOpenResponseModal(complaint)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <MessageSquareReply className="w-4 h-4" />
                  رد / تحديث
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ))}

      {/* Response / Update Complaint Modal */}
      <AnimatePresence>
        {showResponseModal && selectedComplaintForResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseResponseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary-900">رد على الشكوى / تحديث الحالة</h2>
                <button
                  type="button"
                  onClick={handleCloseResponseModal}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-primary-700 text-sm mb-4">الشكوى: {selectedComplaintForResponse.subject}</p>
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الحالة</label>
                  <select
                    value={responseForm.status}
                    onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value as ComplaintStatus })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">رد الإدارة</label>
                  <textarea
                    value={responseForm.admin_response}
                    onChange={(e) => setResponseForm({ ...responseForm, admin_response: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="اكتب رد الإدارة..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingResponse}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isSubmittingResponse ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseResponseModal}
                    className="flex-1 px-4 py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border-2 border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-primary-700">
            {currentPage} / {pagination.total_pages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
            disabled={currentPage >= pagination.total_pages}
            className="p-2 rounded-lg border-2 border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
