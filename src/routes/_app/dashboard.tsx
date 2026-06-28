import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import { useAuth } from '@/hooks/useAuth'
import { Badge, Button, Card, CardContent, EmptyState, Skeleton } from '@blinkdotnew/ui'
import { ShoppingBag, Download, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Order, Product } from '@/types'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

// ── Status badge configuration ──
function getStatusConfig(status: Order['status']) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-accent/15 text-accent border-accent/30',
      } as const
    case 'pending':
      return {
        label: 'Pending',
        icon: Clock,
        className: 'bg-[hsl(30,85%,55%)]/10 text-[hsl(30,85%,55%)] border-[hsl(30,85%,55%)]/25',
      } as const
    case 'failed':
      return {
        label: 'Failed',
        icon: XCircle,
        className: 'bg-destructive/15 text-destructive border-destructive/30',
      } as const
  }
}

// ── Dashboard Page ──
function DashboardPage() {
  const { user } = useAuth()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return []
      const result = await blink.db.table<Order>('orders').list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      })
      return result ?? []
    },
    enabled: !!user,
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-serif)]">
          My Orders
        </h1>
      </div>

      {/* Loading State — 3 skeleton cards */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2.5 pt-0.5">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-36" />
                    <div className="flex gap-2 pt-0.5">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders && orders.length === 0 && (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12 text-muted-foreground" />}
          title="No orders yet"
          description="Browse the store to find digital products you love."
          action={{ label: 'Browse Store', onClick: () => window.location.assign('/') }}
        />
      )}

      {/* Order Cards */}
      {!isLoading && orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Order Card Sub-Component ──
// Each card fetches its own product to avoid N+1 batching complexity.
function OrderCard({ order }: { order: Order }) {
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', order.product_id],
    queryFn: async () => {
      const result = await blink.db.table<Product>('products').get(order.product_id)
      return result ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  const status = getStatusConfig(order.status)
  const StatusIcon = status.icon

  const dateFormatted = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const currencySymbol = order.currency === 'USD' ? '$' : '€'

  return (
    <Card className="group border-border hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Product Cover Thumbnail */}
          {productLoading ? (
            <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
          ) : product?.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.title ?? 'Product'}
              className="w-20 h-20 rounded-lg object-cover shrink-0 border border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg shrink-0 bg-muted flex items-center justify-center border border-border">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}

          {/* Order Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Product Title */}
            {productLoading ? (
              <Skeleton className="h-5 w-44" />
            ) : product ? (
              <Link
                to="/products/$id"
                params={{ id: String(product.id) }}
                className="text-foreground font-semibold hover:text-primary transition-colors line-clamp-1"
              >
                {product.title}
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm font-medium">
                Product #{order.product_id}
              </span>
            )}

            {/* Reference + Date + Amount */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Badge variant="outline" className="text-xs font-[family-name:var(--font-mono)] text-muted-foreground border-border/50">
                {order.reference}
              </Badge>
              <span className="text-muted-foreground">{dateFormatted}</span>
              <span className="text-foreground font-semibold tabular-nums">
                {currencySymbol}{order.amount.toFixed(2)}
                <span className="text-muted-foreground font-normal text-xs ml-0.5">{order.currency}</span>
              </span>
            </div>

            {/* Status Badge + Download Button */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Badge className={status.className + ' gap-1.5 text-xs'}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>

              {order.status === 'completed' && product?.file_url && (
                <Button
                  size="lg"
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90
                    transition-all duration-200
                    hover:scale-[1.03] hover:shadow-lg hover:shadow-accent/20
                    active:scale-[0.97]"
                  onClick={() => window.open(product.file_url!, '_blank', 'noopener,noreferrer')}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
