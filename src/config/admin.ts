/**
 * Admin email whitelist.
 * Only users whose email appears in this list are granted admin access.
 * Add or remove emails here to control who can manage the store.
 */
export const ADMIN_EMAILS: readonly string[] = [
  'proyectooro69@gmail.com',
]

/**
 * Check whether a given email belongs to an authorized admin.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase().trim())
}
