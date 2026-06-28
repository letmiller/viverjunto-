import { useNavigate } from 'react-router-dom'
import { LogoFull } from '../../components/Logo'

// Imagens do Figma
const IMG_HERO     = 'https://www.figma.com/api/mcp/asset/187594ce-1cf0-479e-80aa-9b43f10f46e0'
const IMG_AURA_MAIN  = 'https://www.figma.com/api/mcp/asset/012a11c2-dd3c-4752-b4e8-6d3a1fa23010'
const IMG_AURA_CORAL = 'https://www.figma.com/api/mcp/asset/078638b8-8ad7-4d2a-9db0-4dee069d9096'

export default function BoasVindas() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', width: '100%', height: '852px', background: '#fff', overflow: 'hidden' }}>

      {/* Auras de fundo — posições exatas do Figma */}
      <div style={{ position:'absolute', left:200, top:-80, width:280, height:280, pointerEvents:'none' }}>
        <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,138,122,0.20) 0%, transparent 70%)' }}/>
      </div>
      <div style={{ position:'absolute', left:-100, top:480, width:240, height:240, pointerEvents:'none' }}>
        <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)' }}/>
      </div>
      <div style={{ position:'absolute', left:260, top:340, width:150, height:150, pointerEvents:'none' }}>
        <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,216,166,0.28) 0%, transparent 70%)' }}/>
      </div>

      {/* Status bar — top:0, height:59 */}
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:59 }}>
        <span style={{ position:'absolute', left:40, top:17, fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
      </div>

      {/* Header — top:59, height:56 */}
      <div style={{ position:'absolute', top:59, left:0, width:'100%', height:56 }}>
        {/* Botão Pular — left:322, top:14 */}
        <button
          onClick={() => navigate('/cadastro')}
          style={{ position:'absolute', left:322, top:14, width:47, height:28, background:'#F0F2F1', border:'none', borderRadius:100, fontSize:12, fontWeight:500, color:'#80908C', cursor:'pointer' }}
        >
          Pular
        </button>
        {/* Logo — left:24, top:14 */}
        <div style={{ position:'absolute', left:24, top:14 }}>
          <LogoFull size={28} />
        </div>
      </div>

      {/* Hero bg — left:0, top:115, width:393, height:334 */}
      <div style={{ position:'absolute', left:0, top:115, width:393, height:334, background:'#F2EFE6', overflow:'hidden' }}>
        {/* Aura main — left:60, top:20 (relativo ao hero) */}
        <div style={{ position:'absolute', left:60, top:20, width:280, height:280 }}>
          <img src={IMG_AURA_MAIN} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        </div>
        {/* Aura coral — left:180, top:80 */}
        <div style={{ position:'absolute', left:180, top:80, width:180, height:180 }}>
          <img src={IMG_AURA_CORAL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        </div>
        {/* Imagem principal — left:9, top:0, width:376, height:342 */}
        <img
          src={IMG_HERO}
          alt="Casal organizando a vida juntos"
          style={{ position:'absolute', left:9, top:0, width:376, height:342, objectFit:'cover', objectPosition:'center top' }}
        />
      </div>

      {/* Headline — left:24, top:485, fontSize:26 Bold */}
      <div style={{ position:'absolute', left:24, top:485, width:345 }}>
        <p style={{ margin:0, fontSize:26, fontWeight:700, color:'#2E3A37', lineHeight:1.35 }}>
          Organizar a vida<br/>pode ser mais leve.
        </p>
      </div>

      {/* Subheadline — left:24, top:573, fontSize:16 */}
      <p style={{ position:'absolute', left:24, top:573, width:345, margin:0, fontSize:16, fontWeight:400, color:'#51625E', lineHeight:1.55 }}>
        Finanças, rotina e responsabilidades compartilhadas em um só lugar.
      </p>

      {/* Dot separado — left:191.5, top:816 */}
      <div style={{ position:'absolute', left:191.5, top:816, width:7, height:7, borderRadius:4, background:'#E1E4E3', opacity:0.40 }}/>

      {/* Pills — left:24, top:655 */}
      <div style={{ position:'absolute', left:24, top:655, display:'flex', gap:8, alignItems:'center' }}>
        <div style={{ background:'#E8F2F1', borderRadius:100, padding:'4px 12px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:14, color:'#6BA6A0' }}>◈</span>
          <span style={{ fontSize:12, fontWeight:500, color:'#6BA6A0', width:52, display:'flex', alignItems:'center', justifyContent:'center' }}>Finanças</span>
        </div>
        <div style={{ background:'#FFF4F2', borderRadius:100, padding:'4px 12px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:14, color:'#FF8A7A' }}>✓</span>
          <span style={{ fontSize:12, fontWeight:500, color:'#FF8A7A' }}>Tarefas</span>
        </div>
        <div style={{ background:'#FDF3E1', borderRadius:100, padding:'4px 12px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:14, color:'#A57D29' }}>◎</span>
          <span style={{ fontSize:12, fontWeight:500, color:'#A57D29' }}>Metas</span>
        </div>
      </div>

      {/* CTAs + dots — left:24, top:705, width:345 */}
      <div style={{ position:'absolute', left:24, top:705, width:345, display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
        {/* Botão Começar */}
        <button
          onClick={() => navigate('/carrossel')}
          style={{
            width:'100%', height:56, background:'#FF8A7A', border:'none', borderRadius:16,
            fontSize:16, fontWeight:600, color:'#fff', cursor:'pointer',
            boxShadow:'0 8px 12px rgba(255,138,122,0.25)',
            position:'relative', overflow:'hidden',
          }}
          onPointerDown={e => e.currentTarget.style.transform='scale(0.97)'}
          onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
        >
          <div style={{ position:'absolute', top:0, left:0, right:0, height:28, background:'rgba(255,255,255,0.10)', borderRadius:16 }}/>
          Começar
        </button>

        {/* "Conhecer primeiro" */}
        <button
          onClick={() => navigate('/carrossel')}
          style={{ background:'none', border:'none', fontSize:14, fontWeight:500, color:'#80908C', cursor:'pointer', height:32, display:'flex', alignItems:'center' }}
        >
          Conhecer primeiro
        </button>

        {/* Progress dots — w:41, centralizados */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:41 }}>
          <div style={{ width:20, height:7, background:'#FF8A7A', borderRadius:4 }}/>
          <div style={{ width:7, height:7, background:'#E1E4E3', borderRadius:4, opacity:0.40 }}/>
        </div>
      </div>

    </div>
  )
}
