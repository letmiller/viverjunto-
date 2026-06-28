import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginPage, SignupPage } from './pages/Auth'
import { DashboardPage } from './pages/Dashboard'
import ConfirmarEmail     from './pages/ConfirmarEmail'
import SplashScreen       from './pages/onboarding/SplashScreen'
import BoasVindas         from './pages/onboarding/BoasVindas'
import Carrossel          from './pages/onboarding/Carrossel'
import TipoDeUso          from './pages/onboarding/TipoDeUso'
import ConvidarParceiro   from './pages/onboarding/ConvidarParceiro'
import ObjetivosIniciais  from './pages/onboarding/ObjetivosIniciais'
import ConfigFinanceira   from './pages/onboarding/ConfigFinanceira'
import ConfigRotina       from './pages/onboarding/ConfigRotina'
import './styles/global.css'

// ── Zonas de rota ─────────────────────────────────────────────
// PÚBLICA: qualquer um acessa (splash, boas-vindas, carrossel, login, cadastro)
// SETUP: acessível após cadastro, mesmo sem email confirmado
// PRIVADA: só com sessão ativa

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// Setup route: acessível sempre — não bloqueia nem redireciona
// O usuário chega aqui vindo do cadastro (sessão pode ou não estar ativa)
function SetupRoute({ children }) {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />
  return children
}

function PlaceholderPage({ title, icon }) {
  const { signOut } = useAuth()
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', background:'var(--cream)', gap:16, padding:24, paddingBottom:100 }}>
      <div style={{ fontSize:52 }}>{icon}</div>
      <h2 style={{ color:'var(--dark)', textAlign:'center' }}>{title}</h2>
      <p style={{ color:'var(--dark-lt)', fontSize:13, textAlign:'center' }}>Em desenvolvimento — em breve!</p>
      {title === 'Perfil' && (
        <button onClick={signOut} style={{
          background:'#fff', border:'1.5px solid #E1E4E3', borderRadius:14,
          padding:'12px 28px', fontSize:14, fontWeight:500, color:'#51625E',
          cursor:'pointer', marginTop:8,
        }}>Sair da conta</button>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#6BA6A0', display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <svg width="72" height="80" viewBox="0 0 120 130" fill="none">
        <circle cx="38" cy="18" r="11" stroke="#FFE0DB" strokeWidth="5.5" strokeLinecap="round"/>
        <circle cx="82" cy="18" r="11" stroke="rgba(255,255,255,0.7)" strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M10 56 L38 26 L66 56 L66 96 Q66 102 60 102 L16 102 Q10 102 10 96 Z"
          stroke="#FFE0DB" strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
        <path d="M54 66 L82 36 L110 66 L110 106 Q110 112 104 112 L60 112 Q54 112 54 106 Z"
          stroke="rgba(255,255,255,0.7)" strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
      </svg>
      <div style={{ display:'flex', gap:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:4, background:'rgba(255,255,255,0.6)',
            animation:`dotPulse 1.2s ease-in-out ${i*0.2}s infinite alternate` }}/>
        ))}
      </div>
      <style>{`@keyframes dotPulse { from{opacity:0.3;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            {/* ── PÚBLICAS — pré-cadastro ── */}
            <Route path="/"            element={<SplashScreen />} />
            <Route path="/boas-vindas" element={<BoasVindas />} />
            <Route path="/carrossel"   element={<Carrossel />} />
            <Route path="/confirmar"   element={<ConfirmarEmail />} />

            {/* ── AUTH ── */}
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/cadastro" element={<PublicRoute><SignupPage /></PublicRoute>} />

            {/* ── SETUP — pós-cadastro, acessíveis mesmo sem email confirmado ── */}
            <Route path="/tipo-de-uso"       element={<SetupRoute><TipoDeUso /></SetupRoute>} />
            <Route path="/convidar-parceiro" element={<SetupRoute><ConvidarParceiro /></SetupRoute>} />
            <Route path="/objetivos"         element={<SetupRoute><ObjetivosIniciais /></SetupRoute>} />
            <Route path="/config-financeira" element={<SetupRoute><ConfigFinanceira /></SetupRoute>} />
            <Route path="/config-rotina"     element={<SetupRoute><ConfigRotina /></SetupRoute>} />

            {/* ── APP PRIVADO ── */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/financas"  element={<PrivateRoute><PlaceholderPage title="Finanças" icon="💰" /></PrivateRoute>} />
            <Route path="/rotina"    element={<PrivateRoute><PlaceholderPage title="Rotina" icon="✓" /></PrivateRoute>} />
            <Route path="/compras"   element={<PrivateRoute><PlaceholderPage title="Compras" icon="🛒" /></PrivateRoute>} />
            <Route path="/metas"     element={<PrivateRoute><PlaceholderPage title="Metas" icon="✨" /></PrivateRoute>} />
            <Route path="/perfil"    element={<PrivateRoute><PlaceholderPage title="Perfil" icon="👤" /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
