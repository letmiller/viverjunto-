import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Screen } from '../components/layout/Screen'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import heroFinancas from '../assets/carousel-1-financas.webp'
import heroRotina from '../assets/carousel-2-rotina.webp'
import heroCargaMental from '../assets/carousel-3-cargamental.webp'
import heroMetas from '../assets/carousel-4-metas.webp'
import heroVidaCompartilhada from '../assets/carousel-5-vidacompartilhada.webp'

// Each slide's illustration sits on its own soft halo + sparkle backdrop in
// the original design (baked into the hero artwork there); reproduced here
// as CSS so it can layer under the transparent-background webp illustration.
interface HeroDot {
  x: number
  y: number
  size: number
  color: string
  opacity: number
}
interface HeroDecor {
  fill: boolean
  haloColor: string
  haloOpacity: number
  haloSize: number
  dots: HeroDot[]
}

const SLIDES: { image: string; title: string; desc: string; color: 'coral' | 'teal' | 'amber'; decor: HeroDecor }[] = [
  {
    image: heroFinancas,
    title: 'Entendam juntos para onde\no dinheiro está indo.',
    desc: 'Transforme gastos e contas em clareza compartilhada.',
    color: 'coral',
    decor: { fill: true, haloColor: '#E8F2F1', haloOpacity: 0.75, haloSize: 250, dots: [] },
  },
  {
    image: heroRotina,
    title: 'Uma rotina mais leve\npara os dois.',
    desc: 'Dividam tarefas da casa sem perder tempo negociando quem faz o quê.',
    color: 'teal',
    decor: {
      fill: false,
      haloColor: '#FFF4F2',
      haloOpacity: 0.55,
      haloSize: 240,
      dots: [
        { x: 12, y: 9, size: 6, color: '#FF8A7A', opacity: 0.5 },
        { x: 81, y: 14, size: 5, color: '#6BA6A0', opacity: 0.4 },
        { x: 41, y: 8, size: 4, color: '#F5D8A6', opacity: 0.6 },
      ],
    },
  },
  {
    image: heroCargaMental,
    title: 'Menos coisas para\nlembrar sozinho(a).',
    desc: 'Reduza a carga mental com tudo organizado em um só lugar.',
    color: 'amber',
    decor: {
      fill: true,
      haloColor: '#FDF3E1',
      haloOpacity: 0.65,
      haloSize: 270,
      dots: [
        { x: 76, y: 19, size: 6, color: '#E8F2F1', opacity: 0.7 },
        { x: 19, y: 49, size: 6, color: '#FDF3E1', opacity: 0.7 },
        { x: 78, y: 46, size: 6, color: '#FFF4F2', opacity: 0.7 },
        { x: 50, y: 10, size: 6, color: '#F0F2F1', opacity: 0.7 },
      ],
    },
  },
  {
    image: heroMetas,
    title: 'Planejem metas e\nsonhos compartilhados.',
    desc: 'Acompanhem juntos o progresso rumo ao que realmente importa.',
    color: 'coral',
    decor: {
      fill: true,
      haloColor: '#E8F2F1',
      haloOpacity: 0.6,
      haloSize: 300,
      dots: [
        { x: 17, y: 10, size: 16, color: '#F5D8A6', opacity: 0.55 },
        { x: 78, y: 7, size: 12, color: '#FF8A7A', opacity: 0.55 },
        { x: 88, y: 35, size: 10, color: '#6BA6A0', opacity: 0.55 },
        { x: 8, y: 58, size: 8, color: '#F5D8A6', opacity: 0.55 },
        { x: 83, y: 64, size: 9, color: '#FFE0DB', opacity: 0.55 },
      ],
    },
  },
  {
    image: heroVidaCompartilhada,
    title: 'Tudo isso, feito\npara a vida a dois.',
    desc: 'Finanças, rotina e objetivos — compartilhados de verdade.',
    color: 'teal',
    decor: {
      fill: false,
      haloColor: '#E8F2F1',
      haloOpacity: 0.65,
      haloSize: 280,
      dots: [
        { x: 65, y: 22, size: 12, color: '#E1E4E3', opacity: 0.4 },
        { x: 66, y: 18, size: 9, color: '#E1E4E3', opacity: 0.25 },
      ],
    },
  },
]

export function OnboardingCarouselPage() {
  const navigate = useNavigate()
  const { slide } = useParams()
  const index = Math.min(Math.max(Number(slide) || 0, 0), SLIDES.length - 1)
  const data = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  function next() {
    if (isLast) navigate('/criar-conta')
    else navigate(`/onboarding/${index + 1}`)
  }

  function prev() {
    if (index > 0) navigate(`/onboarding/${index - 1}`)
  }

  function goTo(i: number) {
    navigate(`/onboarding/${i}`)
  }

  return (
    <Screen scroll className="bg-white">
      <AuraBackground
        auras={[
          { color: data.color, size: 260, top: -60, left: 180 },
          { color: 'teal', size: 220, bottom: -60, left: -60 },
        ]}
      />

      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-6 pt-2.5">
        <Logo compact />
        <button
          onClick={() => navigate('/criar-conta')}
          className="rounded-full bg-forest-50 px-3.5 py-1.5 text-xs font-medium text-forest-500"
        >
          Pular
        </button>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) next()
              else if (info.offset.x > 60) prev()
            }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="relative flex h-[300px] shrink-0 items-center justify-center overflow-hidden">
              {data.decor.fill && <div className="absolute inset-0 bg-app-bg" />}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: data.decor.haloSize,
                  height: data.decor.haloSize,
                  backgroundColor: data.decor.haloColor,
                  opacity: data.decor.haloOpacity,
                }}
              />
              {data.decor.dots.map((dot, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    width: dot.size,
                    height: dot.size,
                    backgroundColor: dot.color,
                    opacity: dot.opacity,
                  }}
                />
              ))}
              <img
                src={data.image}
                alt=""
                draggable={false}
                className="relative h-full max-h-[280px] w-auto object-contain"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-4">
              <h1 className="whitespace-pre-line text-[24px] font-bold leading-[1.3] text-forest-900">{data.title}</h1>
              <p className="mt-3 text-[14px] leading-[1.55] text-forest-700">{data.desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex shrink-0 flex-col gap-6 px-6 pb-8 pt-4">
        <div className="flex items-center justify-center gap-2.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              className="flex h-[20px] items-center px-0.5"
            >
              <span
                className={`h-[7px] rounded-full transition-all ${
                  i === index ? 'w-6 bg-coral-700' : 'w-[7px] bg-forest-100'
                }`}
              />
            </button>
          ))}
        </div>

        <Button onClick={next}>{isLast ? 'Vamos começar' : 'Continuar'}</Button>
      </div>
    </Screen>
  )
}
