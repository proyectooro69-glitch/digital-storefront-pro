import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { blink } from '@/blink/client'
import type { Product } from '@/types'
import {
  Page, PageHeader, PageTitle, PageActions, PageBody,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Textarea, Switch, Badge, DataTable, EmptyState, toast,
} from '@blinkdotnew/ui'
import { Plus, Pencil, Trash2, Package, Image, Link, DollarSign } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

// ── Zod Schema ──
const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  price_usd: z.coerce.number({ invalid_type_error: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  price_eur: z.coerce.number({ invalid_type_error: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  tropipay_url_usd: z.string().optional().default(''),
  tropipay_url_eur: z.string().optional().default(''),
  cover_image: z.string().optional().default(''),
  file_url: z.string().optional().default(''),
  file_name: z.string().optional().default(''),
  is_published: z.coerce.boolean().optional().default(false),
})

type ProductFormData = z.infer<typeof productSchema>

export const Route = createFileRoute('/_app/admin/products')({
  component: AdminProducts,
})

function AdminProducts() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // ── Fetch products ──
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const result = await blink.db.table<Product>('products').list()
      return Array.isArray(result) ? result : []
    },
  })

  // ── Form ──
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price_usd: 0,
      price_eur: 0,
      tropipay_url_usd: '',
      tropipay_url_eur: '',
      cover_image: '',
      file_url: '',
      file_name: '',
      is_published: false,
    },
  })

  // ── Create / Update Mutation ──
  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        ...data,
        is_published: data.is_published ? 1 : 0,
      }
      if (editingProduct) {
        return blink.db.table<Product>('products').update(editingProduct.id, payload)
      }
      return blink.db.table<Product>('products').create(payload)
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated' : 'Product created', {
        description: editingProduct
          ? 'The product has been updated successfully.'
          : 'The product has been added to your catalog.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setDialogOpen(false)
      setEditingProduct(null)
      form.reset()
    },
    onError: () => {
      toast.error('Failed to save product', {
        description: 'Something went wrong. Please try again.',
      })
    },
  })

  // ── Delete Mutation ──
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return blink.db.table<Product>('products').delete(id)
    },
    onSuccess: () => {
      toast.success('Product deleted', {
        description: 'The product has been removed from your catalog.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setDeleteConfirmOpen(false)
      setDeletingProduct(null)
    },
    onError: () => {
      toast.error('Failed to delete product', {
        description: 'Something went wrong. Please try again.',
      })
    },
  })

  // ── Open create dialog ──
  const openCreate = () => {
    setEditingProduct(null)
    form.reset({
      title: '',
      description: '',
      category: '',
      price_usd: 0,
      price_eur: 0,
      tropipay_url_usd: '',
      tropipay_url_eur: '',
      cover_image: '',
      file_url: '',
      file_name: '',
      is_published: false,
    })
    setDialogOpen(true)
  }

  // ── Open edit dialog ──
  const openEdit = (product: Product) => {
    setEditingProduct(product)
    form.reset({
      title: product.title ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      price_usd: Number(product.price_usd) ?? 0,
      price_eur: Number(product.price_eur) ?? 0,
      tropipay_url_usd: product.tropipay_url_usd ?? '',
      tropipay_url_eur: product.tropipay_url_eur ?? '',
      cover_image: product.cover_image ?? '',
      file_url: product.file_url ?? '',
      file_name: product.file_name ?? '',
      is_published: product.is_published === 1,
    })
    setDialogOpen(true)
  }

  // ── Open delete confirmation ──
  const openDelete = (product: Product) => {
    setDeletingProduct(product)
    setDeleteConfirmOpen(true)
  }

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data)
  }

  // ── Column defs ──
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {row.original.cover_image ? (
            <img
              src={row.original.cover_image}
              alt=""
              className="h-8 w-8 rounded-md object-cover shrink-0 border border-border"
            />
          ) : (
            <div className="h-8 w-8 rounded-md bg-muted shrink-0 flex items-center justify-center border border-border">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
          <span className="truncate text-foreground font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs">{getValue<string>() || '—'}</span>
      ),
    },
    {
      accessorKey: 'price_usd',
      header: 'Price USD',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-foreground font-medium">
          ${Number(getValue()).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'price_eur',
      header: 'Price EUR',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-foreground font-medium">
          €{Number(getValue()).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue<number>() === 1 ? (
          <Badge variant="default">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row.original)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Edit product"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDelete(row.original)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const safeData = Array.isArray(products) ? products : []

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <PageTitle>Manage Products</PageTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add, edit, or remove products from your catalog
            </p>
          </div>
        </div>
        <PageActions>
          <Button
            onClick={openCreate}
            className="gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : safeData.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No products yet"
            description="Add your first product to start selling."
            action={{ label: 'Add Product', onClick: openCreate }}
          />
        ) : (
          <DataTable columns={columns} data={safeData} />
        )}
      </PageBody>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product details below.'
                : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                {...form.register('title')}
                placeholder="Product name"
                className="w-full"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                {...form.register('description')}
                placeholder="Product description..."
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <Input
                {...form.register('category')}
                placeholder="e.g. Ebooks, Code, Design"
                className="w-full"
              />
            </div>

            {/* Price fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Price USD <span className="text-destructive">*</span>
                </label>
                <Input
                  {...form.register('price_usd')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full"
                />
                {form.formState.errors.price_usd && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.price_usd.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Price EUR <span className="text-destructive">*</span>
                </label>
                <Input
                  {...form.register('price_eur')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full"
                />
                {form.formState.errors.price_eur && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.price_eur.message}
                  </p>
                )}
              </div>
            </div>

            {/* TropiPay URLs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  TropiPay URL (USD)
                </label>
                <Input
                  {...form.register('tropipay_url_usd')}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  TropiPay URL (EUR)
                </label>
                <Input
                  {...form.register('tropipay_url_eur')}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Image className="h-3 w-3" />
                Cover Image URL
              </label>
              <Input
                {...form.register('cover_image')}
                placeholder="https://..."
                className="w-full"
              />
              {form.watch('cover_image') && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border w-32 h-24 bg-muted">
                  <img
                    src={form.watch('cover_image')}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* File fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  File URL
                </label>
                <Input
                  {...form.register('file_url')}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">File Name</label>
                <Input
                  {...form.register('file_name')}
                  placeholder="product.zip"
                  className="w-full"
                />
              </div>
            </div>

            {/* Published toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <label className="text-sm font-medium text-foreground">Published</label>
                <p className="text-xs text-muted-foreground">
                  Make this product visible to customers
                </p>
              </div>
              <Switch
                checked={form.watch('is_published')}
                onCheckedChange={(checked) =>
                  form.setValue('is_published', checked, { shouldValidate: true })
                }
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setEditingProduct(null)
                  form.reset()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </>
                ) : editingProduct ? (
                  'Update Product'
                ) : (
                  'Create Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingProduct?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeletingProduct(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingProduct) deleteMutation.mutate(deletingProduct.id)
              }}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-destructive-foreground border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
