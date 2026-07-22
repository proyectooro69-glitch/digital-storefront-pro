import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo, useRef, useCallback } from 'react'
import { blink } from '@/blink/client'
import type { Product } from '@/types'
import {
  Page, PageHeader, PageTitle, PageActions, PageBody,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DataTable, EmptyState, toast,
} from '@blinkdotnew/ui'
import { Plus, Package } from 'lucide-react'
import { isAdminEmail } from '@/config/admin'
import { ProductForm, type ProductFormData } from '@/components/admin/ProductForm'
import { ProductDeleteDialog } from '@/components/admin/ProductDeleteDialog'
import { createProductColumns } from '@/components/admin/ProductColumns'

export const Route = createFileRoute('/_app/admin/products')({
  beforeLoad: async () => {
    const user = blink.auth.isAuthenticated() ? await blink.auth.me().catch(() => null) : null
    if (!isAdminEmail(user?.email)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminProducts,
})

function AdminProducts() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Track dialog key so Radix fully remounts the portal on every open
  const [dialogKey, setDialogKey] = useState(0)

  // Ref to avoid stale closure in mutationFn
  const editingProductRef = useRef<Product | null>(null)
  editingProductRef.current = editingProduct

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const result = await blink.db.table<Product>('products').list()
      return Array.isArray(result) ? result : []
    },
  })

  const closeDialog = useCallback(() => {
    // Only close if the dialog is actually open to avoid double-unmount
    setDialogOpen(false)
    // Delay clearing editingProduct to let the portal fully unmount first
    setTimeout(() => {
      setEditingProduct(null)
    }, 0)
  }, [])

  const openCreateDialog = useCallback(() => {
    setEditingProduct(null)
    setDialogKey((k) => k + 1)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((product: Product) => {
    setEditingProduct(product)
    setDialogKey((k) => k + 1)
    setDialogOpen(true)
  }, [])

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = { ...data, is_published: data.is_published ? 1 : 0 }
      // Read from ref to avoid stale closure
      const current = editingProductRef.current
      if (current) {
        return blink.db.table<Product>('products').update(current.id, payload)
      }
      return blink.db.table<Product>('products').create(payload)
    },
    onSuccess: () => {
      const isEdit = editingProductRef.current !== null
      toast.success(isEdit ? 'Product updated' : 'Product created', {
        description: isEdit
          ? 'The product has been updated successfully.'
          : 'The product has been added to your catalog.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      closeDialog()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[AdminProducts] Save failed:', error)
      toast.error('Failed to save product', {
        description: message || 'Something went wrong. Please try again.',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => blink.db.table<Product>('products').delete(id),
    onSuccess: () => {
      toast.success('Product deleted', {
        description: 'The product has been removed from your catalog.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setDeleteConfirmOpen(false)
      setDeletingProduct(null)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[AdminProducts] Delete failed:', error)
      toast.error('Failed to delete product', {
        description: message || 'Something went wrong. Please try again.',
      })
    },
  })

  const columns = useMemo(
    () => createProductColumns(openEditDialog, (product) => {
      setDeletingProduct(product)
      setDeleteConfirmOpen(true)
    }),
    [openEditDialog],
  )

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
            onClick={openCreateDialog}
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
            action={{
              label: 'Add Product',
              onClick: openCreateDialog,
            }}
          />
        ) : (
          <DataTable columns={columns} data={safeData} />
        )}
      </PageBody>

      {/* ── Create / Edit Dialog ── */}
      <Dialog key={dialogKey} open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product details below.'
                : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>

          <ProductForm
            key={dialogKey}
            product={editingProduct}
            isPending={saveMutation.isPending}
            onSubmit={(data) => saveMutation.mutate(data)}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <ProductDeleteDialog
        product={deletingProduct}
        open={deleteConfirmOpen}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          if (deletingProduct) deleteMutation.mutate(deletingProduct.id)
        }}
      />
    </Page>
  )
}
