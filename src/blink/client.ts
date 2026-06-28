import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'digital-storefront-pro-7hou9jge',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_Ym722IpPaP7NRMOqYW4UzUXcf4y0Ikef',
  authRequired: false,
  auth: { mode: 'managed' },
})
