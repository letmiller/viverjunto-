import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// Imagens do Figma DEV [1:556]
const IMG_LOGO       = 'https://www.figma.com/api/mcp/asset/5f46a47a-d910-4161-85de-65d8264019e8'
const IMG_HALO       = 'https://www.figma.com/api/mcp/asset/4e8a1ee6-4a64-446c-9b87-adc24360a603'
const IMG_CONNECT    = 'https://www.figma.com/api/mcp/asset/e14d0829-3627-4960-8ff2-16516c715f48'
const IMG_HEART      = 'https://www.figma.com/api/mcp/asset/34992d8b-d06e-4402-a291-a353956403b8'
const IMG_PH_HEAD    = 'https://www.figma.com/api/mcp/asset/ddc324eb-fbbc-47bd-b742-b4436ef356b1'
const IMG_PH_BODY    = 'https://www.figma.com/api/mcp/asset/44124077-71be-44f6-884a-3871e1e6a04f'
const IMG_AVATAR_LET = 'https://www.figma.com/api/mcp/asset/56f55e94-fe8d-4d3a-bdcd-cc9907612ac0'

const INVITE_OPTS = [
  { id:'whatsapp', icon:'💬', title:'WhatsApp', sub:'Envie um convite rápido pelo WhatsApp.',   iconBg:'#ECF7F3', iconColor:'#44AB84', arrowColor:'#44AB84' },
  { id:'link',     icon:'🔗', title:'Link',     sub:'Compartilhe um link personalizado.',        iconBg:'#F0F6F5', iconColor:'#6BA6A0', arrowColor:'#6BA6A0' },
  { id:'qrcode',   icon:'⬛', title:'QR Code',  sub:'Escaneie para conectar rapidamente.',       iconBg:'#EAEBEB', iconColor:'#2E3A37', arrowColor:'#2E3A37' },
  { id:'email',    icon:'✉️', title:'Email',    sub:'Digite o email e envie o convite.',         iconBg:'#FFF3F2', iconColor:'#FF8A7A', arrowColor:'#FF8A7A' },
]

export default function ConvidarParceiro() {
  const navigate = useNavigate()
  const { household, profile } = useAuth()
  const [mode, setMode] = useState(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const inviteLink = `viverjunto.app/join/${Math.random().toString(36).slice(2,8)}`

  async function handleWhatsApp() {
    const msg = encodeURIComponent(`Oi! Te convido para o ViverJunto 💚\nhttps://${inviteLink}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    navigate('/dashboard')
  }

  async function handleEmail() {
    if (!email.includes('@')) return
    setSending(true)
    try {
      if (household?.id) {
        await supabase.from('invites').insert({ household_id: household.id, invited_by: profile?.id, email })
      }
    } catch(_) {}
    setSending(false)
    setSent(true)
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(`https://${inviteLink}`)
      .then(() => alert('Link copiado!'))
      .catch(() => alert(`https://${inviteLink}`))
  }

  function handleOpt(id) {
    if (id === 'whatsapp') { handleWhatsApp(); return }
    if (id === 'qrcode')   { alert('QR Code: ' + inviteLink); return }
    setMode(mode === id ? null : id)
  }

  return (
    <div style={{ position:'relative', width:'100%', height:'852px', background:'#fff', overflow:'hidden' }}>

      {/* Auras */}
      <div style={{ position:'absolute', left:160, top:-80, width:290, height:290, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.16) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:-60, top:560, width:220, height:220, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.14) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:280, top:380, width:140, height:140, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,216,166,0.22) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Status Bar */}
      <span style={{ position:'absolute', left:40, top:17, fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>

      {/* Header logo */}
      <div style={{ position:'absolute', left:24, top:73, display:'flex', alignItems:'center', gap:5.9 }}>
        <img src={IMG_LOGO} alt="" style={{ width:32.148, height:28, objectFit:'contain' }}/>
        <div style={{ display:'flex', fontSize:21.827, fontWeight:700 }}>
          <span style={{ color:'#2E3A37' }}>Viver</span>
          <span style={{ color:'#6BA6A0' }}>Junto</span>
        </div>
      </div>

      {/* Progress bar — 6 segmentos todos coral, passo 6 de 6 */}
      <div style={{ position:'absolute', top:122, left:24, right:24, display:'flex', gap:3.5 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:'#FF8A7A' }}/>
        ))}
      </div>
      <p style={{ position:'absolute', top:132, left:0, width:'100%', margin:0,
        fontSize:10, fontWeight:500, color:'#80908C', textAlign:'center' }}>Passo 6 de 6</p>

      {/* Hero — top:115, height:175, bg:#F2EFE6 */}
      <div style={{ position:'absolute', left:0, top:115, width:393, height:175,
        background:'#F2EFE6', overflow:'hidden' }}>
        {/* Halo */}
        <img src={IMG_HALO} alt="" style={{ position:'absolute', left:60, top:0, width:274, height:200, objectFit:'cover' }}/>

        {/* Connect line */}
        <img src={IMG_CONNECT} alt="" style={{ position:'absolute', left:150.5, top:96, width:92, objectFit:'contain' }}/>

        {/* Avatar Letícia — left:62.5, top:52, size:88 */}
        <div style={{ position:'absolute', left:62.5, top:52, width:88, height:88,
          borderRadius:44, background:'#FFE0DB', overflow:'hidden',
          boxShadow:'0 6px 20px rgba(255,138,122,0.16)' }}>
          <img src={IMG_AVATAR_LET} alt="Letícia" style={{ width:'254%', height:'170%', position:'absolute', left:'-25%', top:'-24%', objectFit:'cover' }}/>
        </div>

        {/* Heart float — left:174.5, top:61, size:44 */}
        <img src={IMG_HEART} alt="" style={{ position:'absolute', left:164.5, top:51, width:64, height:80, objectFit:'contain' }}/>

        {/* Label Letícia */}
        <p style={{ position:'absolute', left:107-44, top:153, width:88,
          margin:0, fontSize:12, fontWeight:600, color:'#2E3A37', textAlign:'center' }}>Letícia</p>

        {/* Avatar parceiro placeholder — left:242.5, top:39, size:88 */}
        <div style={{ position:'absolute', left:242.5, top:39, width:88, height:88,
          borderRadius:44, background:'#F0F2F1',
          border:'2px dashed #E1E4E3', overflow:'hidden',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <img src={IMG_PH_HEAD} alt="" style={{ width:34, height:34 }}/>
          <img src={IMG_PH_BODY} alt="" style={{ width:60, height:42, marginTop:0 }}/>
        </div>

        {/* Label Seu par */}
        <p style={{ position:'absolute', left:286.5-44, top:151, width:88,
          margin:0, fontSize:12, fontWeight:500, color:'#80908C', textAlign:'center' }}>Seu par</p>
      </div>

      {/* Headline — left:16, top:314 */}
      <div style={{ position:'absolute', left:16, top:314, width:361 }}>
        <p style={{ margin:0, fontSize:22, fontWeight:700, color:'#2E3A37', lineHeight:1.3 }}>
          Convide quem compartilha<br/>a vida com você.
        </p>
      </div>

      {/* Sub — left:16, top:394 */}
      <p style={{ position:'absolute', left:16, top:394, width:345, margin:0,
        fontSize:13, color:'#51625E', lineHeight:1.52 }}>
        Organizem juntos tarefas, finanças<br/>e objetivos compartilhados.
      </p>

      {/* Opções de convite — left:16, top:458, gap:16 */}
      <div style={{ position:'absolute', left:16, top:458, width:361, display:'flex', flexDirection:'column', gap:16 }}>
        {INVITE_OPTS.map(opt => (
          <div key={opt.id}>
            <div
              onClick={() => handleOpt(opt.id)}
              style={{
                background:'#fff', border:'1.5px solid #E1E4E3', borderRadius:18,
                padding:'10px 16px', cursor:'pointer',
                boxShadow:'0 3px 6px rgba(46,58,55,0.05)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:opt.id==='qrcode'?12:16 }}>
                <div style={{ width:40, height:40, borderRadius:20, background:opt.iconBg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:20, flexShrink:0 }}>
                  {opt.icon}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#2E3A37', lineHeight:'20px' }}>{opt.title}</p>
                  <p style={{ margin:0, fontSize:11, color:'#80908C', lineHeight:'20px' }}>{opt.sub}</p>
                </div>
              </div>
              <span style={{ fontSize:22, color:opt.arrowColor, lineHeight:1 }}>›</span>
            </div>

            {/* Campo email expandido */}
            {opt.id === 'email' && mode === 'email' && (
              <div style={{ marginTop:8, background:'#FFF3F2', border:'1.5px solid #FF8A7A',
                borderRadius:14, padding:'10px 14px', animation:'slideDown 0.2s ease' }}>
                {sent ? (
                  <p style={{ margin:0, fontSize:13, color:'#FF8A7A', fontWeight:600, textAlign:'center' }}>
                    ✓ Convite enviado!
                  </p>
                ) : (
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      style={{ flex:1, border:'none', outline:'none', fontSize:13,
                        color:'#2E3A37', background:'transparent', fontFamily:'Inter,sans-serif' }}
                    />
                    <button
                      onClick={handleEmail}
                      disabled={sending || !email.includes('@')}
                      style={{ background:'#FF8A7A', border:'none', borderRadius:8,
                        padding:'6px 14px', fontSize:12, fontWeight:600, color:'#fff',
                        cursor:'pointer', opacity: email.includes('@') ? 1 : 0.5 }}
                    >
                      {sending ? '...' : 'Enviar'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Link copiável */}
            {opt.id === 'link' && mode === 'link' && (
              <div style={{ marginTop:8, background:'#F0F6F5', border:'1.5px solid #6BA6A0',
                borderRadius:14, padding:'10px 14px', display:'flex', gap:8,
                alignItems:'center', animation:'slideDown 0.2s ease' }}>
                <span style={{ flex:1, fontSize:11, color:'#6BA6A0', wordBreak:'break-all' }}>
                  {inviteLink}
                </span>
                <button onClick={handleCopyLink}
                  style={{ background:'#6BA6A0', border:'none', borderRadius:8,
                    padding:'6px 12px', fontSize:11, fontWeight:600, color:'#fff', cursor:'pointer', flexShrink:0 }}>
                  Copiar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Skip — left:16, top:758, w:361, h:44 */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{ position:'absolute', left:16, top:758, width:361, height:44,
          background:'#F0F2F1', border:'none', borderRadius:12, cursor:'pointer',
          fontSize:13, fontWeight:500, color:'#80908C' }}
      >
        Continuar sozinho(a) por agora
      </button>

      {/* Hint — top:812 */}
      <p style={{ position:'absolute', top:812, left:0, width:'100%', margin:0,
        fontSize:11, color:'#80908C', textAlign:'center' }}>
        Você pode convidar depois, nas configurações.
      </p>

      <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}
