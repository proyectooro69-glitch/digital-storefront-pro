import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { blink } from '@/blink/client'
import { Page, PageHeader, PageTitle, PageBody, Card, CardContent, Badge, Button, Skeleton } from '@blinkdotnew/ui'
import { Shield, ShoppingBag, DollarSign, TrendingUp, Package, ArrowRight, BarChart3, Receipt } from 'lucide-react'
import type { Order, Product } from '@/types'
import { isAdminEmail } from '@/config/admin'

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async ({ context }) => {
    // Wait for auth to resolve before checking
    const user = blink.auth.isAuthenticated() ? await blink.auth.me().catch(() => null) : null
    if (!isAdminEmail(user?.email)) {
      throw redirect({ to: '/_app/dashboard' })
    }
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
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
    if (!products) return new Map<number, string>()
    const map = new Map<number, string>()
    for (const p of products) {
      map.set(p.id, p.title)
    }
    return map
  }, [products])

  // ── KPI computations ──
  const kpis = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : []
    const totalOrders = safe.length
    const completedOrders = safe.filter((o) => o.status === 'completed').length
    const revenueUSD = safe
      .filter((o) => o.status === 'completed' && o.currency === 'USD')
      .reduce((sum, o) => sum + Number(o.amount), 0)
    const revenueEUR = safe
      .filter((o) => o.status === 'completed' && o.currency === 'EUR')
      .reduce((sum, o) => sum + Number(o.amount), 0)
    return { totalOrders, completedOrders, revenueUSD, revenueEUR }
  }, [orders])

  const recentOrders = useMemo(() => {
    if (!orders) return []
    return orders.slice(0, 10)
  }, [orders])

  // ── Status badge variants ──
  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'outline'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return d
    }
  }

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <PageTitle>Admin Dashboard</PageTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overview of your digital storefront performance
            </p>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* ── KPI Cards Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ordersLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            : (
              <>
                {/* Total Orders */}
                <Card className="group transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total Orders
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      {kpis.totalOrders}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      <span>All-time orders</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Completed Orders */}
                <Card className="group transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-accent/10 p-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Completed
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-accent tracking-tight">
                      {kpis.completedOrders}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Receipt className="h-3 w-3" />
                      <span>
                        {kpis.totalOrders > 0
                          ? `${((kpis.completedOrders / kpis.totalOrders) * 100).toFixed(0)}% conversion`
                          : 'No data'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue USD */}
                <Card className="group transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Revenue USD
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      ${kpis.revenueUSD.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Completed orders only</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue EUR */}
                <Card className="group transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Revenue EUR
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      €{kpis.revenueEUR.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Completed orders only</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
        </div>

        {/* ── Quick Nav Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            to="/_app/admin/products"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5
              transition-all duration-300
              hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:bg-card/80
              active:scale-[0.98]"
          >
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Manage Products</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add, edit, or remove products from your catalog
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>

          <Link
            to="/_app/admin/orders"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5
              transition-all duration-300
              hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:bg-card/80
              active:scale-[0.98]"
          >
            <div className="rounded-lg bg-accent/10 p-2.5">
              <Receipt className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Orders & Webhooks</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitor orders, view webhook data, manage statuses
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        </div>

        {/* ── Recent Orders Table ── */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Recent Orders
              </h3>
              <Link
                to="/_app/admin/orders"
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !Array.isArray(orders) || orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="rounded-full bg-card border border-border p-3">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Orders will appear here once customers start purchasing products.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Reference
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Product
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Currency
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border/50 hover:bg-card/50 transition-colors duration-150"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-foreground">
                          {order.reference}
                        </td>
                        <td className="px-5 py-3 text-foreground max-w-[200px] truncate">
                          {productMap.get(order.product_id) ?? `ID: ${order.product_id}`}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-muted-foreground">
                            {order.currency}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground font-medium">
                          {order.currency === 'USD' ? '$' : '€'}
                          {Number(order.amount).toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={statusVariant(order.status) as 'default' | 'outline' | 'destructive' | 'secondary'}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </Page>
  )
}
