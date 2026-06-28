import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

// Imagens do DEV Figma [5:118]
const IMG_NOTIF_DOT  = 'https://www.figma.com/api/mcp/asset/4e715af6-fc53-44f5-adcb-9518ffd12077'
const IMG_MOOD_ICON  = 'https://www.figma.com/api/mcp/asset/6c681b3f-86ff-4ded-b12d-64d5e38b8d3e'
const IMG_URG_DOT    = 'https://www.figma.com/api/mcp/asset/10ba5fa8-3388-41b2-9934-f5d31a0bfed6'

// ── Bottom Nav ─────────────────────────────────────────────────
export function BottomNav() {
  const { pathname } = useLocation()
  const items = [
    { icon:'⌂',  label:'Início',   to:'/dashboard' },
    { icon:'◎',  label:'Finanças', to:'/financas'  },
    { icon:'✦',  label:'Rotina',   to:'/rotina'    },
    { icon:'🛒', label:'Compras',  to:'/compras'   },
    { icon:'⊙',  label:'Perfil',   to:'/perfil'    },
  ]
  return (
    <div style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:430,
      background:'#fff', boxShadow:'0 -2px 8px rgba(46,58,55,0.08)',
      padding:'16px 0', zIndex:100,
    }}>
      <div style={{ display:'flex', gap:14, alignItems:'flex-end', justifyContent:'center' }}>
        {items.map(item => {
          const active = pathname === item.to
          return (
            <Link key={item.to} to={item.to} style={{ textDecoration:'none', width:65, display:'flex', flexDirection:'column', alignItems:'center', gap: item.icon==='🛒'?5:2 }}>
              {active ? (
                <div style={{ background:'#FFF4F2', border:'1px solid #FFE0DB', borderRadius:14,
                  width:36, height:28, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:18, color:'#FF8A7A' }}>{item.icon}</span>
                </div>
              ) : (
                <span style={{ fontSize:22, color:'#80908C', textAlign:'center', display:'block', width:'100%' }}>{item.icon}</span>
              )}
              <span style={{ fontSize:12, fontWeight: active?600:400, color: active?'#FF8A7A':'#80908C', textAlign:'center' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
function fmtDate() {
  return new Date().toLocaleDateString('pt-BR',{ weekday:'long', day:'numeric', month:'long' })
}
function fmtBRL(v) {
  return Number(v).toLocaleString('pt-BR',{ minimumFractionDigits:2 })
}

// ── Mini card ──────────────────────────────────────────────────
function MiniCard({ icon, iconBg, iconColor, label, labelColor, value, sub, border }) {
  return (
    <div style={{
      flex:'1 0 0', background: iconBg.replace('28','10'), border:`1px solid ${border}`,
      borderRadius:8, padding:8, boxShadow:'0 2px 4px rgba(46,58,55,0.05)',
    }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
        <div style={{ width:28, height:28, borderRadius:14, background:iconBg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
          <span style={{ color:iconColor }}>{icon}</span>
        </div>
        <span style={{ fontSize:12, fontWeight:600, color:labelColor }}>{label}</span>
      </div>
      <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#2E3A37' }}>{value}</p>
      <p style={{ margin:0, fontSize:12, color:'#80908C' }}>{sub}</p>
    </div>
  )
}

// ── Timeline item ──────────────────────────────────────────────
function TimelineItem({ time, icon, iconBg, iconColor, title, sub, tag, tagBg, tagColor, urgent, lineColor, lineHeight }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
      {/* Vertical line */}
      {lineColor && (
        <div style={{ position:'absolute', left:9, top:20, width:2, height:lineHeight||44,
          background:lineColor, borderRadius:1 }}/>
      )}
      <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
        <div style={{ width:20, height:20, borderRadius:10, background:iconBg, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
          <span>{icon}</span>
        </div>
        <div>
          <p style={{ margin:0, fontSize:10, color:'#80908C' }}>{time}</p>
          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#2E3A37' }}>{title}</p>
          <p style={{ margin:0, fontSize:10, color:'#80908C' }}>{sub}</p>
        </div>
      </div>
      {urgent ? (
        <div style={{ background:'#FFF1EF', borderRadius:100, padding:'4px 16px',
          display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <img src={IMG_URG_DOT} alt="" style={{ width:8, height:8 }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'#B64F41' }}>Urgente</span>
        </div>
      ) : (
        <div style={{ background:tagBg, borderRadius:100, padding:'4px 16px', flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:tagColor }}>{tag}</span>
        </div>
      )}
    </div>
  )
}

// ── Meta card ──────────────────────────────────────────────────
function MetaCard({ emoji, emojiBg, accColor, title, tag, tagBg, tagColor, target, current, pct }) {
  return (
    <div style={{ background:'#fff', borderRadius:8, boxShadow:'0 4px 16px rgba(46,58,55,0.06)',
      display:'flex', gap:7, alignItems:'center', overflow:'hidden' }}>
      <div style={{ width:5, height:112, background:accColor, flexShrink:0 }}/>
      <div style={{ display:'flex', flex:1, gap:8, alignItems:'flex-start', padding:'8px 8px 8px 0' }}>
        <div style={{ width:44, height:44, borderRadius:22, background:emojiBg, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
          {emoji}
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#2E3A37' }}>{title}</span>
            <div style={{ background:tagBg, borderRadius:100, padding:'4px 8px' }}>
              <span style={{ fontSize:12, fontWeight:600, color:tagColor }}>{tag}</span>
            </div>
          </div>
          <span style={{ fontSize:12, color:'#80908C' }}>R$ {fmtBRL(target)}</span>
          {/* Progress bar */}
          <div style={{ position:'relative', height:6, background:'#F0F2F1', borderRadius:4 }}>
            <div style={{ position:'absolute', top:0, left:0, height:6, width:`${pct}%`,
              background:accColor, borderRadius:4 }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#2E3A37' }}>R$ {fmtBRL(current)}</span>
            <span style={{ fontSize:12, color:'#80908C' }}>{pct}% da meta</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
export function DashboardPage() {
  const { profile, household } = useAuth()
  const [stats, setStats]   = useState({ income:0, expense:0, tasks:0, urgentTasks:0, goalsAvg:68 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (household?.id) loadStats()
    else setLoading(false)
  }, [household])

  async function loadStats() {
    const hid = household.id
    const startMonth = new Date(); startMonth.setDate(1)
    const m0 = startMonth.toISOString().split('T')[0]

    const [{ data: txData }, { count: taskCount }, { count: urgentCount }] = await Promise.all([
      supabase.from('transactions').select('type,amount').eq('household_id', hid).gte('date', m0),
      supabase.from('tasks').select('*',{count:'exact',head:true}).eq('household_id', hid).eq('status','pending'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).eq('household_id', hid).eq('status','pending').eq('priority','high'),
    ])

    const income  = (txData||[]).filter(t=>t.type==='income').reduce((s,t)=>s+ +t.amount,0)
    const expense = (txData||[]).filter(t=>t.type==='expense').reduce((s,t)=>s+ +t.amount,0)
    setStats({ income, expense, tasks: taskCount||0, urgentTasks: urgentCount||0, goalsAvg:68 })
    setLoading(false)
  }

  const saldo = stats.income - stats.expense
  const firstName = profile?.name?.split(' ')[0] || 'você'

  return (
    <div style={{ background:'#F2EFE6', minHeight:'100vh', paddingBottom:110 }}>

      {/* Auras */}
      <div style={{ position:'fixed', left:200, top:-120, width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.16) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', left:-80, top:1000, width:260, height:260, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.12) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── HEADER ── */}
        <div style={{ padding:'0 16px', paddingTop:0 }}>
          {/* Status bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:17, paddingBottom:0 }}>
            <span style={{ fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
            <span style={{ fontSize:11, color:'#80908C', textAlign:'right' }}>▓▓▓▓ 87%</span>
          </div>

          {/* Greeting row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:56-17, paddingTop:0 }}>
            {/* Recalculate: header starts at top:0, greeting at top:56 */}
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:500, color:'#80908C', textTransform:'capitalize' }}>
                {fmtDate()}
              </p>
              <p style={{ margin:0, fontSize:24, fontWeight:700, color:'#2E3A37' }}>
                {greeting()}, {firstName} ✦
              </p>
            </div>
            {/* Notif button */}
            <div style={{ position:'relative' }}>
              <div style={{ width:40, height:40, borderRadius:20, background:'#fff',
                boxShadow:'0 2px 4px rgba(46,58,55,0.06)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                🔔
              </div>
              <img src={IMG_NOTIF_DOT} alt="" style={{ position:'absolute', top:2, right:0, width:14, height:14 }}/>
              <span style={{ position:'absolute', top:3, right:1, fontSize:9, fontWeight:700, color:'#fff', zIndex:1 }}>2</span>
            </div>
          </div>

          {/* Mood badge */}
          <div style={{
            marginTop:16, background:'#fff', border:'1px solid #D1E7E5', borderRadius:20,
            padding:'9px 10px', display:'flex', alignItems:'center', gap:4,
            boxShadow:'0 3px 7px rgba(107,166,160,0.10)',
          }}>
            <img src={IMG_MOOD_ICON} alt="" style={{ width:20, height:20 }}/>
            <span style={{ flex:1, fontSize:13, fontWeight:500, color:'#2E3A37' }}>A casa está equilibrada hoje ✨</span>
            <span style={{ fontSize:12, color:'#6BA6A0', textAlign:'right', width:76 }}>Ver mais →</span>
          </div>
        </div>

        {/* ── VISÃO GERAL ── */}
        <div style={{ padding:'0 16px', marginTop:24 }}>
          <p style={{ margin:'0 0 16px', fontSize:14, fontWeight:600, color:'#51625E' }}>Visão geral</p>

          {/* Saldo card */}
          <div style={{ background:'#2E3A37', borderRadius:8, padding:12,
            boxShadow:'0 6px 10px rgba(46,58,55,0.14)', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:11, fontWeight:500, color:'#D1E7E5' }}>Conta compartilhada</p>
                <p style={{ margin:'0', fontSize:28, fontWeight:700, color:'#fff' }}>
                  R$ {fmtBRL(loading ? 0 : Math.abs(saldo))}
                </p>
                {/* Progress bar */}
                <div style={{ marginTop:8, position:'relative', height:5, background:'rgba(255,255,255,0.12)', borderRadius:4, width:'100%' }}>
                  <div style={{ position:'absolute', top:0, left:0, height:5, width:'54%', background:'#FF8A7A', borderRadius:4 }}/>
                </div>
              </div>
              <div style={{ width:36, height:36, borderRadius:18, background:'rgba(255,255,255,0.10)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                💰
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:12, color:'#FFE0DB' }}>
              <span>{firstName} 54%</span>
              <span style={{ color:'#D1E7E5' }}>Rodolfo 46%</span>
            </div>
          </div>

          {/* Mini cards */}
          <div style={{ display:'flex', gap:18, alignItems:'stretch', marginBottom:24 }}>
            <MiniCard icon="📅" iconBg="#F4EFE5" iconColor="#A57D29" label="Contas"   labelColor="#906814"
              value={`${stats.tasks} em breve`} sub="Próx: R$ 180" border="#F5D8A6"/>
            <MiniCard icon="✓"  iconBg="#E7EEED" iconColor="#38706A" label="Tarefas"  labelColor="#38706A"
              value={loading ? '—' : String(stats.tasks)} sub={`${stats.urgentTasks} urgentes`} border="#D1E7E5"/>
            <MiniCard icon="✨" iconBg="#F8EAE9" iconColor="#C75445" label="Metas"    labelColor="#C75445"
              value={`${stats.goalsAvg}%`} sub="Do objetivo" border="#FFE0DB"/>
          </div>

          {/* ── Casa hoje ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#2E3A37' }}>Casa hoje</span>
            <span style={{ fontSize:12, fontWeight:500, color:'#6BA6A0' }}>Ver tudo →</span>
          </div>

          {/* Timeline card */}
          <div style={{ background:'#fff', borderRadius:4, padding:'8px 16px',
            boxShadow:'0 4px 9px rgba(46,58,55,0.06)', marginBottom:24,
            display:'flex', flexDirection:'column', gap:4 }}>
            {[
              { time:'09:30', icon:'💳', iconBg:'#FFEDEB', title:'Conta de luz', sub:'R$ 180 · Vence hoje', urgent:true, lineColor:'#FF8A7A', lineHeight:44 },
              { time:'12:00', icon:'🐶', iconBg:'#E9F2F1', title:'Vacina do Buddy', sub:'Lembrete · Rafael', tag:'Pet', tagBg:'#EDF4F4', tagColor:'#417872', lineColor:'#E1E4E3', lineHeight:50 },
              { time:'14:00', icon:'🛒', iconBg:'#FEF9F2', title:'Fazer mercado', sub:'Lista: 18 itens', tag:'Tarefa', tagBg:'#FEFAF4', tagColor:'#8B6F40', lineColor:'#E1E4E3', lineHeight:53 },
              { time:'18:00', icon:'💰', iconBg:'#FDFDFD', title:'Transferência', sub:'R$ 800 · Aluguel', tag:'Financeiro', tagBg:'#EAECEC', tagColor:'#51625E', lineColor:'#E1E4E3', lineHeight:62 },
              { time:'20:00', icon:'🏠', iconBg:'#F8FBFB', title:'Limpar cozinha', sub:'Juntos · 30 min', tag:'Rotina', tagBg:'#EDF4F4', tagColor:'#417872', lineColor:null },
            ].map((item, i) => <TimelineItem key={i} {...item}/>)}
          </div>

          {/* ── Equilíbrio da casa ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#2E3A37' }}>Equilíbrio da casa</span>
            <span style={{ fontSize:12, fontWeight:500, color:'#417973' }}>Este mês</span>
          </div>

          <div style={{ background:'#fff', borderRadius:4, padding:8, boxShadow:'0 4px 18px rgba(46,58,55,0.06)', marginBottom:24 }}>
            <p style={{ margin:'0 0 16px', fontSize:12, color:'#80908C' }}>Como as responsabilidades estão distribuídas</p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {/* Letícia */}
              <div style={{ flex:1, background:'#FFF4F2', borderRadius:4, padding:8 }}>
                <p style={{ margin:0, fontSize:28, fontWeight:700, color:'#DD6C5D', textAlign:'center' }}>54%</p>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#2E3A37', textAlign:'center' }}>{firstName}</p>
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:8 }}>
                  {[{label:'Finanças',w:59},{label:'Tarefas',w:69},{label:'Compras',w:44}].map(b => (
                    <div key={b.label}>
                      <div style={{ position:'relative', height:5, background:'#F0F2F1', borderRadius:3, width:98 }}>
                        <div style={{ position:'absolute', top:0, left:0, height:5, width:b.w, background:'#FF8A7A', borderRadius:3 }}/>
                      </div>
                      <span style={{ fontSize:12, color:'#80908C' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Coração */}
              <div style={{ width:36, height:36, borderRadius:18, background:'#fff',
                boxShadow:'0 3px 5px rgba(107,166,160,0.14)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#6BA6A0', flexShrink:0 }}>♡</div>
              {/* Rodolfo */}
              <div style={{ flex:1, background:'#E8F2F1', borderRadius:4, padding:8 }}>
                <p style={{ margin:0, fontSize:28, fontWeight:700, color:'#5B938E', textAlign:'center' }}>46%</p>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#2E3A37', textAlign:'center' }}>Rodolfo</p>
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:8 }}>
                  {[{label:'Finanças',w:39,c:'#6BA6A0'},{label:'Tarefas',w:29,c:'#D1E7E5'},{label:'Compras',w:54,c:'#BDE0D9'}].map(b => (
                    <div key={b.label}>
                      <div style={{ position:'relative', height:5, background:'#F0F2F1', borderRadius:3, width:98 }}>
                        <div style={{ position:'absolute', top:0, left:0, height:5, width:b.w, background:b.c, borderRadius:3 }}/>
                      </div>
                      <span style={{ fontSize:12, color:'#80908C' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Carga mental */}
            <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:16 }}>
              <span style={{ fontSize:12, color:'#80908C', width:160 }}>Carga mental da semana</span>
              <div style={{ display:'flex', alignItems:'center', flex:1 }}>
                <div style={{ position:'relative', height:8, background:'#F0F2F1', borderRadius:4, width:147 }}>
                  <div style={{ position:'absolute', top:0, left:0, height:8, width:91, background:'#6BA6A0', borderRadius:4 }}/>
                </div>
                <span style={{ fontSize:10, fontWeight:600, color:'#6BA6A0', marginLeft:4 }}>62%</span>
              </div>
            </div>
          </div>

          {/* ── Compras da semana ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#2E3A37' }}>Compras da semana</span>
            <Link to="/compras" style={{ fontSize:12, fontWeight:500, color:'#3F7570', textDecoration:'none' }}>Ver lista →</Link>
          </div>

          <div style={{ background:'#fff', borderRadius:8, padding:16, boxShadow:'0 4px 8px rgba(46,58,55,0.06)', marginBottom:24 }}>
            <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:600, color:'#2E3A37' }}>11 de 18 itens</p>
            <p style={{ margin:'0 0 8px', fontSize:12, color:'#80908C' }}>Faltam 7 itens · ~R$ 74</p>
            <div style={{ position:'relative', height:8, background:'#F0F2F1', borderRadius:4, marginBottom:8 }}>
              <div style={{ position:'absolute', top:0, left:0, height:8, width:'60.45%', background:'#F5D8A6', borderRadius:4 }}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['🥦 Brócolis','🥛 Leite','🧴 Sabonete'].map(item => (
                <div key={item} style={{ background:'#F0F2F1', borderRadius:10, padding:'4px 8px' }}>
                  <span style={{ fontSize:12, color:'#51625E' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Metas compartilhadas ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#2E3A37' }}>Metas compartilhadas</span>
            <Link to="/metas" style={{ fontSize:12, fontWeight:500, color:'#3F7570', textDecoration:'none' }}>Ver todas →</Link>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
            <MetaCard emoji="✈️" emojiBg="#E8F2F1" accColor="#6BA6A0"
              title="Viagem a Portugal" tag="Sonho" tagBg="#E8F2F1" tagColor="#407670"
              target={12000} current={4800} pct={40}/>
            <MetaCard emoji="🛡️" emojiBg="#FDF3E1" accColor="#F5D8A6"
              title="Reserva de emergência" tag="Segurança" tagBg="#FDF3E1" tagColor="#84693A"
              target={12000} current={4800} pct={40}/>
            <MetaCard emoji="🏠" emojiBg="#FFF4F2" accColor="#FF8A7A"
              title="Reforma da cozinha" tag="Casa" tagBg="#FFF4F2" tagColor="#84693A"
              target={12000} current={4800} pct={40}/>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div style={{
        position:'fixed', bottom:98, right:'calc(50% - 197px)',
        width:56, height:56, borderRadius:28,
        background:'#FF8A7A', boxShadow:'0 8px 10px rgba(255,138,122,0.28)',
        display:'flex', alignItems:'center', justifyContent:'center', zIndex:90, cursor:'pointer',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:28, background:'rgba(255,255,255,0.12)', borderRadius:28 }}/>
        <span style={{ fontSize:28, fontWeight:700, color:'#fff', lineHeight:1 }}>+</span>
      </div>

      <BottomNav />
    </div>
  )
}
