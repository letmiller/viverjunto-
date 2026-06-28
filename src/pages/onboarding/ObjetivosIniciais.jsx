import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const IMG_LOGO = 'https://www.figma.com/api/mcp/asset/81c34dfa-4e68-473b-bfd8-a17bd81d2423'

const CHIPS = [
  { id:'organizar-contas',    icon:'💸', label:'Organizar contas',             top:334, left:16 },
  { id:'org-casa',            icon:'🏠', label:'Organização da casa',          top:334, left:null }, // row 1 right
  { id:'reduzir-esq',         icon:'🧠', label:'Reduzir esquecimentos',        top:386, left:16 },
  { id:'dividir-tarefas',     icon:'✓',  label:'Dividir tarefas',              top:386, left:null }, // row 2 right
  { id:'reduzir-ans',         icon:'😌', label:'Reduzir ansiedade financeira', top:438, left:16 },
  { id:'planejar-sonhos',     icon:'✨', label:'Planejar sonhos',              top:490, left:16 },
  { id:'sair-dividas',        icon:'💳', label:'Sair das dívidas',             top:490, left:192 },
  { id:'planejar-compras',    icon:'🛒', label:'Planejar compras',             top:542, left:16 },
  { id:'criar-reserva',       icon:'🛡️', label:'Criar reserva',               top:542, left:194 },
  { id:'equilibrar-rotina',   icon:'⚖️', label:'Equilibrar rotina',           top:594, left:16 },
  { id:'controlar-gastos',    icon:'📊', label:'Controlar gastos',             top:594, left:193 },
  { id:'guardar-dinheiro',    icon:'💰', label:'Guardar dinheiro',             top:646, left:16 },
]

// Chips em row 1 e 2 são side-by-side, precisamos calcular left do segundo
const ROW1 = ['organizar-contas', 'org-casa']
const ROW2 = ['reduzir-esq', 'dividir-tarefas']

export default function ObjetivosIniciais() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(new Set())

  function toggle(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const hasSelection = selected.size > 0

  function Chip({ chip, leftOverride }) {
    const sel = selected.has(chip.id)
    return (
      <div
        onClick={() => toggle(chip.id)}
        style={{
          position:'absolute', left: leftOverride ?? chip.left, top: chip.top,
          display:'flex', alignItems:'center', gap:8,
          padding:'8px 16px 8px 8px', borderRadius:100, cursor:'pointer',
          background: sel ? '#FFF4F2' : '#fff',
          border: `${sel ? 2 : 1.5}px solid ${sel ? '#FF8A7A' : '#E1E4E3'}`,
          boxShadow:'0 2px 3px rgba(46,58,55,0.04)',
          transition:'all 0.18s ease',
        }}
      >
        <div style={{ width:24, height:20, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, color: sel ? '#FF8A7A' : '#E1E4E3' }}>
          {chip.icon}
        </div>
        <span style={{ fontSize:13, color:'#51625E', whiteSpace:'nowrap', fontWeight: sel ? 500 : 400 }}>
          {chip.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{ position:'relative', width:'100%', height:'852px', background:'#fff', overflow:'hidden' }}>
      {/* Auras */}
      <div style={{ position:'absolute', left:180, top:-70, width:260, height:260, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:-60, top:580, width:210, height:210, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:280, top:360, width:140, height:140, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,216,166,0.20) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Status bar */}
      <span style={{ position:'absolute', left:40, top:17, fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>

      {/* Header */}
      <div style={{ position:'absolute', left:24, top:73, display:'flex', alignItems:'center', gap:5.9 }}>
        <img src={IMG_LOGO} alt="" style={{ width:32.148, height:28, objectFit:'contain' }}/>
        <div style={{ display:'flex', fontSize:21.827, fontWeight:700 }}>
          <span style={{ color:'#2E3A37' }}>Viver</span>
          <span style={{ color:'#6BA6A0' }}>Junto</span>
        </div>
      </div>

      {/* Headline — left:16, top:139, 24px Bold */}
      <div style={{ position:'absolute', left:16, top:139, width:361 }}>
        <p style={{ margin:0, fontSize:24, fontWeight:700, color:'#2E3A37', lineHeight:1.28 }}>
          O que vocês gostariam<br/>de melhorar juntos?
        </p>
      </div>

      {/* Sub — left:16, top:217 */}
      <p style={{ position:'absolute', left:16, top:217, width:361, margin:0,
        fontSize:14, color:'#51625E' }}>
        Selecione os temas mais importantes para a rotina de vocês.
      </p>

      {/* Hint pill — left:16, top:273 */}
      <div style={{ position:'absolute', left:16, top:273, width:361,
        background:'#F0F2F1', borderRadius:100, padding:'8px 16px',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:11, color:'#80908C', whiteSpace:'nowrap' }}>
          Selecione ao menos 1 tema para continuar
        </span>
      </div>

      {/* Row 1: organizar-contas + org-casa side by side — top:334 */}
      {(() => {
        const c0 = CHIPS.find(c => c.id === 'organizar-contas')
        const c1 = CHIPS.find(c => c.id === 'org-casa')
        const sel0 = selected.has(c0.id), sel1 = selected.has(c1.id)
        // renderizamos manualmente para ter left dinâmico no segundo
        return (
          <div style={{ position:'absolute', left:16, top:334, display:'flex', gap:12 }}>
            {[c0, c1].map(chip => {
              const sel = selected.has(chip.id)
              return (
                <div key={chip.id} onClick={() => toggle(chip.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px 8px 8px',
                    borderRadius:100, cursor:'pointer',
                    background: sel ? '#FFF4F2' : '#fff',
                    border:`${sel?2:1.5}px solid ${sel?'#FF8A7A':'#E1E4E3'}`,
                    boxShadow:'0 2px 3px rgba(46,58,55,0.04)', transition:'all 0.18s ease' }}>
                  <div style={{ width:24, height:20, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                    color: sel ? '#FF8A7A' : '#E1E4E3' }}>{chip.icon}</div>
                  <span style={{ fontSize:13, color:'#51625E', whiteSpace:'nowrap', fontWeight: sel?500:400 }}>{chip.label}</span>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Row 2: reduzir-esq + dividir-tarefas — top:386 */}
      {(() => {
        const chips = CHIPS.filter(c => c.id === 'reduzir-esq' || c.id === 'dividir-tarefas')
        return (
          <div style={{ position:'absolute', left:16, top:386, display:'flex', gap:12 }}>
            {chips.map(chip => {
              const sel = selected.has(chip.id)
              return (
                <div key={chip.id} onClick={() => toggle(chip.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px 8px 8px',
                    borderRadius:100, cursor:'pointer',
                    background: sel ? '#FFF4F2' : '#fff',
                    border:`${sel?2:1.5}px solid ${sel?'#FF8A7A':'#E1E4E3'}`,
                    boxShadow:'0 2px 3px rgba(46,58,55,0.04)', transition:'all 0.18s ease' }}>
                  <div style={{ width:24, height:20, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                    color: sel?'#FF8A7A':'#E1E4E3' }}>{chip.icon}</div>
                  <span style={{ fontSize:13, color:'#51625E', whiteSpace:'nowrap', fontWeight: sel?500:400 }}>{chip.label}</span>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Chips individuais */}
      {CHIPS.filter(c => !['organizar-contas','org-casa','reduzir-esq','dividir-tarefas'].includes(c.id)).map(chip => {
        const sel = selected.has(chip.id)
        return (
          <div key={chip.id} onClick={() => toggle(chip.id)}
            style={{ position:'absolute', left: chip.left, top: chip.top,
              display:'flex', alignItems:'center', gap:8, padding:'8px 16px 8px 8px',
              borderRadius:100, cursor:'pointer',
              background: sel ? '#FFF4F2' : '#fff',
              border:`${sel?2:1.5}px solid ${sel?'#FF8A7A':'#E1E4E3'}`,
              boxShadow:'0 2px 3px rgba(46,58,55,0.04)', transition:'all 0.18s ease' }}>
            <div style={{ width:24, height:20, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
              color: sel?'#FF8A7A':'#E1E4E3' }}>{chip.icon}</div>
            <span style={{ fontSize:13, color:'#51625E', whiteSpace:'nowrap', fontWeight: sel?500:400 }}>{chip.label}</span>
          </div>
        )
      })}

      {/* CTA — centrado, top:714 */}
      <button
        onClick={() => hasSelection && navigate('/config-financeira')}
        style={{
          position:'absolute', left:'50%', transform:'translateX(-50%)',
          top:714, width:345, height:56,
          border:'none', borderRadius:16,
          background: hasSelection ? '#FF8A7A' : '#E1E4E3',
          color: hasSelection ? '#fff' : '#80908C',
          fontSize:16, fontWeight:600,
          opacity: hasSelection ? 1 : 0.45,
          boxShadow: hasSelection ? '0 8px 12px rgba(255,138,122,0.22)' : 'none',
          cursor: hasSelection ? 'pointer' : 'default',
          overflow:'hidden', transition:'all 0.25s ease',
        }}
        onPointerDown={e => hasSelection && (e.currentTarget.style.opacity='0.88')}
        onPointerUp={e => (e.currentTarget.style.opacity=hasSelection?'1':'0.45')}
      >
        {hasSelection && <div style={{ position:'absolute', top:0, left:0, right:0, height:28,
          background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>}
        Continuar
      </button>
    </div>
  )
}
