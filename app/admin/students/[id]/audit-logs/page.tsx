'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  Loader2,
  Phone,
  Server,
  Sparkles,
  User,
} from 'lucide-react'
import {
  getStudentAuditLogs,
  type StudentAuditLogsData,
  type StudentAuditLog,
  type StudentAuditLogChange,
} from '@/lib/api/students'

const AUDIT_PAGE_SIZE = 15

/** شرح مبسّط لنوع العملية — للمستخدم غير التقني */
const ACTION_USER_HINTS: Record<string, string> = {
  subscription_pause_requested: 'طُلب تعليق أو إيقاف اشتراك الطالب؛ قد يتغيّر عدد الحصص أو حالة الاشتراك.',
  session_completed: 'تم تسجيل إتمام حصة دراسية للطالب.',
  session_postponed: 'تم تأجيل موعد حصة إلى وقت لاحق.',
  endpoint_api_app_session_reports:
    'تم إرسال تقرير بعد الحصة (ملاحظات المعلّم أو تقييم الجلسة).',
}

function normalizeActionKey(key: string): string {
  return key.replace(/-/g, '_')
}

function actionHintForKey(key: string | undefined): string | null {
  if (!key) return null
  const k = normalizeActionKey(key)
  return (
    ACTION_USER_HINTS[k] ??
    ACTION_USER_HINTS[key] ??
    (key.startsWith('endpoint_')
      ? 'عملية تقنية على أحد أجزاء النظام؛ غالبًا إرسال بيانات أو تحديث حالة.'
      : null)
  )
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function changeHumanBefore(ch: StudentAuditLogChange): string {
  const v =
    ch.before_display ??
    ch.old_value ??
    (ch.before_raw !== undefined && ch.before_raw !== null
      ? formatAuditValue(ch.before_raw)
      : null) ??
    formatAuditValue(ch.before)
  const s = v === '' || v == null ? '—' : String(v)
  return s
}

function changeHumanAfter(ch: StudentAuditLogChange): string {
  const v =
    ch.after_display ??
    ch.new_value ??
    (ch.after_raw !== undefined && ch.after_raw !== null
      ? formatAuditValue(ch.after_raw)
      : null) ??
    formatAuditValue(ch.after)
  const s = v === '' || v == null ? '—' : String(v)
  return s
}

function changeFieldTitle(ch: StudentAuditLogChange): string {
  return (ch.field_label || ch.label || ch.field_key || ch.field || 'حقل').trim() || 'حقل'
}

function methodBadgeClass(method: string): string {
  switch (method?.toUpperCase()) {
    case 'POST':
      return 'bg-emerald-100 text-emerald-800'
    case 'PUT':
    case 'PATCH':
      return 'bg-amber-100 text-amber-900'
    case 'DELETE':
      return 'bg-red-100 text-red-800'
    case 'GET':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-primary-100 text-primary-800'
  }
}

/** وصف عربي بسيط لنوع طلب HTTP */
function httpMethodFriendly(method: string): string {
  const u = method?.toUpperCase()
  if (u === 'GET') return 'قراءة بيانات'
  if (u === 'POST') return 'إرسال أو تسجيل'
  if (u === 'PUT') return 'تحديث كامل'
  if (u === 'PATCH') return 'تحديث جزئي'
  if (u === 'DELETE') return 'حذف'
  return method || '—'
}

function statusBadgeClass(code: number): string {
  if (code >= 200 && code < 300) return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
  if (code >= 400) return 'bg-red-50 text-red-900 ring-1 ring-red-200'
  return 'bg-slate-50 text-slate-800 ring-1 ring-slate-200'
}

function statusFriendlyAr(code: number): string {
  if (code >= 200 && code < 300) return 'اكتمل بنجاح'
  if (code >= 400 && code < 500) return 'لم يُقبل الطلب'
  if (code >= 500) return 'خطأ من الخادم'
  return `رمز ${code}`
}

function logTitle(log: StudentAuditLog): string {
  if (log.action?.label) return log.action.label
  return `عملية رقم ${log.id}`
}

export default function StudentAuditLogsPage() {
  const params = useParams()
  const idParam = params?.id
  const studentId = typeof idParam === 'string' ? parseInt(idParam, 10) : NaN

  const [data, setData] = useState<StudentAuditLogsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!Number.isFinite(studentId) || studentId < 1) {
      setLoading(false)
      setError('معرّف الطالب غير صالح')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getStudentAuditLogs(studentId, {
          page,
          per_page: AUDIT_PAGE_SIZE,
        })
        if (!cancelled) setData(res)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'فشل تحميل السجل'
        if (!cancelled) setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentId, page])

  const pagination = data?.pagination
  const totalPages = Math.max(1, pagination?.total_pages ?? 1)
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="w-full min-w-0 max-w-full mx-auto px-0 sm:px-0" dir="rtl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-900 font-medium text-sm shrink-0"
          >
            <ArrowRight className="w-4 h-4 shrink-0" />
            العودة إلى الطلاب
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8 min-w-0">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
          <History className="w-6 h-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900 break-words">
            سجل العمليات
          </h1>
          {data?.student && (
            <p className="text-primary-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-primary-900">{data.student.name}</span>
              <span className="text-primary-500 text-sm">معرّف الطالب: {data.student.id}</span>
              {data.student.phone && (
                <span
                  className="inline-flex items-center gap-1 tabular-nums text-primary-800"
                  dir="ltr"
                >
                  <Phone className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  {data.student.phone}
                </span>
              )}
            </p>
          )}
          {pagination && pagination.total > 0 && (
            <p className="text-sm text-primary-500 mt-1">
              إجمالي {pagination.total} عملية مسجّلة
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-primary-600 gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>جاري التحميل...</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="space-y-5 lg:space-y-6 w-full min-w-0">
            {data.logs.length === 0 ? (
              <div className="rounded-xl border-2 border-primary-200 bg-white px-4 py-12 text-center text-primary-600">
                لا توجد عمليات مسجّلة لهذا الطالب في هذه الصفحة
              </div>
            ) : (
              data.logs.map((log: StudentAuditLog) => {
                const rawLog = log as unknown as Record<string, unknown>
                const hint =
                  actionHintForKey(log.action?.key) ??
                  (log.changes_count === 0
                    ? 'هذه العملية وُثّقت دون عرض تفاصيل حقول متغيّرة.'
                    : null)
                const req = log.request_details
                const performedAt = req?.performed_at ?? log.created_at
                const endpoint = req?.endpoint ?? log.path
                const method = req?.method ?? log.http_method
                const statusCode = req?.status_code ?? log.response_status
                const actorHuman = log.actor_details
                const actorRaw = log.actor

                return (
                  <article
                    key={log.id}
                    className="group rounded-2xl border border-primary-200/80 bg-white shadow-sm overflow-hidden w-full min-w-0 max-w-full"
                  >
                    <div className="h-1.5 bg-gradient-to-l from-primary-500 via-primary-400 to-emerald-400" />
                    <div className="p-4 sm:p-5 md:p-6 space-y-4 lg:space-y-5">
                      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                            <Sparkles className="w-5 h-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 gap-y-1">
                              <h2 className="text-lg sm:text-xl font-bold text-primary-950 leading-snug break-words">
                                {logTitle(log)}
                              </h2>
                              {log.changes_count != null && log.changes_count > 0 && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                                  {log.changes_count} تغيير
                                </span>
                              )}
                            </div>
                            {hint && (
                              <p className="text-sm text-primary-700/90 mt-1.5 leading-relaxed max-w-2xl">
                                {hint}
                              </p>
                            )}
                            <p className="text-xs text-primary-500 mt-2 tabular-nums" dir="ltr">
                              {new Date(performedAt).toLocaleString('ar-EG', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${methodBadgeClass(method)}`}
                            title={httpMethodFriendly(method)}
                          >
                            {method}
                            <span className="font-sans font-normal text-[10px] opacity-90 hidden sm:inline">
                              ({httpMethodFriendly(method)})
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${statusBadgeClass(statusCode)}`}
                            title={statusFriendlyAr(statusCode)}
                          >
                            {statusCode}{' '}
                            <span className="font-normal mr-1 hidden sm:inline">
                              — {statusFriendlyAr(statusCode)}
                            </span>
                          </span>
                          <span className="text-xs text-primary-400 font-mono" dir="ltr">
                            #{log.id}
                          </span>
                        </div>
                      </header>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <section className="min-w-0 rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white p-4">
                          <h3 className="text-sm font-bold text-primary-900 mb-3 flex items-center gap-2">
                            <Server className="w-4 h-4 shrink-0 text-primary-600" />
                            تفاصيل الطلب في النظام
                          </h3>
                          <dl className="space-y-2.5 text-sm">
                            <div>
                              <dt className="text-primary-600 text-xs font-medium mb-0.5">
                                عنوان العملية (للمطابقة التقنية)
                              </dt>
                              <dd
                                className="font-mono text-xs break-all text-primary-900 bg-white/80 rounded-md px-2 py-1.5 border border-primary-100"
                                dir="ltr"
                              >
                                {endpoint}
                              </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <dt className="text-primary-600 text-xs font-medium mb-0.5">
                                  نوع الطلب
                                </dt>
                                <dd className="text-primary-900 font-medium">
                                  {httpMethodFriendly(method)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-primary-600 text-xs font-medium mb-0.5">
                                  نتيجة الطلب
                                </dt>
                                <dd className="text-primary-900 font-medium">
                                  {statusFriendlyAr(statusCode)}
                                </dd>
                              </div>
                            </div>
                          </dl>
                        </section>

                        <section className="min-w-0 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-4">
                          <h3 className="text-sm font-bold text-primary-900 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 shrink-0 text-emerald-700" />
                            من نفّذ العملية؟
                          </h3>
                          {actorHuman ? (
                            <dl className="space-y-2 text-sm">
                              <div>
                                <dt className="text-primary-600 text-xs font-medium">الاسم</dt>
                                <dd className="font-semibold text-primary-950">{actorHuman.name}</dd>
                              </div>
                              <div>
                                <dt className="text-primary-600 text-xs font-medium">نوع الحساب</dt>
                                <dd className="text-primary-900">{actorHuman.type}</dd>
                              </div>
                              {actorHuman.phone && (
                                <div>
                                  <dt className="text-primary-600 text-xs font-medium">الهاتف</dt>
                                  <dd className="font-mono tabular-nums text-primary-900" dir="ltr">
                                    {actorHuman.phone}
                                  </dd>
                                </div>
                              )}
                              {actorHuman.id != null && (
                                <div>
                                  <dt className="text-primary-600 text-xs font-medium">
                                    رقم المستخدم في النظام
                                  </dt>
                                  <dd className="font-mono tabular-nums">{actorHuman.id}</dd>
                                </div>
                              )}
                            </dl>
                          ) : (
                            <dl className="space-y-2 text-sm">
                              <div>
                                <dt className="text-primary-600 text-xs font-medium">الاسم</dt>
                                <dd className="font-semibold text-primary-950">
                                  {actorRaw?.name ?? '—'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-primary-600 text-xs font-medium">نوع الحساب</dt>
                                <dd className="text-primary-900">
                                  {actorRaw?.type_label ?? actorRaw?.type ?? '—'}
                                </dd>
                              </div>
                            </dl>
                          )}
                        </section>
                      </div>

                      <section className="w-full min-w-0">
                        <h3 className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 shrink-0" />
                          ما الذي تغيّر؟
                        </h3>
                        {!log.changes || log.changes.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-primary-200 bg-slate-50/60 px-4 py-5 text-sm text-primary-600 text-center leading-relaxed">
                            لا يوجد عرض لقيم «قبل / بعد» لهذه العملية. قد تكون العملية تسجيلًا فقط
                            (مثل إرسال تقرير) دون تعديل حقول تظهر هنا.
                          </div>
                        ) : (
                          <>
                            <div className="md:hidden space-y-3 w-full min-w-0">
                              {log.changes.map((ch, idx) => (
                                <div
                                  key={`${log.id}-m-${idx}-${ch.field}`}
                                  className="rounded-xl border border-primary-100 bg-white p-4 space-y-3 shadow-sm"
                                >
                                  <p className="font-bold text-primary-900 text-sm">
                                    {changeFieldTitle(ch)}
                                  </p>
                                  <div className="grid grid-cols-1 gap-2">
                                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500 mb-1">
                                        قبل
                                      </p>
                                      <p className="text-primary-900 text-base font-semibold tabular-nums break-words">
                                        {changeHumanBefore(ch)}
                                      </p>
                                    </div>
                                    <div className="rounded-lg bg-primary-50/80 border border-primary-100 p-3">
                                      <p className="text-[11px] font-semibold text-primary-600 mb-1">
                                        بعد
                                      </p>
                                      <p className="text-primary-950 text-base font-semibold tabular-nums break-words">
                                        {changeHumanAfter(ch)}
                                      </p>
                                    </div>
                                  </div>
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-primary-600 font-medium">
                                      تفاصيل تقنية إضافية
                                    </summary>
                                    <div className="mt-2 space-y-2 font-mono text-[11px] text-primary-800">
                                      <pre
                                        className="whitespace-pre-wrap break-words rounded bg-slate-100 p-2 overflow-x-auto"
                                        dir="ltr"
                                      >
                                        {formatAuditValue(ch.before)}
                                      </pre>
                                      <pre
                                        className="whitespace-pre-wrap break-words rounded bg-slate-100 p-2 overflow-x-auto"
                                        dir="ltr"
                                      >
                                        {formatAuditValue(ch.after)}
                                      </pre>
                                    </div>
                                  </details>
                                </div>
                              ))}
                            </div>
                            <div className="hidden md:block space-y-3">
                              {log.changes.map((ch, idx) => (
                                <div
                                  key={`${log.id}-${idx}-${ch.field}`}
                                  className="rounded-xl border border-primary-100 bg-white p-4 flex flex-col lg:flex-row lg:items-stretch gap-4"
                                >
                                  <div className="lg:w-48 shrink-0">
                                    <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1">
                                      الحقل
                                    </p>
                                    <p className="font-bold text-primary-950 leading-snug">
                                      {changeFieldTitle(ch)}
                                    </p>
                                    {(ch.field_key || ch.field) && (
                                      <p
                                        className="text-[11px] font-mono text-primary-400 mt-1 break-all"
                                        dir="ltr"
                                      >
                                        {ch.field_key || ch.field}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 min-w-0">
                                      <p className="text-xs font-semibold text-slate-500 mb-1">قبل</p>
                                      <p className="text-primary-900 font-semibold tabular-nums break-words">
                                        {changeHumanBefore(ch)}
                                      </p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 min-w-0">
                                      <p className="text-xs font-semibold text-emerald-800 mb-1">بعد</p>
                                      <p className="text-primary-950 font-semibold tabular-nums break-words">
                                        {changeHumanAfter(ch)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </section>

                      {(() => {
                        const known = new Set([
                          'id',
                          'created_at',
                          'path',
                          'http_method',
                          'response_status',
                          'actor',
                          'changes',
                          'action',
                          'request_details',
                          'actor_details',
                          'changes_count',
                        ])
                        const extraKeys = Object.keys(rawLog).filter((k) => !known.has(k))
                        if (extraKeys.length === 0) return null
                        return (
                          <section>
                            <h3 className="text-sm font-bold text-primary-800 mb-2">
                              بيانات إضافية من الخادم
                            </h3>
                            <pre
                              className="text-xs font-mono bg-amber-50 border border-amber-100 rounded-lg p-3 overflow-x-auto text-amber-950 w-full min-w-0 max-w-full"
                              dir="ltr"
                            >
                              {JSON.stringify(
                                Object.fromEntries(extraKeys.map((k) => [k, rawLog[k]])),
                                null,
                                2
                              )}
                            </pre>
                          </section>
                        )
                      })()}

                      <details className="rounded-xl border border-slate-200 bg-slate-50/80 text-sm w-full min-w-0">
                        <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-100 rounded-xl text-xs sm:text-sm leading-snug break-words [&::-webkit-details-marker]:hidden">
                          عرض السجل كاملاً كما ورد من الخادم (JSON) — للدعم الفني
                        </summary>
                        <pre
                          className="mt-2 px-3 pb-3 text-xs font-mono text-slate-800 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap break-words w-full min-w-0 max-w-full"
                          dir="ltr"
                        >
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
              aria-label="ترقيم صفحات السجل"
            >
              <button
                type="button"
                disabled={safePage <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
              <span className="text-sm text-primary-700 tabular-nums font-medium px-2">
                صفحة {pagination.current_page} من {pagination.total_pages}
                <span className="text-primary-500 font-normal mr-2">
                  ({pagination.total} إجمالي)
                </span>
              </span>
              <button
                type="button"
                disabled={safePage >= pagination.total_pages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
