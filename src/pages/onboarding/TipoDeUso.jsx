import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// URLs atualizadas do Figma DEV
const IMG_LOGO     = 'https://www.figma.com/api/mcp/asset/80d69250-fc17-40b6-b49f-57ef48486d58'
const IMG_SOZINHO  = 'https://www.figma.com/api/mcp/asset/c28e0d7b-b9ae-4c73-9442-0f135325f6b6'
const IMG_CASAL    = 'https://www.figma.com/api/mcp/asset/9550bc9b-ce84-448e-be1c-c513a9e70a60'
const IMG_FAMILIA  = 'https://www.figma.com/api/mcp/asset/fac8af39-b621-4724-9f41-9a48014d22c2'

const CARDS = [
  {
    id: 'sozinho',
    title: 'Sozinho(a)',
    desc: 'Organize sua rotina e finanças pessoais.',
    image: IMG_SOZINHO,
    top: 282,
    // illust-area bg: #F0F2F1, com linhas decorativas
    illustBg: '#F0F2F1',
    illustLines: true,
    // imagem: left:-4.31, top:0, w:123.624, h:104, object-fit:cover
    imgStyle: { position:'absolute', left:-4.31, top:0, width:123.624, height:104, objectFit:'cover' },
    // selecionado: border coral, bg #FFF7F6, illustBg #FFF1EF
    selIllustBg: '#FFF1EF',
  },
  {
    id: 'casal',
    title: 'Em casal',
    desc: 'Compartilhem tarefas, finanças e objetivos.',
    image: IMG_CASAL,
    top: 400,
    illustBg: '#E8F2F1',
    illustLines: false,
    // imagem: left:-23.03%, top:-6.89%, w:144.36%, h:106.89%
    imgStyle: { position:'absolute', left:'-23.03%', top:'-6.89%', width:'144.36%', height:'106.89%', objectFit:'cover' },
    selIllustBg: '#FFF1EF',
  },
  {
    id: 'familia',
    title: 'Família futuramente',
    desc: 'Prepare uma estrutura para crescer juntos.',
    image: IMG_FAMILIA,
    top: 518,
    illustBg: '#F0F2F1',
    illustLines: false,
    // imagem posicionada fora do illust-area — left:28, top:518 (absoluto na tela)
    imgAbsolute: true,
    imgStyle: { position:'absolute', left:28, top:518, width:108.952, height:104, overflow:'hidden' },
    selIllustBg: '#FFF1EF',
  },
]

export default function TipoDeUso() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ position:'relative', width:'100%', height:'852px', background:'#fff', overflow:'hidden' }}>

      {/* Auras */}
      <div style={{ position:'absolute', left:200, top:-60, width:240, height:240, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:-60, top:600, width:180, height:180, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.14) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Status Bar */}
      <span style={{ position:'absolute', left:40, top:17, fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>

      {/* Header — logo */}
      <div style={{ position:'absolute', left:24, top:73, display:'flex', alignItems:'center', gap:5.9 }}>
        <img src={IMG_LOGO} alt="ViverJunto" style={{ width:32.148, height:28, objectFit:'contain' }}/>
        <div style={{ display:'flex', fontSize:21.827, fontWeight:700, lineHeight:'27.78px' }}>
          <span style={{ color:'#2E3A37' }}>Viver</span>
          <span style={{ color:'#6BA6A0' }}>Junto</span>
        </div>
      </div>

      {/* Headline — left:24, top:139, 26px Bold */}
      <div style={{ position:'absolute', left:24, top:139, width:345 }}>
        <p style={{ margin:0, fontSize:26, fontWeight:700, color:'#2E3A37', lineHeight:1.3 }}>
          Como você pretende<br/>usar o app?
        </p>
      </div>

      {/* Subtítulo — left:24, top:225 */}
      <p style={{ position:'absolute', left:24, top:225, width:345, margin:0,
        fontSize:14, color:'#51625E', lineHeight:1.5 }}>
        Isso ajuda a personalizar melhor sua experiência.
      </p>

      {/* Cards */}
      {CARDS.map(card => {
        const sel = selected === card.id
        return (
          <div key={card.id}>
            {/* Card container */}
            <div
              onClick={() => setSelected(card.id)}
              style={{
                position:'absolute', left:24, top:card.top, width:345, height:104,
                borderRadius:20, overflow:'hidden', cursor:'pointer',
                border:`1.5px solid ${sel ? '#FF8A7A' : '#E1E4E3'}`,
                background: sel ? '#FFF7F6' : card.id === 'casal' ? '#FEFEFE' : '#fff',
                boxShadow:'0 3px 5px rgba(46,58,55,0.05)',
                transition:'border-color 0.2s, background 0.2s',
              }}
            >
              {/* Illust area — left:-1.5, top:-1.5, w:116, h:104, overflow:hidden */}
              {!card.imgAbsolute && (
                <div style={{
                  position:'absolute', left:-1.5, top:-1.5, width:116, height:104,
                  overflow:'hidden',
                  background: sel ? card.selIllustBg : card.illustBg,
                }}>
                  {/* Linhas decorativas (sozinho) */}
                  {card.illustLines && [49.12, 59.2, 69.28, 79.36].map((t, i) => (
                    <div key={i} style={{
                      position:'absolute', left:47.92, top:t,
                      width:25.92, height:2.16, borderRadius:2, background:'#E8F2F1',
                    }}/>
                  ))}
                  <img src={card.image} alt={card.title} style={card.imgStyle}/>
                </div>
              )}

              {/* família: illust-area sem imagem (bg só) */}
              {card.imgAbsolute && (
                <div style={{
                  position:'absolute', left:-1.5, top:-1.5, width:116, height:104,
                  background: sel ? card.selIllustBg : card.illustBg,
                }}/>
              )}

              {/* Título — left:126.5, top:18.5 */}
              <p style={{ position:'absolute', left:126.5, top:18.5, margin:0,
                fontSize:16, fontWeight:600, color:'#2E3A37' }}>{card.title}</p>

              {/* Descrição — left:126.5, top:44.5, w:201 */}
              <p style={{ position:'absolute', left:126.5, top:44.5, width:201, margin:0,
                fontSize:12, color:'#51625E', lineHeight:1.5 }}>{card.desc}</p>

              {/* Check — left:305.5, top:14.5, size:26 */}
              <div style={{
                position:'absolute', left:305.5, top:14.5, width:26, height:26, borderRadius:13,
                background: sel ? '#FF8A7A' : '#F0F2F1',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background 0.2s',
              }}>
                <span style={{ fontSize:14, fontWeight: sel?700:400, color: sel?'#fff':'#E1E4E3' }}>
                  {sel ? '✓' : '○'}
                </span>
              </div>
            </div>

            {/* Família: imagem fora do card (posição absoluta na tela) */}
            {card.imgAbsolute && (
              <div style={{ position:'absolute', left:28, top:card.top, width:108.952, height:104,
                overflow:'hidden', pointerEvents:'none', borderRadius:'18px 0 0 18px' }}>
                <img src={card.image} alt={card.title} style={{
                  position:'absolute', left:'-40.23%', top:'-7.5%',
                  width:'174.55%', height:'121.9%', objectFit:'cover',
                }}/>
              </div>
            )}
          </div>
        )
      })}

      {/* Hint — top:758 */}
      <p style={{ position:'absolute', top:758, left:0, width:'100%', margin:0,
        fontSize:12, color:'#80908C', textAlign:'center' }}>
        Selecione uma opção para continuar
      </p>

      {/* CTA — left:24, top:658, w:345, h:56 */}
      <button
        onClick={() => selected && navigate('/convidar-parceiro')}
        style={{
          position:'absolute', left:24, top:658, width:345, height:56,
          border:'none', borderRadius:16,
          background: selected ? '#FF8A7A' : '#E1E4E3',
          color: selected ? '#fff' : '#80908C',
          fontSize:16, fontWeight:600,
          boxShadow: selected ? '0 8px 12px rgba(255,138,122,0.22)' : 'none',
          cursor: selected ? 'pointer' : 'default',
          overflow:'hidden', transition:'all 0.25s ease',
        }}
        onPointerDown={e => selected && (e.currentTarget.style.opacity='0.88')}
        onPointerUp={e => (e.currentTarget.style.opacity='1')}
      >
        {selected && <div style={{ position:'absolute', top:0, left:0, right:0, height:28,
          background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>}
        Continuar
      </button>

    </div>
  )
}
