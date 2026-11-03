import { describe, expect, it } from 'vitest'
import type { Tech } from '@/api/types'
import { handleize, newUuid, sizeChartKey, techLink, techName, whatsappUrl } from './site'

describe('handleize', () => {
  it('turns names into lowercase keys', () => {
    expect(handleize('Mini Fitted')).toBe('mini-fitted')
    expect(handleize('Toy Story')).toBe('toy-story')
  })
})

describe('tech links', () => {
  const tech = {
    links: [
      { fit: 'Regular', url: 'https://shopee.co.id/a' },
      { fit: null, url: 'https://shopee.co.id/b' },
    ],
  } as Tech
  it('finds the link of a fit, or the fit-less link', () => {
    expect(techLink(tech, 'Regular')).toBe('https://shopee.co.id/a')
    expect(techLink(tech, 'Fitted')).toBeUndefined()
    expect(techLink(tech, null)).toBe('https://shopee.co.id/b')
  })
})

describe('size chart keys', () => {
  it('uses tech-fit, or the tech alone when it has no fit', () => {
    expect(sizeChartKey('aezy', 'Regular')).toBe('aezy-regular')
    expect(sizeChartKey('curflex', 'Mini Fitted')).toBe('curflex-mini-fitted')
    expect(sizeChartKey('antshell', null)).toBe('antshell')
  })
})

describe('brand text', () => {
  it('puts the trademark after the tech name', () => {
    expect(techName('AEZY')).toBe('AEZY™')
  })

  it('encodes the WhatsApp message', () => {
    expect(whatsappUrl('Halo NVM, B2B-7KQ4M2')).toBe(
      'https://wa.me/6282111228700?text=Halo%20NVM%2C%20B2B-7KQ4M2',
    )
  })
})

describe('newUuid', () => {
  it('produces distinct version 4 UUIDs', () => {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    const a = newUuid()
    expect(a).toMatch(pattern)
    expect(newUuid()).not.toBe(a)
  })
})
