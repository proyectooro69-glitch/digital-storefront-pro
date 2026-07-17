import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button, DialogFooter, Input, Textarea, Switch,
} from '@blinkdotnew/ui'
import { DollarSign, Link as LinkIcon, Image } from 'lucide-react'
import { useMemo } from 'react'
import type { Product } from '@/types'
import { toDirectImageUrl } from '@/lib/utils'

export const productSchema = z.object({
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

export type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product: Product | null
  isPending: boolean
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
}

export function ProductForm({ product, isPending, onSubmit, onCancel }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title ?? '',
      description: product?.description ?? '',
      category: product?.category ?? '',
      price_usd: Number(product?.price_usd) ?? 0,
      price_eur: Number(product?.price_eur) ?? 0,
      tropipay_url_usd: product?.tropipay_url_usd ?? '',
      tropipay_url_eur: product?.tropipay_url_eur ?? '',
      cover_image: product?.cover_image ?? '',
      file_url: product?.file_url ?? '',
      file_name: product?.file_name ?? '',
      is_published: product ? product.is_published === 1 : false,
    },
  })

  const coverImageRaw = form.watch('cover_image')
  const coverImageSrc = useMemo(() => toDirectImageUrl(coverImageRaw || ''), [coverImageRaw])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <Input {...form.register('title')} placeholder="Product name" className="w-full" />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
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
        <Input {...form.register('category')} placeholder="e.g. Ebooks, Code, Design" className="w-full" />
      </div>

      {/* Prices */}
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
            <p className="text-xs text-destructive">{form.formState.errors.price_usd.message}</p>
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
            <p className="text-xs text-destructive">{form.formState.errors.price_eur.message}</p>
          )}
        </div>
      </div>

      {/* TropiPay URLs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            TropiPay URL (USD)
          </label>
          <Input {...form.register('tropipay_url_usd')} placeholder="https://..." className="w-full" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            TropiPay URL (EUR)
          </label>
          <Input {...form.register('tropipay_url_eur')} placeholder="https://..." className="w-full" />
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1">
          <Image className="h-3 w-3" />
          Cover Image URL
        </label>
        <Input {...form.register('cover_image')} placeholder="https://... (or Google Drive link)" className="w-full" />
        {coverImageSrc && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border w-32 h-24 bg-muted">
            <img
              src={coverImageSrc}
              alt="Cover preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
      </div>

      {/* File fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            File URL
          </label>
          <Input {...form.register('file_url')} placeholder="https://..." className="w-full" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">File Name</label>
          <Input {...form.register('file_name')} placeholder="product.zip" className="w-full" />
        </div>
      </div>

      {/* Published toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <label className="text-sm font-medium text-foreground">Published</label>
          <p className="text-xs text-muted-foreground">Make this product visible to customers</p>
        </div>
        <Switch
          checked={form.watch('is_published')}
          onCheckedChange={(checked) => form.setValue('is_published', checked, { shouldValidate: true })}
        />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent" />
              Saving...
            </>
          ) : product ? (
            'Update Product'
          ) : (
            'Create Product'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
