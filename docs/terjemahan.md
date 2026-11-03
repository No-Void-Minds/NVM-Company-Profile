# Terjemahan

Dibuat otomatis oleh `frontend/scripts/terjemahan.mjs` dari `frontend/src/i18n/id.ts`, `en.ts`, dan seed tech di `backend/internal/db/seed/`. Jangan diedit langsung: ubah sumbernya, lalu jalankan `node scripts/terjemahan.mjs` dari folder `frontend`.

Kunci bertanda `*` berasal dari teks Inggris asli (teks toko atau SRS), kolom ID adalah terjemahannya. Kunci lain berasal dari teks Indonesia v1.1, kolom EN adalah terjemahannya. Nama tech, nama fit, slogan brand, dan label seperti On the rack tidak diterjemahkan.

Tolong cek bahwa terjemahan setia dan tidak menambah klaim (FR-114).

## meta

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `meta.home.title` | No Void Minds | No Void Minds |
| `meta.home.description` | No Void Minds builds technical everyday wear from the material out. Meet the {count} material systems, the Core and Graphic lines, and ways to work with us B2B. | No Void Minds membangun technical everyday wear dari materialnya dulu. Kenali {count} material system, lini Core dan Graphic, serta peluang kerja sama B2B. |
| `meta.brand.title` | Brand | Brand |
| `meta.brand.description` | How No Void Minds works: engineered to perfection, fabric first, and the three stages of making a material system. Founded in 2021 in Bandung. | Cara No Void Minds bekerja: engineered to perfection, fabric first, dan tiga tahap membuat sebuah material system. Berdiri 2021 di Bandung. |
| `meta.tech.title` | Technology | Teknologi |
| `meta.tech.description` | The index of {count} NVM material systems. Filter by your day, then see the features and fits available. | Index {count} material system NVM. Saring berdasarkan kebutuhan harianmu, lalu lihat fitur dan fit yang tersedia. |
| `meta.product.title` | Products | Produk |
| `meta.product.description` | The difference between the Core and Graphic lines. Core is chosen by tech and fit, Graphic from the list of licensed character collabs. | Beda lini Core dan Graphic. Core dipilih dari tech dan fit, Graphic dari daftar collab karakter berlisensi. |
| `meta.b2b.title` | B2B | B2B |
| `meta.b2b.description` | Two ways to work with NVM: Wholesale for stores and resellers, Collaboration for brands, communities, and teams. Send an inquiry through the form. | Dua jalur kerja sama dengan NVM: Wholesale untuk toko dan reseller, Collaboration untuk brand, komunitas, dan tim. Kirim inquiry lewat formulir. |
| `meta.gallery.title` | Gallery | Galeri |
| `meta.gallery.description` | Lookbook, production, and event photos from No Void Minds. | Foto lookbook, produksi, dan event No Void Minds. |
| `meta.testimonial.title` | Testimonials | Testimoni |
| `meta.testimonial.description` | Screenshots of NVM buyer reviews from Shopee and TikTok Shop, with text transcripts. | Tangkapan layar ulasan pembeli NVM dari Shopee dan TikTok Shop, lengkap dengan transkrip teks. |
| `meta.size.title` | Size | Size |
| `meta.size.description` | Find your NVM size from your height or from a favorite tee, using the official size chart for each tech and fit. | Cari ukuran NVM dari tinggi badan atau dari kaos favoritmu, memakai size chart resmi per tech dan fit. |
| `meta.contact.title` | Contact | Kontak |
| `meta.contact.description` | Reach the NVM team on WhatsApp to ask about techs, wholesale, or collaboration. | Hubungi tim NVM lewat WhatsApp untuk tanya tech, wholesale, atau collaboration. |
| `meta.privacy.title` | Privacy Policy | Kebijakan Privasi |
| `meta.privacy.description` | What data NVM keeps from the B2B form, why, how long it is kept, and how to request deletion. | Data apa yang NVM simpan dari formulir B2B, tujuannya, lama penyimpanan, dan cara meminta penghapusan. |
| `meta.notFound.title` | Page not found | Halaman tidak ditemukan |
| `meta.notFound.description` | The address you opened does not exist on the No Void Minds site. | Alamat yang kamu buka tidak ada di situs No Void Minds. |
| `meta.password.title` | Coming soon | Segera hadir |
| `meta.password.description` | The No Void Minds site is being prepared. | Situs No Void Minds sedang disiapkan. |

## layout

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `layout.skip` | Skip to content | Lewati ke konten |
| `layout.homeLink` | No Void Minds, to the home page | No Void Minds, ke Beranda |
| `layout.mainMenu` | Main menu | Menu utama |
| `layout.openMenu` | Open menu | Buka menu |
| `layout.closeMenu` | Close menu | Tutup menu |
| `layout.shop` | Shop on Shopee | Belanja di Shopee |
| `layout.newTab` | (opens in a new tab) | (buka di tab baru) |
| `layout.darkTheme` | Dark theme | Tema gelap |
| `layout.switchLang` | Baca halaman ini dalam Bahasa Indonesia | Read this page in English |
| `layout.pauseTicker` | Pause the ticker | Jeda teks berjalan |
| `layout.playTicker` | Play the ticker | Jalankan teks berjalan |

## nav

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `nav.brand` | Brand | Brand |
| `nav.tech` | Technology | Teknologi |
| `nav.product` | Products | Produk |
| `nav.b2b` | B2B | B2B |
| `nav.gallery` | Gallery | Galeri |
| `nav.testimonial` | Testimonials | Testimoni |
| `nav.size` | Size | Size |
| `nav.contact` | Contact | Kontak |

## footer

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `footer.contact` | Contact | Kontak |
| `footer.store` | Store | Toko |
| `footer.privacy` | Privacy policy | Kebijakan privasi |
| `footer.whatsappMessage` | Hi NVM, I have a question. | Halo NVM, saya ingin bertanya. |

## state

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `state.loading` | Loading data | Memuat data |
| `state.failed` | Data failed to load | Data gagal dimuat |
| `state.retry` | Try again | Coba lagi |
| `state.optional` | (optional) | (opsional) |

## apiErrors

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `apiErrors.VALIDATION` | Some fields are not right yet. Check the marked fields. | Ada isian yang belum benar. Periksa bagian yang ditandai. |
| `apiErrors.NOT_FOUND` | The requested data was not found. | Data yang diminta tidak ditemukan. |
| `apiErrors.UNAUTHORIZED` | Please sign in first. | Silakan masuk dulu. |
| `apiErrors.FORBIDDEN` | Access denied. Reload the page, then try again. | Akses ditolak. Muat ulang halaman, lalu coba lagi. |
| `apiErrors.RATE_LIMITED` | Too many submissions. Try again later, or reach us on WhatsApp. | Terlalu banyak kiriman. Coba lagi nanti, atau hubungi kami lewat WhatsApp. |
| `apiErrors.CONFLICT` | This conflicts with another change. Reload, then try again. | Data bentrok dengan perubahan lain. Muat ulang, lalu coba lagi. |
| `apiErrors.INTERNAL` | Something went wrong on the server. Try again shortly. | Terjadi kesalahan di server. Coba lagi sebentar. |
| `apiErrors.NETWORK` | Cannot reach the server. Check your connection, then try again. | Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi. |

## needs

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `needs.hot` * | Runs hot | Mudah gerah |
| `needs.shape` * | Holds shape | Ingin bentuk terjaga |
| `needs.move` * | Moves a lot | Banyak bergerak |
| `needs.soft` * | Wants soft | Ingin yang lembut |
| `needs.cold` * | Runs cold | Mudah kedinginan |
| `needs.layer` * | Needs a layer | Butuh lapisan |

## cta

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `cta.seeSystems` | See the {count} material systems | Lihat {count} material system |

## home

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `home.lead` * | Most brands draw the shirt, then go looking for a fabric. We do it the other way round. | Kebanyakan brand menggambar kausnya dulu, baru mencari kainnya. Kami melakukannya sebaliknya. |
| `home.labIndex` | Lab index | Lab index |
| `home.labLoading` | Loading the Lab index | Memuat Lab index |
| `home.labEmpty` | The Lab index is not available yet | Lab index belum tersedia |
| `home.systems` | Material systems | Material system |
| `home.onRack` | On the rack | On the rack |
| `home.founded` | Founded in Bandung | Berdiri di Bandung |
| `home.lineTitle` | Core and Graphic | Core dan Graphic |
| `home.lineBody` | Core covers every product except collabs, chosen by tech and fit. Graphic covers licensed character collab products, chosen by collab name. | Core berisi semua produk selain collab, dipilih dari tech dan fit. Graphic berisi produk collab karakter berlisensi, dipilih dari nama collab. |
| `home.lineCta` | Compare Core and Graphic | Bandingkan Core dan Graphic |
| `home.b2bTitle` | B2B | B2B |
| `home.b2bBody` | Run a store, or have an idea and an audience? There are two ways to work with us: Wholesale and Collaboration. | Punya toko, atau punya ide dan audiens? Ada dua jalur kerja sama: Wholesale dan Collaboration. |
| `home.b2bCta` | Send a wholesale inquiry | Kirim inquiry wholesale |
| `home.buyersTitle` | What buyers say | Kata pembeli |
| `home.buyersCta` | Read all testimonials | Baca semua testimoni |
| `home.galleryTitle` | Gallery | Galeri |
| `home.galleryCta` | Open the full gallery | Buka galeri lengkap |

## brand

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `brand.statement` * | We build technical everyday wear from the material out. Engineering proprietary fabric systems first, then designing each garment around what the fabric can do. Made for those who refuse to blend in. | Kami membuat technical everyday wear mulai dari materialnya. Sistem kain milik sendiri direkayasa lebih dulu, lalu setiap pakaian dirancang mengikuti apa yang bisa dilakukan kainnya. Dibuat untuk mereka yang menolak berbaur. |
| `brand.engineeredBody` * | Performance first, then form. Every seam, panel, and material choice is engineered until it is right. Nothing decorative, nothing wasted. | Performa dulu, baru bentuk. Setiap jahitan, panel, dan pilihan material direkayasa sampai tepat. Tidak ada yang sekadar hiasan, tidak ada yang terbuang. |
| `brand.stagesTitle` | How a system is made | Cara sebuah system dibuat |
| `brand.stages.0.label` * | The annoyance | Gangguan kecil |
| `brand.stages.0.title` * | Start with what bugs you | Mulai dari yang mengganggumu |
| `brand.stages.0.body` * | A tee that clings by noon. A collar that gives up by the third wash. Every system starts with one small, specific annoyance. | Kaos yang lengket menempel sebelum siang. Kerah yang sudah menyerah di cucian ketiga. Setiap system berawal dari satu gangguan kecil yang spesifik. |
| `brand.stages.1.label` * | The fabric | Kain |
| `brand.stages.1.title` * | Fix it in the material | Selesaikan di materialnya |
| `brand.stages.1.body` * | Not with a print or a trim. We work the fabric itself: the knit, the weight, the stretch, the finish. | Bukan dengan sablon atau aksen. Kami menggarap kainnya sendiri: rajutan, bobot, kelenturan, dan finishing-nya. |
| `brand.stages.2.label` * | The garment | Pakaian |
| `brand.stages.2.title` * | Then, and only then, cut | Baru setelah itu, potong |
| `brand.stages.2.body` * | Regular, boxy, oversized, fitted. The cut follows what the fabric can do. | Regular, boxy, oversized, fitted. Potongan mengikuti apa yang bisa dilakukan kainnya. |
| `brand.timeline` | Timeline | Garis waktu |

## tech

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `tech.lead` * | Most brands draw the shirt, then go looking for a fabric. We do it the other way round. | Kebanyakan brand menggambar kausnya dulu, baru mencari kainnya. Kami melakukannya sebaliknya. |
| `tech.loading` | Loading material systems | Memuat material system |
| `tech.empty` | The material system list is not available yet | Daftar material system belum tersedia |
| `tech.filterLabel` | Your day | Harimu |
| `tech.all` | All | Semua |
| `tech.matchCount` | {count} fit | {count} cocok |
| `tech.panel` | Material system details | Detail material system |
| `tech.onRack` | On the rack | On the rack |
| `tech.notYet` | Not available yet | Belum tersedia |
| `tech.family` | Family | Keluarga |
| `tech.generation` | Generation | Generasi |
| `tech.forNeeds` | For | Untuk |
| `tech.character` | Character | Sifat |
| `tech.features` | Features | Fitur |
| `tech.fits` | Available fits | Fit tersedia |
| `tech.noFit` | No fit options | Tanpa pilihan fit |
| `tech.buyTitle` | Buy on Shopee | Beli di Shopee |
| `tech.buyAll` | See on Shopee | Lihat di Shopee |
| `tech.buyLabel` | {fit} {name} on Shopee | {fit} {name} di Shopee |
| `tech.sizeCta` | Find your {name} {fit} size | Cari ukuran {name} {fit} |

## probe

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `probe.label` | Illustration, not a test result | Ilustrasi, bukan hasil uji |
| `probe.play` | Show how the fabric behaves | Peragakan sifat kain |
| `probe.hot` | Airflow passing through the knit | Aliran udara melewati rajutan |
| `probe.shape` | The grid holds its shape when pushed | Grid menahan bentuk saat digeser |
| `probe.move` | The grid stretches in four directions | Grid melar ke empat arah |
| `probe.soft` | Points swell, adding loft | Titik mengembang, memberi loft |
| `probe.cold` | A layer covers the surface | Lapisan menutup permukaan |
| `probe.layer` | A shell over the grid | Cangkang di atas grid |

## product

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `product.number` | Products | Produk |
| `product.title` | Core and Graphic | Core dan Graphic |
| `product.lead` | Core is chosen by tech and fit. Graphic is chosen by collab. Prices and stock always follow the Shopee store. | Core dipilih dari tech dan fit. Graphic dipilih dari collab. Harga dan stok selalu mengikuti toko Shopee. |
| `product.coreBody` | Every product except collabs. Pick a tech, then a fit. | Semua produk selain collab. Pilih tech, lalu fit. |
| `product.matrixLoading` | Loading the matrix | Memuat matriks |
| `product.techEmpty` | The tech list is not available yet | Daftar tech belum tersedia |
| `product.matrixRegion` | Tech and fit matrix, scrolls sideways | Matriks tech dan fit, bisa digeser ke samping |
| `product.matrixCaption` | Tech and fit combinations in the Core line, cells marked See link to the product on Shopee | Kombinasi tech dan fit lini Core, sel bertanda Lihat menuju produk di Shopee |
| `product.tech` | Tech | Tech |
| `product.noFitLabel` | See {name} on Shopee, no fit options | Lihat {name} di Shopee, tanpa pilihan fit |
| `product.noFit` | No fit options | Tanpa pilihan fit |
| `product.cellLabel` | See {name} {fit} on Shopee | Lihat {name} {fit} di Shopee |
| `product.see` | See | Lihat |
| `product.unavailable` | Not available | Tidak tersedia |
| `product.noLink` | No link yet | Belum ada link |
| `product.graphicBody` | Licensed character collab products. | Produk collab karakter berlisensi. |
| `product.collabLoading` | Loading collabs | Memuat daftar collab |
| `product.collabEmpty` | The collab list is not available yet | Daftar collab belum tersedia |
| `product.comingSoon` | Coming soon | Coming soon |

## b2b

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `b2b.title` | Two ways to work with us | Dua jalur kerja sama |
| `b2b.lead` | Tell us what you need through the form. The NVM team replies by WhatsApp or email. | Ceritakan kebutuhanmu lewat formulir. Tim NVM menjawab lewat WhatsApp atau email. |
| `b2b.wholesale.audience` * | Stores and resellers | Toko dan reseller |
| `b2b.wholesale.body` * | You run a store and want NVM on your rack. Tiered pricing on bulk orders across our systems, full size runs, and restocks you can plan around. | Kamu punya toko dan ingin NVM ada di rakmu. Harga berjenjang untuk pesanan dalam jumlah besar di semua system kami, rentang ukuran lengkap, dan restock yang bisa kamu rencanakan. |
| `b2b.wholesale.points.0` * | Tiered pricing | Harga berjenjang |
| `b2b.wholesale.points.1` * | Full size runs | Rentang ukuran lengkap |
| `b2b.wholesale.points.2` * | Reliable restocks | Restock yang bisa diandalkan |
| `b2b.wholesale.cta` | Fill in a wholesale inquiry | Isi inquiry wholesale |
| `b2b.wholesale.submit` | Send a wholesale inquiry | Kirim inquiry wholesale |
| `b2b.collaboration.audience` * | Brands, communities, teams | Brand, komunitas, tim |
| `b2b.collaboration.body` * | You have an idea and an audience. We have the fabric. Co-branded capsules built on our material systems, with custom design and limited runs. Minimum order applies. | Kamu punya ide dan audiens. Kami punya kainnya. Kapsul co-branded yang dibangun di atas material system kami, dengan desain khusus dan produksi terbatas. Berlaku minimum order. |
| `b2b.collaboration.points.0` * | Custom design | Desain khusus |
| `b2b.collaboration.points.1` * | Limited runs | Produksi terbatas |
| `b2b.collaboration.points.2` * | Our materials | Material kami |
| `b2b.collaboration.cta` | Fill in a collaboration inquiry | Isi inquiry collaboration |
| `b2b.collaboration.submit` | Send a collaboration inquiry | Kirim inquiry collaboration |
| `b2b.sentTitle` | Inquiry sent | Inquiry terkirim |
| `b2b.codeLabel` | Inquiry code | Kode inquiry |
| `b2b.sentBody` | Keep this code. The NVM team will reach you at the contact you gave, or you can continue now on WhatsApp. | Simpan kode ini. Tim NVM akan menghubungi kontak yang kamu tulis, atau lanjutkan sekarang lewat WhatsApp. |
| `b2b.sentCta` | Continue on WhatsApp | Lanjut chat WhatsApp |
| `b2b.sentMessage` | Hi NVM, I just sent a B2B inquiry with the code {code}. | Halo NVM, saya baru mengirim inquiry B2B dengan kode {code}. |
| `b2b.formTitle` | Inquiry form | Formulir inquiry |
| `b2b.kind` | Type of partnership | Jenis kerja sama |
| `b2b.name` | Name | Nama |
| `b2b.org` | Business or community name | Nama usaha atau komunitas |
| `b2b.city` | City | Kota |
| `b2b.channels` | Sales channels | Kanal penjualan |
| `b2b.phone` | WhatsApp | WhatsApp |
| `b2b.contactHint` | Fill in WhatsApp or email, either one is enough. | Isi WhatsApp atau email, salah satu cukup. |
| `b2b.email` | Email | Email |
| `b2b.techs` | Techs you are interested in | Tech yang diminati |
| `b2b.quantity` | Estimated quantity | Perkiraan jumlah |
| `b2b.message` | Message | Pesan |
| `b2b.consentBefore` | I agree to this data being processed to answer my inquiry, in line with the | Saya setuju data ini diproses untuk menjawab inquiry saya, sesuai |
| `b2b.consentLink` | privacy policy | kebijakan privasi |
| `b2b.sending` | Sending inquiry | Mengirim inquiry |
| `b2b.errors.name` | Name must be 2 to 80 characters. | Nama harus 2 sampai 80 karakter. |
| `b2b.errors.org` | Business or community name must be 2 to 120 characters. | Nama usaha atau komunitas harus 2 sampai 120 karakter. |
| `b2b.errors.city` | City must be 2 to 80 characters. | Kota harus 2 sampai 80 karakter. |
| `b2b.errors.phoneFormat` | The WhatsApp number must start with 08 or +62 and have 10 to 15 digits. | Nomor WhatsApp harus diawali 08 atau +62, 10 sampai 15 digit. |
| `b2b.errors.emailFormat` | The email format is not right yet. | Format email belum benar. |
| `b2b.errors.contactRequired` | Fill in WhatsApp or email, either one is enough. | Isi WhatsApp atau email, salah satu cukup. |
| `b2b.errors.channels` | Sales channels can be at most 200 characters. | Kanal penjualan maksimal 200 karakter. |
| `b2b.errors.quantity` | Estimated quantity can be at most 200 characters. | Perkiraan jumlah maksimal 200 karakter. |
| `b2b.errors.message` | The message must be 10 to 1000 characters. | Pesan harus 10 sampai 1000 karakter. |
| `b2b.errors.consent` | Tick the consent box so we can process this data. | Centang persetujuan agar kami bisa memproses data ini. |
| `b2b.errors.techs` | One of the chosen techs is not recognized. | Ada pilihan tech yang tidak dikenali. |

## gallery

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `gallery.number` | Gallery | Galeri |
| `gallery.title` | Lookbook, production, and events | Lookbook, produksi, dan event |
| `gallery.loading` | Loading the gallery | Memuat galeri |
| `gallery.emptyTitle` | The gallery is being prepared | Galeri sedang disiapkan |
| `gallery.emptyBody` | Photos appear here once our team uploads them. | Foto baru muncul di sini setelah tim kami mengunggahnya. |
| `gallery.instagram` | See NVM on Instagram | Lihat Instagram NVM |
| `gallery.filter` | Filter by category | Saring kategori |
| `gallery.all` | All | Semua |
| `gallery.enlarge` | Enlarge photo: {alt} | Perbesar foto: {alt} |
| `gallery.dialog` | Photo: {alt} | Foto: {alt} |
| `gallery.previous` | Previous photo | Foto sebelumnya |
| `gallery.next` | Next photo | Foto berikutnya |
| `gallery.close` | Close photo | Tutup foto |

## testimonial

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `testimonial.number` | Testimonials | Testimoni |
| `testimonial.title` | From NVM buyers | Dari pembeli NVM |
| `testimonial.lead` | Screenshots of reviews from Shopee and TikTok Shop, with text transcripts. | Tangkapan layar ulasan dari Shopee dan TikTok Shop, dengan transkrip teks. |
| `testimonial.loading` | Loading testimonials | Memuat testimoni |
| `testimonial.empty` | We are collecting testimonials from Shopee and TikTok Shop. | Testimoni sedang kami kumpulkan dari Shopee dan TikTok Shop. |
| `testimonial.source` | Source | Sumber |
| `testimonial.allSources` | All sources | Semua sumber |
| `testimonial.tech` | Tech | Tech |
| `testimonial.allTechs` | All techs | Semua tech |
| `testimonial.summaryWithAverage` | Average {average} out of 5 stars, from the {count} screenshots shown here. | Rata-rata {average} dari 5 bintang, dari {count} tangkapan layar yang kami tampilkan. |
| `testimonial.summary` | From the {count} screenshots shown here. | Dari {count} tangkapan layar yang kami tampilkan. |
| `testimonial.noMatchTitle` | No testimonials for this selection | Tidak ada testimoni untuk pilihan ini |
| `testimonial.noMatchBody` | Try another source or tech. | Coba ganti sumber atau tech. |
| `testimonial.rating` | {rating} out of 5 stars | {rating} dari 5 bintang |
| `testimonial.imageAlt` | Screenshot of a review from {source} | Tangkapan layar ulasan dari {source} |
| `testimonial.transcript` | Read the transcript | Baca transkrip |

## size

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `size.title` | Find your size | Cari ukuranmu |
| `size.lead` | Calculated from the official size chart for each tech and fit. If the data does not exist yet, we say so. | Hitungan memakai size chart resmi per tech dan fit. Kalau datanya belum ada, kami bilang belum ada. |
| `size.loading` | Loading tech options | Memuat pilihan tech |
| `size.empty` | The tech list is not available yet | Daftar tech belum tersedia |
| `size.tech` | Tech | Tech |
| `size.fit` | Fit | Fit |
| `size.noFit` | {name} has no fit options. | {name} tidak punya pilihan fit. |
| `size.modes` | How to find your size | Cara mencari ukuran |
| `size.byHeight` | From your height | Dari tinggi badan |
| `size.byGarment` | From a favorite tee | Dari kaos favorit |
| `size.height` | Height (cm) | Tinggi badan (cm) |
| `size.width` | Tee body width (cm) | Lebar badan kaos (cm) |
| `size.length` | Tee body length (cm) | Panjang badan kaos (cm) |
| `size.chartLoading` | Loading the size chart | Memuat size chart |
| `size.chartEmptyTitle` | The size chart for this combination is not available yet | Size chart untuk kombinasi ini belum tersedia |
| `size.chartEmptyBody` | Ask the NVM team directly. We do not guess sizes without data. | Tanyakan langsung ke tim NVM, kami tidak menebak ukuran tanpa data. |
| `size.ask` | Ask about sizing on WhatsApp | Tanya ukuran lewat WhatsApp |
| `size.betweenBefore` | Your result is between | Hasilmu ada di antara |
| `size.and` | and | dan |
| `size.betweenAfter` | . Ask us on WhatsApp which one suits you best. | . Tanyakan pilihan terbaiknya lewat WhatsApp. |
| `size.recommendation` | Recommendation: | Rekomendasi: |
| `size.prompt` | Fill in the form to see a recommendation. | Isi data di samping untuk melihat rekomendasi. |
| `size.tableRegion` | Size chart table, scrolls sideways | Tabel size chart, bisa digeser ke samping |
| `size.difference` | Difference (cm) | Selisih (cm) |
| `size.selected` | (selected size) | (ukuran terpilih) |
| `size.tolerance` | Tolerance of 1 to 2 cm. | Toleransi 1 sampai 2 cm. |
| `size.heightNote` | Height is a recommendation only. | Tinggi badan hanya rekomendasi. |
| `size.shopCta` | See this size on Shopee | Lihat ukuran ini di Shopee |
| `size.askMessage` | Hi NVM, I have a question about sizing for {name} {fit}, my result was {sizes}. | Halo NVM, saya ingin bertanya ukuran {name} {fit}, hasilnya {sizes}. |

## contact

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `contact.number` | Contact | Kontak |
| `contact.title` | Talk to the NVM team | Bicara dengan tim NVM |
| `contact.lead` * | A real person on the team answers, usually within one working day. | Orang sungguhan dari tim kami yang menjawab, biasanya dalam satu hari kerja. |
| `contact.topics.0.title` * | Which system is for me? | System mana yang cocok untukku? |
| `contact.topics.0.message` | Hi NVM, I would like to ask which system suits me. | Halo NVM, saya ingin tanya system yang cocok. |
| `contact.topics.1.title` * | Wholesale | Wholesale |
| `contact.topics.1.message` | Hi NVM, I would like to ask about wholesale. | Halo NVM, saya ingin tanya soal wholesale. |
| `contact.topics.2.title` * | Collaboration | Collaboration |
| `contact.topics.2.message` | Hi NVM, I would like to ask about collaboration. | Halo NVM, saya ingin tanya soal collaboration. |
| `contact.footnote` | WhatsApp {phone}, Bandung. | WhatsApp {phone}, Bandung. |

## privacy

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `privacy.number` | Privacy | Privasi |
| `privacy.title` | Privacy policy | Kebijakan privasi |
| `privacy.lead` | This page explains the data we keep from the B2B form and your rights over that data, in line with Indonesian Law No. 27 of 2022 on Personal Data Protection. | Halaman ini menjelaskan data yang kami simpan dari formulir B2B dan hak kamu atas data itu, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. |
| `privacy.dataTitle` | Data we keep | Data yang disimpan |
| `privacy.dataBody` | From the B2B inquiry form: partnership type, name, business or community name, city, WhatsApp, email, sales channels, techs of interest, estimated quantity, message, and time of consent. IP addresses are not stored as they are, only as a hash, and are used to limit excessive submissions. | Dari formulir inquiry B2B: jenis kerja sama, nama, nama usaha atau komunitas, kota, WhatsApp, email, kanal penjualan, tech yang diminati, perkiraan jumlah, pesan, dan waktu persetujuan. Alamat IP tidak disimpan apa adanya, hanya dalam bentuk hash, dan dipakai untuk membatasi kiriman berlebihan. |
| `privacy.purposeTitle` | Purpose | Tujuan |
| `privacy.purposeBody` | The data is only used to answer the inquiry you send. We do not use it for any other purpose. | Data hanya dipakai untuk menjawab inquiry yang kamu kirim. Kami tidak memakainya untuk tujuan lain. |
| `privacy.retentionTitle` | Retention | Lama penyimpanan |
| `privacy.retentionBody` | Inquiry data is kept for 12 months, then deleted. | Data inquiry disimpan 12 bulan, lalu dihapus. |
| `privacy.testimonialTitle` | Testimonials | Testimoni |
| `privacy.testimonialBody` | Review screenshots from Shopee and TikTok Shop are only shown after the buyer account name and profile photo are blurred, unless the buyer gives permission. | Tangkapan layar ulasan dari Shopee dan TikTok Shop hanya kami tampilkan setelah nama akun dan foto profil pembeli diburamkan, kecuali pembeli memberi izin. |
| `privacy.deletionTitle` | Requesting deletion | Meminta penghapusan |
| `privacy.deletionBody` | Contact us on WhatsApp {phone}. Include your inquiry code if you still have it. | Hubungi kami lewat WhatsApp {phone}. Sertakan kode inquiry bila masih ada. |
| `privacy.deletionCta` | Request data deletion | Minta penghapusan data |
| `privacy.deletionMessage` | Hi NVM, I would like to request deletion of my inquiry data. | Halo NVM, saya ingin meminta penghapusan data inquiry saya. |

## notFound

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `notFound.title` | This page does not exist | Halaman ini tidak ada |
| `notFound.lead` | The address may be mistyped, or the page has moved. | Alamatnya mungkin salah ketik, atau halamannya sudah pindah. |
| `notFound.home` | Back to the home page | Kembali ke Beranda |

## password

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `password.title` | The site is being prepared | Situs sedang disiapkan |
| `password.lead` | No Void Minds is preparing this site, and for now only the team can open it. | No Void Minds sedang menyiapkan situs ini, dan untuk sementara hanya tim yang bisa membukanya. |
| `password.username` | Username | Username |
| `password.password` | Password | Password |
| `password.submit` | Enter the site | Masuk ke situs |
| `password.submitting` | Checking the account | Memeriksa akun |
| `password.required` | Fill in the username and password. | Isi username dan password. |
| `password.wrong` | The username or password is wrong. Check them, then try once more. | Username atau password salah. Periksa lagi, lalu coba sekali lagi. |
| `password.rateLimited` | Too many sign-in attempts. Wait 15 minutes, then try again. | Terlalu banyak percobaan masuk. Tunggu 15 menit, lalu coba lagi. |

## tech (seed)

| Kunci | Teks EN | Teks ID |
|---|---|---|
| `aezy.tagline` * | For days that run hot. | Untuk hari-hari yang terasa gerah. |
| `aezy.sub` * | Performance, climate, stretch | Performa, iklim, stretch |
| `aezy.description` * | Lightweight performance fabric. Breathable, fast-drying and air-feel soft. Engineered for movement and everyday climate control, with elastic recovery that stays stable after long wear. | Kain performa yang ringan. Bernapas, cepat kering, dan lembut seperti udara. Direkayasa untuk bergerak dan menjaga kenyamanan di iklim sehari-hari, dengan pemulihan elastis yang tetap stabil setelah lama dipakai. |
| `aezy.chips` * | Breathable, Fast-drying, Air-feel soft, Elastic recovery | Bernapas, Cepat kering, Lembut seperti udara, Pemulihan elastis |
| `aezy-cotton.tagline` * | AEZY, with a cotton hand. | AEZY, dengan sentuhan katun. |
| `aezy-cotton.sub` * | Cotton touch, breathable, everyday | Sentuhan katun, bernapas, sehari-hari |
| `aezy-cotton.description` * | The AEZY system with a cotton touch. The natural, familiar feel of cotton on the skin, with the easy breathability AEZY is known for. Made for long days and everyday wear. | Sistem AEZY dengan sentuhan katun. Rasa katun yang alami dan akrab di kulit, dengan kemampuan bernapas khas AEZY. Dibuat untuk hari yang panjang dan pemakaian sehari-hari. |
| `aezy-cotton.chips` * | Cotton hand-feel, Breathable, Everyday comfort | Rasa katun, Bernapas, Nyaman sehari-hari |
| `aezy-2.tagline` * | AEZY, refined. | AEZY, disempurnakan. |
| `aezy-2.sub` * | Next generation, air-feel, movement | Generasi berikutnya, ringan seperti udara, gerak |
| `aezy-2.description` * | The next generation of our AEZY system. The same air-feel lightness you know, refined in the lab for a smoother hand and easier movement through the day. | Generasi berikutnya dari sistem AEZY kami. Ringan seperti udara yang sudah kamu kenal, disempurnakan di lab untuk sentuhan yang lebih halus dan gerak yang lebih leluasa sepanjang hari. |
| `aezy-2.chips` * | Second generation, Air-feel light, Refined hand | Generasi kedua, Ringan seperti udara, Sentuhan lebih halus |
| `formlock.tagline` * | For cuts that refuse to sag. | Untuk potongan yang menolak melorot. |
| `formlock.sub` * | Structure, hold, construction | Struktur, daya tahan bentuk, konstruksi |
| `formlock.description` * | A structural construction system. Seam-lock paneling and dense contour knits engineered to hold their silhouette wash after wash, so the cut stays as sharp as day one. | Sistem konstruksi struktural. Panel seam-lock dan rajutan kontur yang padat, direkayasa untuk menjaga siluetnya dari cucian ke cucian, sehingga potongannya tetap setajam hari pertama. |
| `formlock.chips` * | Seam-lock paneling, Dense contour knit, Holds its shape | Panel seam-lock, Rajutan kontur padat, Bentuk terjaga |
| `formlock-2.tagline` * | FORMLOCK, in more cuts. | FORMLOCK, dalam lebih banyak potongan. |
| `formlock-2.sub` * | Next generation, structure, silhouette | Generasi berikutnya, struktur, siluet |
| `formlock-2.description` * | The next generation of FORMLOCK. The same shape-holding structure, developed further across more silhouettes, from clean regular cuts to boxy and oversized fits that keep their form. | Generasi berikutnya dari FORMLOCK. Struktur penahan bentuk yang sama, dikembangkan lebih jauh ke lebih banyak siluet, dari potongan regular yang rapi sampai fit boxy dan oversized yang tetap terjaga bentuknya. |
| `formlock-2.chips` * | Second generation, Shape-holding, Regular, Boxy, Oversized | Generasi kedua, Menahan bentuk, Regular, Boxy, Oversized |
| `curflex.tagline` * | For bodies that never sit still. | Untuk tubuh yang tidak pernah diam. |
| `curflex.sub` * | Curve, flex, recovery | Lekuk, lentur, pemulihan |
| `curflex.description` * | Four-way curve-flex stretch. Moves with your body and recovers its shape for all-day mobility without losing structure. Built to flatter the figure and free the movement. | Stretch curve-flex empat arah. Bergerak bersama tubuhmu dan kembali ke bentuknya, untuk mobilitas sepanjang hari tanpa kehilangan struktur. Dibuat untuk menonjolkan bentuk tubuh dan membebaskan gerak. |
| `curflex.chips` * | Four-way stretch, Shape recovery, All-day mobility | Stretch empat arah, Kembali ke bentuk, Mobilitas sepanjang hari |
| `puffmax.tagline` * | For when soft is the whole point. | Untuk saat lembut adalah tujuannya. |
| `puffmax.sub` * | Loft, cushion, softness | Loft, empuk, kelembutan |
| `puffmax.description` * | Maximum loft and density. A plush, cushioned hand that feels like being wrapped in a cloud. Extra-soft and substantial, with comfort that holds up wear after wear. | Loft dan kepadatan maksimal. Sentuhan tebal dan empuk yang terasa seperti dibungkus awan. Ekstra lembut dan berbobot, dengan kenyamanan yang bertahan dari pemakaian ke pemakaian. |
| `puffmax.chips` * | Maximum loft, Plush hand, Lasting comfort | Loft maksimal, Sentuhan tebal, Nyaman tahan lama |
| `therco.tagline` * | For cold mornings and freezing offices. | Untuk pagi yang dingin dan kantor yang membeku. |
| `therco.sub` * | Thermal, comfort, layering | Termal, nyaman, berlapis |
| `therco.description` * | A thermal comfort system built for cooler hours. Designed to keep warmth close to the body while staying easy to layer and comfortable from morning to night. | Sistem kenyamanan termal untuk jam-jam yang lebih sejuk. Dirancang untuk menjaga hangat tetap dekat dengan tubuh, sambil tetap mudah dilapis dan nyaman dari pagi sampai malam. |
| `therco.chips` * | Thermal comfort, Easy layering, All-day wear | Nyaman termal, Mudah dilapis, Dipakai seharian |
| `antshell.tagline` * | For a cleaner outer layer. | Untuk lapisan luar yang lebih rapi. |
| `antshell.sub` * | Shell, light, everyday armor | Cangkang, ringan, pelindung sehari-hari |
| `antshell.description` * | An outer-layer system inspired by a lightweight shell. Built to feel light on the body while giving everyday pieces a clean, protective outer face. | Sistem lapisan luar yang terinspirasi dari cangkang ringan. Dibuat agar terasa ringan di badan, sambil memberi pakaian sehari-hari permukaan luar yang rapi dan melindungi. |
| `antshell.chips` * | Lightweight shell, Clean outer face, Everyday layer | Cangkang ringan, Permukaan luar rapi, Lapisan sehari-hari |
| `flexe.tagline` * | For a full range of motion. | Untuk rentang gerak penuh. |
| `flexe.sub` * | Flex, mobility, ease | Lentur, mobilitas, leluasa |
| `flexe.description` * | A flexible system made for full range of motion. Bends and moves with you, then settles back into shape, so the fit feels easy whether you are moving or standing still. | Sistem lentur yang dibuat untuk rentang gerak penuh. Menekuk dan bergerak bersamamu, lalu kembali ke bentuknya, sehingga fit terasa leluasa saat kamu bergerak maupun diam. |
| `flexe.chips` * | Full range of motion, Easy fit, Settles back into shape | Rentang gerak penuh, Fit leluasa, Kembali ke bentuk |
| `meltwrap.tagline` * | For a second-skin drape. | Untuk jatuh kain seperti kulit kedua. |
| `meltwrap.sub` * | Drape, softness, second skin | Jatuh kain, kelembutan, kulit kedua |
| `meltwrap.description` * | A soft, fluid system that drapes close to the body. Smooth against the skin and light in the hand, it wraps the figure gently for an easy, second-skin feel. | Sistem yang lembut dan cair, jatuh dekat ke tubuh. Halus di kulit dan ringan di tangan, membalut bentuk tubuh dengan lembut untuk rasa nyaman seperti kulit kedua. |
| `meltwrap.chips` * | Fluid drape, Smooth hand, Second-skin feel | Jatuh kain cair, Sentuhan halus, Rasa kulit kedua |
