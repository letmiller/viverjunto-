import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ConfirmarEmail() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    // Supabase coloca os tokens na URL como hash ou query params
    // O cliente JS detecta automaticamente e cria a sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('success')
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        // Tenta pegar do hash da URL
        const hash = window.location.hash
        if (hash.includes('access_token') || hash.includes('type=signup')) {
          // Supabase JS vai processar o hash automaticamente
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: s } }) => {
              if (s) {
                setStatus('success')
                setTimeout(() => navigate('/dashboard'), 1500)
              } else {
                setStatus('error')
              }
            })
          }, 1000)
        } else {
          // Sem sessão e sem hash — já estava logado ou link expirou
          setStatus('error')
        }
      }
    })
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh', background: '#F2EFE6',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24,
    }}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize: 52 }}>⏳</div>
          <h2 style={{ color: '#2E3A37', textAlign: 'center' }}>Confirmando seu email...</h2>
          <p style={{ color: '#80908C', textAlign: 'center', fontSize: 14 }}>Aguarde um momento.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: '#6BA6A0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(107,166,160,0.25)',
            animation: 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <span style={{ fontSize: 36, color: '#fff', fontWeight: 700 }}>✓</span>
          </div>
          <h2 style={{ color: '#2E3A37', textAlign: 'center' }}>Email confirmado! 🎉</h2>
          <p style={{ color: '#80908C', textAlign: 'center', fontSize: 14 }}>
            Redirecionando para o app...
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 52 }}>😕</div>
          <h2 style={{ color: '#2E3A37', textAlign: 'center' }}>Link inválido ou expirado</h2>
          <p style={{ color: '#80908C', textAlign: 'center', fontSize: 14 }}>
            Tente fazer login ou criar uma nova conta.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#FF8A7A', border: 'none', borderRadius: 16,
              padding: '14px 32px', fontSize: 15, fontWeight: 600, color: '#fff',
              cursor: 'pointer', boxShadow: '0 6px 12px rgba(255,138,122,0.22)',
            }}
          >
            Ir para o login
          </button>
        </>
      )}
      <style>{`@keyframes pop { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}
