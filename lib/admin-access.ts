/** Routes visible and accessible to full admins only (not supervisors). */
export const ADMIN_ONLY_ROUTES = [
  '/admin/accounting',
  '/admin/financial-reports',
  '/admin/supervisors',
] as const

/** Admin usernames with limited permissions (delete + specific pages). */
export const RESTRICTED_STUDENT_DELETE_USERNAMES = ['new_admin_1', 'new_admin_2'] as const

/** Pages blocked for restricted admin usernames (supervisors + financial reports). */
export const RESTRICTED_ADMIN_BLOCKED_ROUTES = [
  '/admin/supervisors',
  '/admin/financial-reports',
] as const

export type AdminOnlyRoute = (typeof ADMIN_ONLY_ROUTES)[number]

export function isAdminOnlyRoute(pathname: string): boolean {
  return (ADMIN_ONLY_ROUTES as readonly string[]).includes(pathname)
}

export function isRestrictedAdminBlockedRoute(pathname: string): boolean {
  return (RESTRICTED_ADMIN_BLOCKED_ROUTES as readonly string[]).includes(pathname)
}

/** Supervisors must not access financial reports, accounting, or supervisor management. */
export function isSupervisorUser(
  userType?: string | null,
  user?: { supervisor?: { id?: number } | null } | null
): boolean {
  if (userType === 'supervisor') return true
  if (user?.supervisor?.id != null) return true
  return false
}

export function isRestrictedStudentDeleteUsername(username?: string | null): boolean {
  if (!username) return false
  return (RESTRICTED_STUDENT_DELETE_USERNAMES as readonly string[]).includes(username)
}

/** Whether the current user may open an admin route (sidebar + direct URL). */
export function canAccessAdminRoute(
  pathname: string,
  username?: string | null,
  userType?: string | null,
  user?: { supervisor?: { id?: number } | null } | null
): boolean {
  if (isAdminOnlyRoute(pathname) && isSupervisorUser(userType, user)) return false
  if (isRestrictedAdminBlockedRoute(pathname) && isRestrictedStudentDeleteUsername(username)) return false
  return true
}

export function canAccessAdminOnlyPages(
  username?: string | null,
  userType?: string | null,
  user?: { supervisor?: { id?: number } | null } | null,
  pathname?: string | null
): boolean {
  if (pathname) return canAccessAdminRoute(pathname, username, userType, user)
  if (isSupervisorUser(userType, user)) return false
  return true
}

/** Full admins only; blocks restricted usernames and supervisors from deleting students. */
export function canDeleteStudents(
  username?: string | null,
  userType?: string | null,
  user?: { supervisor?: { id?: number } | null } | null
): boolean {
  if (isRestrictedStudentDeleteUsername(username)) return false
  if (isSupervisorUser(userType, user)) return false
  return true
}

/** Approve/reject/delete on student deletion requests — same restriction as student delete. */
export function canManageStudentDeletionRequests(
  username?: string | null,
  userType?: string | null,
  user?: { supervisor?: { id?: number } | null } | null
): boolean {
  return canDeleteStudents(username, userType, user)
}
