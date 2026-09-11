import { websiteApiRequest, Pagination } from '../website-api-client'

// Types
export interface WebsiteFeature {
  id: number
  title: string
  title_ar: string
  title_en?: string
  description: string
  description_ar: string
  description_en?: string
  icon?: string
  order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface WebsitePackage {
  id: number
  name: string
  name_ar: string
  name_en?: string
  price: number
  price_ar?: string
  price_en?: string
  price_label?: string
  features: string[]
  features_ar: string[]
  features_en?: string[]
  is_popular: boolean
  students_count?: number
  created_at?: string
}

export interface WebsiteTeacher {
  id: number
  name: string
  name_ar: string
  name_en?: string
  specialization: string
  specialization_ar: string
  specialization_en?: string
  experience_years: number
  image?: string // Teacher profile image URL
  created_at?: string
}

export interface WebsiteReview {
  id: number
  student: {
    id: number
    name: string
  }
  student_id: number
  package?: {
    id: number
    name: string
  }
  package_id?: number
  rating: number
  review: string
  review_ar: string
  review_en?: string
  media_file?: string // Media file URL (image or video)
  created_at?: string
}

export interface WebsiteHonorBoard {
  id: number
  student: {
    id: number
    name: string
  }
  student_id: number
  level: string
  level_ar: string
  level_en?: string
  achievement: string
  achievement_ar: string
  achievement_en?: string
  certificate_images: string[]
  created_at?: string
}

export interface WebsiteLesson {
  id: number
  title: string
  title_ar: string
  title_en?: string
  localized_title: string
  description: string
  description_ar: string
  description_en?: string
  localized_description: string
  video: string // Video URL
  created_at?: string
  updated_at?: string
}

export interface WebsiteData {
  features: WebsiteFeature[]
  packages: WebsitePackage[]
  teachers: WebsiteTeacher[]
  reviews: WebsiteReview[]
}

export interface RegisterStudentRequest {
  name: string
  phone: string
  age: number
  gender?: 'male' | 'female'
  package_id?: number
  notes?: string
}

export interface RegisterStudentResponse {
  id: number
  name: string
  email: string
  phone: string
  age: number
  gender: 'male' | 'female'
  gender_label?: string
  package: {
    id: number
    name: string
  }
  package_id: number
  teacher_id: null
  hour: null
  monthly_sessions: null
  weekly_sessions: null
  weekly_days: []
  session_duration: null
  hourly_rate: null
  notes?: string
  created_at?: string
}

// Get all website data
export const getWebsiteData = async (locale?: string): Promise<WebsiteData> => {
  return websiteApiRequest<WebsiteData>('/api/website', { locale })
}

// List honor boards
export const listHonorBoards = async (
  studentId?: number,
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<{ honor_boards: WebsiteHonorBoard[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  if (studentId) params.append('student_id', studentId.toString())
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())

  return websiteApiRequest<{ honor_boards: WebsiteHonorBoard[]; pagination: Pagination }>(
    `/api/honor-boards?${params.toString()}`,
    { locale }
  )
}

// List teachers
export const listTeachers = async (
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<{ teachers: WebsiteTeacher[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())

  return websiteApiRequest<{ teachers: WebsiteTeacher[]; pagination: Pagination }>(
    `/api/teachers?${params.toString()}`,
    { locale }
  )
}

// List packages
export const listPackages = async (
  isPopular?: boolean,
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<{ packages: WebsitePackage[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  if (isPopular !== undefined) params.append('is_popular', isPopular.toString())
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())

  return websiteApiRequest<{ packages: WebsitePackage[]; pagination: Pagination }>(
    `/api/packages?${params.toString()}`,
    { locale }
  )
}

// List reviews
export const listReviews = async (
  rating?: number,
  packageId?: number,
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<{ reviews: WebsiteReview[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  if (rating) params.append('rating', rating.toString())
  if (packageId) params.append('package_id', packageId.toString())
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())

  return websiteApiRequest<{ reviews: WebsiteReview[]; pagination: Pagination }>(
    `/api/reviews?${params.toString()}`,
    { locale }
  )
}

// Get single honor board entry
export const getHonorBoard = async (id: number, locale?: string): Promise<WebsiteHonorBoard> => {
  return websiteApiRequest<WebsiteHonorBoard>(`/api/website/honor-boards/${id}`, { locale })
}

// List lessons
export const listLessons = async (
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<{ lessons: WebsiteLesson[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())

  return websiteApiRequest<{ lessons: WebsiteLesson[]; pagination: Pagination }>(
    `/api/lessons?${params.toString()}`,
    { locale }
  )
}

// Register new student
export const registerStudent = async (
  data: RegisterStudentRequest,
  locale?: string
): Promise<RegisterStudentResponse> => {
  return websiteApiRequest<RegisterStudentResponse>('/api/register', {
    method: 'POST',
    body: data,
    locale,
  })
}

// Create review from website
export interface CreateReviewRequest {
  name: string
  rating: number // Required, 1-5
  review: string // Review text (will be sent to both review and review_en)
  media_file?: File // Optional, media file (image or video)
}

export interface CreateReviewResponse {
  id: number
  name: string
  rating: number
  review: string
  review_ar: string
  review_en: string
  media_file?: string
  created_at?: string
}

export const createReview = async (
  data: CreateReviewRequest,
  locale?: string
): Promise<CreateReviewResponse> => {
  // Always use FormData for review submission (even without file, to match API expectations)
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('rating', data.rating.toString())
  formData.append('review', data.review)
  formData.append('review_en', data.review) // Send same value to both fields
  if (data.media_file) {
    formData.append('media_file', data.media_file)
  }
  
  return websiteApiRequest<CreateReviewResponse>('/api/reviews', {
    method: 'POST',
    body: formData,
    locale,
  })
}

