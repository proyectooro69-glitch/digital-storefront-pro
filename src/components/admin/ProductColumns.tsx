import type { ColumnDef } from '@tanstack/react-table'
import { Button, Badge } from '@blinkdotnew/ui'
import { Pencil, Trash2, Package } from 'lucide-react'
import type { Product } from '@/types'

export function createProductColumns(
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void,
): ColumnDef<Product>[] {
  return [
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
        <span className="text-muted-foreground text-xs">{getValue<string>() || '\u2014'}</span>
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
          \u20ac{Number(getValue()).toFixed(2)}
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
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Edit product"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]
}
