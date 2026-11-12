// Select options for backend enums, shared by admin forms and filters.

/** @type {{ title: string, value: import('../types/api').SectionType }[]} */
export const SECTION_TYPE_OPTIONS = [
  { title: 'TWK (Tes Wawasan Kebangsaan)', value: 'TWK' },
  { title: 'TIU (Tes Intelegensi Umum)', value: 'TIU' },
  { title: 'TKP (Tes Karakteristik Pribadi)', value: 'TKP' }
]

/** @type {{ title: string, value: import('../types/api').AccessType }[]} */
export const ACCESS_TYPE_OPTIONS = [
  { title: 'Free', value: 'FREE' },
  { title: 'Premium', value: 'PREMIUM' }
]
