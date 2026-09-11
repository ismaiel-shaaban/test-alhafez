/**
 * Utilities for weekly_schedule and weekly_days API format.
 *
 * weekly_schedule: { "sunday": { "time": "10:00", "session_duration": 60 }, "friday": "17:00" }
 * weekly_days: [ { "day": "sunday", "session_duration": 90 }, { "day": "tuesday" }, "friday" ]
 */

const AR_TO_EN_DAY: Record<string, string> = {
  'السبت': 'saturday', 'الأحد': 'sunday', 'الإثنين': 'monday', 'الثلاثاء': 'tuesday',
  'الأربعاء': 'wednesday', 'الخميس': 'thursday', 'الجمعة': 'friday',
}

function toEnglishDay(key: string): string {
  return AR_TO_EN_DAY[key] || key
}

export type WeeklyScheduleApiValue = string | { time: string; session_duration?: number }
export type WeeklyScheduleApi = Record<string, WeeklyScheduleApiValue>

export type WeeklyDayApiItem = string | { day: string; session_duration?: number }
export type WeeklyDaysApi = WeeklyDayApiItem[]

export type WeeklyScheduleForm = Record<string, { time: string; session_duration: string }>
export type WeeklyDayFormItem = { day: string; session_duration: string }
export type WeeklyDaysForm = WeeklyDayFormItem[]

/** Parse API weekly_schedule to form format (keys normalized to English) */
export function parseWeeklyScheduleFromApi(api: WeeklyScheduleApi | undefined): WeeklyScheduleForm {
  if (!api || typeof api !== 'object') return {}
  const result: WeeklyScheduleForm = {}
  for (const [day, val] of Object.entries(api)) {
    const enDay = toEnglishDay(day)
    if (typeof val === 'string') {
      result[enDay] = { time: val, session_duration: '' }
    } else if (val && typeof val === 'object' && 'time' in val) {
      result[enDay] = {
        time: val.time || '',
        session_duration: val.session_duration != null ? String(val.session_duration) : '',
      }
    }
  }
  return result
}

/** Convert form weekly_schedule to API format */
export function toApiWeeklySchedule(form: WeeklyScheduleForm): WeeklyScheduleApi {
  const result: WeeklyScheduleApi = {}
  for (const [day, entry] of Object.entries(form)) {
    if (!entry?.time) continue
    const dur = entry.session_duration?.trim()
    if (dur && !isNaN(parseInt(dur, 10))) {
      result[day] = { time: entry.time, session_duration: parseInt(dur, 10) }
    } else {
      result[day] = entry.time
    }
  }
  return result
}

/** Parse API weekly_days to form format (day normalized to English) */
export function parseWeeklyDaysFromApi(api: WeeklyDaysApi | undefined): WeeklyDaysForm {
  if (!Array.isArray(api)) return []
  return api.map((item) => {
    if (typeof item === 'string') {
      return { day: toEnglishDay(item) || item, session_duration: '' }
    }
    if (item && typeof item === 'object' && 'day' in item) {
      return {
        day: toEnglishDay(item.day) || item.day,
        session_duration: item.session_duration != null ? String(item.session_duration) : '',
      }
    }
    return { day: '', session_duration: '' }
  }).filter((x) => x.day)
}

/** Convert form weekly_days to API format */
export function toApiWeeklyDays(form: WeeklyDaysForm): WeeklyDaysApi {
  return form.filter((x) => x.day).map((item) => {
    const dur = item.session_duration?.trim()
    if (dur && !isNaN(parseInt(dur, 10))) {
      return { day: item.day, session_duration: parseInt(dur, 10) }
    }
    return item.day
  })
}

const WEEKS_PER_MONTH = 4

/** عدد الحصص الأسبوعية = عدد أيام الجدول؛ الشهرية = أسبوعية × 4 */
export function deriveSessionCountsFromSchedule(options: {
  useWeeklySchedule: boolean
  weekly_schedule: WeeklyScheduleForm
  weekly_days: WeeklyDaysForm
  weeksPerMonth?: number
}): { weekly_sessions: number; monthly_sessions: number } | null {
  const weeks = options.weeksPerMonth ?? WEEKS_PER_MONTH
  let weeklyCount = 0

  if (options.useWeeklySchedule) {
    weeklyCount = Object.values(options.weekly_schedule).filter((entry) =>
      Boolean(entry?.time?.trim())
    ).length
  } else {
    weeklyCount = options.weekly_days.filter((item) => Boolean(item.day)).length
  }

  if (weeklyCount < 1) return null

  return {
    weekly_sessions: weeklyCount,
    monthly_sessions: weeklyCount * weeks,
  }
}
