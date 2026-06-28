import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const IMG_LOGO = 'https://www.figma.com/api/mcp/asset/8a5832e1-49b4-4a61-a54a-c0af3464e04c'
const IMG_RD   = 'https://www.figma.com/api/mcp/asset/9d7f9a47-1a7e-46cc-a8dd-371bf43134db'  // radio selecionado teal
const IMG_RD1  = 'https://www.figma.com/api/mcp/asset/179021cd-8de6-4eaf-90f0-e999e7b63d0c'  // radio selecionado amber

// Radio card
function RadioCard({ icon, label, selected, accent = '#6BA6A0', accentBg = '#F0F6F5', accentImg, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? accentBg : '#fff',
      border:`${selected?2:1.5}px solid ${selected?accent:'#E1E4E3'}`,
      borderRadius:16, padding:'16px 12px', cursor:'pointer',
      boxShadow: selected ? `0 3px 6px ${accent}1E` : '0 2px 4px rgba(46,58,55,0.04)',
      display:'flex', gap:8, alignItems:'center', transition:'all 0.18s ease',
    }}>
      <div style={{ width:20, height:20, borderRadius:10, flexShrink:0, overflow:'hidden',
        border: selected ? 'none' : '1.5px solid #E1E4E3', background: selected ? 'transparent' : '#F0F2F1' }}>
        {selected && accentImg && <img src={accentImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>}
        {selected && !accentImg && (
          <div style={{ width:20, height:20, borderRadius:10, background:accent,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>✓</span>
          </div>
        )}
      </div>
      {icon && <span style={{ fontSize:18, width:28, textAlign:'center' }}>{icon}</span>}
      <span style={{ fontSize:14, fontWeight: selected?600:400, color:'#2E3A37' }}>{label}</span>
    </div>
  )
}

// Opção visual (emoji card)
function EmojiCard({ icon, label, selected, accent = '#FF8A7A', accentBg = '#FFF3F2', onClick, width = 78.75 }) {
  return (
    <div onClick={onClick} style={{
      position:'relative', width, height:72, borderRadius:16, cursor:'pointer',
      background: selected ? accentBg : '#fff',
      border:`${selected?2:1.5}px solid ${selected?accent:'#E1E4E3'}`,
      boxShadow: selected ? `0 3px 6px ${accent}1E` : '0 2px 4px rgba(46,58,55,0.04)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
      transition:'all 0.18s ease',
    }}>
      <span style={{ fontSize:26 }}>{icon}</span>
      <span style={{ fontSize:10, fontWeight: selected?600:400, color:'#2E3A37', textAlign:'center' }}>{label}</span>
      {selected && (
        <div style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:9, background:accent,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>✓</span>
        </div>
      )}
    </div>
  )
}

export default function ConfigRotina() {
  const navigate = useNavigate()
  const { completeSetup } = useAuth()
  const [moradia, setMoradia]   = useState(null)   // 'sim'|'parcialmente'|'nao'
  const [pets, setPets]         = useState(new Set())  // 'nao'|'cachorro'|'gato'|'outros'
  const [petQtd, setPetQtd]     = useState(1)
  const [filhos, setFilhos]     = useState(null)   // 'nao'|'sim'
  const [filhosQtd, setFilhosQtd] = useState(2)
  const [faixas, setFaixas]     = useState(new Set())
  const [trabalho, setTrabalho] = useState(null)   // 'home'|'presencial'|'hibrido'|'escalas'
  const [equil, setEquil]       = useState(null)   // 'equilibradas'|'concentradas'|'desorganizadas'|'dificeis'

  function togglePet(id) {
    const next = new Set(pets)
    if (id === 'nao') { next.clear(); next.add('nao') }
    else { next.delete('nao'); next.has(id) ? next.delete(id) : next.add(id) }
    setPets(next)
  }
  function toggleFaixa(f) {
    const next = new Set(faixas)
    next.has(f) ? next.delete(f) : next.add(f)
    setFaixas(next)
  }

  const hasPets = pets.size > 0 && !pets.has('nao')
  const allDone = moradia && pets.size > 0 && filhos && trabalho && equil

  // feedback dinâmico
  const showFbPets     = hasPets
  const showFbFilhos   = filhos === 'sim'
  const showFbEquil    = equil === 'concentradas'

  return (
    <div style={{ position:'relative', width:'100%', minHeight:'100vh', background:'#fff',
      overflowY:'auto', paddingBottom:40 }}>
      {/* Auras */}
      <div style={{ position:'absolute', left:180, top:-80, width:260, height:260, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:-60, top:1100, width:200, height:200, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.10) 0%, transparent 70%)', pointerEvents:'none' }}/>

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

      <div style={{ padding:'8px 16px 0', display:'flex', flexDirection:'column', gap:24 }}>
        {/* Headline */}
        <p style={{ margin:0, fontSize:22, fontWeight:700, color:'#2E3A37', lineHeight:1.28 }}>
          Agora vamos entender um<br/>pouco da rotina de vocês.
        </p>

        {/* ── MORADIA ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:18, background:'#EDF4F4',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏠</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#80908C' }}>Moradia</span>
          </div>
          <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2E3A37', lineHeight:1.4 }}>Vocês moram juntos?</p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[{v:'sim',icon:'🏡',label:'Sim'},{v:'parcialmente',icon:'🔄',label:'Parcialmente'},{v:'nao',icon:'📅',label:'Ainda não'}].map(op => (
              <RadioCard key={op.v} icon={op.icon} label={op.label}
                selected={moradia===op.v} accentImg={moradia===op.v?IMG_RD:null}
                onClick={() => setMoradia(op.v)}/>
            ))}
          </div>
          <div style={{ height:1, background:'#F0F2F1' }}/>
        </div>

        {/* ── PETS ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:18, background:'#FFF1EF',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🐾</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#80908C' }}>Pets</span>
          </div>
          <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2E3A37', lineHeight:1.4 }}>Vocês possuem pets?</p>
          <div style={{ display:'flex', gap:11 }}>
            {[{v:'nao',icon:'🚫',label:'Não'},{v:'cachorro',icon:'🐶',label:'Cachorro'},
              {v:'gato',icon:'🐱',label:'Gato'},{v:'outros',icon:'🐹',label:'Outros'}].map(op => (
              <EmojiCard key={op.v} icon={op.icon} label={op.label}
                selected={pets.has(op.v)}
                accent={op.v==='nao'?'#E1E4E3':'#FF8A7A'}
                accentBg={op.v==='nao'?'#F0F2F1':'#FFF3F2'}
                onClick={() => togglePet(op.v)}/>
            ))}
          </div>
          {/* Quantos pets — expansível */}
          {showFbPets && (
            <div style={{ background:'#FFF4F2', border:'1px solid #FFE0DB', borderRadius:14, padding:'10px 14px' }}>
              <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:600, color:'#B85042' }}>Quantos?</p>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ background:'#fff', border:'1.5px solid #E1E4E3', borderRadius:100,
                  padding:'5px 8px', display:'flex', alignItems:'center', justifyContent:'center', gap:0 }}>
                  <button onClick={() => setPetQtd(q => Math.max(1,q-1))}
                    style={{ border:'none', background:'none', fontSize:16, color:'#51625E', cursor:'pointer', width:28 }}>−</button>
                  <span style={{ fontSize:15, fontWeight:700, color:'#2E3A37', width:28, textAlign:'center' }}>{petQtd}</span>
                  <button onClick={() => setPetQtd(q => q+1)}
                    style={{ border:'none', background:'none', fontSize:16, color:'#51625E', cursor:'pointer', width:28 }}>+</button>
                </div>
                <div style={{ flex:1, background:'#FF8A7A', borderRadius:100, padding:'8px 10px',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:10, fontWeight:500, color:'#fff' }}>🐶  Letícia cuida principalmente</span>
                </div>
              </div>
            </div>
          )}
          <div style={{ height:1, background:'#F0F2F1' }}/>
        </div>

        {/* ── FILHOS ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:18, background:'#FEFAF4',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👨‍👩‍👦</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#80908C' }}>Filhos</span>
          </div>
          <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2E3A37', lineHeight:1.4 }}>Vocês possuem filhos?</p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <RadioCard icon="🌱" label="Não" selected={filhos==='nao'}
              accentImg={filhos==='nao'?IMG_RD1:null} accent='#F5D8A6' accentBg='#FEFBF6'
              onClick={() => setFilhos('nao')}/>
            <RadioCard icon="👶" label="Sim" selected={filhos==='sim'}
              accentImg={filhos==='sim'?IMG_RD1:null} accent='#F5D8A6' accentBg='#FEFBF6'
              onClick={() => setFilhos('sim')}/>
          </div>
          {/* Expansível filhos */}
          {showFbFilhos && (
            <div style={{ background:'#FDF3E1', border:'1px solid #F5D8A6', borderRadius:14, padding:8 }}>
              <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:'#906814' }}>Quantos filhos?</p>
              <div style={{ background:'#fff', border:'1.5px solid #E1E4E3', borderRadius:100,
                padding:'5px 8px', display:'inline-flex', alignItems:'center' }}>
                <button onClick={() => setFilhosQtd(q => Math.max(1,q-1))}
                  style={{ border:'none', background:'none', fontSize:16, color:'#51625E', cursor:'pointer', width:28 }}>−</button>
                <span style={{ fontSize:15, fontWeight:700, color:'#2E3A37', width:28, textAlign:'center' }}>{filhosQtd}</span>
                <button onClick={() => setFilhosQtd(q => q+1)}
                  style={{ border:'none', background:'none', fontSize:16, color:'#51625E', cursor:'pointer', width:28 }}>+</button>
              </div>
              <p style={{ margin:'8px 0 4px', fontSize:12, fontWeight:600, color:'#906814' }}>Faixas etárias (selecione todas)</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {['Bebê (0–2)','Criança (3–10)','Pré-adolescente (11–13)','Adolescente (14-17)','Jovem adulto (18-21)'].map(f => {
                  const sel = faixas.has(f)
                  return (
                    <div key={f} onClick={() => toggleFaixa(f)} style={{
                      padding:'4px 8px', borderRadius:100, cursor:'pointer',
                      background: sel ? '#F5D8A6' : '#fff',
                      border:`${sel?1.5:1}px solid ${sel?'#A57D29':'#E1E4E3'}`,
                      fontSize:12, fontWeight: sel?600:400,
                      color: sel ? '#805908' : '#51625E',
                    }}>{f}</div>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ height:1, background:'#F0F2F1' }}/>
        </div>

        {/* ── TRABALHO ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:18, background:'#EDF4F4',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💼</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#80908C' }}>Trabalho</span>
          </div>
          <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2E3A37', lineHeight:1.4 }}>Como funciona a rotina de trabalho?</p>
          <div style={{ display:'flex', gap:10 }}>
            {[{v:'home',icon:'🏠',label:'Home office'},{v:'presencial',icon:'🏢',label:'Presencial'},
              {v:'hibrido',icon:'🔀',label:'Híbrido'},{v:'escalas',icon:'📅',label:'Escalas variáveis'}].map(op => (
              <EmojiCard key={op.v} icon={op.icon} label={op.label}
                selected={trabalho===op.v} accent='#6BA6A0' accentBg='#F0F6F5'
                onClick={() => setTrabalho(op.v)}/>
            ))}
          </div>
          <div style={{ height:1, background:'#F0F2F1' }}/>
        </div>

        {/* ── EQUILÍBRIO ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:18, background:'#FFF1EF',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚖️</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#80908C' }}>Equilíbrio</span>
          </div>
          <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2E3A37', lineHeight:1.4 }}>Hoje as tarefas da casa parecem…</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{v:'equilibradas',icon:'✓',label:'Equilibradas'},
              {v:'concentradas',icon:'⚡',label:'Concentradas em uma pessoa'},
              {v:'desorganizadas',icon:'🌀',label:'Desorganizadas'},
              {v:'dificeis',icon:'🔍',label:'Difíceis de acompanhar'}].map(op => (
              <div key={op.v} onClick={() => setEquil(op.v)} style={{
                position:'relative', borderRadius:16, cursor:'pointer', height:72,
                background: equil===op.v ? '#FFF3F2' : '#fff',
                border:`${equil===op.v?2:1.5}px solid ${equil===op.v?'#FF8A7A':'#E1E4E3'}`,
                boxShadow: equil===op.v ? '0 3px 6px rgba(255,138,122,0.12)' : '0 2px 4px rgba(46,58,55,0.04)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                transition:'all 0.18s ease',
              }}>
                <span style={{ fontSize:26 }}>{op.icon}</span>
                <span style={{ fontSize:10, fontWeight: equil===op.v?600:400, color:'#2E3A37', textAlign:'center', padding:'0 4px' }}>{op.label}</span>
                {equil===op.v && (
                  <div style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:9, background:'#FF8A7A',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback card equilíbrio */}
        {showFbEquil && (
          <div style={{ background:'#FDF3E1', border:'1px solid #F5D8A6', borderRadius:20, padding:16,
            boxShadow:'0 3px 7px rgba(245,216,166,0.10)', minHeight:92, position:'relative' }}>
            <div style={{ position:'absolute', left:15, top:23, width:40, height:40, borderRadius:20,
              background:'#FAEAC7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>💛</div>
            <p style={{ margin:'0 0 4px', paddingLeft:55, fontSize:13, fontWeight:600, color:'#2E3A37' }}>
              Notamos uma concentração de tarefas.
            </p>
            <p style={{ margin:0, paddingLeft:55, fontSize:11, color:'#51625E', lineHeight:1.5 }}>
              Vamos te ajudar a redistribuir as<br/>responsabilidades de forma mais leve.
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => { if(allDone) { completeSetup(); navigate("/dashboard"); } }}
          style={{
            width:'100%', height:56, border:'none', borderRadius:16, overflow:'hidden', position:'relative',
            background: allDone ? '#FF8A7A' : '#E1E4E3',
            color: allDone ? '#fff' : '#80908C',
            fontSize:16, fontWeight:600,
            boxShadow: allDone ? '0 8px 12px rgba(255,138,122,0.22)' : 'none',
            opacity: allDone ? 1 : 0.45,
            cursor: allDone ? 'pointer' : 'default',
            transition:'all 0.25s ease',
          }}
          onPointerDown={e => allDone && (e.currentTarget.style.opacity='0.88')}
          onPointerUp={e => (e.currentTarget.style.opacity='1')}
        >
          {allDone && <div style={{ position:'absolute', top:0, left:0, right:0, height:28,
            background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>}
          Continuar
        </button>
      </div>
    </div>
  )
}
