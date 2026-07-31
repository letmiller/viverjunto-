import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Logo } from '../components/ui/Logo'

export function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/bem-vindo'), 1800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <Screen className="bg-white">
      <AuraBackground
        auras={[
          { color: 'coral', size: 300, top: -110, left: 180 },
          { color: 'teal', size: 260, bottom: -60, left: -118 },
          { color: 'amber', size: 160, top: 360, right: -80 },
        ]}
      />
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-16 px-6">
        <Logo />
        <div className="absolute bottom-24 flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-teal-300 [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-forest-100" />
          </div>
          <div className="h-0.5 w-14 overflow-hidden rounded-full bg-forest-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-teal-500" />
          </div>
        </div>
      </div>
    </Screen>
  )
}
