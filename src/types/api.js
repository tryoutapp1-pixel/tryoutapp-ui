// Shared JSDoc type definitions for backend payloads. This module exports no
// runtime values; import types with:
//   /** @type {import('../types/api').Material} */

/** @typedef {'FREE'|'PREMIUM'} AccessType */
/** @typedef {'TWK'|'TIU'|'TKP'} SectionType */
/** @typedef {'latihan'|'tryout'} AssessmentKind */
/** @typedef {'LATIHAN'|'TRYOUT'} AssessmentType */
/** @typedef {'IN_PROGRESS'|'COMPLETED'|'EXPIRED'} AttemptStatus */
/** @typedef {'EASY'|'MEDIUM'|'HARD'} Difficulty */

/**
 * @typedef {Object} Pagination
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} totalPages
 */

/**
 * @template T
 * @typedef {Object} Page
 * @property {T[]} items
 * @property {Pagination} pagination
 */

/**
 * @typedef {Object} PageQuery
 * @property {number} [page=1]
 * @property {number} [limit]
 */

/**
 * @typedef {Object} Subscription
 * @property {AccessType} status - Effective status computed by the backend
 * @property {string|null} started_at
 * @property {string|null} expired_at
 */

/**
 * @typedef {Object} Plan
 * @property {'Free'|'Premium'} name
 * @property {string} title
 * @property {number} price
 * @property {string} currency
 * @property {number} duration_days
 * @property {string} duration_description - HTML built by the backend, e.g. "tahun <small>(365 hari)</small>"
 */

/**
 * @typedef {Object} Invoice
 * @property {string} order_id
 * @property {number} transaction_id
 * @property {string} snap_token
 * @property {number} amount
 * @property {string} currency
 * @property {string} status
 */

/**
 * @typedef {Object} Transaction
 * @property {string} order_id
 * @property {number|string} amount
 * @property {string} status
 * @property {string|null} payment_method
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} FileInfo
 * @property {number} id
 * @property {string} original_filename
 * @property {string} mime_type
 * @property {number} size
 * @property {string} created_at
 * @property {string|null} url - Signed URL, valid for about 60 seconds
 */

/**
 * @typedef {Object} Material
 * @property {number} id
 * @property {string} title
 * @property {string|null} description
 * @property {SectionType} type
 * @property {AccessType} access_type
 * @property {number|boolean} [is_released]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {FileInfo} [file] - Detail responses only
 */

/**
 * @typedef {Object} AssessmentSummary
 * @property {number} id
 * @property {string} title
 * @property {string|null} description
 * @property {AssessmentType} type
 * @property {AccessType} access_type
 * @property {number|null} duration_minutes
 * @property {number} question_count
 */

/**
 * @typedef {AssessmentSummary & {
 *   passing_score_twk: number|string,
 *   passing_score_tiu: number|string,
 *   passing_score_tkp: number|string
 * }} AssessmentDetail
 */

/**
 * @typedef {Object} Attachment
 * @property {string} filename
 * @property {string} mime_type
 * @property {string} url
 */

/**
 * @typedef {Object} AttemptOption
 * @property {number} id
 * @property {string} code
 * @property {string} text
 * @property {number} order
 * @property {Attachment|null} attachment
 */

/**
 * @typedef {Object} AttemptQuestion
 * @property {number} id
 * @property {number} number
 * @property {SectionType} type
 * @property {string} text
 * @property {boolean} answered
 * @property {number|null} selected_option_id
 * @property {Attachment|null} attachment
 * @property {AttemptOption[]} options
 */

/**
 * @typedef {Object} AttemptState
 * @property {number} attempt_id
 * @property {number} assessment_id
 * @property {AttemptStatus} status
 * @property {string} started_at
 * @property {string|null} expired_at - Try Out deadline; null for Latihan
 * @property {string} server_time
 * @property {number|null} remaining_seconds
 * @property {AttemptQuestion[]} [questions]
 */

/**
 * @typedef {Object} AttemptResult
 * @property {number} attempt_id
 * @property {number} assessment_id
 * @property {AttemptStatus} status
 * @property {number} total_score
 * @property {number} twk_score
 * @property {number} tiu_score
 * @property {number} tkp_score
 * @property {boolean} twk_passed
 * @property {boolean} tiu_passed
 * @property {boolean} tkp_passed
 * @property {number} total_correct
 * @property {number} total_wrong
 * @property {number} total_unanswered
 * @property {string} completed_at
 */

/**
 * @typedef {Object} SubmitResponse
 * @property {boolean} is_feedback - True when the user already left feedback
 * @property {AttemptResult} result
 */

/**
 * @typedef {Object} AttemptHistoryEntry
 * @property {number} attempt_id
 * @property {number} assessment_id
 * @property {string} assessment_title
 * @property {AttemptStatus} status
 * @property {string} completed_at
 * @property {number} total_score
 * @property {number} twk_score
 * @property {number} tiu_score
 * @property {number} tkp_score
 * @property {boolean} twk_passed
 * @property {boolean} tiu_passed
 * @property {boolean} tkp_passed
 * @property {number} total_correct
 * @property {number} total_wrong
 * @property {number} total_unanswered
 */

/**
 * @typedef {Object} StatisticsRow
 * @property {number} attempt_id
 * @property {number} assessment_id
 * @property {string} assessment_title
 * @property {string} completed_at
 * @property {number} total_score
 * @property {number} twk_score
 * @property {number} tiu_score
 * @property {number} tkp_score
 */

/**
 * @typedef {Object} ExplanationOption
 * @property {number} id
 * @property {string} code
 * @property {string} text
 * @property {string|null} image_url
 * @property {number} score
 * @property {boolean} is_correct - Always false for TKP
 * @property {boolean} is_selected - The user's answer in the reviewed attempt
 */

/**
 * @typedef {Object} ExplanationItem
 * @property {number} id
 * @property {number} number
 * @property {SectionType} type
 * @property {string} question
 * @property {string|null} question_image_url
 * @property {number|null} selected_option_id
 * @property {string|null} [explanation] - Premium only
 * @property {string|null} [explanation_image_url] - Premium only
 * @property {ExplanationOption[]} options
 */

/**
 * @typedef {Object} FeedbackPayload
 * @property {number} rating - 1 to 5
 * @property {Difficulty} difficulty
 * @property {string} [comment]
 */

/**
 * @typedef {Object} FeedbackEntry
 * @property {number} id
 * @property {number} rating
 * @property {Difficulty} difficulty
 * @property {string|null} comment
 * @property {string} created_at
 * @property {number} assessment_id
 * @property {string} assessment_title
 * @property {AssessmentType} assessment_type
 * @property {number} user_id
 * @property {string} user_name
 * @property {string} user_email
 */

/**
 * @typedef {Object} FeedbackFilters
 * @property {number|null} [assessment_id]
 * @property {AssessmentType|null} [assessment_type]
 * @property {number|null} [rating]
 * @property {Difficulty|null} [difficulty]
 */

/**
 * @typedef {Page<FeedbackEntry> & { summary: { total: number, average_rating: number|null } }} FeedbackPage
 */

export {}
