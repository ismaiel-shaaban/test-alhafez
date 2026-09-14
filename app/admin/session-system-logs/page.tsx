'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Search, User, GraduationCap, UserCog, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import {
  listSessionSystemLogs,
  approveSessionSystemLog,
  rejectSessionSystemLog,
  type SessionSystemLog,
  type SessionSystemLogStatus,
} from '@/lib/api/session-system-logs'
import type { Pagination } from '@/lib/api-client'
import { useAdminStore } from '@/store/useAdminStore'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import StudentAdminActions from '@/components/admin/StudentAdminActions'

const SESSION_SYSTEM_LOGS_PER_PAGE = 20

const WEEKDAY_AR: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
}

const SESSION_FIELD_LABELS: Record<string, string> = {
  weekly_days: 'أيام الأسبوع',
  weekly_schedule: 'الجدول الأسبوعي',
  weekly_sessions: 'عدد الحصص الأسبوعية',
  monthly_sessions: 'عدد الحصص الشهرية',
  session_duration: 'مدة الحصة',
  time: 'الوقت',
  id: 'المعرّف',
  student_id: 'معرّف الطالب',
  teacher_id: 'معرّف المعلم',
  changed_by_user_id: 'معرّف من نفّذ التغيير',
  student: 'الطالب',
  teacher: 'المعلم',
  changed_by_user: 'من نفّذ التغيير',
  old_values: 'القيم السابقة',
  new_values: 'القيم الجديدة',
  created_at: 'تاريخ الإنشاء',
  name: 'الاسم',
}

function labelForKey(key: string): string {
  return SESSION_FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
}

function formatDayToken(token: string): string {
  return WEEKDAY_AR[token.toLowerCase()] ?? token
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isScheduleSlot(o: Record<string, unknown>): boolean {
  return 'time' in o && Object.keys(o).every((k) => ['time', 'session_duration'].includes(k))
}

function formatScalar(v: unknown): ReactNode {
  if (v === null || v === undefined) {
    return <span className="text-primary-500 italic">غير محدد</span>
  }
  if (typeof v === 'boolean') {
    return v ? 'نعم' : 'لا'
  }
  if (typeof v === 'number') {
    return <span dir="ltr" className="tabular-nums inline-block">{v}</span>
  }
  if (typeof v === 'string') {
    return <span dir="auto" className="break-words">{v}</span>
  }
  return String(v)
}

function SessionLogValuesView({ values }: { values: Record<string, unknown> | null | undefined }) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return <p className="p-3 text-sm text-primary-600 text-right">—</p>
  }
  const keys = Object.keys(values)
  if (keys.length === 0) {
    return <p className="p-3 text-sm text-primary-600 text-right">—</p>
  }

  const preferredOrder = [
    'weekly_days',
    'weekly_schedule',
    'weekly_sessions',
    'monthly_sessions',
    'session_duration',
    'student',
    'teacher',
    'changed_by_user',
    'id',
    'student_id',
    'teacher_id',
    'changed_by_user_id',
    'created_at',
  ]
  const orderedKeys = [
    ...preferredOrder.filter((k) => k in values),
    ...keys.filter((k) => !preferredOrder.includes(k)).sort(),
  ]

  const renderNested = (val: unknown, depth: number): ReactNode => {
    if (val === null || val === undefined) {
      return <span className="text-primary-500 italic text-sm">غير محدد</span>
    }
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return <span className="text-primary-500 italic text-sm">لا يوجد</span>
      }
      if (val.every((x) => typeof x === 'string')) {
        return (
          <ul className="flex flex-wrap gap-1.5 justify-end list-none m-0 p-0">
            {(val as string[]).map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="px-2 py-0.5 rounded-md bg-white/80 border border-primary-200 text-xs font-medium text-primary-900"
              >
                {formatDayToken(item)}
              </li>
            ))}
          </ul>
        )
      }
      return (
        <ul className="space-y-1 text-sm text-right list-disc list-inside marker:text-primary-400">
          {val.map((item, i) => (
            <li key={i} className="break-words">
              {renderNested(item, depth + 1)}
            </li>
          ))}
        </ul>
      )
    }
    if (isPlainObject(val)) {
      if (isScheduleSlot(val)) {
        const dur = val.session_duration
        return (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-end text-sm">
            <span>
              <span className="text-primary-600 text-xs ms-1">الوقت</span>{' '}
              <span dir="ltr" className="font-mono tabular-nums font-semibold text-primary-900">
                {String(val.time ?? '—')}
              </span>
            </span>
            <span className="text-primary-300 hidden sm:inline">|</span>
            <span>
              <span className="text-primary-600 text-xs ms-1">المدة</span>{' '}
              <span dir="ltr" className="tabular-nums font-semibold text-primary-900">
                {dur != null ? `${dur} دقيقة` : '—'}
              </span>
            </span>
          </div>
        )
      }
      const refName = typeof val.name === 'string' ? val.name : null
      const refId = typeof val.id === 'number' ? val.id : null
      if (refName !== null || refId !== null) {
        return (
          <span className="text-sm font-semibold text-primary-900 break-words">
            {refName ?? `#${refId}`}
            {refName !== null && refId !== null ? (
              <span className="text-primary-500 font-normal text-xs ms-1 tabular-nums" dir="ltr">
                (#{refId})
              </span>
            ) : null}
          </span>
        )
      }
      const entries = Object.keys(val).sort((a, b) => {
        const ai = ['time', 'session_duration'].indexOf(a)
        const bi = ['time', 'session_duration'].indexOf(b)
        if (ai >= 0 && bi >= 0) return ai - bi
        if (ai >= 0) return -1
        if (bi >= 0) return 1
        return a.localeCompare(b)
      })
      return (
        <div
          className={`space-y-2 ${depth > 0 ? 'me-0 sm:me-2 ps-3 border-s-2 border-primary-200/80 rounded-s-md' : ''}`}
        >
          {entries.map((k) => (
            <div key={k} className="text-right">
              <p className="text-xs font-medium text-primary-600 mb-1">{labelForKey(k)}</p>
              <div className="text-primary-900">{renderNested(val[k], depth + 1)}</div>
            </div>
          ))}
        </div>
      )
    }
    return <span className="text-sm">{formatScalar(val)}</span>
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 max-h-80 overflow-y-auto text-right" dir="rtl">
      {orderedKeys.map((key) => (
        <div
          key={key}
          className="rounded-lg bg-white/70 border border-primary-100/90 px-3 py-2.5 shadow-sm"
        >
          <p className="text-xs font-semibold text-primary-700 mb-2 border-b border-primary-100 pb-1.5">
            {labelForKey(key)}
          </p>
          <div className="text-primary-900">
            {key === 'weekly_schedule' && isPlainObject(values[key]) ? (
              <div className="space-y-2">
                {Object.entries(values[key] as Record<string, unknown>)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, cfg]) => (
                    <div
                      key={day}
                      className="rounded-md border border-primary-200/80 bg-primary-50/40 px-2.5 py-2"
                    >
                      <p className="text-xs font-bold text-primary-800 mb-1.5">{formatDayToken(day)}</p>
                      {renderNested(cfg, 1)}
                    </div>
                  ))}
              </div>
            ) : (
              renderNested(values[key], 0)
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SessionSystemLogsPage() {
  const { teachers, fetchTeachers } = useAdminStore()
  const [logs, setLogs] = useState<SessionSystemLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    teacher_id: '',
    status: '' as SessionSystemLogStatus | '',
  })

  useEffect(() => {
    fetchTeachers(1, 1000)
  }, [fetchTeachers])

  const patchFilters = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setCurrentPage(1)
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const api: Parameters<typeof listSessionSystemLogs>[0] = {
        page: currentPage,
        per_page: SESSION_SYSTEM_LOGS_PER_PAGE,
      }
      if (filters.search.trim()) api.search = filters.search.trim()
      if (filters.teacher_id.trim()) api.teacher_id = parseInt(filters.teacher_id, 10)
      if (filters.status) api.status = filters.status

      const data = await listSessionSystemLogs(api)
      setLogs(data?.logs || [])
      setPagination(data?.pagination || null)
    } catch (e) {
      console.error(e)
      setLogs([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [currentPage, filters.search, filters.teacher_id, filters.status])

  const handleApprove = async (id: number) => {
    if (!confirm('هل أنت متأكد من الموافقة على طلب تغيير نظام الحصص؟')) return

    setProcessingId(id)
    try {
      await approveSessionSystemLog(id)
      await loadLogs()
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على الطلب')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('يرجى إدخال سبب الرفض:')
    if (reason === null) return
    if (!reason.trim()) {
      alert('سبب الرفض مطلوب')
      return
    }

    setProcessingId(id)
    try {
      await rejectSessionSystemLog(id, reason.trim())
      await loadLogs()
    } catch (error: any) {
      alert(error.message || 'فشل رفض الطلب')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status?: SessionSystemLogStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            موافق عليه
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            مرفوض
          </span>
        )
      default:
        return null
    }
  }

  const totalPages = pagination?.total_pages ?? 1

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900">طلبات تغيير نظام الحصص</h1>
        <button
          type="button"
          onClick={() => loadLogs()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
        >
          <RefreshCw className="w-5 h-5" />
          تحديث
        </button>
      </div>

      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-semibold text-primary-900 mb-4 text-right">فلترة السجلات</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) =>
                patchFilters({ status: e.target.value as SessionSystemLogStatus | '' })
              }
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-primary-900 font-semibold mb-2 text-right">البحث (اسم الطالب)</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => patchFilters({ search: e.target.value })}
                placeholder="ابحث باسم الطالب..."
                className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم</label>
            <SearchableTeacherSelect
              value={filters.teacher_id}
              onChange={(value) => patchFilters({ teacher_id: value })}
              teachers={teachers}
              placeholder="جميع المعلمين"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-primary-600 bg-white rounded-xl border-2 border-primary-200">
          {filters.search || filters.teacher_id || filters.status
            ? 'لا توجد نتائج'
            : 'لا توجد طلبات'}
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const open = expandedId === log.id
            return (
              <motion.div
                key={log.id}
                layout
                className="bg-white rounded-xl border-2 border-primary-200 shadow-lg overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : log.id)}
                    className="flex-1 min-w-0 text-right hover:opacity-90 transition-opacity"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-primary-700">
                        <span className="font-mono text-xs text-primary-500">#{log.id}</span>
                        {getStatusBadge(log.status)}
                        {log.status_label && !log.status && (
                          <span className="text-xs text-primary-600">{log.status_label}</span>
                        )}
                        {log.created_at && (
                          <span>{new Date(log.created_at.replace(' ', 'T')).toLocaleString('ar-EG')}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-primary-600">الطالب</p>
                            <p className="font-semibold text-primary-900 break-words">
                              {log.student?.name ?? `— (${log.student_id})`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-primary-600">المعلم</p>
                            <p className="font-semibold text-primary-900 break-words">
                              {log.teacher?.name ?? (log.teacher_id != null ? `#${log.teacher_id}` : '—')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <UserCog className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-primary-600">من نفّذ التغيير</p>
                            <p className="font-semibold text-primary-900 break-words">
                              {log.changed_by_user?.name ??
                                (log.changed_by_user_id != null ? `#${log.changed_by_user_id}` : '—')}
                            </p>
                          </div>
                        </div>
                      </div>
                      {log.status === 'rejected' && log.rejection_reason && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-right">
                          <span className="font-semibold">سبب الرفض: </span>
                          {log.rejection_reason}
                        </p>
                      )}
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {log.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleApprove(log.id)}
                          disabled={processingId === log.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {processingId === log.id ? 'جاري...' : 'موافقة'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(log.id)}
                          disabled={processingId === log.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          رفض
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : log.id)}
                      className="p-1 rounded-lg hover:bg-primary-50 transition-colors"
                      aria-label={open ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    >
                      {open ? (
                        <ChevronUp className="w-5 h-5 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-primary-600" />
                      )}
                    </button>
                  </div>
                </div>

                {log.student_id != null && (
                  <div className="px-4 sm:px-5 pb-4 border-t border-primary-100">
                    <p className="text-sm font-semibold text-primary-700 mb-2 text-right pt-3">
                      إجراءات الطالب
                    </p>
                    <StudentAdminActions
                      studentId={log.student_id}
                      student={log.student ? { ...log.student, id: log.student_id } : { id: log.student_id }}
                      hideDeleteActions
                      hideAuditLogs
                    />
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-primary-200"
                    >
                      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-lg border-2 border-red-200 bg-red-50/60 overflow-hidden">
                          <div className="px-3 py-2 bg-red-100 text-red-900 text-sm font-semibold text-right">
                            القيم السابقة
                          </div>
                          <SessionLogValuesView values={log.old_values as Record<string, unknown>} />
                        </div>
                        <div className="rounded-lg border-2 border-green-200 bg-green-50/60 overflow-hidden">
                          <div className="px-3 py-2 bg-green-100 text-green-900 text-sm font-semibold text-right">
                            القيم الجديدة
                          </div>
                          <SessionLogValuesView values={log.new_values as Record<string, unknown>} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {pagination && pagination.total > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border-2 border-primary-200 p-4">
          <p className="text-sm text-primary-700">
            إجمالي السجلات: <span className="font-bold">{pagination.total}</span> — الصفحة{' '}
            <span className="font-bold">{pagination.current_page}</span> من{' '}
            <span className="font-bold">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border-2 border-primary-300 text-primary-800 disabled:opacity-40 text-sm"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-lg border-2 border-primary-300 text-primary-800 disabled:opacity-40 text-sm"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
