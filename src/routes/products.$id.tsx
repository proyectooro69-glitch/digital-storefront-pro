import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { blink } from '@/blink/client'
import { Button, Badge, Input } from '@blinkdotnew/ui'
import { ArrowLeft, ExternalLink, DollarSign, User, Mail, ShoppingCart } from 'lucide-react'
import type { Product, Order } from '@/types'

export const Route = createFileRoute('/products/$id')({
  head: ({ params }) => ({
    meta: [
      { title: `Product · Arte Digital` },
      { name: 'description', content: 'View product details and purchase.' },
    ],
  }),
  component: ProductDetail,
})

function ProductDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD')
  const [isBuying, setIsBuying] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({})

  const productId = parseInt(id, 10)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const result = await blink.db.table<Product>('products').get(productId)
      return result ?? null
    },
    enabled: !isNaN(productId),
  })

  const validateForm = useCallback(() => {
    const errors: { name?: string; email?: string } = {}
    if (!buyerName.trim()) errors.name = 'Name is required'
    if (!buyerEmail.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) errors.email = 'Enter a valid email'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [buyerName, buyerEmail])

  const handleBuy = useCallback(async () => {
    if (!product || isBuying) return
    if (!validateForm()) return

    setIsBuying(true)

    try {
      const reference = `ORD-${Date.now().toString(36).toUpperCase()}`
      const amount = currency === 'USD' ? product.price_usd : product.price_eur
      const tropipayUrl = currency === 'USD' ? product.tropipay_url_usd : product.tropipay_url_eur

      // Create order record with buyer info
      await blink.db.table<Order>('orders').create({
        reference,
        product_id: product.id,
        user_id: '',
        currency,
        amount,
        status: 'pending',
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        email_sent: 0,
      })

      // Redirect to TropiPay, passing the reference for callback
      const checkoutUrl = `${tropipayUrl}${tropipayUrl.includes('?') ? '&' : '?'}reference=${reference}`
      window.location.href = checkoutUrl
    } catch {
      // Buy flow failed — user can retry
      setIsBuying(false)
    }
  }, [product, currency, isBuying, buyerName, buyerEmail, validateForm])

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-8" />
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="aspect-[16/10] bg-muted rounded-2xl animate-pulse" />
              <div className="space-y-3">
                <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
                <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="border border-border bg-card rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="h-8 w-32 bg-muted rounded" />
                <div className="h-12 w-full bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-serif)]">
            Product Not Found
          </h1>
          <p className="text-muted-foreground max-w-sm">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const price = currency === 'USD' ? product.price_usd : product.price_eur
  const currencySymbol = currency === 'USD' ? '$' : '€'

  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Store
        </Link>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ── Left: Cover Image ── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-muted">
              {product.cover_image ? (
                <img
                  src={product.cover_image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <DollarSign className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
            </div>

            <div className="space-y-4">
              <Badge variant="secondary" className="text-sm">
                {product.category}
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-[family-name:var(--font-serif)] leading-tight">
                {product.title}
              </h1>
            </div>

            {product.description && (
              <div className="max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Purchase Card ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              <div className="border border-border bg-card rounded-2xl p-6 space-y-5">
                {/* Price */}
                <div className="text-center space-y-1">
                  <span className="text-4xl sm:text-5xl font-bold text-accent">
                    {currencySymbol}{price.toFixed(2)}
                  </span>
                  <p className="text-sm text-muted-foreground">{currency}</p>
                </div>

                {/* Currency Selector */}
                <div className="flex rounded-xl border border-border p-1 bg-muted/50">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      currency === 'USD'
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    } active:scale-95`}
                  >
                    USD $
                  </button>
                  <button
                    onClick={() => setCurrency('EUR')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      currency === 'EUR'
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    } active:scale-95`}
                  >
                    EUR €
                  </button>
                </div>

                {/* ── Checkout Form (Name + Email) ── */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={buyerName}
                      onChange={(e) => { setBuyerName(e.target.value); setFormErrors((p) => ({ ...p, name: undefined })) }}
                      className={`w-full ${formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-destructive">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={buyerEmail}
                      onChange={(e) => { setBuyerEmail(e.target.value); setFormErrors((p) => ({ ...p, email: undefined })) }}
                      className={`w-full ${formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-destructive">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Buy Now Button */}
                <Button
                  onClick={handleBuy}
                  disabled={isBuying}
                  size="lg"
                  className="w-full gap-2 rounded-xl text-base font-semibold
                    transition-all duration-200
                    hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20
                    active:scale-[0.98]"
                >
                  {isBuying ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Buy Now — {currencySymbol}{price.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  You will be redirected to our secure payment processor.<br />
                  Your download link will be sent to your email after payment.
                </p>
              </div>

              {/* Product Details */}
              <div className="border border-border bg-card rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="text-foreground">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="text-foreground">Digital Download</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-foreground">Instant + Email</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
