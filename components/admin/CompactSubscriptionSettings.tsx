'use client'

export type PastSessionsMode = '' | 'count' | 'date'

export type SubscriptionSettingsForm = {
  past_sessions_mode: PastSessionsMode
  past_sessions_count: string
  subscription_start_date: string
  past_months_count: string
  paid_months_count: string
}

type CompactSubscriptionSettingsProps = {
  idPrefix: string
  showPastSessions?: boolean
  value: SubscriptionSettingsForm
  onChange: (value: SubscriptionSettingsForm) => void
  title?: string
}

export default function CompactSubscriptionSettings({
  idPrefix,
  showPastSessions = true,
  value,
  onChange,
  title = 'إعدادات الاشتراك',
}: CompactSubscriptionSettingsProps) {
  const selectCount = () => {
    onChange({ ...value, past_sessions_mode: 'count', subscription_start_date: '' })
  }

  const selectDate = () => {
    onChange({ ...value, past_sessions_mode: 'date', past_sessions_count: '' })
  }

  return (
    <div className="border-t border-primary-200 pt-2 mt-2">
      <p className="text-sm font-semibold text-primary-900 mb-1.5 text-right">{title}</p>
      <div className="rounded border border-primary-200 bg-primary-50/40 p-2 space-y-2">
        {showPastSessions && (
          <div className="space-y-1.5">
        
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  className="flex items-center gap-1.5 justify-end text-xs text-primary-800 cursor-pointer"
                  dir="rtl"
                >
                  <span>عدد الحصة المكتملة</span>
                  <input
                    type="radio"
                    name={`${idPrefix}_past_sessions_mode`}
                    checked={value.past_sessions_mode === 'count'}
                    onChange={selectCount}
                  />
                </label>
                {value.past_sessions_mode === 'count' && (
                  <input
                    type="number"
                    min="0"
                    value={value.past_sessions_count}
                    onChange={(e) => onChange({ ...value, past_sessions_count: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-primary-200 rounded focus:border-primary-500 outline-none bg-white"
                    placeholder="مثال: 8"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label
                  className="flex items-center gap-1.5 justify-end text-xs text-primary-800 cursor-pointer"
                  dir="rtl"
                >
                  <span>تاريخ بداية الاشتراك</span>
                  <input
                    type="radio"
                    name={`${idPrefix}_past_sessions_mode`}
                    checked={value.past_sessions_mode === 'date' || value.past_sessions_mode === ''}
                    onChange={selectDate}
                  />
                </label>
                {(value.past_sessions_mode === 'date' || value.past_sessions_mode === '') && (
                  <input
                    type="date"
                    value={value.subscription_start_date}
                    onFocus={selectDate}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        past_sessions_mode: 'date',
                        past_sessions_count: '',
                        subscription_start_date: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-primary-200 rounded focus:border-primary-500 outline-none bg-white"
                  />
                )}
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-primary-600 mb-0.5 block text-right">أشهر سابقة</label>
            <input
              type="number"
              value={value.past_months_count}
              onChange={(e) => onChange({ ...value, past_months_count: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-primary-200 rounded focus:border-primary-500 outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-primary-600 mb-0.5 block text-right">أشهر مدفوعة</label>
            <input
              type="number"
              min="0"
              max="120"
              value={value.paid_months_count}
              onChange={(e) => onChange({ ...value, paid_months_count: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-primary-200 rounded focus:border-primary-500 outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
