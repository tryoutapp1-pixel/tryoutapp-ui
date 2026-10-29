// Vue Router: nested routes under layouts, with auth/role guards.
//
// Route meta:
//   requiresAuth: must be authenticated
//   roles: array of allowed roles (USER / ADMIN)
//   guestOnly: only for unauthenticated visitors (login/signup/etc.)
//
// The guard initializes the auth store once (hydrating the user from a stored
// token), then enforces access. Frontend guards are navigation/UX only; the
// backend remains the authority on authorization.

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, ROLES } from '../stores/auth'

import PublicLayout from '../layouts/PublicLayout.vue'
import UserLayout from '../layouts/UserLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

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
      { path: 'materials', name: 'user-materials', component: () => import('../views/user/ComingSoonPage.vue'), meta: { title: 'Materials' } },
      { path: 'latihan', name: 'user-latihan', component: () => import('../views/user/ComingSoonPage.vue'), meta: { title: 'Latihan' } },
      { path: 'tryout', name: 'user-tryout', component: () => import('../views/user/ComingSoonPage.vue'), meta: { title: 'Try Out' } },
      { path: 'subscription', name: 'user-subscription', component: () => import('../views/user/ComingSoonPage.vue'), meta: { title: 'Subscription' } },
      { path: 'transactions', name: 'user-transactions', component: () => import('../views/user/ComingSoonPage.vue'), meta: { title: 'Transactions' } }
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
      { path: 'assessments/:id/questions', name: 'admin-assessment-questions', component: () => import('../views/admin/QuestionPackageUploadPage.vue') }
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

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const guestOnly = to.matched.some((r) => r.meta.guestOnly)
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
