import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoFull } from '../../components/Logo'

// Imagens do Figma — todas as URLs atualizadas
const SLIDES = [
  {
    id: 0,
    image:  'https://www.figma.com/api/mcp/asset/6dd55bd3-691d-4fb3-a8fa-97dab0ee02bc',
    headline: 'Entendam juntos para onde o dinheiro está indo.',
    sub: 'Transforme gastos e contas em clareza compartilhada.',
    cta: 'Continuar',
    btnColor: '#FF8A7A',
    heroBg: '#F2EFE6',
    activeIdx: 0,
  },
  {
    id: 1,
    image:  'https://www.figma.com/api/mcp/asset/568aa53c-766d-4fc4-be66-58e07a91a44c',
    headline: 'Dividir responsabilidades pode ser mais simples.',
    sub: 'Visualizem tarefas e responsabilidades sem cobranças.',
    cta: 'Continuar',
    btnColor: '#FF8A7A',
    heroBg: '#F2EFE6',
    activeIdx: 1,
  },
  {
    id: 2,
    image:  'https://www.figma.com/api/mcp/asset/c0503772-456b-4882-95e7-81b271101787',
    headline: 'O esforço invisível também merece espaço.',
    sub: 'Transforme organização mental em clareza visual.',
    cta: 'Continuar',
    btnColor: '#FF8A7A',
    heroBg: '#F2EFE6',
    activeIdx: 2,
  },
  {
    id: 3,
    image:  'https://www.figma.com/api/mcp/asset/7e58759b-52ad-473c-b575-aced4b20b2e3',
    headline: 'Construam objetivos juntos.',
    sub: 'Metas financeiras e sonhos compartilhados em um único lugar.',
    cta: 'Continuar',
    btnColor: '#FF8A7A',
    heroBg: '#F2EFE6',
    activeIdx: 3,
  },
  {
    id: 4,
    image:  'https://www.figma.com/api/mcp/asset/7926045e-75e1-4133-9781-6faa2f68c73f',
    headline: 'Mais clareza. Menos caos.',
    sub: 'Uma nova forma de organizar a vida compartilhada.',
    cta: 'Começar agora',
    btnColor: '#6BA6A0',
    heroBg: '#F2EFE6',
    activeIdx: 4,
    features: [
      { icon:'💰', label:'Finanças' },
      { icon:'🏠', label:'Rotina'   },
      { icon:'🎯', label:'Metas'    },
    ],
  },
]

export default function Carrossel() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const startX = useRef(null)

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  function goTo(idx) {
    if (animating || idx === current || idx < 0 || idx >= SLIDES.length) return
    setAnimating(true)
    setTimeout(() => { setCurrent(idx); setAnimating(false) }, 260)
  }

  function next() {
    if (isLast) { navigate('/cadastro'); return }
    goTo(current + 1)
  }

  function handleTouchStart(e) { startX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -50) goTo(current + 1)
    if (dx > 50)  goTo(current - 1)
    startX.current = null
  }

  return (
    <div
      style={{ position:'relative', width:'100%', height:'852px', background:'#fff', overflow:'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Status bar — top:0, height:59 */}
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:59, zIndex:10 }}>
        <span style={{ position:'absolute', left:40, top:17, fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
      </div>

      {/* Header — top:59, height:56 */}
      <div style={{ position:'absolute', top:59, left:0, width:'100%', height:56, zIndex:10 }}>
        <button
          onClick={() => navigate('/cadastro')}
          style={{ position:'absolute', left:322, top:14, width:47, height:28, background:'#EBF3F2', border:'none', borderRadius:100, fontSize:12, fontWeight:500, color:'#80908C', cursor:'pointer' }}
        >
          Pular
        </button>
        <div style={{ position:'absolute', left:24, top:14 }}>
          <LogoFull size={28} />
        </div>
      </div>

      {/* Hero — top:115, height:340 */}
      <div style={{ position:'absolute', left:0, top:115, width:393, height:340, background: slide.heroBg, overflow:'hidden' }}>
        {/* Halo */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(107,166,160,0.15) 0%, transparent 70%)' }}/>
        <img
          key={slide.id}
          src={slide.image}
          alt={slide.headline}
          style={{
            position:'absolute', left:0, top:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center top',
            opacity: animating ? 0 : 1,
            transform: animating ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        />
      </div>

      {/* Headline — left:24, top:487, width:345, fontSize:24 Bold */}
      <div style={{
        position:'absolute', left:24, top:487, width:345,
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(6px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease 0.05s, transform 0.25s ease 0.05s',
      }}>
        <p style={{ margin:0, fontSize:24, fontWeight:700, color:'#2E3A37', lineHeight:1.3 }}>
          {slide.headline}
        </p>
      </div>

      {/* Sub — left:24, top:573, fontSize:14 */}
      <p style={{
        position:'absolute', left:24, top:573, width:345, margin:0,
        fontSize:14, color:'#51625E', lineHeight:1.55,
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(6px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease 0.08s, transform 0.25s ease 0.08s',
      }}>
        {slide.sub}
      </p>

      {/* Features — último slide */}
      {slide.features && (
        <div style={{ position:'absolute', left:24, top:611, display:'flex', gap:16 }}>
          {slide.features.map(f => (
            <div key={f.label} style={{ background:'#F0F2F1', borderRadius:12, padding:'12px', display:'flex', alignItems:'center', gap:8, width:96 }}>
              <span style={{ fontSize:16 }}>{f.icon}</span>
              <span style={{ fontSize:12, fontWeight:500, color:'#51625E' }}>{f.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress dots — top:762, centrado */}
      <div style={{
        position:'absolute', top:762,
        left:'50%', transform:'translateX(-50%)',
        display:'flex', gap:10, alignItems:'center',
      }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              height: 7, borderRadius: 4, cursor: 'pointer',
              width: i === current ? 24 : 7,
              background: i === current ? '#FF8A7A' : '#E1E4E3',
              opacity: i === current ? 1 : 0.5,
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* CTA — left:24, top:682, width:345, height:56 */}
      <button
        onClick={next}
        style={{
          position:'absolute', left:24, top:682, width:345, height:56,
          background: slide.btnColor, border:'none', borderRadius:16,
          fontSize:16, fontWeight:600, color:'#fff', cursor:'pointer',
          boxShadow: `0 8px 12px ${slide.btnColor}38`,
          position:'absolute', overflow:'hidden',
        }}
        onPointerDown={e => e.currentTarget.style.opacity='0.88'}
        onPointerUp={e => e.currentTarget.style.opacity='1'}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:28, background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>
        {slide.cta}
      </button>

      {/* Home indicator — top:842 */}
      <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', top:842, width:120, height:5, background:'rgba(46,58,55,0.12)', borderRadius:3 }}/>
    </div>
  )
}
