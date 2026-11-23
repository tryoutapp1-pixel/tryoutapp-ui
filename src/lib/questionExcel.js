// Excel <-> question-package JSON helpers for the admin question upload flow.
//
// Flow: admin downloads a fixed-format template, fills rows, uploads the file.
// The browser parses it here into the exact payload the backend expects at
// POST /api/admin/question-packages:
//   { assessment_id, questions: [
//     { question_text, question_type, explanation?,
//       image_attachment_id?, explanation_attachment_id?,
//       options: [ { option_text, score, image_attachment_id? }, ... ] } ] }
//
// Backend constraints mirrored here (api/src/validators/adminValidators.js):
// - question_type in TWK/TIU/TKP
// - 1..5 options per question, each option needs option_text + numeric score
// - 1..65535 questions
// - attachment ids are optional positive integers (admin uploads images first
//   in the Images menu, then references their numeric id here)
//
// Template layout: one row per OPTION. Columns:
//   question_no | question_type | question_text | explanation |
//   question_image_id | explanation_file_id |
//   option_text | option_score | option_image_id
// Rows sharing the same question_no belong to the same question; the
// question-level fields are read from the first row of that group.

import * as XLSX from 'xlsx'

/** @typedef {import('../types/api').SectionType} SectionType */

/**
 * One option in the question-package payload.
 * @typedef {Object} PackageOption
 * @property {string} option_text
 * @property {number} score
 * @property {number|null} image_attachment_id
 */

/**
 * One question in the question-package payload.
 * @typedef {Object} PackageQuestion
 * @property {string} question_text
 * @property {SectionType} question_type
 * @property {string|null} explanation
 * @property {number|null} image_attachment_id
 * @property {number|null} explanation_attachment_id
 * @property {PackageOption[]} options
 */

/**
 * @typedef {Object} ParsedWorkbook
 * @property {PackageQuestion[]} questions
 * @property {number} questionCount
 * @property {number} optionCount - Total options across all questions
 */

/**
 * One template row (one option). Cells come from Excel, so any column may be
 * a number or a string.
 * @typedef {Record<string, string|number>} TemplateRow
 */

/** @type {SectionType[]} */
export const QUESTION_TYPES = ['TWK', 'TIU', 'TKP']

/** @type {string[]} */
export const TEMPLATE_HEADERS = [
  'question_no',
  'question_type',
  'question_text',
  'explanation',
  'question_image_id',
  'explanation_file_id',
  'option_text',
  'option_score',
  'option_image_id'
]

// Two sample questions so the admin sees exactly how to group option rows.
/** @type {TemplateRow[]} */
const SAMPLE_ROWS = [
  {
    question_no: 1,
    question_type: 'TWK',
    question_text: 'Contoh soal TWK pertama?',
    explanation: 'Penjelasan singkat jawaban benar.',
    question_image_id: '',
    explanation_file_id: '',
    option_text: 'Pilihan A',
    option_score: 5,
    option_image_id: ''
  },
  { question_no: 1, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Pilihan B', option_score: 0, option_image_id: '' },
  { question_no: 1, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Pilihan C', option_score: 0, option_image_id: '' },
  { question_no: 1, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Pilihan D', option_score: 0, option_image_id: '' },
  { question_no: 1, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Pilihan E', option_score: 0, option_image_id: '' },
  {
    question_no: 2,
    question_type: 'TKP',
    question_text: 'Contoh soal TKP (semua opsi berskor)?',
    explanation: '',
    question_image_id: '',
    explanation_file_id: '',
    option_text: 'Respon paling tepat',
    option_score: 5,
    option_image_id: ''
  },
  { question_no: 2, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Respon cukup tepat', option_score: 4, option_image_id: '' },
  { question_no: 2, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Respon kurang tepat', option_score: 3, option_image_id: '' },
  { question_no: 2, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Respon tidak tepat', option_score: 2, option_image_id: '' },
  { question_no: 2, question_type: '', question_text: '', explanation: '', question_image_id: '', explanation_file_id: '', option_text: 'Respon paling tidak tepat', option_score: 1, option_image_id: '' }
]

/**
 * Builds the template workbook and triggers a browser download.
 * @param {string} [filename='question-package-template.xlsx']
 */
export function downloadTemplate(filename = 'question-package-template.xlsx') {
  const wb = XLSX.utils.book_new()

  const sheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: TEMPLATE_HEADERS })
  sheet['!cols'] = [
    { wch: 11 }, { wch: 13 }, { wch: 40 }, { wch: 40 },
    { wch: 16 }, { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 14 }
  ]
  XLSX.utils.book_append_sheet(wb, sheet, 'Questions')

  // A short guidance sheet.
  const guide = [
    ['Petunjuk pengisian'],
    [''],
    ['- Satu baris = satu OPSI jawaban.'],
    ['- Baris dengan question_no yang sama = satu soal.'],
    ['- Isi question_type / question_text / explanation hanya di baris pertama tiap soal.'],
    ['- question_type wajib salah satu dari: TWK, TIU, TKP.'],
    ['- Setiap soal butuh 1 sampai 5 opsi.'],
    ['- option_score berupa angka (boleh desimal, mis. 2.5).'],
    ['- Kolom *_id (gambar/file) opsional. Upload file dulu di menu Images,'],
    ['  lalu salin ID angka attachment-nya ke kolom ini. Kosongkan jika tidak ada.'],
    ['- Hapus baris contoh sebelum mengunggah data asli.']
  ]
  const guideSheet = XLSX.utils.aoa_to_sheet(guide)
  guideSheet['!cols'] = [{ wch: 70 }]
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Petunjuk')

  XLSX.writeFile(wb, filename)
}

/**
 * @param {unknown} value - Cell value
 * @returns {number|null} Null for an empty cell
 * @throws {Error} When the value is not a positive integer
 */
function toOptionalId(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`attachment id "${value}" harus berupa bilangan bulat positif`)
  }
  return n
}

/**
 * @param {unknown} value - Cell value
 * @returns {number}
 * @throws {Error} When the cell is empty, not a number, or negative
 */
function toScore(value) {
  if (value === '' || value === null || value === undefined) {
    throw new Error('option_score wajib diisi')
  }
  const n = Number(value)
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`option_score "${value}" harus berupa angka >= 0`)
  }
  return n
}

/**
 * @param {unknown} value - Cell value
 * @returns {string} Trimmed text; '' for null or undefined
 */
function cleanText(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

/**
 * Parses an uploaded workbook into the question-package payload.
 * @param {ArrayBuffer} arrayBuffer - Contents of the uploaded .xlsx file
 * @returns {Promise<ParsedWorkbook>}
 * @throws {Error} With a human-readable message on the first validation problem
 */
export async function parseWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'questions') || wb.SheetNames[0]
  if (!sheetName) throw new Error('File Excel tidak memiliki sheet apa pun.')

  const sheet = wb.Sheets[sheetName]
  /** @type {TemplateRow[]} */
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!rows.length) throw new Error('Sheet soal kosong.')

  // Validate headers are present.
  const firstRowKeys = Object.keys(rows[0]).map((k) => k.trim())
  const missing = TEMPLATE_HEADERS.filter((h) => !firstRowKeys.includes(h))
  if (missing.length) {
    throw new Error(`Kolom wajib hilang: ${missing.join(', ')}. Gunakan template yang disediakan.`)
  }

  // Group rows by question_no, preserving first-seen order.
  /** @type {Map<string, Array<{ row: TemplateRow, index: number }>>} */
  const groups = new Map()
  /** @type {string[]} */
  const order = []
  rows.forEach((row, index) => {
    const no = cleanText(row.question_no)
    if (!no) {
      // Skip fully blank trailing rows; flag rows that have option data but no number.
      const hasOption = cleanText(row.option_text) !== ''
      if (hasOption) throw new Error(`Baris ${index + 2}: option_text terisi tetapi question_no kosong.`)
      return
    }
    if (!groups.has(no)) {
      groups.set(no, [])
      order.push(no)
    }
    groups.get(no).push({ row, index })
  })

  if (!order.length) throw new Error('Tidak ada soal yang dapat dibaca dari file.')

  /** @type {PackageQuestion[]} */
  const questions = []
  let optionCount = 0

  for (const no of order) {
    const entries = groups.get(no)
    const headEntry = entries[0]
    const head = headEntry.row
    const headLine = headEntry.index + 2

    const questionType = cleanText(head.question_type).toUpperCase()
    if (!QUESTION_TYPES.includes(questionType)) {
      throw new Error(`Soal ${no} (baris ${headLine}): question_type "${head.question_type}" tidak valid (harus TWK/TIU/TKP).`)
    }
    const questionText = cleanText(head.question_text)
    if (!questionText) {
      throw new Error(`Soal ${no} (baris ${headLine}): question_text wajib diisi.`)
    }

    /** @type {PackageOption[]} */
    const options = []
    for (const { row, index } of entries) {
      const optionText = cleanText(row.option_text)
      if (!optionText) continue // allow blank spacer lines within a group
      options.push({
        option_text: optionText,
        score: toScore(row.option_score),
        image_attachment_id: toOptionalId(row.option_image_id)
      })
      optionCount += 1
      if (options.length > 5) {
        throw new Error(`Soal ${no}: maksimal 5 opsi per soal.`)
      }
    }
    if (options.length < 1) {
      throw new Error(`Soal ${no}: minimal 1 opsi jawaban.`)
    }

    const explanation = cleanText(head.explanation)
    questions.push({
      question_text: questionText,
      question_type: questionType,
      explanation: explanation || null,
      image_attachment_id: toOptionalId(head.question_image_id),
      explanation_attachment_id: toOptionalId(head.explanation_file_id),
      options
    })
  }

  if (questions.length > 65535) {
    throw new Error('Jumlah soal melebihi batas 65535.')
  }

  return { questions, questionCount: questions.length, optionCount }
}
