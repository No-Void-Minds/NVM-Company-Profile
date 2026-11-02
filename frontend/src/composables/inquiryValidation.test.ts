import { describe, expect, it } from 'vitest'
import type { InquiryInput } from '@/api/types'
import { validateInquiry } from './inquiryValidation'

const valid = (): InquiryInput => ({
  kind: 'wholesale',
  name: 'UJI Budi',
  org: 'Toko Uji',
  city: 'Bandung',
  phone: '081234567890',
  email: '',
  channels: '',
  techs: [],
  quantity_note: '',
  message: 'Pesan uji yang cukup panjang.',
  consent: true,
  website: '',
})

describe('validateInquiry', () => {
  it('accepts a valid form', () => {
    expect(validateInquiry(valid())).toEqual({})
  })

  it.each([
    ['name', { name: 'A' }],
    ['org', { org: '' }],
    ['city', { city: '' }],
    ['phone', { phone: '0712345678' }],
    ['phone', { phone: '081234567' }],
    ['phone', { phone: '0812345678901234' }],
    ['phone', { phone: '', email: '' }],
    ['email', { email: 'bukan-email' }],
    ['message', { message: 'pendek' }],
    ['consent', { consent: false }],
  ])('flags %s for %j', (field, change) => {
    expect(validateInquiry({ ...valid(), ...change })[field]).toBeTruthy()
  })

  it('takes either contact and ignores separators', () => {
    expect(validateInquiry({ ...valid(), phone: '', email: 'uji@example.com' })).toEqual({})
    expect(validateInquiry({ ...valid(), phone: '+62 812-3456-7890' })).toEqual({})
  })
})
