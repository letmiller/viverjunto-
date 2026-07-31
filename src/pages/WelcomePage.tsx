import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { ProgressDots } from '../components/ui/ProgressDots'
import welcomeHero from '../assets/welcome-hero.webp'
import featFinancas from '../assets/feat-financas.webp'
import featRotina from '../assets/feat-rotina.webp'
import featMetas from '../assets/feat-metas.webp'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <Screen scroll className="bg-white">
      <AuraBackground
        auras={[
          { color: 'coral', size: 280, top: -80, left: 200 },
          { color: 'teal', size: 240, bottom: -60, left: -100 },
          { color: 'amber', size: 150, top: 340, right: -60 },
        ]}
      />

      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-6 pt-2.5">
        <Logo compact />
        <button
          onClick={() => navigate('/onboarding/0')}
          className="rounded-full bg-forest-50 px-3.5 py-1.5 text-xs font-medium text-forest-500"
        >
          Pular
        </button>
      </header>

      <div className="relative flex h-[210px] shrink-0 items-center justify-center overflow-hidden bg-app-bg">
        <img src={welcomeHero} alt="Casal organizando a vida juntos" className="h-full max-h-[200px] w-auto object-contain" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pt-7 pb-6">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.35] text-forest-900">
            Organizar a vida
            <br />
            pode ser mais leve.
          </h1>
          <p className="mt-3 text-[16px] leading-[1.55] text-forest-700">
            Finanças, rotina e responsabilidades compartilhadas em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-50 py-2 text-sm font-medium text-forest-700">
            <img src={featFinancas} alt="" className="size-6" /> Finanças
          </span>
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-50 py-2 text-sm font-medium text-forest-700">
            <img src={featRotina} alt="" className="size-6" /> Rotina
          </span>
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-50 py-2 text-sm font-medium text-forest-700">
            <img src={featMetas} alt="" className="size-6" /> Metas
          </span>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pt-2">
          <Button onClick={() => navigate('/criar-conta')}>Começar</Button>
          <button
            onClick={() => navigate('/onboarding/0')}
            className="text-sm font-medium text-forest-500"
          >
            Conhecer primeiro
          </button>
          <ProgressDots total={3} current={0} />
        </div>
      </div>
    </Screen>
  )
}
