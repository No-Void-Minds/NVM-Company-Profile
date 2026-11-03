import { describe, expect, it } from 'vitest'
import { shopeeUrlError } from './shopeeUrl'

describe('shopeeUrlError', () => {
  it.each([
    '',
    'https://shopee.co.id/novoidminds',
    'https://shopee.co.id/No-Void-Minds-AEZY-Regular-T-Shirt-Core-i.462123491.25438116155',
    'https://shopee.co.id/novoidminds?shopCollection=123456789',
    'https://shopee.co.id/novoidminds?shopCollection=1&sp_atk=abc#produk',
  ])('menerima %s', (raw) => {
    expect(shopeeUrlError(raw)).toBe('')
  })

  it.each([
    'javascript:alert(1)',
    'JavaScript://shopee.co.id/%0Aalert(1)',
    'http://shopee.co.id/novoidminds',
    '//shopee.co.id/novoidminds',
    'shopee.co.id/novoidminds',
    'https://shopee.co.id.evil.com/novoidminds',
    'https://evil.com/shopee.co.id',
    'https://evilshopee.co.id/x',
    'https://www.shopee.co.id/novoidminds',
    'https://shopee.com/novoidminds',
    'https://shopee.co.id@evil.com/novoidminds',
    'https://user:pass@shopee.co.id/novoidminds',
    'https://shopee.co.id:8443/novoidminds',
    'https://SHOPEE.CO.ID/novoidminds',
    'https://evil.com\\@shopee.co.id/x',
    'https://shopee.co.id\\.evil.com/x',
    'https://shopee.co.id /x',
    'https://shopee.co.id/x\n',
    'https://shopee.co.id/x\u0000',
    'data:text/html,<script>alert(1)</script>',
    'https://shopee.co.id/' + 'a'.repeat(2100),
  ])('menolak %s', (raw) => {
    expect(shopeeUrlError(raw)).not.toBe('')
  })
})
