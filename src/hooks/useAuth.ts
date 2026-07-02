import { useState, useEffect, useMemo } from 'react'
import { blink } from '@/blink/client'
import type { BlinkUser } from '@blinkdotnew/sdk'
import { isAdminEmail } from '@/config/admin'

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const isAdmin = useMemo(() => isAdminEmail(user?.email), [user?.email])

  return { user, isLoading, isAuthenticated: !!user, isAdmin }
}
