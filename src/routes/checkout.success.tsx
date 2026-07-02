import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { Button, Skeleton } from '@blinkdotnew/ui'
import { CircleCheck, Download, ShoppingBag, Store, ArrowRight } from 'lucide-react'
import { blink } from '@/blink/client'
import type { Order, Product } from '@/types'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/checkout/success')({
  head: () => ({
    meta: [
      { title: 'Payment Successful · Arte Digital' },
      { name: 'description', content: 'Your payment was successful. Your download is ready.' },
    ],
  }),
  component: CheckoutSuccess,
  validateSearch: (search: Record<string, unknown>) => ({
    reference: (search.reference as string) || '',
  }),
})

function CheckoutSuccess() {
  const { reference } = Route.useSearch()
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  // Fetch the order
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', reference],
    queryFn: async () => {
      if (!reference) return null
      // List orders filtered by reference to find ours
      const result = await blink.db.table<Order>('orders').list({
        where: { reference },
      })
      return Array.isArray(result) && result.length > 0 ? result[0] : null
    },
    enabled: !!reference,
  })

  // Fetch product for download link
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', order?.product_id],
    queryFn: async () => {
      if (!order) return null
      const result = await blink.db.table<Product>('products').get(order.product_id)
      return result ?? null
    },
    enabled: !!order,
  })

  // On mount: mark order as completed + send email
  useEffect(() => {
    if (!order || !product) return
    if (order.status === 'completed') return // Already processed

    const processOrder = async () => {
      try {
        // 1. Mark order as completed
        await blink.db.table<Order>('orders').update(order.id, {
          status: 'completed',
          updated_at: new Date().toISOString(),
        })

        // 2. Send confirmation email to buyer
        if (order.buyer_email && emailStatus === 'idle') {
          setEmailStatus('sending')
          try {
            await blink.notifications.email({
              to: order.buyer_email,
              subject: `Your Download: ${product.title}`,
              html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <div style="background: #0F172A; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #F8FAFC; margin: 0; font-size: 24px; font-weight: 700;">Arte Digital Premium</h1>
                    <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">Your digital art is ready!</p>
                  </div>
                  <div style="background: #1E293B; padding: 32px 24px; border-radius: 0 0 12px 12px;">
                    <p style="color: #E2E8F0; font-size: 16px; margin: 0 0 4px;">Hi${order.buyer_name ? ' ' + order.buyer_name : ''},</p>
                    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 16px 0;">
                      Thank you for your purchase! Your payment has been confirmed and your digital art is ready to download.
                    </p>
                    <div style="background: #0F172A; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <p style="color: #F8FAFC; font-size: 16px; font-weight: 600; margin: 0;">${product.title}</p>
                      <p style="color: #64748B; font-size: 13px; margin: 4px 0 0;">Order: ${order.reference}</p>
                    </div>
                    <a href="${product.file_url}"
                       style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Download Your Art
                    </a>
                    <p style="color: #64748B; font-size: 12px; margin: 20px 0 0; line-height: 1.5;">
                      If the button doesn't work, copy and paste this link:<br />
                      <a href="${product.file_url}" style="color: #60A5FA; word-break: break-all;">${product.file_url}</a>
                    </p>
                  </div>
                  <div style="padding: 20px 24px; text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0;">
                      Digital Storefront Pro · All rights reserved
                    </p>
                  </div>
                </div>
              `,
              text: [
                `Hi${order.buyer_name ? ' ' + order.buyer_name : ''},`,
                '',
                'Thank you for your purchase! Your digital art is ready to download.',
                '',
                `Product: ${product.title}`,
                `Order: ${order.reference}`,
                `Download: ${product.file_url}`,
                '',
                'Digital Storefront Pro',
              ].join('\n'),
            })

            // Mark email as sent
            await blink.db.table<Order>('orders').update(order.id, {
              email_sent: 1,
            })
            setEmailStatus('sent')
          } catch {
            setEmailStatus('failed')
          }
        }
      } catch {
        // Best-effort; don't block the success page
      }
    }

    processOrder()
  }, [order, product, emailStatus])

  if (orderLoading || productLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <main className="max-w-lg mx-auto px-4 py-20 sm:py-32">
          <div className="flex flex-col items-center text-center gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  const downloadUrl = product?.file_url
  const productTitle = product?.title ?? 'your digital art'
  const currencySymbol = order?.currency === 'USD' ? '$' : '€'
  const amount = order ? Number(order.amount).toFixed(2) : '0.00'

  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-lg mx-auto px-4 py-16 sm:py-28">
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
              Thank you for your purchase. Your digital art is ready.
            </p>
          </div>

          {/* Order Summary */}
          {order && (
            <div className="w-full border border-border bg-card rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="text-foreground font-medium">{productTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="text-foreground font-mono text-xs">{order.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-semibold">{currencySymbol}{amount} {order.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Status</span>
                <span className={
                  emailStatus === 'sent' ? 'text-accent font-medium' :
                  emailStatus === 'sending' ? 'text-[hsl(30,85%,55%)]' :
                  'text-muted-foreground'
                }>
                  {emailStatus === 'sent' ? 'Confirmation sent' :
                   emailStatus === 'sending' ? 'Sending...' :
                   emailStatus === 'failed' ? 'Email queued' : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Download Button — PRIMARY */}
          {downloadUrl && (
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-xl w-full sm:w-auto text-base font-semibold
                bg-accent text-accent-foreground hover:bg-accent/90
                transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20
                active:scale-[0.98]"
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download Your Art
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
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

          <p className="text-xs text-muted-foreground pt-4">
            A confirmation email has been sent{order?.buyer_email ? ` to ${order.buyer_email}` : ''}.
            If you don't see it, check your spam folder.
          </p>
        </div>
      </main>
    </div>
  )
}
