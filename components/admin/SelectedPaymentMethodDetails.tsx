'use client'

import CopyTextButton from '@/components/admin/CopyTextButton'
import type { TeacherPaymentMethod } from '@/lib/api/teacher-salary'

function formatPaymentMethodLabel(method: TeacherPaymentMethod) {
  const typeLabel =
    method.type_label ||
    (method.type === 'wallet'
      ? 'محفظة'
      : method.type === 'insta' || method.type === 'instapay'
        ? 'انستا'
        : 'InstaPay')
  return `${typeLabel} - ${method.name}`
}

export default function SelectedPaymentMethodDetails({
  method,
}: {
  method: TeacherPaymentMethod | null | undefined
}) {
  if (!method?.phone) return null

  return (
    <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
      <p className="text-xs text-primary-600 mb-1">{formatPaymentMethodLabel(method)}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-primary-500 mb-0.5">رقم التحويل</p>
          <p className="font-mono text-sm text-primary-900 break-all" dir="ltr">
            {method.phone}
          </p>
        </div>
        <CopyTextButton text={method.phone} title="نسخ رقم التحويل" successMessage="تم نسخ الرقم" />
      </div>
    </div>
  )
}
