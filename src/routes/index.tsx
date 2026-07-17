import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { blink } from '@/blink/client'
import { Button, Badge, Input } from '@blinkdotnew/ui'
import { Store, Search, Package, Tag } from 'lucide-react'
import type { Product } from '@/types'
import { toDirectImageUrl } from '@/lib/utils'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Arte Digital Premium · Storefront Pro' },
      { name: 'description', content: 'Arte digital premium para decorar tu hogar. Colecciones de imágenes en alta resolución listas para descargar, imprimir y enmarcar.' },
      { property: 'og:title', content: 'Arte Digital Premium para tu Hogar' },
      { property: 'og:description', content: 'Colecciones exclusivas de imágenes en alta resolución listas para descargar, imprimir y enmarcar.' },
    ],
  }),
  component: StorefrontHome,
})

function StorefrontHome() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'published'],
    queryFn: async () => {
      const result = await blink.db.table<Product>('products').list({
        where: { is_published: '1' },
      })
      return Array.isArray(result) ? result : []
    },
  })

  // Derive unique categories
  const categories = useMemo(() => {
    if (!products || !Array.isArray(products)) return ['All']
    const cats = products.map((p) => p.category).filter(Boolean)
    return ['All', ...Array.from(new Set(cats))]
  }, [products])

  // Filter products
  const filtered = useMemo(() => {
    if (!products || !Array.isArray(products)) return []
    return products.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, activeCategory])

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Hero Section ── */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <Package className="h-3.5 w-3.5" />
              Arte Digital Descargable
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground font-[family-name:var(--font-serif)] tracking-tight max-w-3xl leading-tight">
              Arte Digital Premium para tu Hogar
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Colecciones exclusivas de imágenes en alta resolución listas para descargar, imprimir y enmarcar.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 rounded-full px-6">
                <Link to="/" className="no-underline">
                  <Store className="h-4 w-4" />
                  Browse Catalog
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* ── Search + Filters ── */}
        <section className="mb-10 space-y-5">
          {/* Search */}
          <div className="relative max-w-md mx-auto sm:mx-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar arte digital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:border-primary/40 hover:bg-primary/5'
                  }
                  active:scale-95
                `}
              >
                {cat === 'All' ? (
                  <Tag className="h-3.5 w-3.5" />
                ) : null}
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── Product Grid ── */}
        <section>
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-16 bg-muted rounded-full" />
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="h-6 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && products && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="rounded-full bg-card border border-border p-5">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground font-[family-name:var(--font-serif)]">
                No products available yet
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Check back soon — new digital products are added regularly.
              </p>
            </div>
          )}

          {/* Empty filtered results */}
          {!isLoading && products && products.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="rounded-full bg-card border border-border p-5">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground font-[family-name:var(--font-serif)]">
                No products match your search
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Try adjusting your search or category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearch(''); setActiveCategory('All'); }}
                className="gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            </div>
          )}

          {/* Product Cards */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <Link
                  key={product.id}
                  to="/products/$id"
                  params={{ id: String(product.id) }}
                  className="group block rounded-xl border border-border bg-card overflow-hidden
                    transition-all duration-300
                    hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30
                    active:scale-[0.98]"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {product.cover_image ? (
                      <img
                        src={toDirectImageUrl(product.cover_image)}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-serif)] leading-snug line-clamp-2
                      group-hover:text-primary transition-colors duration-200">
                      {product.title}
                    </h3>

                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-2xl font-bold text-accent">
                        ${product.price_usd.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">USD</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span>Digital Storefront Pro</span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/admin"
              className="text-xs text-muted-foreground/60 hover:text-primary/70 transition-colors"
            >
              Admin
            </Link>
            <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
