// Link building and brand constants shared across pages.

export const SHOP_URL = 'https://novoidminds.com'
export const WHATSAPP_NUMBER = '6282111228700'
export const WHATSAPP_DISPLAY = '+62 821-1122-8700'

export const MARKETPLACE_LINKS = [
  { label: 'Shopee', url: import.meta.env.VITE_SHOPEE_URL as string | undefined },
  { label: 'TikTok Shop', url: import.meta.env.VITE_TIKTOK_SHOP_URL as string | undefined },
].filter((link): link is { label: string; url: string } => Boolean(link.url))

export const INSTAGRAM_URL = (import.meta.env.VITE_INSTAGRAM_URL as string | undefined) || ''

export const NEED_FILTERS = [
  { key: 'hot', label: 'Runs hot' },
  { key: 'shape', label: 'Holds shape' },
  { key: 'move', label: 'Moves a lot' },
  { key: 'soft', label: 'Wants soft' },
  { key: 'cold', label: 'Runs cold' },
  { key: 'layer', label: 'Needs a layer' },
]

export function handleize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function collectionUrl(...tags: string[]): string {
  return `${SHOP_URL}/collections/all/${tags.map(handleize).join('+')}`
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function techName(name: string): string {
  return `${name}™`
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function sizeChartKey(techKey: string, fit: string | null): string {
  return fit ? `${techKey}-${handleize(fit)}` : techKey
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

export function formatDate(value: string): string {
  // A bare date would parse as UTC midnight, the time part pins it to Jakarta.
  const date = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value)
  return dateFormatter.format(date)
}

// crypto.randomUUID only exists on HTTPS, and the LAN deployment runs on plain HTTP.
export function newUuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
