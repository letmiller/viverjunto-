import { create } from 'zustand'

const STORAGE_KEY = 'viverjunto:lastSeenActivityAt'

interface ActivityState {
  lastSeenAt: string | null
  markSeen: (at: string) => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  lastSeenAt: localStorage.getItem(STORAGE_KEY),
  markSeen: (at) => {
    localStorage.setItem(STORAGE_KEY, at)
    set({ lastSeenAt: at })
  },
}))
