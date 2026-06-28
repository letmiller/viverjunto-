import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

const SITE_URL = window.location.origin

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [household, setHousehold] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadUserData(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadUserData(session.user.id)
      else { setProfile(null); setHousehold(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(userId) {
    try {
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', userId).single()
      setProfile(prof)

      const { data: mem } = await supabase
        .from('household_members')
        .select('household_id, role, households(*)')
        .eq('profile_id', userId)
        .single()
      if (mem) setHousehold({ ...mem.households, role: mem.role })
    } finally {
      setLoading(false)
    }
  }

  async function signUp({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name },
        emailRedirectTo: `${SITE_URL}/confirmar`,
      }
    })
    return { data, error }
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Marca setup como completo
  async function completeSetup(tipo) {
    if (!user) return
    await supabase.from('profiles').update({
      setup_completed: true,
      uso_tipo: tipo || 'casal',
    }).eq('id', user.id)
    setProfile(prev => ({ ...prev, setup_completed: true, uso_tipo: tipo }))
  }

  return (
    <AuthContext.Provider value={{
      user, profile, household, loading,
      signUp, signIn, signOut, completeSetup,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
