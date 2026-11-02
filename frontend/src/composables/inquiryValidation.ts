import type { InquiryInput } from '@/api/types'

// Same rules as backend/internal/inquiry (FR-42). The backend stays the authority.
export function validateInquiry(input: InquiryInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const name = input.name.trim()
  const org = input.org.trim()
  const city = input.city.trim()
  const phone = input.phone.trim().replace(/[\s\-().]/g, '')
  const email = input.email.trim()
  const message = input.message.trim()

  if (name.length < 2 || name.length > 80) errors.name = 'Nama harus 2 sampai 80 karakter.'
  if (org.length < 2 || org.length > 120) {
    errors.org = 'Nama usaha atau komunitas harus 2 sampai 120 karakter.'
  }
  if (city.length < 2 || city.length > 80) errors.city = 'Kota harus 2 sampai 80 karakter.'

  if (phone) {
    const digits = phone.replace('+', '').length
    if (!/^(08|\+62)\d+$/.test(phone) || digits < 10 || digits > 15) {
      errors.phone = 'Nomor WhatsApp harus diawali 08 atau +62, 10 sampai 15 digit.'
    }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email belum benar.'
  }
  if (!phone && !email) errors.phone = 'Isi WhatsApp atau email, salah satu cukup.'

  if (input.channels.trim().length > 200) errors.channels = 'Kanal penjualan maksimal 200 karakter.'
  if (input.quantity_note.trim().length > 200) {
    errors.quantity_note = 'Perkiraan jumlah maksimal 200 karakter.'
  }
  if (message.length < 10 || message.length > 1000) {
    errors.message = 'Pesan harus 10 sampai 1000 karakter.'
  }
  if (!input.consent) errors.consent = 'Centang persetujuan agar kami bisa memproses data ini.'
  return errors
}
