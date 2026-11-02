import type { InquiryInput } from '@/api/types'
import type { Messages } from '@/i18n'

export type InquiryErrorKey = keyof Messages['b2b']['errors']

// Same rules as backend/internal/inquiry (FR-42). The backend stays the authority.
// Returns dictionary keys, so the page shows the message in the visitor's language.
export function validateInquiry(input: InquiryInput): Record<string, InquiryErrorKey> {
  const errors: Record<string, InquiryErrorKey> = {}
  const name = input.name.trim()
  const org = input.org.trim()
  const city = input.city.trim()
  const phone = input.phone.trim().replace(/[\s\-().]/g, '')
  const email = input.email.trim()
  const message = input.message.trim()

  if (name.length < 2 || name.length > 80) errors.name = 'name'
  if (org.length < 2 || org.length > 120) errors.org = 'org'
  if (city.length < 2 || city.length > 80) errors.city = 'city'

  if (phone) {
    const digits = phone.replace('+', '').length
    if (!/^(08|\+62)\d+$/.test(phone) || digits < 10 || digits > 15) {
      errors.phone = 'phoneFormat'
    }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'emailFormat'
  if (!phone && !email) errors.phone = 'contactRequired'

  if (input.channels.trim().length > 200) errors.channels = 'channels'
  if (input.quantity_note.trim().length > 200) errors.quantity_note = 'quantity'
  if (message.length < 10 || message.length > 1000) errors.message = 'message'
  if (!input.consent) errors.consent = 'consent'
  return errors
}

// The backend names the field, not the language, so its own wording is not shown (FR-116).
const SERVER_FIELD_KEYS: Record<string, InquiryErrorKey> = {
  name: 'name',
  org: 'org',
  city: 'city',
  phone: 'phoneFormat',
  email: 'emailFormat',
  channels: 'channels',
  quantity_note: 'quantity',
  message: 'message',
  consent: 'consent',
  techs: 'techs',
}

export function serverFieldErrors(fields: Record<string, string>): Record<string, InquiryErrorKey> {
  const errors: Record<string, InquiryErrorKey> = {}
  for (const field of Object.keys(fields)) {
    const key = SERVER_FIELD_KEYS[field]
    if (key) errors[field] = key
  }
  return errors
}
