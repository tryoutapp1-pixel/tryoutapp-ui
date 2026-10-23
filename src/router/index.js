import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import PublicLayout from '../layouts/PublicLayout.vue'
import UserLayout from '../layouts/UserLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import LandingPage from '../views/LandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import SignupPage from '../views/SignupPage.vue'
import VerifyEmailPage from '../views/VerifyEmailPage.vue'
import ForgotPasswordPage from '../views/ForgotPasswordPage.vue'
import ResetPasswordPage from '../views/ResetPasswordPage.vue'
import UserHomePage from '../views/UserHomePage.vue'
import AdminHomePage from '../views/AdminHomePage.vue'
import ForbiddenPage from '../views/ForbiddenPage.vue'
import NotFoundPage from '../views/NotFoundPage.vue'

export const routes = [
  {
    path: '/', component: PublicLayout, meta: { access: 'public' }, children: [
      { path: '', name: 'landing', component: LandingPage, meta: { access: 'public' } },
      { path: 'login', name: 'login', component: LoginPage, meta: { access: 'public', guestOnly: true } },
      { path: 'signup', name: 'signup', component: SignupPage, meta: { access: 'public' } },
      { path: 'verify-email', name: 'verify-email', component: VerifyEmailPage, meta: { access: 'public' } },
      { path: 'forgot-password', name: 'forgot-password', component: ForgotPasswordPage, meta: { access: 'public' } },
      { path: 'reset-password', name: 'reset-password', component: ResetPasswordPage, meta: { access: 'public' } },
      { path: 'forbidden', name: 'forbidden', component: ForbiddenPage, meta: { access: 'public' } },
    ],
  },
  {
    path: '/app', component: UserLayout, meta: { access: 'authenticated', roles: ['USER'] }, children: [
      { path: '', name: 'user-home', component: UserHomePage, meta: { access: 'authenticated', roles: ['USER'] } },
    ],
  },
  {
    path: '/admin', component: AdminLayout, meta: { access: 'authenticated', roles: ['ADMIN'] }, children: [
      { path: '', name: 'admin-home', component: AdminHomePage, meta: { access: 'authenticated', roles: ['ADMIN'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage, meta: { access: 'public' } },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  const roles = to.meta.roles

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return auth.user?.role === 'ADMIN' ? { name: 'admin-home' } : { name: 'user-home' }
  }
  if (to.meta.access === 'authenticated' && !auth.isAuthenticated) {
    if (to.name === 'login') return true
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (Array.isArray(roles) && (!auth.user?.role || !roles.includes(auth.user.role))) {
    return { name: 'forbidden' }
  }
  return true
})

