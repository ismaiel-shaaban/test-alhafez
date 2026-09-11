'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, RefreshCw, Users, XCircle } from 'lucide-react'
import { listStudents, type Student, type StudentSubscription } from '@/lib/api/students'
import { normalizeStudentSearchQuery } from '@/lib/student-search'
import { useAdminStore } from '@/store/useAdminStore'

const phoneStudentsCache = new Map<string, Promise<Student[]>>()

function getUnpaidSubscriptions(student: Student): StudentSubscription[] {
  if (!Array.isArray(student.subscriptions)) return []
  return student.subscriptions.filter((sub) => !sub.is_paid)
}

async function fetchStudentsByPhone(phone: string, getStudent: (id: number) => Promise<Student>) {
  const query = normalizeStudentSearchQuery(phone)
  if (!query) return []

  if (!phoneStudentsCache.has(query)) {
    phoneStudentsCache.set(
      query,
      (async () => {
        const { students } = await listStudents({ search: query, per_page: 100 })
        if (students.length === 0) return []
        return Promise.all(students.map((student) => getStudent(student.id)))
      })()
    )
  }

  return phoneStudentsCache.get(query)!
}

export function invalidateReceiptRelatedStudentsCache(phone?: string | null) {
  if (!phone) {
    phoneStudentsCache.clear()
    return
  }
  const query = normalizeStudentSearchQuery(phone)
  if (query) phoneStudentsCache.delete(query)
}

export default function ReceiptRelatedStudentsPanel({ phone }: { phone: string }) {
  const { getStudent, updateSubscriptionPaymentStatus } = useAdminStore()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const loadRelatedStudents = useCallback(async () => {
    if (!phone?.trim()) {
      setStudents([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const related = await fetchStudentsByPhone(phone, getStudent)
      setStudents(related)
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الطلاب المرتبطين')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [phone, getStudent])

  useEffect(() => {
    loadRelatedStudents()
  }, [loadRelatedStudents])

  const handleMarkPaid = async (subscriptionId: number) => {
    setTogglingId(subscriptionId)
    try {
      await updateSubscriptionPaymentStatus(subscriptionId, true)
      invalidateReceiptRelatedStudentsCache(phone)
      await loadRelatedStudents()
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة الدفع')
    } finally {
      setTogglingId(null)
    }
  }

  if (!phone?.trim()) return null

  const studentsWithUnpaid = students
    .map((student) => ({
      student,
      unpaid: getUnpaidSubscriptions(student),
    }))
    .filter((item) => item.unpaid.length > 0)

  return (
    <div className="mt-4 pt-4 border-t-2 border-primary-100">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-600" />
          <h4 className="text-sm font-bold text-primary-900">طلاب مرتبطون بالرقم {phone}</h4>
        </div>
        <button
          type="button"
          onClick={() => {
            invalidateReceiptRelatedStudentsCache(phone)
            loadRelatedStudents()
          }}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 rounded-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-primary-500">لا يوجد طلاب مرتبطون بهذا الرقم</p>
      ) : studentsWithUnpaid.length === 0 ? (
        <p className="text-sm text-primary-500">تم العثور على {students.length} طالب — لا توجد اشتراكات غير مدفوعة</p>
      ) : (
        <div className="space-y-4">
          {studentsWithUnpaid.map(({ student, unpaid }) => (
            <div key={student.id} className="rounded-lg border border-primary-200 bg-primary-50/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-primary-900">{student.name}</p>
                  <p className="text-xs text-primary-600" dir="ltr">
                    {student.phone}
                    {student.type ? ` · ${student.type === 'website' ? 'موقع' : student.type === 'app' ? 'تطبيق' : 'إدارة'}` : ''}
                  </p>
                </div>
                <Link
                  href={`/admin/students?id=${student.id}`}
                  className="text-xs text-primary-700 underline hover:text-primary-900"
                >
                  فتح الطالب
                </Link>
              </div>

              <div className="space-y-2">
                {unpaid.map((subscription, index) => (
                  <div
                    key={subscription.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-white border border-primary-200 px-3 py-2"
                  >
                    <div className="text-sm text-primary-800">
                      <span className="font-medium">
                        اشتراك #{subscription.subscription_number ?? index + 1}
                      </span>
                      <span className="text-primary-600 mx-2">·</span>
                      <span>{subscription.start_date} → {subscription.end_date}</span>
                      {subscription.remaining_amount != null && (
                        <span className="block sm:inline sm:mr-2 text-red-600 font-medium mt-1 sm:mt-0">
                          المتبقي: {subscription.remaining_amount}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(subscription.id)}
                      disabled={togglingId === subscription.id}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                    >
                      {togglingId === subscription.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      تعيين كمدفوع
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {students.length > 0 && studentsWithUnpaid.length > 0 && (
        <p className="mt-2 text-xs text-primary-500 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          يعرض الاشتراكات غير المدفوعة فقط لتسهيل المطابقة مع الإيصال
        </p>
      )}
    </div>
  )
}
