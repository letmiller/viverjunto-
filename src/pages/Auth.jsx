import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { LogoFull } from '../components/Logo'

// ── Strength bar ─────────────────────────────────────
function PasswordStrength({ password }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2 : 3
  const colors = ['', '#E14848', '#F5C842', '#63B37E']
  const labels = ['', 'Fraca', 'Média', 'Forte ✓']
  if (!password) return null
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 3,
            background: i <= strength ? colors[strength] : '#E1E4E3',
            transition: 'background 0.25s ease',
          }}/>
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[strength], fontWeight: 500, marginTop: 3, display: 'block' }}>
        Senha {labels[strength]}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// SIGNUP — fiel ao Figma tela 04
// ══════════════════════════════════════════════════════
export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const isValid = name.trim().length > 0 && email.includes('@') && password.length >= 6

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Informe seu nome.'
    if (!email.includes('@')) e.email = 'Email inválido.'
    if (password.length < 6) e.password = 'Mínimo 6 caracteres.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setError('')
    const { error: err } = await signUp({ email, password, name })
    setLoading(false)
    if (err) {
      setError(err.message.includes('already registered') ? 'Este email já está cadastrado.' : err.message)
    } else {
      setSuccess(true)
    }
  }

  // ── Tela de sucesso ──────────────────────────────────
  if (success) {
    return (
      <div style={{ position:'relative', width:'100%', minHeight:'100vh', background:'#fff', overflow:'hidden' }}>
        {/* Auras */}
        <div style={{ position:'absolute', left:100, top:-40, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', left:-40, top:600, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,138,122,0.14) 0%, transparent 70%)' }}/>

        {/* Status bar */}
        <div style={{ height:59, display:'flex', alignItems:'center', padding:'0 40px' }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
        </div>

        {/* Badge de sucesso */}
        <div style={{
          position:'absolute', left:'50%', top:220,
          transform:'translateX(-50%)',
          width:100, height:100, borderRadius:50,
          background:'#6BA6A0',
          boxShadow:'0 12px 20px rgba(107,166,160,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          animation:'badgeSpring 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <span style={{ fontSize:44, color:'#fff', fontWeight:700 }}>✓</span>
        </div>

        {/* Confetti dots */}
        {[
          {left:54,top:200,size:10,color:'#FF8A7A'},
          {left:320,top:210,size:8, color:'#F5D8A6'},
          {left:38, top:300,size:8, color:'#D1E7E5'},
          {left:340,top:310,size:10,color:'#FFE0DB'},
          {left:70, top:350,size:6, color:'#F5D8A6'},
          {left:310,top:340,size:7, color:'#6BA6A0'},
        ].map((c,i) => (
          <div key={i} style={{
            position:'absolute', left:c.left, top:c.top,
            width:c.size, height:c.size, borderRadius:'50%',
            background:c.color,
            animation:`confettiFly 0.6s ease ${i*0.06}s both`,
          }}/>
        ))}

        {/* Textos */}
        <h2 style={{
          position:'absolute', top:344, left:0, width:'100%',
          textAlign:'center', fontSize:28, fontWeight:700,
          color:'#2E3A37', lineHeight:1.3,
          animation:'slideUp 0.5s ease 0.3s both',
        }}>
          Conta criada<br/>com sucesso! 🎉
        </h2>

        <p style={{
          position:'absolute', top:438, left:24, width:345,
          textAlign:'center', fontSize:15, color:'#51625E', lineHeight:1.55,
          animation:'slideUp 0.5s ease 0.4s both',
        }}>
          Bem-vindo ao ViverJunto, {name.split(' ')[0]}.<br/>
          Agora é hora de construir algo incrível juntos.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/tipo-de-uso')}
          style={{
            position:'absolute', left:24, top:582, width:345, height:56,
            background:'#6BA6A0', border:'none', borderRadius:16,
            color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer',
            boxShadow:'0 8px 12px rgba(107,166,160,0.22)',
            animation:'slideUp 0.5s ease 0.5s both',
          }}
        >
          <div style={{ position:'absolute', top:0, left:0, right:0, height:28, background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>
          Começar a organizar ✦
        </button>

        <style>{`
          @keyframes badgeSpring { from { opacity:0; transform:translateX(-50%) scale(0); } to { opacity:1; transform:translateX(-50%) scale(1); } }
          @keyframes confettiFly { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </div>
    )
  }

  // ── Formulário de cadastro ───────────────────────────
  return (
    <div style={{ position:'relative', width:'100%', minHeight:'100vh', background:'#fff', overflow:'hidden' }}>
      {/* Auras */}
      <div style={{ position:'absolute', left:200, top:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(107,166,160,0.20) 0%, transparent 70%)' }}/>
      <div style={{ position:'absolute', left:-60, top:600, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,138,122,0.14) 0%, transparent 70%)' }}/>

      {/* Status bar */}
      <div style={{ height:59, display:'flex', alignItems:'center', padding:'0 40px' }}>
        <span style={{ fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
      </div>

      {/* Header */}
      <div style={{ height:56, display:'flex', alignItems:'center', padding:'0 24px' }}>
        <LogoFull size={28} />
      </div>

      {/* Headline */}
      <h2 style={{ margin:'0 24px', marginTop:12, fontSize:24, fontWeight:700, color:'#2E3A37', lineHeight:1.3 }}>
        Vamos começar sua organização compartilhada.
      </h2>
      <p style={{ margin:'14px 24px 0', fontSize:14, color:'#51625E', lineHeight:1.55 }}>
        Crie sua conta para começar a construir uma rotina mais leve.
      </p>

      {/* Error */}
      {error && (
        <div style={{ margin:'16px 24px 0', display:'flex', gap:8, alignItems:'center', background:'#FEE8E8', border:'1px solid #E14848', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#C03030' }}>
          <AlertCircle size={16}/> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ margin:'24px 24px 0', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Nome */}
        <div>
          <div style={{
            border:`1.5px solid ${errors.name ? '#E14848' : name ? '#6BA6A0' : '#E1E4E3'}`,
            borderRadius:14, padding:'18px 16px',
            background: errors.name ? '#FEE8E8' : '#fff',
            transition:'border-color 0.15s ease',
          }}>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              style={{ width:'100%', border:'none', outline:'none', fontSize:15, color:'#2E3A37', background:'transparent', fontFamily:'Inter, sans-serif' }}
            />
          </div>
          {errors.name && <span style={{ fontSize:11, color:'#E14848', marginTop:3, display:'block' }}>{errors.name}</span>}
        </div>

        {/* Email */}
        <div>
          <div style={{
            border:`1.5px solid ${errors.email ? '#E14848' : email ? '#6BA6A0' : '#E1E4E3'}`,
            borderRadius:14, padding:'18px 16px',
            background: errors.email ? '#FEE8E8' : '#fff',
            transition:'border-color 0.15s ease',
          }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Seu melhor email"
              style={{ width:'100%', border:'none', outline:'none', fontSize:15, color:'#2E3A37', background:'transparent', fontFamily:'Inter, sans-serif' }}
            />
          </div>
          {errors.email && <span style={{ fontSize:11, color:'#E14848', marginTop:3, display:'block' }}>{errors.email}</span>}
        </div>

        {/* Senha */}
        <div>
          <div style={{
            border:`1.5px solid ${errors.password ? '#E14848' : password ? '#6BA6A0' : '#E1E4E3'}`,
            borderRadius:14, padding:'16px',
            background: errors.password ? '#FEE8E8' : '#fff',
            display:'flex', alignItems:'center', gap:8,
            transition:'border-color 0.15s ease',
          }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Crie uma senha"
              style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'#2E3A37', background:'transparent', fontFamily:'Inter, sans-serif' }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ border:'none', background:'none', cursor:'pointer', color:'#80908C', padding:0, display:'flex' }}>
              {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>
          <PasswordStrength password={password} />
          {errors.password && <span style={{ fontSize:11, color:'#E14848', marginTop:3, display:'block' }}>{errors.password}</span>}
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={!isValid || loading}
          style={{
            width:'100%', height:56, border:'none', borderRadius:16,
            background: isValid && !loading ? '#FF8A7A' : '#E1E4E3',
            color: isValid && !loading ? '#fff' : '#80908C',
            fontSize:16, fontWeight:600, cursor: isValid ? 'pointer' : 'default',
            opacity: loading ? 0.8 : 1,
            boxShadow: isValid ? '0 8px 12px rgba(255,138,122,0.25)' : 'none',
            transition:'all 0.25s ease', position:'relative', overflow:'hidden',
            marginTop:8,
          }}
        >
          {isValid && !loading && <div style={{ position:'absolute', top:0, left:0, right:0, height:28, background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>}
          {loading ? 'Criando conta...' : 'Continuar'}
        </button>
      </form>

      {/* Login link */}
      <div style={{ marginTop:32, textAlign:'center' }}>
        <p style={{ fontSize:13, color:'#647470' }}>Já possui conta?</p>
        <Link to="/login" style={{ fontSize:14, fontWeight:600, color:'#FF8A7A', textDecoration:'none', display:'block', marginTop:8 }}>
          Entrar
        </Link>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════
export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Preencha todos os campos.'); return }
    setLoading(true); setError('')
    const { error: err } = await signIn({ email, password })
    setLoading(false)
    if (err) setError('Email ou senha incorretos.')
    else navigate('/dashboard')
  }

  return (
    <div style={{ position:'relative', width:'100%', minHeight:'100vh', background:'#fff', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:200, top:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)' }}/>

      <div style={{ height:59, display:'flex', alignItems:'center', padding:'0 40px' }}>
        <span style={{ fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
      </div>
      <div style={{ height:56, display:'flex', alignItems:'center', padding:'0 24px' }}>
        <LogoFull size={28} />
      </div>

      <div style={{ padding:'0 24px', marginTop:20 }}>
        <h2 style={{ fontSize:24, fontWeight:700, color:'#2E3A37', lineHeight:1.3 }}>
          Bem-vindo de volta 👋
        </h2>
        <p style={{ marginTop:10, fontSize:14, color:'#51625E', lineHeight:1.55 }}>
          Entre para continuar organizando a vida de vocês.
        </p>

        {error && (
          <div style={{ marginTop:16, display:'flex', gap:8, alignItems:'center', background:'#FEE8E8', border:'1px solid #E14848', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#C03030' }}>
            <AlertCircle size={16}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop:24, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ border:`1.5px solid ${email ? '#6BA6A0' : '#E1E4E3'}`, borderRadius:14, padding:'18px 16px', transition:'border-color 0.15s' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu email"
              style={{ width:'100%', border:'none', outline:'none', fontSize:15, color:'#2E3A37', background:'transparent', fontFamily:'Inter, sans-serif' }}/>
          </div>
          <div style={{ border:`1.5px solid ${password ? '#6BA6A0' : '#E1E4E3'}`, borderRadius:14, padding:'16px', display:'flex', alignItems:'center', gap:8, transition:'border-color 0.15s' }}>
            <input type={showPw?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha"
              style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'#2E3A37', background:'transparent', fontFamily:'Inter, sans-serif' }}/>
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ border:'none', background:'none', cursor:'pointer', color:'#80908C', padding:0, display:'flex' }}>
              {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', height:56, border:'none', borderRadius:16, background:'#FF8A7A', color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer', boxShadow:'0 8px 12px rgba(255,138,122,0.25)', marginTop:8, opacity:loading?0.8:1, transition:'opacity 0.15s' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop:32, textAlign:'center' }}>
          <p style={{ fontSize:13, color:'#647470' }}>Não tem conta?</p>
          <Link to="/cadastro" style={{ fontSize:14, fontWeight:600, color:'#FF8A7A', textDecoration:'none', display:'block', marginTop:8 }}>
            Criar conta gratuita
          </Link>
        </div>
      </div>
    </div>
  )
}
