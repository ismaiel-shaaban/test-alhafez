'use client'

import { useEffect, useState, useRef } from 'react'
import { Calendar as CalendarIcon, Clock, X, User, GraduationCap, CheckCircle, AlertCircle, Filter, Search, ChevronDown, FileText, Star, Image as ImageIcon, ExternalLink } from 'lucide-react'
import {
  getSessionsByDate,
  listSessions,
  StudentSession,
  SessionReport,
  SessionEvaluation,
  revertSessionToPending,
  updateSession,
  completeSession,
  deleteSession,
  getSessionStatusLabel,
  getSessionStatusBadgeClass,
  type SessionStatusFilter,
  type SessionStatus,
} from '@/lib/api/sessions'
import type { Teacher } from '@/lib/api/teachers'
import { useAdminStore } from '@/store/useAdminStore'
import { motion, AnimatePresence } from 'framer-motion'
import WhatsAppLink from '@/components/admin/WhatsAppLink'

function SessionReportEntry({
  report,
  index,
  onViewImage,
}: {
  report: SessionReport
  index: number
  onViewImage: (url: string) => void
}) {
  return (
    <div className="p-4 sm:p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-primary-600">تقرير #{index + 1}</span>
        <div className="text-sm text-primary-500">
          {report.created_at && (
            <span>إنشاء: {new Date(report.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
          )}
          {report.updated_at && report.updated_at !== report.created_at && (
            <span className="mr-2">تحديث: {new Date(report.updated_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-primary-800 mb-3 font-medium">
        <span>📔 الطالب: {report.student_name ? report.student_name : '-'}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-primary-800 mb-3 font-medium">
        <span>📔 الدرس: {report.session_name ?? '-'}</span>
      </div>
      <div className="space-y-1.5 text-base text-primary-900 mb-2">
        <p className="break-words">
          <span className="text-primary-600 ml-1">📔</span> الحفظ الجديد: {(report.new_memorization?.trim() ?? '') || '-'}
        </p>
        <p className="break-words">
          <span className="text-primary-600 ml-1">📔</span> المراجعة: {(report.review?.trim() ?? '') || '-'}
        </p>
      </div>
      <div className="space-y-1.5 text-base text-primary-900 mb-3">
        <p>
          <span className="text-primary-600 ml-1">📌</span> مستوى الجديد: {report.new_memorization_level_label ?? '-'}
        </p>
        <p>
          <span className="text-primary-600 ml-1">📌</span> مستوى المراجعة: {report.review_level_label ?? '-'}
        </p>
      </div>
      {report.notes && (
        <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
          <p className="text-primary-800 text-base break-words">{report.notes}</p>
        </div>
      )}
      {report.image && (
        <div className="mb-1">
          <p className="text-primary-600 font-medium text-sm mb-2 flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            صورة التقرير
          </p>
          <button
            type="button"
            onClick={() => onViewImage(report.image!)}
            className="block max-w-full text-right"
          >
            <img
              src={report.image}
              alt="صورة التقرير"
              className="max-h-52 w-auto max-w-full rounded-lg border-2 border-primary-200 object-contain cursor-zoom-in hover:border-primary-400 transition-colors"
            />
          </button>
        </div>
      )}
    </div>
  )
}

function SessionReportsPanel({
  title,
  reports,
  headerBgClass,
  onViewImage,
}: {
  title: string
  reports: SessionReport[]
  headerBgClass: string
  onViewImage: (url: string) => void
}) {
  if (!reports.length) return null
  return (
    <div className="border-2 border-primary-200 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 flex items-center gap-2 ${headerBgClass}`}>
        <FileText className="w-6 h-6 text-primary-700" />
        <h3 className="text-lg font-bold text-primary-900">{title} ({reports.length})</h3>
      </div>
      <div className="divide-y divide-primary-200">
        {reports.map((report, idx) => (
          <SessionReportEntry key={report.id} report={report} index={idx} onViewImage={onViewImage} />
        ))}
      </div>
    </div>
  )
}

function getSessionLink(session: StudentSession, teachers: Teacher[]): string | undefined {
  const directLink = session.session_link?.trim() || session.teacher?.session_link?.trim()
  if (directLink) return directLink

  const teacherId = session.teacher_id ?? session.teacher?.id
  if (!teacherId) return undefined

  return teachers.find((teacher) => teacher.id === teacherId)?.session_link?.trim() || undefined
}

export default function SessionsPage() {
  const { teachers, fetchTeachers, getSession } = useAdminStore()
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('')
  const [trialOnlyFilter, setTrialOnlyFilter] = useState(false)
  const [withoutTeacherFilter, setWithoutTeacherFilter] = useState(false)
  const [sessions, setSessions] = useState<StudentSession[]>([])
  const [statistics, setStatistics] = useState<{
    total_sessions: number
    completed_sessions: number
    pending_sessions: number
  } | null>(null)
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [updatingSessionId, setUpdatingSessionId] = useState<number | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  // Custom dropdown states
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false)
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('')
  const teacherDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch teachers on mount
  useEffect(() => {
    fetchTeachers(1, 1000)
  }, [fetchTeachers])

  // Load sessions for selected date, teacher, and status
  useEffect(() => {
    const filterSessionsClient = (sess: StudentSession[]) =>
      sess.filter((s) => {
        if (statusFilter) {
          if (statusFilter === 'completed') {
            if (!s.is_completed && s.status !== 'completed') return false
          } else if (s.status !== statusFilter) {
            return false
          }
        }
        if (trialOnlyFilter && !(s as StudentSession & { is_trial?: boolean | number }).is_trial) {
          return false
        }
        return true
      })

    const computeStatistics = (sess: StudentSession[]) => ({
      total_sessions: sess.length,
      completed_sessions: sess.filter((s) => s.is_completed).length,
      pending_sessions: sess.filter((s) => !s.is_completed && s.status !== 'postponed' && s.status !== 'absence').length,
    })

    const loadSessions = async () => {
      setLoading(true)
      try {
        if (withoutTeacherFilter) {
          const data = await getSessionsByDate(selectedDate, undefined, undefined, undefined, true)
          const sess = filterSessionsClient(data?.sessions || [])
          setSessions(sess)
          setStatistics(computeStatistics(sess))
        } else {
          const teacherId = selectedTeacherId ? parseInt(selectedTeacherId) : undefined
          if (statusFilter || trialOnlyFilter) {
            const response = await listSessions({
              date_from: selectedDate,
              date_to: selectedDate,
              teacher_id: teacherId,
              status: statusFilter || undefined,
              is_trial: trialOnlyFilter ? 1 : undefined,
              per_page: 500,
            })
            const sess = response?.sessions || []
            setSessions(sess)
            setStatistics(computeStatistics(sess))
          } else {
            const data = await getSessionsByDate(selectedDate, undefined, teacherId, undefined)
            setSessions(data?.sessions || [])
            setStatistics(data?.statistics || null)
          }
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
        setSessions([])
        setStatistics(null)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [selectedDate, selectedTeacherId, statusFilter, trialOnlyFilter, withoutTeacherFilter])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target as Node)) {
        setIsTeacherDropdownOpen(false)
        setTeacherSearchTerm('')
      }
    }

    if (isTeacherDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTeacherDropdownOpen])

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacherSearchTerm) return true
    const search = teacherSearchTerm.toLowerCase()
    return (
      teacher.name.toLowerCase().includes(search) ||
      teacher.name_en?.toLowerCase().includes(search) ||
      teacher.specialization.toLowerCase().includes(search) ||
      teacher.specialization_en?.toLowerCase().includes(search)
    )
  })

  // Get selected teacher name
  const selectedTeacher = teachers.find((t) => t.id.toString() === selectedTeacherId)

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId)
    if (teacherId) setWithoutTeacherFilter(false)
    setIsTeacherDropdownOpen(false)
    setTeacherSearchTerm('')
  }

  const handleSessionClick = (session: StudentSession) => {
    setSelectedSession(session)
    setIsModalOpen(true)
  }

  const handleRevertToPending = async (sessionId: number) => {
    if (!confirm('هل أنت متأكد من إرجاع الحصة إلى قيد الانتظار؟')) return
    setUpdatingSessionId(sessionId)
    try {
      await revertSessionToPending(sessionId)
      setSelectedSession((prev) =>
        prev?.id === sessionId ? { ...prev, is_completed: false, status: 'pending', status_label: 'قيد الانتظار' } : prev
      )
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, is_completed: false, status: 'pending', status_label: 'قيد الانتظار' } : s
        )
      )
      setStatistics((prev) =>
        prev ? { ...prev, completed_sessions: prev.completed_sessions - 1, pending_sessions: prev.pending_sessions + 1 } : prev
      )
    } catch (error: any) {
      alert(error.message || 'فشل إرجاع الحصة')
    } finally {
      setUpdatingSessionId(null)
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) return
    setUpdatingSessionId(sessionId)
    try {
      await deleteSession(sessionId)
      setIsModalOpen(false)
      setSelectedSession(null)
      await loadSessionsForDate()
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف الحصة')
    } finally {
      setUpdatingSessionId(null)
    }
  }

  const loadSessionsForDate = async () => {
    const filterSessionsClient = (sess: StudentSession[]) =>
      sess.filter((s) => {
        if (statusFilter) {
          if (statusFilter === 'completed') {
            if (!s.is_completed && s.status !== 'completed') return false
          } else if (s.status !== statusFilter) {
            return false
          }
        }
        if (trialOnlyFilter && !(s as StudentSession & { is_trial?: boolean | number }).is_trial) {
          return false
        }
        return true
      })

    const computeStatistics = (sess: StudentSession[]) => ({
      total_sessions: sess.length,
      completed_sessions: sess.filter((s) => s.is_completed).length,
      pending_sessions: sess.filter((s) => !s.is_completed && s.status !== 'postponed' && s.status !== 'absence').length,
    })

    if (withoutTeacherFilter) {
      const data = await getSessionsByDate(selectedDate, undefined, undefined, undefined, true)
      const sess = filterSessionsClient(data?.sessions || [])
      setSessions(sess)
      setStatistics(computeStatistics(sess))
      return
    }

    const teacherId = selectedTeacherId ? parseInt(selectedTeacherId) : undefined
    if (statusFilter || trialOnlyFilter) {
      const response = await listSessions({
        date_from: selectedDate,
        date_to: selectedDate,
        teacher_id: teacherId,
        status: statusFilter || undefined,
        is_trial: trialOnlyFilter ? 1 : undefined,
        per_page: 500,
      })
      const sess = response?.sessions || []
      setSessions(sess)
      setStatistics(computeStatistics(sess))
    } else {
      const data = await getSessionsByDate(selectedDate, undefined, teacherId, undefined)
      setSessions(data?.sessions || [])
      setStatistics(data?.statistics || null)
    }
  }

  const handleStatusChange = async (sessionId: number, newStatus: SessionStatus) => {
    setUpdatingSessionId(sessionId)
    try {
      const session = sessions.find((s) => s.id === sessionId)
      if (newStatus === 'completed') {
        await completeSession(sessionId)
      } else if (newStatus === 'pending' && session?.is_completed) {
        await revertSessionToPending(sessionId)
      } else {
        await updateSession(sessionId, { status: newStatus } as any)
      }
      const updated = await getSession(sessionId)
      setSelectedSession((prev) => (prev?.id === sessionId ? updated : prev))
      await loadSessionsForDate()
    } catch (error: any) {
      alert(error.message || 'فشل تحديث الحالة')
    } finally {
      setUpdatingSessionId(null)
    }
  }

  return (
    <div className="px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">الحصص اليومية</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Picker */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-6 border-b border-primary-200">
              <h2 className="text-lg sm:text-xl font-bold text-primary-900 mb-4">الفلترة</h2>

              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-primary-900 font-semibold mb-2 text-right">التاريخ</label>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-primary-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-primary-900"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-primary-900 font-semibold mb-2 text-right">الحالة</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SessionStatusFilter)}
                  className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-primary-900 bg-white"
                  dir="rtl"
                >
                  <option value="">جميع الحالات</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="completed">مكتملة</option>
                  <option value="postponed">مؤجلة</option>
                  <option value="absence">غياب</option>
                </select>
              </div>

              {/* Trial Sessions Filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer justify-end" dir="rtl">
                  <span className="text-primary-900 font-semibold">حصص التجربة فقط</span>
                  <input
                    type="checkbox"
                    checked={trialOnlyFilter}
                    onChange={(e) => setTrialOnlyFilter(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>
              </div>

              {/* Without Teacher Filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer justify-end" dir="rtl">
                  <span className="text-primary-900 font-semibold">بدون معلم</span>
                  <input
                    type="checkbox"
                    checked={withoutTeacherFilter}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setWithoutTeacherFilter(checked)
                      if (checked) setSelectedTeacherId('')
                    }}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>
              </div>

              {/* Teacher Filter */}
              <div>
                <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم</label>
                <div className="relative" ref={teacherDropdownRef}>
                  <button
                    type="button"
                    onClick={() => !withoutTeacherFilter && setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                    disabled={withoutTeacherFilter}
                    className={`w-full flex items-center gap-3 px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-primary-900 bg-white transition-colors ${
                      withoutTeacherFilter ? 'opacity-50 cursor-not-allowed bg-primary-50' : 'hover:bg-primary-50'
                    }`}
                    dir="rtl"
                  >
                    <Filter className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <span className="flex-1 text-right">
                      {withoutTeacherFilter ? 'بدون معلم' : selectedTeacher ? selectedTeacher.name : 'جميع المعلمين'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-primary-600 flex-shrink-0 transition-transform ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isTeacherDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-200 rounded-lg shadow-xl max-h-64 overflow-hidden"
                        dir="rtl"
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b border-primary-200">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                            <input
                              type="text"
                              value={teacherSearchTerm}
                              onChange={(e) => setTeacherSearchTerm(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="ابحث عن معلم..."
                              className="w-full pr-10 pl-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm text-right"
                              dir="rtl"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-48 overflow-y-auto">
                          {/* All Teachers Option */}
                          <button
                            type="button"
                            onClick={() => handleTeacherSelect('')}
                            className={`w-full px-4 py-2 text-right hover:bg-primary-50 transition-colors ${selectedTeacherId === '' ? 'bg-primary-100 text-primary-900 font-semibold' : 'text-primary-700'
                              }`}
                          >
                            جميع المعلمين
                          </button>

                          {/* Filtered Teachers */}
                          {filteredTeachers.length === 0 ? (
                            <div className="px-4 py-8 text-center text-primary-600 text-sm">
                              لا توجد نتائج
                            </div>
                          ) : (
                            filteredTeachers.map((teacher) => (
                              <button
                                key={teacher.id}
                                type="button"
                                onClick={() => handleTeacherSelect(teacher.id.toString())}
                                className={`w-full px-4 py-2 text-right hover:bg-primary-50 transition-colors ${selectedTeacherId === teacher.id.toString()
                                    ? 'bg-primary-100 text-primary-900 font-semibold'
                                    : 'text-primary-700'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{teacher.name}</span>
                                  {teacher.specialization && (
                                    <span className="text-xs text-primary-500 mr-2">{teacher.specialization}</span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="p-4 sm:p-6 space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-primary-900 mb-3">إحصائيات اليوم</h3>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-blue-700 text-xs sm:text-sm mb-1">إجمالي الحصص</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">{statistics.total_sessions}</div>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                  <div className="text-green-700 text-xs sm:text-sm mb-1">الحصص المكتملة</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-900">{statistics.completed_sessions}</div>
                </div>
                <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-2 border-yellow-200">
                  <div className="text-yellow-700 text-xs sm:text-sm mb-1">الحصص قيد الانتظار</div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-900">{statistics.pending_sessions}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-6 border-b border-primary-200">
              <h2 className="text-lg sm:text-xl font-bold text-primary-900">
                الحصص في {new Date(selectedDate).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h2>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="text-center py-8 sm:py-12 text-primary-600">
                  <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm sm:text-base">جاري تحميل الحصص...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-primary-600">
                  <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-primary-300" />
                  <p className="text-base sm:text-lg">لا توجد حصص في هذا التاريخ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session, index) => {
                    const sessionLink = getSessionLink(session, teachers)
                    return (
                    <div
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className="bg-primary-50 p-3 sm:p-4 rounded-lg border-2 border-primary-200 hover:bg-primary-100 hover:border-primary-300 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                            <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-600 text-white font-bold text-base sm:text-lg flex-shrink-0">
                              {session.session_number != null && session.session_number !== ''
                                ? session.session_number
                                : index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 gap-y-1">
                                <span className="text-base sm:text-lg font-bold text-primary-900">{session.session_time || '—'}</span>
                                {session.session_number != null && session.session_number !== '' && (
                                  <span className="text-xs sm:text-sm font-medium text-primary-700 bg-white/80 px-2 py-0.5 rounded-full border border-primary-200">
                                    رقم الحصة: {session.session_number}
                                  </span>
                                )}
                                {session.subscription_month_number != null && session.subscription_month_number !== '' && (
                                  <span className="text-xs sm:text-sm font-medium text-primary-700 bg-white/80 px-2 py-0.5 rounded-full border border-primary-200">
                                    رقم الشهر: {session.subscription_month_number}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-primary-600">{session.day_of_week_label || session.day_of_week}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-primary-700 font-medium">الطالب:</span>
                              <span className="text-xs sm:text-sm text-primary-900 break-words inline-flex items-center gap-1">
                                {session.student?.name || '-'}
                                <WhatsAppLink phone={session.student?.phone} country={session.student?.country} stopPropagation />
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <GraduationCap className="w-4 h-4 text-primary-600 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-primary-700 font-medium">المعلم:</span>
                              <span className="text-xs sm:text-sm text-primary-900 break-words inline-flex items-center gap-1">
                                {session.teacher?.name || '-'}
                                <WhatsAppLink phone={session.teacher?.phone} stopPropagation />
                              </span>
                            </div>
                            {sessionLink && (
                              <div className="flex items-center gap-2 flex-wrap sm:col-span-2">
                                <ExternalLink className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-primary-700 font-medium">رابط الحلقة:</span>
                                <a
                                  href={sessionLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 underline break-all"
                                >
                                  {sessionLink}
                                </a>
                              </div>
                            )}
                            {(session as any).student_joined_at && (
                              <div className="flex items-center gap-2 flex-wrap sm:col-span-2">
                                <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-primary-700 font-medium">دخول الطالب:</span>
                                <span className="text-xs sm:text-sm text-primary-900">{new Date((session as any).student_joined_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </div>

                          {session.notes && (
                            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-primary-600 bg-white p-2 rounded border border-primary-200">
                              <span className="font-medium">ملاحظات:</span> {session.notes}
                            </div>
                          )}
                          {session.reports && session.reports.length > 0 && (
                            <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs sm:text-sm text-primary-600">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{session.reports.length} تقرير</span>
                            </div>
                          )}
                          {session.previous_reports && session.previous_reports.length > 0 && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{session.previous_reports.length} تقرير سابق</span>
                            </div>
                          )}
                          {session.evaluation && (
                            <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs sm:text-sm text-amber-600">
                              <Star className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>تقييم الطالب</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 ${getSessionStatusBadgeClass(session)}`}
                          >
                            {session.is_completed || session.status === 'completed' ? (
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span className="whitespace-nowrap">{getSessionStatusLabel(session)}</span>
                          </span>
                          {session.new_date && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded whitespace-nowrap">
                              مؤجلة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل الحصة</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <X className="w-5 h-5 text-primary-700" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Student session # + subscription month (للطالب فقط) */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary-600 text-white font-bold text-xl sm:text-2xl" title="رقم حصة الطالب">
                    {selectedSession.session_number != null && selectedSession.session_number !== ''
                      ? selectedSession.session_number
                      : '-'}
                  </span>
                  <div className="flex flex-wrap justify-center gap-2 text-sm">
                    {selectedSession.session_number != null && selectedSession.session_number !== '' && (
                      <span className="bg-primary-100 text-primary-900 px-3 py-1 rounded-lg font-medium">
                        رقم الحصة: {selectedSession.session_number}
                      </span>
                    )}
                    {selectedSession.subscription_month_number != null && selectedSession.subscription_month_number !== '' && (
                      <span className="bg-primary-100 text-primary-900 px-3 py-1 rounded-lg font-medium">
                        رقم الشهر: {selectedSession.subscription_month_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    <h3 className="text-sm sm:text-base font-semibold text-primary-900">الطالب</h3>
                  </div>
                  <p className="text-sm sm:text-base text-primary-700 break-words inline-flex items-center gap-1.5">
                    {selectedSession.student?.name || '-'}
                    <WhatsAppLink phone={selectedSession.student?.phone} country={selectedSession.student?.country} />
                  </p>
                </div>

                {/* Teacher Info */}
                <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    <h3 className="text-sm sm:text-base font-semibold text-primary-900">المعلم</h3>
                  </div>
                  <p className="text-sm sm:text-base text-primary-700 break-words inline-flex items-center gap-1.5">
                    {selectedSession.teacher?.name || '-'}
                    <WhatsAppLink phone={selectedSession.teacher?.phone} />
                  </p>
                  {(() => {
                    const sessionLink = getSessionLink(selectedSession, teachers)
                    if (!sessionLink) return null
                    return (
                      <a
                        href={sessionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 underline break-all"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        {sessionLink}
                      </a>
                    )
                  })()}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                      <h3 className="text-sm sm:text-base font-semibold text-primary-900">التاريخ</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-primary-700">
                      {new Date(selectedSession.session_date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      {selectedSession.day_of_week_label || selectedSession.day_of_week}
                    </p>
                  </div>

                  <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                      <h3 className="text-sm sm:text-base font-semibold text-primary-900">الوقت</h3>
                    </div>
                    <p className="text-sm sm:text-base text-primary-700">{selectedSession.session_time}</p>
                  </div>
                </div>

                {/* Teacher entry time (وقت دخول المعلم) */}
                <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-sm sm:text-base font-semibold text-primary-900 mb-2">وقت دخول المعلم</h3>
                  <p className="text-sm sm:text-base text-primary-700">{selectedSession?.start_time ?? '-'}</p>
                </div>

                {/* Student joined time (وقت دخول الطالب) */}

                  <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-sm sm:text-base font-semibold text-primary-900 mb-2">وقت دخول الطالب</h3>
                    <p className="text-sm sm:text-base text-primary-700">
                    {selectedSession?.student_joined_at ?? '-'}
                    </p>
                  </div>
               

                {/* Status */}
                <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-sm sm:text-base font-semibold text-primary-900 mb-2">الحالة</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedSession.status || (selectedSession.is_completed ? 'completed' : 'pending')}
                      onChange={(e) => handleStatusChange(selectedSession.id, e.target.value as SessionStatus)}
                      disabled={updatingSessionId === selectedSession.id}
                      className="px-3 py-1.5 border-2 border-primary-300 rounded-lg focus:border-primary-500 outline-none text-sm font-medium disabled:opacity-50"
                      dir="rtl"
                    >
                     {selectedSession.status == 'pending' && <option value="pending">قيد الانتظار</option>}
                      <option value="completed">مكتملة</option>
                      {selectedSession.status == 'postponed' && <option value="postponed">مؤجلة</option>}
                      <option value="absence">غياب</option>
                    </select>
                    {selectedSession.is_completed && (
                      <button
                        onClick={() => handleRevertToPending(selectedSession.id)}
                        disabled={updatingSessionId === selectedSession.id}
                        className="px-3 py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {updatingSessionId === selectedSession.id ? 'جاري...' : 'إرجاع قيد الانتظار'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSession(selectedSession.id)}
                      disabled={updatingSessionId === selectedSession.id}
                      className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {updatingSessionId === selectedSession.id ? 'جاري...' : 'حذف'}
                    </button>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getSessionStatusBadgeClass(selectedSession)}`}
                  >
                    {getSessionStatusLabel(selectedSession)}
                  </span>
                  {selectedSession.completed_at && (
                    <p className="text-xs sm:text-sm text-primary-600 mt-2">
                      تم الإكمال في: {new Date(selectedSession.completed_at).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>

                {/* Rescheduled Info */}
                {selectedSession.new_date && (
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-2 border-yellow-200">
                    <h3 className="text-sm sm:text-base font-semibold text-primary-900 mb-2">تم تأجيل الحصة</h3>
                    <p className="text-xs sm:text-sm text-primary-700">
                      التاريخ الجديد: {new Date(selectedSession.new_date).toLocaleDateString('ar-EG')}
                    </p>
                    {selectedSession.new_time && (
                      <p className="text-xs sm:text-sm text-primary-700">الوقت الجديد: {selectedSession.new_time}</p>
                    )}
                    {selectedSession.reason && (
                      <p className="text-xs sm:text-sm text-primary-700 mt-2 break-words">السبب: {selectedSession.reason}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedSession.notes && (
                  <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-sm sm:text-base font-semibold text-primary-900 mb-2">ملاحظات</h3>
                    <p className="text-xs sm:text-sm text-primary-700 break-words">{selectedSession.notes}</p>
                  </div>
                )}

                {/* Student Evaluation */}
                {selectedSession.evaluation && (
                  <div className="border-2 border-amber-200 rounded-xl overflow-hidden bg-amber-50/50">
                    <div className="bg-amber-100 px-4 py-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-700" />
                      <h3 className="text-base font-bold text-primary-900">تقييم الطالب</h3>
                      {selectedSession.evaluation.created_at && (
                        <span className="mr-auto text-xs text-amber-700">
                          {new Date(selectedSession.evaluation.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {selectedSession.evaluation.satisfaction_level_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">مستوى الرضا</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.satisfaction_level_label}</p>
                          </div>
                        )}
                        {selectedSession.evaluation.student_progress_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">تقدم الطالب</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.student_progress_label}</p>
                          </div>
                        )}
                        {selectedSession.evaluation.noise_in_session_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">ضجيج في الحصة</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.noise_in_session_label}</p>
                          </div>
                        )}
                        {selectedSession.evaluation.internet_quality_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">جودة الإنترنت</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.internet_quality_label}</p>
                          </div>
                        )}
                        {selectedSession.evaluation.teacher_camera_on_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">كاميرا المعلم</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.teacher_camera_on_label}</p>
                          </div>
                        )}
                        {selectedSession.evaluation.screen_sharing_on_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">مشاركة الشاشة</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.screen_sharing_on_label}</p>
                          </div>
                        )}
                        {selectedSession.evaluation.would_recommend_label && (
                          <div>
                            <p className="text-primary-600 font-medium mb-0.5">هل تنصح بالأكاديمية</p>
                            <p className="text-primary-900 font-medium">{selectedSession.evaluation.would_recommend_label}</p>
                          </div>
                        )}
                      </div>
                      {selectedSession.evaluation.academy_advantages && (
                        <div className="p-2 bg-white rounded-lg border border-amber-200">
                          <p className="text-primary-600 font-medium text-xs mb-0.5">مميزات الأكاديمية</p>
                          <p className="text-primary-800 text-sm break-words">{selectedSession.evaluation.academy_advantages}</p>
                        </div>
                      )}
                      {selectedSession.evaluation.notes && (
                        <div className="p-2 bg-white rounded-lg border border-amber-200">
                          <p className="text-primary-600 font-medium text-xs mb-0.5">ملاحظات</p>
                          <p className="text-primary-800 text-sm break-words">{selectedSession.evaluation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedSession.reports && selectedSession.reports.length > 0 && (
                  <SessionReportsPanel
                    title="تقارير الحصة"
                    reports={selectedSession.reports}
                    headerBgClass="bg-primary-100"
                    onViewImage={setViewingImage}
                  />
                )}

                {selectedSession.previous_reports && selectedSession.previous_reports.length > 0 && (
                  <SessionReportsPanel
                    title="تقارير الحصص السابقة"
                    reports={selectedSession.previous_reports}
                    headerBgClass="bg-slate-100"
                    onViewImage={setViewingImage}
                  />
                )}

                {/* Created At */}
                {selectedSession.created_at && (
                  <div className="text-xs sm:text-sm text-primary-600">
                    تم الإنشاء: {new Date(selectedSession.created_at).toLocaleString('ar-EG')}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setViewingImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="absolute -top-10 left-0 p-2 text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={viewingImage}
                alt="صورة التقرير"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl mx-auto"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
