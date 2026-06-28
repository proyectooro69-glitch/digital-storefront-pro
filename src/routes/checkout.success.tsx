import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@blinkdotnew/ui'
import { CircleCheck, ShoppingBag, Store } from 'lucide-react'

export const Route = createFileRoute('/checkout/success')({
  head: () => ({
    meta: [
      { title: 'Payment Successful · Storefront Pro' },
      { name: 'description', content: 'Your payment was successful. Your order is being processed.' },
    ],
  }),
  component: CheckoutSuccess,
})

function CheckoutSuccess() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-lg mx-auto px-4 py-20 sm:py-32">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl scale-150" />
            <div className="relative rounded-full bg-accent/10 border border-accent/30 p-4">
              <CircleCheck className="h-14 w-14 text-accent" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-[family-name:var(--font-serif)]">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Your order is being processed. You&apos;ll receive access to your download shortly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto gap-2 rounded-xl
                transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20
                active:scale-[0.98]"
            >
              <Link to="/_app/dashboard">
                <ShoppingBag className="h-4 w-4" />
                Go to My Orders
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 rounded-xl
                transition-all duration-200
                hover:scale-[1.02] hover:bg-primary/5
                active:scale-[0.98]"
            >
              <Link to="/">
                <Store className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Subtle bottom note */}
          <p className="text-xs text-muted-foreground pt-6">
            If you have any questions, check your email for order details or contact support.
          </p>
        </div>
      </main>
    </div>
  )
}
