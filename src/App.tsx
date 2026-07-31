import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { auth, household, SESSION_EXPIRED_EVENT } from './lib/api'
import { useSession } from './store/session'
import { toastError } from './store/toast'
import { RequireAuth } from './components/layout/RequireAuth'

const SplashPage = lazy(() => import('./pages/SplashPage').then((m) => ({ default: m.SplashPage })))
const WelcomePage = lazy(() => import('./pages/WelcomePage').then((m) => ({ default: m.WelcomePage })))
const OnboardingCarouselPage = lazy(() =>
  import('./pages/OnboardingCarouselPage').then((m) => ({ default: m.OnboardingCarouselPage })),
)
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const UsageTypePage = lazy(() => import('./pages/UsageTypePage').then((m) => ({ default: m.UsageTypePage })))
const InvitePartnerPage = lazy(() =>
  import('./pages/invite/InvitePartnerPage').then((m) => ({ default: m.InvitePartnerPage })),
)
const InviteQrCodePage = lazy(() =>
  import('./pages/invite/InviteQrCodePage').then((m) => ({ default: m.InviteQrCodePage })),
)
const InviteWaitingPage = lazy(() =>
  import('./pages/invite/InviteWaitingPage').then((m) => ({ default: m.InviteWaitingPage })),
)
const InviteConnectedPage = lazy(() =>
  import('./pages/invite/InviteConnectedPage').then((m) => ({ default: m.InviteConnectedPage })),
)
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })))
const FinancialConfigPage = lazy(() =>
  import('./pages/FinancialConfigPage').then((m) => ({ default: m.FinancialConfigPage })),
)
const RoutineConfigPage = lazy(() =>
  import('./pages/RoutineConfigPage').then((m) => ({ default: m.RoutineConfigPage })),
)
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SharedFinancesPage = lazy(() =>
  import('./pages/SharedFinancesPage').then((m) => ({ default: m.SharedFinancesPage })),
)
const HouseholdOrganizationPage = lazy(() =>
  import('./pages/HouseholdOrganizationPage').then((m) => ({ default: m.HouseholdOrganizationPage })),
)
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage').then((m) => ({ default: m.ShoppingListPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const JoinHouseholdPage = lazy(() =>
  import('./pages/JoinHouseholdPage').then((m) => ({ default: m.JoinHouseholdPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
)

// React Router doesn't reset scroll position on navigation by itself. Pages
// either scroll the window directly (onboarding/auth flow, no internal
// overflow) or scroll an inner `.overflow-y-auto` div (main app screens with
// a BottomNav) — reset both on every route change so a step you'd scrolled
// down on doesn't leave the next step's header/fields off-screen.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll<HTMLElement>('.overflow-y-auto').forEach((el) => {
      el.scrollTop = 0
    })
  }, [pathname])
  return null
}

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-app-bg">
      <span className="size-6 animate-spin rounded-full border-2 border-forest-100 border-t-teal-500" />
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const setUser = useSession((s) => s.setUser)
  const setHousehold = useSession((s) => s.setHousehold)
  const setAuthChecked = useSession((s) => s.setAuthChecked)

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => {
        setUser(user)
        if (user) household.me().then(({ household: h }) => setHousehold(h))
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [setUser, setHousehold, setAuthChecked])

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null)
      setHousehold(null)
      toastError('Sua sessão expirou. Entre novamente.')
      navigate('/login', { replace: true })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [navigate, setUser, setHousehold])

  return (
    <Suspense fallback={<RouteFallback />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/bem-vindo" element={<WelcomePage />} />
        <Route path="/onboarding/:slide" element={<OnboardingCarouselPage />} />
        <Route path="/criar-conta" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tipo-de-uso" element={<UsageTypePage />} />
        <Route path="/convidar" element={<InvitePartnerPage />} />
        <Route path="/convidar/qrcode" element={<InviteQrCodePage />} />
        <Route path="/convidar/aguardando" element={<InviteWaitingPage />} />
        <Route path="/convidar/conectado" element={<InviteConnectedPage />} />
        <Route path="/objetivos" element={<GoalsPage />} />
        <Route path="/config-financeira" element={<FinancialConfigPage />} />
        <Route path="/config-rotina" element={<RoutineConfigPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/financas"
          element={
            <RequireAuth>
              <SharedFinancesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/organizacao"
          element={
            <RequireAuth>
              <HouseholdOrganizationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/lista-compras"
          element={
            <RequireAuth>
              <ShoppingListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/entrar" element={<JoinHouseholdPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/verificar-email" element={<VerifyEmailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
