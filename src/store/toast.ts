import { create } from 'zustand'

export interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'error'
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string, tone?: 'success' | 'error') => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string) {
  useToastStore.getState().push(message, 'success')
}

export function toastError(message: string) {
  useToastStore.getState().push(message, 'error')
}
