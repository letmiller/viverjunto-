import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const IMG_LOGO = 'https://www.figma.com/api/mcp/asset/024740c5-883c-410f-b40d-5bfa030fa9e4'

const SECTIONS = [
  {
    id: 'organizacao',
    icon: '📊', iconBg: '#EDF4F4', iconColor: '#6BA6A0',
    category: 'Organização',
    question: 'Vocês costumam organizar os gastos hoje?',
    options: ['Sim', 'Mais ou menos', 'Ainda não'],
  },
  {
    id: 'dividas',
    icon: '💳', iconBg: '#FFF1EF', iconColor: '#FF8A7A',
    category: 'Dívidas',
    question: 'Atualmente vocês possuem dívidas?',
    options: ['Não', 'Sim, poucas', 'Sim, estamos tentando organizar'],
  },
  {
    id: 'reserva',
    icon: '🛡️', iconBg: '#FEFAF4', iconColor: '#F5D8A6',
    category: 'Reserva',
    question: 'Vocês possuem reserva de emergência?',
    options: ['Sim', 'Estamos começando', 'Ainda não'],
  },
]

function RadioCard({ label, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        background:'#fff', border:`${selected ? 2 : 1.5}px solid ${selected ? '#6BA6A0' : '#E1E4E3'}`,
        borderRadius:16, padding:'12px', cursor:'pointer',
        boxShadow: selected ? '0 3px 6px rgba(107,166,160,0.12)' : '0 2px 4px rgba(46,58,55,0.04)',
        display:'flex', alignItems:'center', gap:8,
        background: selected ? '#F0F6F5' : '#fff',
        transition:'all 0.18s ease',
      }}
    >
      <div style={{
        width:20, height:20, borderRadius:10, border:`${selected?0:1.5}px solid #E1E4E3`,
        background: selected ? '#6BA6A0' : '#F0F2F1',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, transition:'all 0.18s',
      }}>
        {selected && <span style={{ fontSize:11, color:'#fff', fontWeight:700 }}>✓</span>}
      </div>
      <span style={{ fontSize:14, fontWeight: selected ? 500 : 400, color:'#2E3A37' }}>{label}</span>
    </div>
  )
}

export default function ConfigFinanceira() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState({})

  function select(sectionId, optionIdx) {
    setAnswers(prev => ({ ...prev, [sectionId]: optionIdx }))
  }

  const allAnswered = SECTIONS.every(s => answers[s.id] !== undefined)

  return (
    <div style={{ position:'relative', width:'100%', minHeight:'100vh', background:'#fff',
      overflowY:'auto', paddingBottom:40 }}>
      {/* Auras */}
      <div style={{ position:'absolute', left:200, top:-80, width:270, height:270, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:-70, top:800, width:220, height:220, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:290, top:520, width:150, height:150, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,216,166,0.22) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Status bar */}
      <div style={{ height:59, display:'flex', alignItems:'center', padding:'0 40px' }}>
        <span style={{ fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
      </div>

      {/* Header */}
      <div style={{ height:56, display:'flex', alignItems:'center', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5.9 }}>
          <img src={IMG_LOGO} alt="" style={{ width:32.148, height:28, objectFit:'contain' }}/>
          <div style={{ display:'flex', fontSize:21.827, fontWeight:700 }}>
            <span style={{ color:'#2E3A37' }}>Viver</span>
            <span style={{ color:'#6BA6A0' }}>Junto</span>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ padding:'0 16px', marginTop:8 }}>
        <p style={{ margin:0, fontSize:24, fontWeight:700, color:'#2E3A37', lineHeight:1.28 }}>
          Vamos entender um pouco<br/>da rotina financeira de vocês.
        </p>
        <p style={{ margin:'5px 0 0', fontSize:14, color:'#51625E', lineHeight:1.52 }}>
          Isso ajuda o app a criar uma experiência<br/>mais útil e personalizada.
        </p>
      </div>

      {/* Seções */}
      <div style={{ padding:'24px 16px 0', display:'flex', flexDirection:'column', gap:32 }}>
        {SECTIONS.map((sec, si) => (
          <div key={sec.id}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Section header */}
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:18, background:sec.iconBg,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
                  {sec.icon}
                </div>
                <span style={{ fontSize:14, fontWeight:600, color:'#80908C' }}>{sec.category}</span>
              </div>
              {/* Question */}
              <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2E3A37', lineHeight:1.4 }}>
                {sec.question}
              </p>
              {/* Options */}
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {sec.options.map((opt, oi) => (
                  <RadioCard
                    key={oi}
                    label={opt}
                    selected={answers[sec.id] === oi}
                    onSelect={() => select(sec.id, oi)}
                  />
                ))}
              </div>
            </div>
            {/* Divider — não no último */}
            {si < SECTIONS.length - 1 && (
              <div style={{ height:1, background:'#F0F2F1', margin:'24px 0 0' }}/>
            )}
          </div>
        ))}

        {/* Feedback card — teal */}
        <div style={{ background:'#E8F2F1', border:'1px solid #D1E7E5', borderRadius:20, padding:16,
          boxShadow:'0 3px 7px rgba(107,166,160,0.08)' }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:40, height:40, borderRadius:20, background:'#D1E7E5',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
              🌿
            </div>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#2E3A37', lineHeight:'20px' }}>
                Tudo bem começar aos poucos.
              </p>
              <p style={{ margin:0, fontSize:11, color:'#51625E', lineHeight:1.45 }}>
                O importante é criar clareza juntos.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => allAnswered && navigate('/config-rotina')}
          style={{
            width:'100%', height:56, border:'none', borderRadius:16,
            background: allAnswered ? '#FF8A7A' : '#E1E4E3',
            color: allAnswered ? '#fff' : '#80908C',
            fontSize:16, fontWeight:600,
            opacity: allAnswered ? 1 : 0.45,
            boxShadow: allAnswered ? '0 8px 12px rgba(255,138,122,0.22)' : 'none',
            cursor: allAnswered ? 'pointer' : 'default',
            overflow:'hidden', position:'relative', transition:'all 0.25s ease',
          }}
          onPointerDown={e => allAnswered && (e.currentTarget.style.opacity='0.88')}
          onPointerUp={e => (e.currentTarget.style.opacity='1')}
        >
          {allAnswered && <div style={{ position:'absolute', top:0, left:0, right:0, height:28,
            background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>}
          Continuar
        </button>
      </div>
    </div>
  )
}
