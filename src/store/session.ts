import { create } from 'zustand'
import type { User } from '../lib/api'

export interface Household {
  id: string
  name: string
  inviteCode: string
}

interface SessionState {
  user: User | null
  household: Household | null
  authChecked: boolean
  setUser: (user: User | null) => void
  setHousehold: (household: Household | null) => void
  setAuthChecked: (authChecked: boolean) => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  household: null,
  authChecked: false,
  setUser: (user) => set({ user }),
  setHousehold: (household) => set({ household }),
  setAuthChecked: (authChecked) => set({ authChecked }),
}))
