export interface Product {
  id: number
  title: string
  description: string
  category: string
  price_usd: number
  price_eur: number
  tropipay_url_usd: string
  tropipay_url_eur: string
  cover_image: string
  file_url: string
  file_name: string
  is_published: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  reference: string
  product_id: number
  user_id: string
  currency: 'USD' | 'EUR'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  webhook_data: string
  buyer_name: string
  buyer_email: string
  email_sent: number
  created_at: string
  updated_at: string
}

export interface OrderWithProduct extends Order {
  product_title?: string
  product_cover?: string
  file_url?: string
  file_name?: string
}
