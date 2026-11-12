// Vue Router: nested routes under layouts, with auth/role guards.
//
// Route meta:
//   requiresAuth: must be authenticated
//   roles: array of allowed roles (USER / ADMIN)
//   guestOnly: only for unauthenticated visitors (login/signup/etc.)
//   kind: 'latihan' | 'tryout' for the shared assessment pages
//
// The guard initializes the auth store once (hydrating the user from a stored
// token), then enforces access. Frontend guards are navigation/UX only; the
// backend remains the authority on authorization.

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, ROLES } from '../stores/auth'

import PublicLayout from '../layouts/PublicLayout.vue'
import UserLayout from '../layouts/UserLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import AssessmentLayout from '../layouts/AssessmentLayout.vue'

/**
 * Meta fields this app reads from route records.
 * @typedef {Object} AppRouteMeta
 * @property {boolean} [requiresAuth] - Must be authenticated
 * @property {import('../services/authService').Role[]} [roles] - Allowed roles; the deepest matched record wins
 * @property {boolean} [guestOnly] - Only for unauthenticated visitors
 * @property {import('../types/api').AssessmentKind} [kind] - Which assessment flow a shared page serves
 */

/** @type {import('vue-router').RouteRecordRaw[]} */
const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'landing', component: () => import('../views/LandingPage.vue') },
      { path: 'login', name: 'login', component: () => import('../views/auth/LoginPage.vue'), meta: { guestOnly: true } },
      { path: 'signup', name: 'signup', component: () => import('../views/auth/SignupPage.vue'), meta: { guestOnly: true } },
      { path: 'verify-email', name: 'verify-email', component: () => import('../views/auth/VerifyEmailPage.vue') },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('../views/auth/ForgotPasswordPage.vue'), meta: { guestOnly: true } },
      { path: 'reset-password', name: 'reset-password', component: () => import('../views/auth/ResetPasswordPage.vue') },
      { path: 'forbidden', name: 'forbidden', component: () => import('../views/errors/ForbiddenPage.vue') }
    ]
  },
  {
    path: '/app',
    component: UserLayout,
    meta: { requiresAuth: true, roles: [ROLES.USER] },
    children: [
      { path: '', name: 'user-dashboard', component: () => import('../views/user/UserDashboardPage.vue') },
      { path: 'profile', name: 'user-profile', component: () => import('../views/user/ProfilePage.vue') },
      { path: 'account', name: 'user-account', component: () => import('../views/user/AccountSecurityPage.vue') },

      // Subscription & payment (FU2, FU6, FU7)
      { path: 'subscription', name: 'user-subscription', component: () => import('../views/user/SubscriptionPage.vue') },
      { path: 'transactions', name: 'user-transactions', component: () => import('../views/user/TransactionsPage.vue') },

      // Premium checkout flow (Features 6, 7, 8). Invoice + method selection is
      // the purchase-preparation stage; payment is the Snap execution stage;
      // the outcome pages reflect backend/transaction state (never a client-
      // side Snap callback) after the interaction resolves.
      { path: 'checkout', name: 'user-checkout', component: () => import('../views/user/CheckoutPage.vue') },
      { path: 'payment', name: 'user-payment', component: () => import('../views/user/PaymentPage.vue') },
      { path: 'payment/success', name: 'user-payment-success', component: () => import('../views/user/PaymentSuccessPage.vue') },
      { path: 'payment/pending', name: 'user-payment-pending', component: () => import('../views/user/PaymentPendingPage.vue') },
      { path: 'payment/failed', name: 'user-payment-failed', component: () => import('../views/user/PaymentFailedPage.vue') },

      // Materials (FU8, FU9)
      { path: 'materials', name: 'user-materials', component: () => import('../views/user/MaterialsListPage.vue') },
      { path: 'materials/:id', name: 'user-material-detail', component: () => import('../views/user/MaterialDetailPage.vue') },

      // Latihan (FU10-FU15) — untimed assessment engine.
      // The ACTIVE attempt route lives under the distraction-free
      // AssessmentLayout (see /assessment below), not here.
      { path: 'latihan', name: 'user-latihan', component: () => import('../views/user/AssessmentListPage.vue'), meta: { kind: 'latihan' } },
      { path: 'latihan/:id', name: 'user-latihan-detail', component: () => import('../views/user/AssessmentDetailPage.vue'), meta: { kind: 'latihan' } },
      { path: 'latihan/:id/history', name: 'user-latihan-history', component: () => import('../views/user/AttemptHistoryPage.vue'), meta: { kind: 'latihan' } },
      { path: 'latihan/:id/explanations', name: 'user-latihan-explanations', component: () => import('../views/user/ExplanationsPage.vue'), meta: { kind: 'latihan' } },

      // Try Out (FU16-FU22) — same engine, with a backend-driven timer.
      { path: 'tryout', name: 'user-tryout', component: () => import('../views/user/AssessmentListPage.vue'), meta: { kind: 'tryout' } },
      // My Progress is Premium only; the page itself explains this to Free users.
      { path: 'tryout/statistics', name: 'user-tryout-statistics', component: () => import('../views/user/StatisticsPage.vue') },
      { path: 'tryout/:id', name: 'user-tryout-detail', component: () => import('../views/user/AssessmentDetailPage.vue'), meta: { kind: 'tryout' } },
      { path: 'tryout/:id/history', name: 'user-tryout-history', component: () => import('../views/user/AttemptHistoryPage.vue'), meta: { kind: 'tryout' } },
      { path: 'tryout/:id/explanations', name: 'user-tryout-explanations', component: () => import('../views/user/ExplanationsPage.vue'), meta: { kind: 'tryout' } }
    ]
  },
  {
    // Distraction-free active-attempt engine (Feature 5). Same auth/role rules
    // as the user area, but rendered without the learner nav drawer/app bar.
    // Direct URL access and refresh work because the attempt state is loaded
    // fresh from the backend by AttemptPage on mount.
    path: '/assessment',
    component: AssessmentLayout,
    meta: { requiresAuth: true, roles: [ROLES.USER] },
    children: [
      { path: 'latihan/:id/attempt/:attemptId', name: 'user-latihan-attempt', component: () => import('../views/user/AttemptPage.vue'), meta: { kind: 'latihan' } },
      { path: 'tryout/:id/attempt/:attemptId', name: 'user-tryout-attempt', component: () => import('../views/user/AttemptPage.vue'), meta: { kind: 'tryout' } }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardPage.vue') },
      { path: 'profile', name: 'admin-profile', component: () => import('../views/user/ProfilePage.vue') },
      { path: 'account', name: 'admin-account', component: () => import('../views/user/AccountSecurityPage.vue') },

      // Users (FA1, FA2) — read-only
      { path: 'users', name: 'admin-users', component: () => import('../views/admin/UsersListPage.vue') },
      { path: 'users/:id', name: 'admin-user-detail', component: () => import('../views/admin/UserDetailPage.vue') },

      // Images / files (FA3, FA4, FA5, FA7)
      { path: 'images', name: 'admin-images', component: () => import('../views/admin/ImagesPage.vue') },

      // Materials (FA8-11, FA24)
      { path: 'materials', name: 'admin-materials', component: () => import('../views/admin/MaterialsPage.vue') },
      { path: 'materials/:id', name: 'admin-material-detail', component: () => import('../views/admin/MaterialDetailPage.vue') },

      // Assessments + question packages
      { path: 'assessments', name: 'admin-assessments', component: () => import('../views/admin/AssessmentsListPage.vue') },
      { path: 'assessments/new', name: 'admin-assessment-new', component: () => import('../views/admin/AssessmentFormPage.vue') },
      { path: 'assessments/:id', name: 'admin-assessment-detail', component: () => import('../views/admin/AssessmentDetailPage.vue') },
      { path: 'assessments/:id/edit', name: 'admin-assessment-edit', component: () => import('../views/admin/AssessmentFormPage.vue') },
      { path: 'assessments/:id/questions', name: 'admin-assessment-questions', component: () => import('../views/admin/QuestionPackageUploadPage.vue') },

      // Learner feedback, filterable by assessment, type, rating, and difficulty
      { path: 'feedback', name: 'admin-feedback', component: () => import('../views/admin/FeedbackListPage.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/errors/NotFoundPage.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

/**
 * Auth and role guard.
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {Promise<import('vue-router').RouteLocationRaw|boolean>} A redirect target, or true to continue
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  // Each record's meta follows AppRouteMeta.
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const guestOnly = to.matched.some((r) => r.meta.guestOnly)
  /** @type {AppRouteMeta['roles']|null} */
  const allowedRoles = to.matched.reduce((roles, r) => (r.meta.roles ? r.meta.roles : roles), null)

  // Already authenticated users should not sit on guest-only pages.
  if (guestOnly && authStore.isAuthenticated) {
    return authStore.homeRoute
  }

  if (requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Preserve where the user wanted to go as an internal redirect.
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    // Role check. If the user lacks the required role, send to forbidden
    // (not their home) to avoid surprising silent redirects and loops.
    if (allowedRoles && (!authStore.role || !allowedRoles.includes(authStore.role))) {
      return { path: '/forbidden' }
    }
  }

  return true
})

export default router
