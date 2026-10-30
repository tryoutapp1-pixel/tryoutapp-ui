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

// Per-question answer status used by the UI (legend + chips).
// 'idle' | 'saving' | 'saved' | 'error'
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
const saveSeq = new Map() // questionId -> latest issued sequence number
const saveControllers = new Map() // questionId -> AbortController

export const useAttemptStore = defineStore('attempt', {
  state: () => freshState(),

  getters: {
    totalQuestions: (state) => state.questions.length,
    answeredCount: (state) =>
      state.questions.reduce((n, q) => (state.answers[q.id] ? n + 1 : n), 0),
    progressPercent() {
      if (!this.totalQuestions) return 0
      return Math.round((this.answeredCount / this.totalQuestions) * 100)
    },
    activeQuestion: (state) => state.questions[state.activeIndex] || null,
    unansweredNumbers: (state) =>
      state.questions.filter((q) => !state.answers[q.id]).map((q) => q.number),
    isAnswered: (state) => (questionId) => Boolean(state.answers[questionId]),
    statusOf: (state) => (questionId) => state.saveStatus[questionId] || 'idle',
    isExpiredByClock() {
      if (!this.timed || !this.expiredAt) return false
      return this.serverNow() >= new Date(this.expiredAt).getTime()
    }
  },

  actions: {
    // Current time adjusted for the server/client clock skew measured at load.
    serverNow() {
      return Date.now() + this.clockOffsetMs
    },

    // Remaining seconds until the backend deadline (Try Out). Null for Latihan.
    remainingSeconds() {
      if (!this.timed || !this.expiredAt) return null
      return Math.max(0, Math.floor((new Date(this.expiredAt).getTime() - this.serverNow()) / 1000))
    },

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

    // Load an in-progress attempt and hydrate questions + saved answers.
    // kind/timed are provided by the caller (derived from the route/assessment).
    //
    // A fresh load for a *different* attempt clears prior engine state first; a
    // re-load of the *same* attempt (e.g. refreshing expired signed image URLs)
    // preserves the user's current question and the measured clock offset so the
    // view and countdown do not jump.
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
      const answers = {}
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

    goTo(index) {
      if (index >= 0 && index < this.questions.length) this.activeIndex = index
    },
    next() {
      this.goTo(this.activeIndex + 1)
    },
    prev() {
      this.goTo(this.activeIndex - 1)
    },

    // Save a single answer. Optimistically reflects the selection in the UI but
    // only marks it 'saved' once the backend confirms. Protects against races
    // where a slower earlier request would otherwise land after a newer one.
    async selectAnswer(questionId, optionId) {
      if (this.status !== 'IN_PROGRESS') return
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

    // Retry a failed save using the currently selected option.
    async retrySave(questionId) {
      const optionId = this.answers[questionId]
      if (optionId) await this.selectAnswer(questionId, optionId)
    },

    // Submit the attempt. Guards against duplicate submissions. Returns
    // { is_feedback, result } from the backend.
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
