// Source of truth for the dictionary shape. en.ts must satisfy Messages, so a missing
// key fails vue-tsc (FR-112). Brand slogans stay English in both languages.

export const id = {
  meta: {
    home: {
      title: 'No Void Minds',
      description:
        'No Void Minds membangun technical everyday wear dari materialnya dulu. Kenali 11 material system, lini Core dan Graphic, serta peluang kerja sama B2B.',
    },
    brand: {
      title: 'Brand',
      description:
        'Cara No Void Minds bekerja: engineered to perfection, fabric first, dan tiga tahap membuat sebuah material system. Berdiri 2021 di Bandung.',
    },
    tech: {
      title: 'Teknologi',
      description:
        'Index 11 material system NVM, dari AEZY sampai MELTWRAP. Saring berdasarkan kebutuhan harianmu, lalu lihat fitur dan fit yang tersedia.',
    },
    product: {
      title: 'Produk',
      description:
        'Beda lini Core dan Graphic. Core dipilih dari tech dan fit, Graphic dari daftar collab karakter berlisensi.',
    },
    b2b: {
      title: 'B2B',
      description:
        'Dua jalur kerja sama dengan NVM: Wholesale untuk toko dan reseller, Collaboration untuk brand, komunitas, dan tim. Kirim inquiry lewat formulir.',
    },
    gallery: {
      title: 'Galeri',
      description: 'Foto lookbook, produksi, dan event No Void Minds.',
    },
    testimonial: {
      title: 'Testimoni',
      description:
        'Tangkapan layar ulasan pembeli NVM dari Shopee dan TikTok Shop, lengkap dengan transkrip teks.',
    },
    size: {
      title: 'Size',
      description:
        'Cari ukuran NVM dari tinggi badan atau dari kaos favoritmu, memakai size chart resmi per tech dan fit.',
    },
    contact: {
      title: 'Kontak',
      description:
        'Hubungi tim NVM lewat WhatsApp untuk tanya tech, wholesale, atau collaboration.',
    },
    privacy: {
      title: 'Kebijakan Privasi',
      description:
        'Data apa yang NVM simpan dari formulir B2B, tujuannya, lama penyimpanan, dan cara meminta penghapusan.',
    },
    notFound: {
      title: 'Halaman tidak ditemukan',
      description: 'Alamat yang kamu buka tidak ada di situs No Void Minds.',
    },
    password: {
      title: 'Segera hadir',
      description: 'Situs No Void Minds sedang disiapkan.',
    },
  },

  layout: {
    skip: 'Lewati ke konten',
    homeLink: 'No Void Minds, ke Beranda',
    mainMenu: 'Menu utama',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
    shop: 'Belanja di Shopify',
    darkTheme: 'Tema gelap',
    // Written in the target language, the link carries lang="en"
    switchLang: 'Read this page in English',
    pauseTicker: 'Jeda teks berjalan',
    playTicker: 'Jalankan teks berjalan',
  },

  nav: {
    brand: 'Brand',
    tech: 'Teknologi',
    product: 'Produk',
    b2b: 'B2B',
    gallery: 'Galeri',
    testimonial: 'Testimoni',
    size: 'Size',
    contact: 'Kontak',
  },

  footer: {
    contact: 'Kontak',
    store: 'Toko',
    privacy: 'Kebijakan privasi',
    whatsappMessage: 'Halo NVM, saya ingin bertanya.',
  },

  state: {
    loading: 'Memuat data',
    failed: 'Data gagal dimuat',
    retry: 'Coba lagi',
    optional: '(opsional)',
  },

  // FR-116: shown by error code, never the backend wording
  apiErrors: {
    VALIDATION: 'Ada isian yang belum benar. Periksa bagian yang ditandai.',
    NOT_FOUND: 'Data yang diminta tidak ditemukan.',
    UNAUTHORIZED: 'Silakan masuk dulu.',
    FORBIDDEN: 'Akses ditolak. Muat ulang halaman, lalu coba lagi.',
    RATE_LIMITED: 'Terlalu banyak kiriman. Coba lagi nanti, atau hubungi kami lewat WhatsApp.',
    CONFLICT: 'Data bentrok dengan perubahan lain. Muat ulang, lalu coba lagi.',
    INTERNAL: 'Terjadi kesalahan di server. Coba lagi sebentar.',
    NETWORK: 'Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.',
  },

  needs: {
    hot: 'Mudah gerah',
    shape: 'Ingin bentuk terjaga',
    move: 'Banyak bergerak',
    soft: 'Ingin yang lembut',
    cold: 'Mudah kedinginan',
    layer: 'Butuh lapisan',
  },

  cta: {
    seeSystems: 'Lihat 11 material system',
  },

  home: {
    lead: 'Kebanyakan brand menggambar kausnya dulu, baru mencari kainnya. Kami melakukannya sebaliknya.',
    labIndex: 'Lab index',
    labLoading: 'Memuat Lab index',
    labEmpty: 'Lab index belum tersedia',
    systems: 'Material system',
    onRack: 'On the rack',
    founded: 'Berdiri di Bandung',
    lineTitle: 'Core dan Graphic',
    lineBody:
      'Core berisi semua produk selain collab, dipilih dari tech dan fit. Graphic berisi produk collab karakter berlisensi, dipilih dari nama collab.',
    lineCta: 'Bandingkan Core dan Graphic',
    b2bTitle: 'B2B',
    b2bBody:
      'Punya toko, atau punya ide dan audiens? Ada dua jalur kerja sama: Wholesale dan Collaboration.',
    b2bCta: 'Kirim inquiry wholesale',
    buyersTitle: 'Kata pembeli',
    buyersCta: 'Baca semua testimoni',
    galleryTitle: 'Galeri',
    galleryCta: 'Buka galeri lengkap',
  },

  brand: {
    statement:
      'Kami membuat technical everyday wear mulai dari materialnya. Sistem kain milik sendiri direkayasa lebih dulu, lalu setiap pakaian dirancang mengikuti apa yang bisa dilakukan kainnya. Dibuat untuk mereka yang menolak berbaur.',
    engineeredBody:
      'Performa dulu, baru bentuk. Setiap jahitan, panel, dan pilihan material direkayasa sampai tepat. Tidak ada yang sekadar hiasan, tidak ada yang terbuang.',
    stagesTitle: 'Cara sebuah system dibuat',
    stages: [
      {
        label: 'Gangguan kecil',
        title: 'Mulai dari yang mengganggumu',
        body: 'Kaos yang lengket menempel sebelum siang. Kerah yang sudah menyerah di cucian ketiga. Setiap system berawal dari satu gangguan kecil yang spesifik.',
      },
      {
        label: 'Kain',
        title: 'Selesaikan di materialnya',
        body: 'Bukan dengan sablon atau aksen. Kami menggarap kainnya sendiri: rajutan, bobot, kelenturan, dan finishing-nya.',
      },
      {
        label: 'Pakaian',
        title: 'Baru setelah itu, potong',
        body: 'Regular, boxy, oversized, fitted. Potongan mengikuti apa yang bisa dilakukan kainnya.',
      },
    ],
    timeline: 'Garis waktu',
  },

  tech: {
    lead: 'Kebanyakan brand menggambar kausnya dulu, baru mencari kainnya. Kami melakukannya sebaliknya.',
    loading: 'Memuat material system',
    empty: 'Daftar material system belum tersedia',
    filterLabel: 'Harimu',
    all: 'Semua',
    matchCount: (count: string) => `${count} cocok`,
    panel: 'Detail material system',
    onRack: 'On the rack',
    notYet: 'Belum tersedia',
    family: 'Keluarga',
    generation: 'Generasi',
    forNeeds: 'Untuk',
    character: 'Sifat',
    features: 'Fitur',
    fits: 'Fit tersedia',
    noFit: 'Tanpa pilihan fit',
    shopCta: 'Lihat di Shopify',
    sizeCta: (name: string, fit: string) => `Cari ukuran ${name} ${fit}`.trim(),
  },

  probe: {
    label: 'Ilustrasi, bukan hasil uji',
    play: 'Peragakan sifat kain',
    hot: 'Aliran udara melewati rajutan',
    shape: 'Grid menahan bentuk saat digeser',
    move: 'Grid melar ke empat arah',
    soft: 'Titik mengembang, memberi loft',
    cold: 'Lapisan menutup permukaan',
    layer: 'Cangkang di atas grid',
  },

  product: {
    number: 'Produk',
    title: 'Core dan Graphic',
    lead: 'Core dipilih dari tech dan fit. Graphic dipilih dari collab. Harga dan stok selalu mengikuti toko Shopify.',
    coreAll: 'Lihat semua Core',
    coreBody: 'Semua produk selain collab. Pilih tech, lalu fit.',
    matrixLoading: 'Memuat matriks',
    techEmpty: 'Daftar tech belum tersedia',
    matrixRegion: 'Matriks tech dan fit, bisa digeser ke samping',
    matrixCaption: 'Kombinasi tech dan fit lini Core, setiap sel menuju koleksi di Shopify',
    tech: 'Tech',
    noFitLabel: (name: string) => `${name} di Shopify, tanpa pilihan fit`,
    noFit: 'Tanpa pilihan fit',
    cellLabel: (name: string, fit: string) => `Lihat ${name} ${fit} di Shopify`,
    see: 'Lihat',
    unavailable: 'Tidak tersedia',
    graphicAll: 'Lihat semua Graphic',
    graphicBody: 'Produk collab karakter berlisensi.',
    collabLoading: 'Memuat daftar collab',
    collabEmpty: 'Daftar collab belum tersedia',
    collabLabel: (name: string) => `Lihat ${name} di Shopify`,
    comingSoon: 'Coming soon',
  },

  b2b: {
    title: 'Dua jalur kerja sama',
    lead: 'Ceritakan kebutuhanmu lewat formulir. Tim NVM menjawab lewat WhatsApp atau email.',
    wholesale: {
      audience: 'Toko dan reseller',
      body: 'Kamu punya toko dan ingin NVM ada di rakmu. Harga berjenjang untuk pesanan dalam jumlah besar di semua system kami, rentang ukuran lengkap, dan restock yang bisa kamu rencanakan.',
      points: ['Harga berjenjang', 'Rentang ukuran lengkap', 'Restock yang bisa diandalkan'],
      cta: 'Isi inquiry wholesale',
      submit: 'Kirim inquiry wholesale',
    },
    collaboration: {
      audience: 'Brand, komunitas, tim',
      body: 'Kamu punya ide dan audiens. Kami punya kainnya. Kapsul co-branded yang dibangun di atas material system kami, dengan desain khusus dan produksi terbatas. Berlaku minimum order.',
      points: ['Desain khusus', 'Produksi terbatas', 'Material kami'],
      cta: 'Isi inquiry collaboration',
      submit: 'Kirim inquiry collaboration',
    },
    sentTitle: 'Inquiry terkirim',
    codeLabel: 'Kode inquiry',
    sentBody:
      'Simpan kode ini. Tim NVM akan menghubungi kontak yang kamu tulis, atau lanjutkan sekarang lewat WhatsApp.',
    sentCta: 'Lanjut chat WhatsApp',
    sentMessage: (code: string) => `Halo NVM, saya baru mengirim inquiry B2B dengan kode ${code}.`,
    formTitle: 'Formulir inquiry',
    kind: 'Jenis kerja sama',
    name: 'Nama',
    org: 'Nama usaha atau komunitas',
    city: 'Kota',
    channels: 'Kanal penjualan',
    phone: 'WhatsApp',
    contactHint: 'Isi WhatsApp atau email, salah satu cukup.',
    email: 'Email',
    techs: 'Tech yang diminati',
    quantity: 'Perkiraan jumlah',
    message: 'Pesan',
    consentBefore: 'Saya setuju data ini diproses untuk menjawab inquiry saya, sesuai',
    consentLink: 'kebijakan privasi',
    sending: 'Mengirim inquiry',
    errors: {
      name: 'Nama harus 2 sampai 80 karakter.',
      org: 'Nama usaha atau komunitas harus 2 sampai 120 karakter.',
      city: 'Kota harus 2 sampai 80 karakter.',
      phoneFormat: 'Nomor WhatsApp harus diawali 08 atau +62, 10 sampai 15 digit.',
      emailFormat: 'Format email belum benar.',
      contactRequired: 'Isi WhatsApp atau email, salah satu cukup.',
      channels: 'Kanal penjualan maksimal 200 karakter.',
      quantity: 'Perkiraan jumlah maksimal 200 karakter.',
      message: 'Pesan harus 10 sampai 1000 karakter.',
      consent: 'Centang persetujuan agar kami bisa memproses data ini.',
      techs: 'Ada pilihan tech yang tidak dikenali.',
    },
  },

  gallery: {
    number: 'Galeri',
    title: 'Lookbook, produksi, dan event',
    loading: 'Memuat galeri',
    emptyTitle: 'Galeri sedang disiapkan',
    emptyBody: 'Foto baru muncul di sini setelah tim kami mengunggahnya.',
    instagram: 'Lihat Instagram NVM',
    filter: 'Saring kategori',
    all: 'Semua',
    enlarge: (alt: string) => `Perbesar foto: ${alt}`,
    dialog: (alt: string) => `Foto: ${alt}`,
    previous: 'Foto sebelumnya',
    next: 'Foto berikutnya',
    close: 'Tutup foto',
  },

  testimonial: {
    number: 'Testimoni',
    title: 'Dari pembeli NVM',
    lead: 'Tangkapan layar ulasan dari Shopee dan TikTok Shop, dengan transkrip teks.',
    loading: 'Memuat testimoni',
    empty: 'Testimoni sedang kami kumpulkan dari Shopee dan TikTok Shop.',
    source: 'Sumber',
    allSources: 'Semua sumber',
    tech: 'Tech',
    allTechs: 'Semua tech',
    summaryWithAverage: (average: string, count: number) =>
      `Rata-rata ${average} dari 5 bintang, dari ${count} tangkapan layar yang kami tampilkan.`,
    summary: (count: number) => `Dari ${count} tangkapan layar yang kami tampilkan.`,
    noMatchTitle: 'Tidak ada testimoni untuk pilihan ini',
    noMatchBody: 'Coba ganti sumber atau tech.',
    rating: (rating: number) => `${rating} dari 5 bintang`,
    imageAlt: (source: string) => `Tangkapan layar ulasan dari ${source}`,
    transcript: 'Baca transkrip',
  },

  size: {
    title: 'Cari ukuranmu',
    lead: 'Hitungan memakai size chart resmi per tech dan fit. Kalau datanya belum ada, kami bilang belum ada.',
    loading: 'Memuat pilihan tech',
    empty: 'Daftar tech belum tersedia',
    tech: 'Tech',
    fit: 'Fit',
    noFit: (name: string) => `${name} tidak punya pilihan fit.`,
    modes: 'Cara mencari ukuran',
    byHeight: 'Dari tinggi badan',
    byGarment: 'Dari kaos favorit',
    height: 'Tinggi badan (cm)',
    width: 'Lebar badan kaos (cm)',
    length: 'Panjang badan kaos (cm)',
    chartLoading: 'Memuat size chart',
    chartEmptyTitle: 'Size chart untuk kombinasi ini belum tersedia',
    chartEmptyBody: 'Tanyakan langsung ke tim NVM, kami tidak menebak ukuran tanpa data.',
    ask: 'Tanya ukuran lewat WhatsApp',
    betweenBefore: 'Hasilmu ada di antara',
    and: 'dan',
    betweenAfter: '. Tanyakan pilihan terbaiknya lewat WhatsApp.',
    recommendation: 'Rekomendasi:',
    prompt: 'Isi data di samping untuk melihat rekomendasi.',
    tableRegion: 'Tabel size chart, bisa digeser ke samping',
    difference: 'Selisih (cm)',
    selected: '(ukuran terpilih)',
    tolerance: 'Toleransi 1 sampai 2 cm.',
    heightNote: 'Tinggi badan hanya rekomendasi.',
    shopCta: 'Lihat ukuran ini di Shopify',
    askMessage: (name: string, fit: string, sizes: string[]) =>
      `Halo NVM, saya ingin bertanya ukuran ${name} ${fit}${sizes.length > 0 ? `, hasilnya ${sizes.join(' atau ')}` : ''}.`,
  },

  contact: {
    number: 'Kontak',
    title: 'Bicara dengan tim NVM',
    lead: 'Orang sungguhan dari tim kami yang menjawab, biasanya dalam satu hari kerja.',
    topics: [
      {
        title: 'System mana yang cocok untukku?',
        message: 'Halo NVM, saya ingin tanya system yang cocok.',
      },
      { title: 'Wholesale', message: 'Halo NVM, saya ingin tanya soal wholesale.' },
      { title: 'Collaboration', message: 'Halo NVM, saya ingin tanya soal collaboration.' },
    ],
    footnote: (phone: string) => `WhatsApp ${phone}, Bandung.`,
  },

  privacy: {
    number: 'Privasi',
    title: 'Kebijakan privasi',
    lead: 'Halaman ini menjelaskan data yang kami simpan dari formulir B2B dan hak kamu atas data itu, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
    dataTitle: 'Data yang disimpan',
    dataBody:
      'Dari formulir inquiry B2B: jenis kerja sama, nama, nama usaha atau komunitas, kota, WhatsApp, email, kanal penjualan, tech yang diminati, perkiraan jumlah, pesan, dan waktu persetujuan. Alamat IP tidak disimpan apa adanya, hanya dalam bentuk hash, dan dipakai untuk membatasi kiriman berlebihan.',
    purposeTitle: 'Tujuan',
    purposeBody:
      'Data hanya dipakai untuk menjawab inquiry yang kamu kirim. Kami tidak memakainya untuk tujuan lain.',
    retentionTitle: 'Lama penyimpanan',
    retentionBody: 'Data inquiry disimpan 12 bulan, lalu dihapus.',
    testimonialTitle: 'Testimoni',
    testimonialBody:
      'Tangkapan layar ulasan dari Shopee dan TikTok Shop hanya kami tampilkan setelah nama akun dan foto profil pembeli diburamkan, kecuali pembeli memberi izin.',
    deletionTitle: 'Meminta penghapusan',
    deletionBody: (phone: string) =>
      `Hubungi kami lewat WhatsApp ${phone}. Sertakan kode inquiry bila masih ada.`,
    deletionCta: 'Minta penghapusan data',
    deletionMessage: 'Halo NVM, saya ingin meminta penghapusan data inquiry saya.',
  },

  notFound: {
    title: 'Halaman ini tidak ada',
    lead: 'Alamatnya mungkin salah ketik, atau halamannya sudah pindah.',
    home: 'Kembali ke Beranda',
  },

  // FR-123: the site gate, signed in with the same admin accounts
  password: {
    title: 'Situs sedang disiapkan',
    lead: 'No Void Minds sedang menyiapkan situs ini, dan untuk sementara hanya tim yang bisa membukanya.',
    username: 'Username',
    password: 'Password',
    submit: 'Masuk ke situs',
    submitting: 'Memeriksa akun',
    required: 'Isi username dan password.',
    wrong: 'Username atau password salah. Periksa lagi, lalu coba sekali lagi.',
    rateLimited: 'Terlalu banyak percobaan masuk. Tunggu 15 menit, lalu coba lagi.',
  },
}

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : T extends readonly (infer U)[]
      ? Widen<U>[]
      : { [K in keyof T]: Widen<T[K]> }

export type Messages = Widen<typeof id>
export type PageKey = keyof Messages['meta']
