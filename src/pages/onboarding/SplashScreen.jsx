import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Imagens do Figma DEV — logo real (imgGroup5) e loading dots
const IMG_LOGO      = 'https://www.figma.com/api/mcp/asset/a8fc4f53-6d9f-4aee-8647-5f60dd502d28'
const IMG_DOT_1     = 'https://www.figma.com/api/mcp/asset/6583b8e3-cb76-4a0c-8d03-1fe459972c5b'
const IMG_DOT_2     = 'https://www.figma.com/api/mcp/asset/71c6cc19-1127-4242-9dc0-5324d87e9141'
const IMG_DOT_3     = 'https://www.figma.com/api/mcp/asset/381ffa8f-0651-4b60-b050-a6e8770286d6'

export default function SplashScreen() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 150)
    const t2 = setTimeout(() => setProgress(50), 500)
    const t3 = setTimeout(() => navigate('/boas-vindas'), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [navigate])

  return (
    <div style={{
      position: 'relative', width: '100%', height: '852px',
      background: '#F2EFE6', overflow: 'hidden',
    }}>

      {/* Auras — posições exatas do Figma DEV */}
      {/* bg/aura-coral: left:180, top:-110, size:300 */}
      <div style={{ position:'absolute', left:180, top:-110, width:300, height:300,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,138,122,0.24) 0%, transparent 65%)' }}/>
      {/* bg/aura-teal: left:-118, top:540, size:260 */}
      <div style={{ position:'absolute', left:-118, top:540, width:260, height:260,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(107,166,160,0.22) 0%, transparent 65%)' }}/>
      {/* bg/aura-amber: left:270, top:360, size:160 */}
      <div style={{ position:'absolute', left:270, top:360, width:160, height:160,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(245,216,166,0.32) 0%, transparent 65%)' }}/>

      {/* Status bar */}
      <span style={{ position:'absolute', left:40, top:18, fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
      <div style={{ position:'absolute', left:330, top:20, width:26, height:12, borderRadius:3, background:'#2E3A37' }}/>
      <div style={{ position:'absolute', left:294, top:20, width:8, height:12, borderRadius:2, background:'#2E3A37' }}/>

      {/* Logo + wordmark — Frame 6: left:83, top:379, width:234 */}
      <div style={{
        position: 'absolute', left:83, top:379, width:234,
        display: 'flex', flexDirection: 'column', gap: 11.6,
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.92)',
        transition: 'opacity 0.55s cubic-bezier(0.34,1.4,0.64,1), transform 0.55s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        {/* Ícone logo — Group 5: width:63.19, height:55.03 */}
        <img
          src={IMG_LOGO}
          alt="ViverJunto"
          style={{ width: 63.19, height: 55.03, objectFit: 'contain' }}
        />
        {/* Wordmark — fontSize:42.9 Bold */}
        <div style={{ display:'flex', alignItems:'center', width:234, justifyContent:'center' }}>
          <span style={{ fontSize:42.9, fontWeight:700, color:'#2E3A37', lineHeight:1.27, letterSpacing:'-0.01em' }}>Viver</span>
          <span style={{ fontSize:42.9, fontWeight:700, color:'#6BA6A0', lineHeight:1.27, letterSpacing:'-0.01em' }}>Junto</span>
        </div>
      </div>

      {/* Loading dots — top:680, posições exatas: 176, 193, 210 */}
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease 0.4s' }}>
        <img src={IMG_DOT_1} alt="" style={{
          position:'absolute', left:176, top:680, width:7, height:7,
          animation:'dotPulse 1.2s ease-in-out 0s infinite alternate',
        }}/>
        <img src={IMG_DOT_2} alt="" style={{
          position:'absolute', left:193, top:680, width:7, height:7,
          animation:'dotPulse 1.2s ease-in-out 0.2s infinite alternate',
        }}/>
        <img src={IMG_DOT_3} alt="" style={{
          position:'absolute', left:210, top:680, width:7, height:7,
          animation:'dotPulse 1.2s ease-in-out 0.4s infinite alternate',
        }}/>
      </div>

      {/* Loading track — left:168.5, top:700, width:56, height:2 */}
      <div style={{
        position:'absolute', left:168.5, top:700, width:56, height:2,
        background:'#E1E4E3', borderRadius:2,
        opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease 0.4s',
      }}>
        {/* Loading fill — width:28 → animado */}
        <div style={{
          height:'100%', borderRadius:2, background:'#6BA6A0',
          width: `${progress}%`,
          transition: 'width 1.6s cubic-bezier(0.4,0,0.2,1)',
        }}/>
      </div>

      <style>{`
        @keyframes dotPulse {
          from { opacity: 0.3; transform: scale(0.82); }
          to   { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
