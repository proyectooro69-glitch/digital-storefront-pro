import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { blink } from '@/blink/client'
import {
  Page, PageHeader, PageTitle, PageBody,
  Card, CardContent, Badge, Button, Skeleton, toast, EmptyState,
} from '@blinkdotnew/ui'
import { Receipt, ShoppingBag, ArrowLeft, Mail, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react'
import type { Order, Product } from '@/types'
import { isAdminEmail } from '@/config/admin'

export const Route = createFileRoute('/_app/admin/orders')({
  beforeLoad: async () => {
    const user = blink.auth.isAuthenticated() ? await blink.auth.me().catch(() => null) : null
    if (!isAdminEmail(user?.email)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminOrders,
})

function AdminOrders() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const result = await blink.db.table<Order>('orders').list({
        orderBy: { created_at: 'desc' },
      })
      return Array.isArray(result) ? result : []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const result = await blink.db.table<Product>('products').list()
      return Array.isArray(result) ? result : []
    },
  })

  const productMap = useMemo(() => {
    const map = new Map<number, Product>()
    if (products) {
      for (const p of products) map.set(p.id, p)
    }
    return map
  }, [products])

  // Resend email mutation
  const resendMutation = useMutation({
    mutationFn: async (order: Order) => {
      const product = productMap.get(order.product_id)
      if (!product) throw new Error('Product not found')

      await blink.notifications.email({
        to: order.buyer_email,
        subject: `Your Download: ${product.title}`,
        html: [
          `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">`,
          `<div style="background:#0F172A;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">`,
          `<h1 style="color:#F8FAFC;margin:0;font-size:22px;">Arte Digital Premium</h1>`,
          `<p style="color:#94A3B8;margin:8px 0 0;font-size:14px;">Your digital art is ready!</p>`,
          `</div>`,
          `<div style="background:#1E293B;padding:32px 24px;border-radius:0 0 12px 12px;">`,
          `<p style="color:#E2E8F0;font-size:16px;">Hi${order.buyer_name ? ' ' + order.buyer_name : ''},</p>`,
          `<p style="color:#CBD5E1;font-size:14px;line-height:1.6;">Your payment has been confirmed. Here is your download link:</p>`,
          `<div style="background:#0F172A;border-radius:8px;padding:16px;margin:20px 0;">`,
          `<p style="color:#F8FAFC;font-size:15px;font-weight:600;margin:0;">${product.title}</p>`,
          `<p style="color:#64748B;font-size:13px;margin:4px 0 0;">Order: ${order.reference}</p>`,
          `</div>`,
          `<a href="${product.file_url}" style="display:inline-block;background:#2563EB;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Download Your Art</a>`,
          `<p style="color:#64748B;font-size:12px;margin:20px 0 0;">Or copy: ${product.file_url}</p>`,
          `</div></div>`,
        ].join(''),
        text: `Hi${order.buyer_name ? ' ' + order.buyer_name : ''},\n\nYour payment has been confirmed for: ${product.title}\n\nOrder: ${order.reference}\nDownload: ${product.file_url}\n\nDigital Storefront Pro`,
      })

      await blink.db.table<Order>('orders').update(order.id, { email_sent: 1 })
    },
    onSuccess: () => {
      toast.success('Email resent', { description: 'Confirmation email sent successfully.' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
    onError: () => {
      toast.error('Failed to send', { description: 'Could not resend the email.' })
    },
  })

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'pending': return 'outline'
      case 'failed': return 'destructive'
      default: return 'secondary'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'pending': return Clock
      case 'failed': return XCircle
      default: return Clock
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return d }
  }

  const safeData = Array.isArray(orders) ? orders : []

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Receipt className="h-5 w-5 text-accent" />
          </div>
          <div>
            <PageTitle>Order Monitor</PageTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full traceability of every sale — buyer details, status, and email delivery
            </p>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : safeData.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="No orders yet"
            description="Orders will appear here once customers start purchasing."
          />
        ) : (
          <div className="space-y-4">
            {safeData.map((order) => {
              const product = productMap.get(order.product_id)
              const StatusIcon = statusIcon(order.status)
              const symbol = order.currency === 'USD' ? '$' : '€'

              return (
                <Card key={order.id} className="group border-border hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      {/* Top row: Reference + Status + Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-foreground font-semibold">
                            {order.reference}
                          </span>
                          <Badge variant={statusVariant(order.status) as 'default' | 'outline' | 'destructive' | 'secondary'} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {order.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                      </div>

                      {/* Middle row: Product + Amount + Buyer */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Product</span>
                          <p className="text-foreground font-medium truncate">
                            {product?.title ?? `ID: ${order.product_id}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Amount</span>
                          <p className="text-foreground font-semibold tabular-nums">
                            {symbol}{Number(order.amount).toFixed(2)} {order.currency}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Buyer</span>
                          <p className="text-foreground truncate">
                            {order.buyer_name || '—'}
                            {order.buyer_email && (
                              <span className="text-muted-foreground ml-1 text-xs">{order.buyer_email}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Bottom row: Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                        {order.buyer_email && Number(order.email_sent) === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8 text-xs"
                            onClick={() => resendMutation.mutate(order)}
                            disabled={resendMutation.isPending}
                          >
                            <Mail className="h-3 w-3" />
                            Resend Email
                          </Button>
                        )}
                        {Number(order.email_sent) === 1 && (
                          <span className="text-xs text-accent flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Email sent
                          </span>
                        )}
                        {order.status === 'completed' && product?.file_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 h-8 text-xs text-primary hover:text-primary/80"
                            onClick={() => window.open(product.file_url!, '_blank', 'noopener,noreferrer')}
                          >
                            <ShoppingBag className="h-3 w-3" />
                            View Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </PageBody>
    </Page>
  )
}
