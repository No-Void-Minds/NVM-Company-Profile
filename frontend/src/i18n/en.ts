import type { Messages } from './id'

// Brand statement, stages, B2B paths, and Contact use the original English store copy (FR-114).
export const en: Messages = {
  meta: {
    home: {
      title: 'No Void Minds',
      description: (count: number | null) =>
        `No Void Minds builds technical everyday wear from the material out. Meet the ${count ? `${count} ` : ''}material systems, the Core and Graphic lines, and ways to work with us B2B.`,
    },
    brand: {
      title: 'Brand',
      description:
        'How No Void Minds works: engineered to perfection, fabric first, and the three stages of making a material system. Founded in 2021 in Bandung.',
    },
    tech: {
      title: 'Technology',
      description: (count: number | null) =>
        `The index of ${count ? `${count} ` : ''}NVM material systems. Filter by your day, then see the features and fits available.`,
    },
    product: {
      title: 'Products',
      description:
        'The difference between the Core and Graphic lines. Core is chosen by tech and fit, Graphic from the list of licensed character collabs.',
    },
    b2b: {
      title: 'B2B',
      description:
        'Two ways to work with NVM: Wholesale for stores and resellers, Collaboration for brands, communities, and teams. Send an inquiry through the form.',
    },
    gallery: {
      title: 'Gallery',
      description: 'Lookbook, production, and event photos from No Void Minds.',
    },
    testimonial: {
      title: 'Testimonials',
      description:
        'Screenshots of NVM buyer reviews from Shopee and TikTok Shop, with text transcripts.',
    },
    size: {
      title: 'Size',
      description:
        'Find your NVM size from your height or from a favorite tee, using the official size chart for each tech and fit.',
    },
    contact: {
      title: 'Contact',
      description:
        'Reach the NVM team on WhatsApp to ask about techs, wholesale, or collaboration.',
    },
    privacy: {
      title: 'Privacy Policy',
      description:
        'What data NVM keeps from the B2B form, why, how long it is kept, and how to request deletion.',
    },
    notFound: {
      title: 'Page not found',
      description: 'The address you opened does not exist on the No Void Minds site.',
    },
    password: {
      title: 'Coming soon',
      description: 'The No Void Minds site is being prepared.',
    },
  },

  layout: {
    skip: 'Skip to content',
    homeLink: 'No Void Minds, to the home page',
    mainMenu: 'Main menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    shop: 'Shop on Shopee',
    newTab: '(opens in a new tab)',
    darkTheme: 'Dark theme',
    switchLang: 'Baca halaman ini dalam Bahasa Indonesia',
    pauseTicker: 'Pause the ticker',
    playTicker: 'Play the ticker',
  },

  nav: {
    brand: 'Brand',
    tech: 'Technology',
    product: 'Products',
    b2b: 'B2B',
    gallery: 'Gallery',
    testimonial: 'Testimonials',
    size: 'Size',
    contact: 'Contact',
  },

  footer: {
    contact: 'Contact',
    store: 'Store',
    privacy: 'Privacy policy',
    whatsappMessage: 'Hi NVM, I have a question.',
  },

  state: {
    loading: 'Loading data',
    failed: 'Data failed to load',
    retry: 'Try again',
    optional: '(optional)',
  },

  apiErrors: {
    VALIDATION: 'Some fields are not right yet. Check the marked fields.',
    NOT_FOUND: 'The requested data was not found.',
    UNAUTHORIZED: 'Please sign in first.',
    FORBIDDEN: 'Access denied. Reload the page, then try again.',
    RATE_LIMITED: 'Too many submissions. Try again later, or reach us on WhatsApp.',
    CONFLICT: 'This conflicts with another change. Reload, then try again.',
    INTERNAL: 'Something went wrong on the server. Try again shortly.',
    NETWORK: 'Cannot reach the server. Check your connection, then try again.',
  },

  needs: {
    hot: 'Runs hot',
    shape: 'Holds shape',
    move: 'Moves a lot',
    soft: 'Wants soft',
    cold: 'Runs cold',
    layer: 'Needs a layer',
  },

  cta: {
    seeSystems: (count: number | null) =>
      count ? `See the ${count} material systems` : 'See all material systems',
  },

  home: {
    lead: 'Most brands draw the shirt, then go looking for a fabric. We do it the other way round.',
    labIndex: 'Lab index',
    labLoading: 'Loading the Lab index',
    labEmpty: 'The Lab index is not available yet',
    systems: 'Material systems',
    onRack: 'On the rack',
    founded: 'Founded in Bandung',
    lineTitle: 'Core and Graphic',
    lineBody:
      'Core covers every product except collabs, chosen by tech and fit. Graphic covers licensed character collab products, chosen by collab name.',
    lineCta: 'Compare Core and Graphic',
    b2bTitle: 'B2B',
    b2bBody:
      'Run a store, or have an idea and an audience? There are two ways to work with us: Wholesale and Collaboration.',
    b2bCta: 'Send a wholesale inquiry',
    buyersTitle: 'What buyers say',
    buyersCta: 'Read all testimonials',
    galleryTitle: 'Gallery',
    galleryCta: 'Open the full gallery',
  },

  brand: {
    statement:
      'We build technical everyday wear from the material out. Engineering proprietary fabric systems first, then designing each garment around what the fabric can do. Made for those who refuse to blend in.',
    engineeredBody:
      'Performance first, then form. Every seam, panel, and material choice is engineered until it is right. Nothing decorative, nothing wasted.',
    stagesTitle: 'How a system is made',
    stages: [
      {
        label: 'The annoyance',
        title: 'Start with what bugs you',
        body: 'A tee that clings by noon. A collar that gives up by the third wash. Every system starts with one small, specific annoyance.',
      },
      {
        label: 'The fabric',
        title: 'Fix it in the material',
        body: 'Not with a print or a trim. We work the fabric itself: the knit, the weight, the stretch, the finish.',
      },
      {
        label: 'The garment',
        title: 'Then, and only then, cut',
        body: 'Regular, boxy, oversized, fitted. The cut follows what the fabric can do.',
      },
    ],
    timeline: 'Timeline',
  },

  tech: {
    lead: 'Most brands draw the shirt, then go looking for a fabric. We do it the other way round.',
    loading: 'Loading material systems',
    empty: 'The material system list is not available yet',
    filterLabel: 'Your day',
    all: 'All',
    matchCount: (count: string) => `${count} fit`,
    panel: 'Material system details',
    onRack: 'On the rack',
    notYet: 'Not available yet',
    family: 'Family',
    generation: 'Generation',
    forNeeds: 'For',
    character: 'Character',
    features: 'Features',
    fits: 'Available fits',
    noFit: 'No fit options',
    buyTitle: 'Buy on Shopee',
    buyAll: 'See on Shopee',
    buyLabel: (name: string, fit: string) => `${fit} ${name} on Shopee`,
    sizeCta: (name: string, fit: string) => `Find your ${name} ${fit} size`.replace(/\s+/g, ' '),
  },

  probe: {
    label: 'Illustration, not a test result',
    play: 'Show how the fabric behaves',
    hot: 'Airflow passing through the knit',
    shape: 'The grid holds its shape when pushed',
    move: 'The grid stretches in four directions',
    soft: 'Points swell, adding loft',
    cold: 'A layer covers the surface',
    layer: 'A shell over the grid',
  },

  product: {
    number: 'Products',
    title: 'Core and Graphic',
    lead: 'Core is chosen by tech and fit. Graphic is chosen by collab. Prices and stock always follow the Shopee store.',
    coreBody: 'Every product except collabs. Pick a tech, then a fit.',
    matrixLoading: 'Loading the matrix',
    techEmpty: 'The tech list is not available yet',
    matrixRegion: 'Tech and fit matrix, scrolls sideways',
    matrixCaption:
      'Tech and fit combinations in the Core line, cells marked See link to the product on Shopee',
    tech: 'Tech',
    noFitLabel: (name: string) => `See ${name} on Shopee, no fit options`,
    noFit: 'No fit options',
    cellLabel: (name: string, fit: string) => `See ${name} ${fit} on Shopee`,
    see: 'See',
    unavailable: 'Not available',
    noLink: 'No link yet',
    graphicBody: 'Licensed character collab products.',
    collabLoading: 'Loading collabs',
    collabEmpty: 'The collab list is not available yet',
    comingSoon: 'Coming soon',
  },

  b2b: {
    title: 'Two ways to work with us',
    lead: 'Tell us what you need through the form. The NVM team replies by WhatsApp or email.',
    wholesale: {
      audience: 'Stores and resellers',
      body: 'You run a store and want NVM on your rack. Tiered pricing on bulk orders across our systems, full size runs, and restocks you can plan around.',
      points: ['Tiered pricing', 'Full size runs', 'Reliable restocks'],
      cta: 'Fill in a wholesale inquiry',
      submit: 'Send a wholesale inquiry',
    },
    collaboration: {
      audience: 'Brands, communities, teams',
      body: 'You have an idea and an audience. We have the fabric. Co-branded capsules built on our material systems, with custom design and limited runs. Minimum order applies.',
      points: ['Custom design', 'Limited runs', 'Our materials'],
      cta: 'Fill in a collaboration inquiry',
      submit: 'Send a collaboration inquiry',
    },
    sentTitle: 'Inquiry sent',
    codeLabel: 'Inquiry code',
    sentBody:
      'Keep this code. The NVM team will reach you at the contact you gave, or you can continue now on WhatsApp.',
    sentCta: 'Continue on WhatsApp',
    sentMessage: (code: string) => `Hi NVM, I just sent a B2B inquiry with the code ${code}.`,
    formTitle: 'Inquiry form',
    kind: 'Type of partnership',
    name: 'Name',
    org: 'Business or community name',
    city: 'City',
    channels: 'Sales channels',
    phone: 'WhatsApp',
    contactHint: 'Fill in WhatsApp or email, either one is enough.',
    email: 'Email',
    techs: 'Techs you are interested in',
    quantity: 'Estimated quantity',
    message: 'Message',
    consentBefore: 'I agree to this data being processed to answer my inquiry, in line with the',
    consentLink: 'privacy policy',
    sending: 'Sending inquiry',
    errors: {
      name: 'Name must be 2 to 80 characters.',
      org: 'Business or community name must be 2 to 120 characters.',
      city: 'City must be 2 to 80 characters.',
      phoneFormat: 'The WhatsApp number must start with 08 or +62 and have 10 to 15 digits.',
      emailFormat: 'The email format is not right yet.',
      contactRequired: 'Fill in WhatsApp or email, either one is enough.',
      channels: 'Sales channels can be at most 200 characters.',
      quantity: 'Estimated quantity can be at most 200 characters.',
      message: 'The message must be 10 to 1000 characters.',
      consent: 'Tick the consent box so we can process this data.',
      techs: 'One of the chosen techs is not recognized.',
    },
  },

  gallery: {
    number: 'Gallery',
    title: 'Lookbook, production, and events',
    loading: 'Loading the gallery',
    emptyTitle: 'The gallery is being prepared',
    emptyBody: 'Photos appear here once our team uploads them.',
    instagram: 'See NVM on Instagram',
    filter: 'Filter by category',
    all: 'All',
    enlarge: (alt: string) => `Enlarge photo: ${alt}`,
    dialog: (alt: string) => `Photo: ${alt}`,
    previous: 'Previous photo',
    next: 'Next photo',
    close: 'Close photo',
  },

  testimonial: {
    number: 'Testimonials',
    title: 'From NVM buyers',
    lead: 'Screenshots of reviews from Shopee and TikTok Shop, with text transcripts.',
    loading: 'Loading testimonials',
    empty: 'We are collecting testimonials from Shopee and TikTok Shop.',
    source: 'Source',
    allSources: 'All sources',
    tech: 'Tech',
    allTechs: 'All techs',
    summaryWithAverage: (average: string, count: number) =>
      `Average ${average} out of 5 stars, from the ${count} screenshots shown here.`,
    summary: (count: number) => `From the ${count} screenshots shown here.`,
    noMatchTitle: 'No testimonials for this selection',
    noMatchBody: 'Try another source or tech.',
    rating: (rating: number) => `${rating} out of 5 stars`,
    imageAlt: (source: string) => `Screenshot of a review from ${source}`,
    transcript: 'Read the transcript',
  },

  size: {
    title: 'Find your size',
    lead: 'Calculated from the official size chart for each tech and fit. If the data does not exist yet, we say so.',
    loading: 'Loading tech options',
    empty: 'The tech list is not available yet',
    tech: 'Tech',
    fit: 'Fit',
    noFit: (name: string) => `${name} has no fit options.`,
    modes: 'How to find your size',
    byHeight: 'From your height',
    byGarment: 'From a favorite tee',
    height: 'Height (cm)',
    width: 'Tee body width (cm)',
    length: 'Tee body length (cm)',
    chartLoading: 'Loading the size chart',
    chartEmptyTitle: 'The size chart for this combination is not available yet',
    chartEmptyBody: 'Ask the NVM team directly. We do not guess sizes without data.',
    ask: 'Ask about sizing on WhatsApp',
    betweenBefore: 'Your result is between',
    and: 'and',
    betweenAfter: '. Ask us on WhatsApp which one suits you best.',
    recommendation: 'Recommendation:',
    prompt: 'Fill in the form to see a recommendation.',
    tableRegion: 'Size chart table, scrolls sideways',
    difference: 'Difference (cm)',
    selected: '(selected size)',
    tolerance: 'Tolerance of 1 to 2 cm.',
    heightNote: 'Height is a recommendation only.',
    shopCta: 'See this size on Shopee',
    askMessage: (name: string, fit: string, sizes: string[]) =>
      `Hi NVM, I have a question about sizing for ${name} ${fit}${sizes.length > 0 ? `, my result was ${sizes.join(' or ')}` : ''}.`,
  },

  contact: {
    number: 'Contact',
    title: 'Talk to the NVM team',
    lead: 'A real person on the team answers, usually within one working day.',
    topics: [
      {
        title: 'Which system is for me?',
        message: 'Hi NVM, I would like to ask which system suits me.',
      },
      { title: 'Wholesale', message: 'Hi NVM, I would like to ask about wholesale.' },
      { title: 'Collaboration', message: 'Hi NVM, I would like to ask about collaboration.' },
    ],
    footnote: (phone: string) => `WhatsApp ${phone}, Bandung.`,
  },

  privacy: {
    number: 'Privacy',
    title: 'Privacy policy',
    lead: 'This page explains the data we keep from the B2B form and your rights over that data, in line with Indonesian Law No. 27 of 2022 on Personal Data Protection.',
    dataTitle: 'Data we keep',
    dataBody:
      'From the B2B inquiry form: partnership type, name, business or community name, city, WhatsApp, email, sales channels, techs of interest, estimated quantity, message, and time of consent. IP addresses are not stored as they are, only as a hash, and are used to limit excessive submissions.',
    purposeTitle: 'Purpose',
    purposeBody:
      'The data is only used to answer the inquiry you send. We do not use it for any other purpose.',
    retentionTitle: 'Retention',
    retentionBody: 'Inquiry data is kept for 12 months, then deleted.',
    testimonialTitle: 'Testimonials',
    testimonialBody:
      'Review screenshots from Shopee and TikTok Shop are only shown after the buyer account name and profile photo are blurred, unless the buyer gives permission.',
    deletionTitle: 'Requesting deletion',
    deletionBody: (phone: string) =>
      `Contact us on WhatsApp ${phone}. Include your inquiry code if you still have it.`,
    deletionCta: 'Request data deletion',
    deletionMessage: 'Hi NVM, I would like to request deletion of my inquiry data.',
  },

  notFound: {
    title: 'This page does not exist',
    lead: 'The address may be mistyped, or the page has moved.',
    home: 'Back to the home page',
  },

  password: {
    title: 'The site is being prepared',
    lead: 'No Void Minds is preparing this site, and for now only the team can open it.',
    username: 'Username',
    password: 'Password',
    submit: 'Enter the site',
    submitting: 'Checking the account',
    required: 'Fill in the username and password.',
    wrong: 'The username or password is wrong. Check them, then try once more.',
    rateLimited: 'Too many sign-in attempts. Wait 15 minutes, then try again.',
  },
}
