import { useNavigate } from 'react-router-dom'
import { Screen } from '../../components/layout/Screen'
import { AuraBackground } from '../../components/ui/AuraBackground'
import { Button } from '../../components/ui/Button'
import { useSession } from '../../store/session'

export function InviteConnectedPage() {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <Screen className="bg-white">
      <AuraBackground
        auras={[
          { color: 'coral', size: 260, top: -80, left: 100 },
          { color: 'teal', size: 220, bottom: -60, left: -60 },
          { color: 'amber', size: 140, top: 400, right: -40 },
        ]}
      />

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
        <span className="text-4xl">🎉</span>

        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-coral-300 text-xl font-bold text-coral-ink shadow-md">
            {initial}
          </div>
          <span className="text-2xl">💞</span>
          <div className="flex size-16 items-center justify-center rounded-full bg-teal-300 text-xl font-bold text-teal-900 shadow-md">
            P
          </div>
        </div>

        <div>
          <h1 className="text-[24px] font-bold text-forest-900">Vocês estão conectados!</h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-forest-700">
            Agora finanças, tarefas e objetivos serão compartilhados entre vocês dois.
          </p>
        </div>

        <Button onClick={() => navigate('/objetivos')}>Continuar</Button>
      </div>
    </Screen>
  )
}
