export interface Tech {
  key: string
  name: string
  family: string
  generation: number
  needs: string[]
  tagline: string
  sub: string
  description: string
  chips: string[]
  fits: string[]
  technology_label: string
  on_rack: boolean
  sort: number
}

export interface Collab {
  key: string
  name: string
  available: boolean
  sort: number
}

export interface LabStats {
  systems: number
  on_rack: number
  est_year: number
}

export interface ImageSet {
  src: string
  srcset: string
  width: number
  height: number
}

export interface GalleryItem {
  id: string
  category: string
  alt: string
  caption: string
  image: ImageSet
}

export interface AdminGalleryItem extends GalleryItem {
  // Optional English text, empty means the English site shows alt and caption (FR-115)
  alt_en: string
  caption_en: string
  visible: boolean
  sort: number
  created_at: string
}

export type TestimonialSource = 'shopee' | 'tiktok_shop'

export interface Testimonial {
  id: string
  source: TestimonialSource
  review_date: string
  tech_key: string | null
  rating: number | null
  transcript: string
  // Language the buyer wrote in, transcripts are never translated (FR-115)
  lang: 'id' | 'en'
  image: ImageSet
}

export interface AdminTestimonial extends Testimonial {
  blurred_confirmed: boolean
  published: boolean
  created_at: string
}

export interface SizeChart {
  key: string
  title: string
  rows: string
  note: string
  updated_at: string
}

export type InquiryKind = 'wholesale' | 'collaboration'
export type InquiryStatus = 'new' | 'contacted' | 'done' | 'spam'

export interface InquiryInput {
  kind: InquiryKind
  name: string
  org: string
  city: string
  phone: string
  email: string
  channels: string
  techs: string[]
  quantity_note: string
  message: string
  consent: boolean
  website: string
}

export interface Inquiry {
  id: string
  code: string
  kind: InquiryKind
  name: string
  org: string
  city: string
  phone: string
  email: string
  channels: string
  techs: string[]
  quantity_note: string
  message: string
  consent_at: string
  status: InquiryStatus
  created_at: string
}

export interface AuditEntry {
  id: number
  action: string
  entity: string
  entity_id: string
  at: string
  username: string | null
}

export interface AdminSession {
  username: string
  csrf_token: string
}
