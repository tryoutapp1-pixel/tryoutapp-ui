// Attempt store — the shared assessment engine for Latihan and Try Out
// (FU12/FU19 and their sub-features). One store instance drives the active
// attempt: questions, per-question answer state, individual answer persistence,
// progress, the Try Out timer, submission, and the post-submit feedback flag.
//
// Design notes (correctness-critical):
//  - Answers are saved individually and are only marked "saved" after the
//    backend confirms. Each question has a monotonic request sequence so a
//    slow older save cannot overwrite a newer selection (race protection).
//    In-flight requests for the same question are aborted when superseded.
//  - The Try Out timer never trusts a local-only countdown. We derive a
//    client/server clock offset from the attempt's server_time, then compute
//    remaining time from the absolute expired_at deadline. This survives page
//    refresh and route re-entry and cannot extend the backend deadline.
//  - kind ('latihan' | 'tryout') and timed are taken from the loaded attempt /
//    assessment, not hard-coded per page.
import { defineStore } from 'pinia'
import userService from '../services/userService'

/** @typedef {import('../types/api').AssessmentKind} AssessmentKind */
/** @typedef {import('../types/api').AttemptState} AttemptState */
/** @typedef {import('../types/api').AttemptQuestion} AttemptQuestion */
/** @typedef {import('../types/api').AttemptResult} AttemptResult */
/** @typedef {import('../types/api').SubmitResponse} SubmitResponse */

/**
 * Per-question answer status used by the UI (legend + chips).
 * @typedef {'idle'|'saving'|'saved'|'error'} SaveStatus
 */

/**
 * @typedef {Object} AttemptStoreState
 * @property {AssessmentKind} kind
 * @property {boolean} timed - True for Try Out (the attempt has a deadline)
 * @property {number|null} attemptId
 * @property {number|null} assessmentId
 * @property {import('../types/api').AttemptStatus|null} status
 * @property {AttemptQuestion[]} questions
 * @property {Record<number, number|null>} answers - questionId to selected_option_id (null if unanswered)
 * @property {Record<number, SaveStatus>} saveStatus - questionId to save status
 * @property {number} activeIndex
 * @property {string|Date|null} expiredAt - Try Out deadline from the backend
 * @property {number} clockOffsetMs - serverNow - clientNow, applied to the local clock
 * @property {boolean} loading
 * @property {string} error
 * @property {boolean} submitting
 * @property {AttemptResult|null} result - Produced by submit or fetched afterwards
 * @property {boolean|null} isFeedback - Backend flag: true if feedback already exists
 */

/** @returns {AttemptStoreState} */
function freshState() {
  return {
    kind: 'latihan',
    timed: false,
    attemptId: null,
    assessmentId: null,
    status: null, // IN_PROGRESS | COMPLETED | EXPIRED
    questions: [], // [{ id, number, type, text, attachment, options:[...] }]
    answers: {}, // questionId -> selected_option_id (null if unanswered)
    saveStatus: {}, // questionId -> 'idle'|'saving'|'saved'|'error'
    activeIndex: 0,

    // Timer bookkeeping (Try Out only).
    expiredAt: null, // ISO string / Date from backend
    clockOffsetMs: 0, // serverNow - clientNow, applied to local clock

    loading: false,
    error: '',
    submitting: false,

    // Result produced by submit or fetched afterwards.
    result: null,
    isFeedback: null // backend flag: true if feedback already exists
  }
}

// Non-reactive bookkeeping kept outside state so Pinia doesn't try to proxy
// AbortControllers / sequence counters.
/** @type {Map<number, number>} */
const saveSeq = new Map() // questionId -> latest issued sequence number
/** @type {Map<number, AbortController>} */
const saveControllers = new Map() // questionId -> AbortController

export const useAttemptStore = defineStore('attempt', {
  state: () => freshState(),

  getters: {
    /** @returns {number} */
    totalQuestions: (state) => state.questions.length,
    /** @returns {number} */
    answeredCount: (state) =>
      state.questions.reduce((n, q) => (state.answers[q.id] ? n + 1 : n), 0),
    /** @returns {number} Whole-number percentage, 0 to 100 */
    progressPercent() {
      if (!this.totalQuestions) return 0
      return Math.round((this.answeredCount / this.totalQuestions) * 100)
    },
    /** @returns {AttemptQuestion|null} */
    activeQuestion: (state) => state.questions[state.activeIndex] || null,
    /** @returns {number[]} Display numbers of unanswered questions */
    unansweredNumbers: (state) =>
      state.questions.filter((q) => !state.answers[q.id]).map((q) => q.number),
    /** @returns {(questionId: number) => boolean} */
    isAnswered: (state) => (questionId) => Boolean(state.answers[questionId]),
    /** @returns {(questionId: number) => SaveStatus} */
    statusOf: (state) => (questionId) => state.saveStatus[questionId] || 'idle',
    /**
     * True once the server-adjusted clock passes the Try Out deadline.
     * @returns {boolean}
     */
    isExpiredByClock() {
      if (!this.timed || !this.expiredAt) return false
      return this.serverNow() >= new Date(this.expiredAt).getTime()
    }
  },

  actions: {
    /**
     * Current time adjusted for the server/client clock skew measured at load.
     * @returns {number} Epoch milliseconds
     */
    serverNow() {
      return Date.now() + this.clockOffsetMs
    },

    /**
     * Remaining seconds until the backend deadline (Try Out).
     * @returns {number|null} Null for Latihan
     */
    remainingSeconds() {
      if (!this.timed || !this.expiredAt) return null
      return Math.max(0, Math.floor((new Date(this.expiredAt).getTime() - this.serverNow()) / 1000))
    },

    /** Aborts in-flight saves and restores the initial state. */
    reset() {
      saveSeq.clear()
      for (const c of saveControllers.values()) {
        try {
          c.abort()
        } catch {
          /* ignore */
        }
      }
      saveControllers.clear()
      Object.assign(this, freshState())
    },

    /**
     * Loads an in-progress attempt and hydrates questions and saved answers.
     * `kind` is provided by the caller (derived from the route); `timed` is
     * derived from the attempt's deadline.
     *
     * A fresh load for a *different* attempt clears prior engine state first; a
     * re-load of the *same* attempt (e.g. refreshing expired signed image URLs)
     * preserves the user's current question and the measured clock offset so the
     * view and countdown do not jump.
     * @param {number|string} attemptId
     * @param {{ kind?: AssessmentKind }} [options]
     * @throws {import('../lib/apiError').ApiError} When the attempt cannot be loaded
     */
    async loadAttempt(attemptId, { kind = 'latihan' } = {}) {
      const sameAttempt = String(this.attemptId) === String(attemptId)
      if (!sameAttempt) this.reset()
      this.loading = true
      this.error = ''
      try {
        const data = await userService.getAttempt(attemptId)
        this.applyAttemptState(data, kind, { preserveView: sameAttempt })
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Copies a backend attempt payload into the store.
     * @param {AttemptState} data - Attempt with `questions`
     * @param {AssessmentKind} kind
     * @param {{ preserveView?: boolean }} [options] - Keep the current question and clock offset
     */
    applyAttemptState(data, kind, { preserveView = false } = {}) {
      this.kind = kind
      this.timed = Boolean(data.expired_at)
      this.attemptId = data.attempt_id
      this.assessmentId = data.assessment_id
      this.status = data.status
      this.expiredAt = data.expired_at || null

      // Measure clock skew only on the first load of this attempt so a mid-
      // attempt reload doesn't nudge the visible countdown.
      if (data.server_time && !preserveView) {
        this.clockOffsetMs = new Date(data.server_time).getTime() - Date.now()
      }

      const questions = data.questions || []
      this.questions = questions
      /** @type {Record<number, number|null>} */
      const answers = {}
      /** @type {Record<number, SaveStatus>} */
      const saveStatus = {}
      for (const q of questions) {
        answers[q.id] = q.selected_option_id || null
        saveStatus[q.id] = q.selected_option_id ? 'saved' : 'idle'
      }
      this.answers = answers
      this.saveStatus = saveStatus
      // Keep the user on their current question across a same-attempt reload.
      if (!preserveView) {
        this.activeIndex = 0
      } else if (this.activeIndex >= questions.length) {
        this.activeIndex = Math.max(0, questions.length - 1)
      }
    },

    /**
     * Moves to a question by zero-based index. Out-of-range indexes are ignored.
     * @param {number} index
     */
    goTo(index) {
      if (index >= 0 && index < this.questions.length) this.activeIndex = index
    },
    next() {
      this.goTo(this.activeIndex + 1)
    },
    prev() {
      this.goTo(this.activeIndex - 1)
    },

    /**
     * Saves a single answer. Optimistically reflects the selection in the UI
     * but only marks it 'saved' once the backend confirms. Protects against
     * races where a slower earlier request would otherwise land after a newer
     * one. Does nothing unless the attempt is IN_PROGRESS.
     * @param {number} questionId
     * @param {number} optionId
     * @throws {import('../lib/apiError').ApiError} When the latest save for this question fails
     */
    async selectAnswer(questionId, optionId) {
      if (this.status !== 'IN_PROGRESS') return
      // One click on an option's radio also bubbles to its card, so the same
      // selection can arrive twice. Skip it while it is saving or saved; an
      // 'error' status still goes through so Retry works.
      const currentStatus = this.saveStatus[questionId]
      if (this.answers[questionId] === optionId && (currentStatus === 'saving' || currentStatus === 'saved')) return
      // Reflect the selection immediately for responsiveness.
      this.answers = { ...this.answers, [questionId]: optionId }

      // Abort any in-flight save for this same question.
      const prevController = saveControllers.get(questionId)
      if (prevController) {
        try {
          prevController.abort()
        } catch {
          /* ignore */
        }
      }
      const controller = new AbortController()
      saveControllers.set(questionId, controller)

      const seq = (saveSeq.get(questionId) || 0) + 1
      saveSeq.set(questionId, seq)

      this.saveStatus = { ...this.saveStatus, [questionId]: 'saving' }
      try {
        await userService.saveAnswer(this.attemptId, questionId, optionId, {
          signal: controller.signal
        })
        // Only the latest request for this question may finalize status.
        if (saveSeq.get(questionId) === seq) {
          this.saveStatus = { ...this.saveStatus, [questionId]: 'saved' }
          saveControllers.delete(questionId)
        }
      } catch (error) {
        // A superseded/aborted request must not clobber newer state.
        if (saveSeq.get(questionId) !== seq) return
        if (error && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError')) return
        this.saveStatus = { ...this.saveStatus, [questionId]: 'error' }
        saveControllers.delete(questionId)
        throw error
      }
    },

    /**
     * Retries a failed save using the currently selected option.
     * @param {number} questionId
     */
    async retrySave(questionId) {
      const optionId = this.answers[questionId]
      if (optionId) await this.selectAnswer(questionId, optionId)
    },

    /**
     * Submits the attempt. Guards against duplicate submissions: while a
     * submit is in flight, or once the attempt is no longer IN_PROGRESS, it
     * returns the stored values instead of calling the backend.
     * @returns {Promise<SubmitResponse|{ is_feedback: boolean|null, result: AttemptResult|null }>}
     */
    async submit() {
      if (this.submitting || this.status !== 'IN_PROGRESS') {
        return { is_feedback: this.isFeedback, result: this.result }
      }
      this.submitting = true
      try {
        const data = await userService.submitAttempt(this.attemptId)
        this.result = data.result || null
        this.isFeedback = data.is_feedback
        this.status = (data.result && data.result.status) || 'COMPLETED'
        return data
      } finally {
        this.submitting = false
      }
    }
  }
})
