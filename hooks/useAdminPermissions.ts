'use client'

import { useAdminStore } from '@/store/useAdminStore'
import {
  canDeleteStudents,
  canManageStudentDeletionRequests,
} from '@/lib/admin-access'

export function useAdminPermissions() {
  const admin = useAdminStore((state) => state.admin)

  return {
    canDeleteStudents: canDeleteStudents(admin.username, admin.userType, admin.user),
    canManageStudentDeletionRequests: canManageStudentDeletionRequests(
      admin.username,
      admin.userType,
      admin.user
    ),
  }
}
