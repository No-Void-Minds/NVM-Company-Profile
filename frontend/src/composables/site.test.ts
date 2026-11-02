import { describe, expect, it } from 'vitest'
import { collectionUrl, handleize, newUuid, sizeChartKey, techName, whatsappUrl } from './site'

describe('Shopify links', () => {
  it('handleizes tags the way the store does', () => {
    expect(handleize('Mini Fitted')).toBe('mini-fitted')
    expect(handleize('Toy Story')).toBe('toy-story')
  })

  it('builds the documented collection URLs', () => {
    expect(collectionUrl('core', 'aezy', 'Regular')).toBe(
      'https://novoidminds.com/collections/all/core+aezy+regular',
    )
    expect(collectionUrl('graphic', 'marvel')).toBe(
      'https://novoidminds.com/collections/all/graphic+marvel',
    )
    expect(collectionUrl('aezy')).toBe('https://novoidminds.com/collections/all/aezy')
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
