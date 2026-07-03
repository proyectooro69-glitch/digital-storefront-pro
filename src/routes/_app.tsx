import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { blink } from '@/blink/client'
import { Button } from '@blinkdotnew/ui'
import { Store, LayoutDashboard, ShoppingBag, LogOut, User, Shield } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { user, isLoading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6 px-4">
        <div className="text-center space-y-3">
          <Store className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-serif)]">
            Digital Storefront Pro
          </h1>
          <p className="text-muted-foreground max-w-md">
            Sign in to access your customer portal and downloads.
          </p>
        </div>
        <Button onClick={() => blink.auth.login()} size="lg" className="gap-2">
          <User className="h-4 w-4" /> Sign In
        </Button>
      </div>
    )
  }

  const handleLogout = async () => {
    await blink.auth.signOut()
    navigate({ to: '/' })
  }

  // ── Navigation ──
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm hidden sm:inline">Storefront Pro</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ShoppingBag className="h-4 w-4" /> My Orders
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-accent hover:bg-secondary transition-colors">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              <LayoutDashboard className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-2 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> My Orders
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-accent hover:bg-secondary transition-colors"
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
