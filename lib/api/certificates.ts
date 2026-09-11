import { apiRequest, Pagination } from '../api-client'

export interface Certificate {
  id: number
  teacher_id: number
  teacher_name?: string
  parent_name?: string
  student_name?: string
  gender?: 'male' | 'female'
  gender_label?: string
  age?: number
  memorization_amount?: string
  student_image?: string | null
  certificate_image?: string | null
  certificate_url?: string | null
  status: 'pending' | 'accept' | 'cancel'
  status_label?: string
  teacher?: {
    id: number
    name: string
    specialization?: string
  }
  created_at?: string
  updated_at?: string
}

export interface CertificatesResponse {
  certificates: Certificate[]
  pagination: Pagination
}

// Get parent certificates
export const getParentCertificates = async (
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<CertificatesResponse> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())
  return apiRequest<CertificatesResponse>(`/api/parent-certificates?${params.toString()}`, { locale })
}

// Update parent certificate status (accept with certificate_image uses multipart FormData; optional certificate_url)
export const updateParentCertificateStatus = async (
  id: number,
  status: 'pending' | 'accept' | 'cancel',
  locale?: string,
  certificateImage?: File | null,
  certificateUrl?: string
): Promise<Certificate> => {
  if (status === 'accept' && certificateImage) {
    const formData = new FormData()
    formData.append('status', status)
    formData.append('certificate_image', certificateImage)
    const urlTrim = certificateUrl?.trim()
    if (urlTrim) formData.append('certificate_url', urlTrim)
    return apiRequest<Certificate>(`/api/parent-certificates/${id}/status`, {
      method: 'POST',
      body: formData,
      locale,
    })
  }
  return apiRequest<Certificate>(`/api/parent-certificates/${id}/status`, {
    method: 'POST',
    body: { status },
    locale,
  })
}

// Get student certificates
export const getStudentCertificates = async (
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<CertificatesResponse> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())
  return apiRequest<CertificatesResponse>(`/api/student-certificates?${params.toString()}`, { locale })
}

// Update student certificate status (accept with certificate_image uses multipart FormData; optional certificate_url)
export const updateStudentCertificateStatus = async (
  id: number,
  status: 'pending' | 'accept' | 'cancel',
  locale?: string,
  certificateImage?: File | null,
  certificateUrl?: string
): Promise<Certificate> => {
  if (status === 'accept' && certificateImage) {
    const formData = new FormData()
    formData.append('status', status)
    formData.append('certificate_image', certificateImage)
    const urlTrim = certificateUrl?.trim()
    if (urlTrim) formData.append('certificate_url', urlTrim)
    return apiRequest<Certificate>(`/api/student-certificates/${id}/status`, {
      method: 'POST',
      body: formData,
      locale,
    })
  }
  return apiRequest<Certificate>(`/api/student-certificates/${id}/status`, {
    method: 'POST',
    body: { status },
    locale,
  })
}

// Delete parent certificate
export const deleteParentCertificate = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest(`/api/parent-certificates/${id}`, {
    method: 'DELETE',
    locale,
  })
}

// Delete student certificate
export const deleteStudentCertificate = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest(`/api/student-certificates/${id}`, {
    method: 'DELETE',
    locale,
  })
}

