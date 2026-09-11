import { apiRequest } from '../api-client'

export type RecipientType =
  | 'all'
  | 'students'
  | 'teachers'
  | 'unpaid_students'
  | 'teacher_students'

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  all: 'الجميع',
  students: 'الطلاب فقط',
  teachers: 'المعلمون فقط',
  unpaid_students: 'طلاب بمستحقات غير مدفوعة',
  teacher_students: 'طلاب معلم معيّن',
}

export interface SendNotificationRequest {
  title: string
  description: string
  recipient_type: RecipientType
  teacher_id?: number
}

export interface SendNotificationResponse {
  notifications_created: number
  notifications_sent: number
  notifications_failed: number
  recipient_type: RecipientType
  teacher_id?: number
}

/** Send notification from dashboard — used on Dashboard Home page */
export const sendNotification = async (
  data: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  const body: SendNotificationRequest = {
    title: data.title,
    description: data.description,
    recipient_type: data.recipient_type,
  }
  if (data.recipient_type === 'teacher_students' && data.teacher_id != null) {
    body.teacher_id = data.teacher_id
  }
  return apiRequest<SendNotificationResponse>('/api/notifications/send', {
    method: 'POST',
    body,
  })
}
