import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

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
      width:'100%', maxWidth:430, background:'#fff',
      boxShadow:'0 -2px 8px rgba(46,58,55,0.08)',
      display:'flex', alignItems:'center', justifyContent:'space-around',
      padding:'10px 0 24px', zIndex:100,
    }}>
      {items.map(item => {
        const active = pathname === item.to
        return (
          <Link key={item.to} to={item.to} style={{ textDecoration:'none',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            {active ? (
              <div style={{ background:'#FFF4F2', border:'1px solid #FFE0DB',
                borderRadius:14, width:36, height:28,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:17, color:'#FF8A7A' }}>{item.icon}</span>
              </div>
            ) : (
              <span style={{ fontSize:22, color:'#80908C', display:'block',
                width:36, textAlign:'center', lineHeight:'28px' }}>{item.icon}</span>
            )}
            <span style={{ fontSize:10, fontWeight:active?600:400,
              color:active?'#FF8A7A':'#80908C' }}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
function fmtDate() {
  return new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})
}
function fmtBRL(v) {
  return Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})
}

// ── Empty state card ───────────────────────────────────────────
function EmptyCard({ icon, title, sub, cta, to }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'20px',
      boxShadow:'0 2px 8px rgba(46,58,55,0.05)',
      display:'flex', flexDirection:'column', alignItems:'center',
      gap:8, textAlign:'center' }}>
      <span style={{ fontSize:32 }}>{icon}</span>
      <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#2E3A37' }}>{title}</p>
      <p style={{ margin:0, fontSize:12, color:'#80908C', lineHeight:1.5 }}>{sub}</p>
      {cta && to && (
        <Link to={to} style={{ marginTop:4, background:'#F2EFE6',
          borderRadius:100, padding:'6px 16px', fontSize:12, fontWeight:600,
          color:'#6BA6A0', textDecoration:'none' }}>
          {cta}
        </Link>
      )}
    </div>
  )
}

// ── Quick action button ────────────────────────────────────────
function QuickAction({ icon, label, to, bg, color }) {
  return (
    <Link to={to} style={{ textDecoration:'none', flex:1 }}>
      <div style={{ background:bg, borderRadius:16, padding:'14px 8px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:24 }}>{icon}</span>
        <span style={{ fontSize:10, fontWeight:600, color }}>{label}</span>
      </div>
    </Link>
  )
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
export function DashboardPage() {
  const { profile, household } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  const firstName = profile?.name?.split(' ')[0] || 'você'

  useEffect(() => {
    if (household?.id) loadData()
    else setLoading(false)
  }, [household])

  async function loadData() {
    const hid = household.id
    const m0 = new Date(); m0.setDate(1)
    const startMonth = m0.toISOString().split('T')[0]

    const [{ data: txData }, { data: taskData }, { count: goalsCount }] = await Promise.all([
      supabase.from('transactions').select('type,amount').eq('household_id',hid).gte('date',startMonth),
      supabase.from('tasks').select('id,title,status,priority').eq('household_id',hid)
        .neq('status','done').order('created_at',{ascending:false}).limit(5),
      supabase.from('goals').select('*',{count:'exact',head:true}).eq('household_id',hid).eq('status','active'),
    ])

    const income  = (txData||[]).filter(t=>t.type==='income').reduce((s,t)=>s+ +t.amount,0)
    const expense = (txData||[]).filter(t=>t.type==='expense').reduce((s,t)=>s+ +t.amount,0)
    setStats({ income, expense, goals: goalsCount||0 })
    setTasks(taskData||[])
    setLoading(false)
  }

  const isEmpty = !loading && stats && stats.income===0 && stats.expense===0 && tasks.length===0

  return (
    <div style={{ background:'#F2EFE6', minHeight:'100vh', paddingBottom:110 }}>

      {/* Aura decorativa */}
      <div style={{ position:'fixed', right:-80, top:-80, width:280, height:280, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(107,166,160,0.18) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', left:-60, bottom:200, width:200, height:200, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,138,122,0.12) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:0 }}/>

      <div style={{ position:'relative', zIndex:1, padding:'0 16px' }}>

        {/* Status bar */}
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:17, paddingBottom:8 }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#2E3A37' }}>9:41</span>
          <span style={{ fontSize:11, color:'#80908C' }}>87%</span>
        </div>

        {/* Greeting */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop:8 }}>
          <div>
            <p style={{ margin:0, fontSize:12, color:'#80908C', textTransform:'capitalize' }}>
              {fmtDate()}
            </p>
            <h1 style={{ margin:'4px 0 0', fontSize:24, fontWeight:700, color:'#2E3A37' }}>
              {greeting()}, {firstName} ✦
            </h1>
          </div>
          {/* Notificação */}
          <div style={{ width:40, height:40, borderRadius:20, background:'#fff',
            boxShadow:'0 2px 6px rgba(46,58,55,0.08)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer' }}>
            🔔
          </div>
        </div>

        {/* ── SE VAZIO: boas-vindas calorosa ── */}
        {isEmpty ? (
          <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Card de boas-vindas */}
            <div style={{ background:'#2E3A37', borderRadius:20, padding:20,
              boxShadow:'0 6px 16px rgba(46,58,55,0.14)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-40, top:-40, width:160, height:160, borderRadius:'50%',
                background:'rgba(107,166,160,0.12)' }}/>
              <p style={{ margin:0, fontSize:12, color:'#D1E7E5' }}>Tudo pronto ✦</p>
              <h2 style={{ margin:'8px 0', fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.3 }}>
                Bem-vindo ao<br/>ViverJunto, {firstName}!
              </h2>
              <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.60)', lineHeight:1.5 }}>
                Comece adicionando suas finanças, tarefas e metas compartilhadas.
              </p>
            </div>

            {/* Ações rápidas */}
            <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#2E3A37' }}>Por onde começar?</p>
            <div style={{ display:'flex', gap:10 }}>
              <QuickAction icon="💰" label="Finanças"  to="/financas" bg="#EBF3F2" color="#387069"/>
              <QuickAction icon="✓"  label="Tarefas"   to="/rotina"   bg="#FFF4F2" color="#C75445"/>
              <QuickAction icon="🛒" label="Compras"   to="/compras"  bg="#FDF3E1" color="#A57D29"/>
              <QuickAction icon="✨" label="Metas"     to="/metas"    bg="#E9E7F7" color="#4B44A0"/>
            </div>

            {/* Empty states */}
            <EmptyCard icon="💳" title="Nenhuma transação ainda"
              sub="Registre entradas e saídas para acompanhar as finanças do casal."
              cta="Adicionar transação" to="/financas"/>

            <EmptyCard icon="✓" title="Nenhuma tarefa pendente"
              sub="Crie tarefas domésticas e divida com seu parceiro(a)."
              cta="Criar tarefa" to="/rotina"/>

            <EmptyCard icon="✨" title="Sem metas ainda"
              sub="Defina objetivos compartilhados e acompanhem juntos."
              cta="Criar meta" to="/metas"/>
          </div>

        ) : (
          /* ── COM DADOS: dashboard normal ── */
          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:20 }}>

            {/* Saldo card */}
            <div style={{ background:'#2E3A37', borderRadius:20, padding:20,
              boxShadow:'0 6px 16px rgba(46,58,55,0.14)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-40, top:-40, width:160, height:160,
                borderRadius:'50%', background:'rgba(107,166,160,0.10)' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ margin:0, fontSize:11, color:'#D1E7E5' }}>Conta compartilhada</p>
                  <h2 style={{ margin:'4px 0 0', fontSize:28, fontWeight:700, color:'#fff' }}>
                    R$ {fmtBRL((stats?.income||0)-(stats?.expense||0))}
                  </h2>
                </div>
                <span style={{ fontSize:24 }}>💰</span>
              </div>
              <div style={{ marginTop:12, display:'flex', gap:16 }}>
                <div>
                  <p style={{ margin:0, fontSize:10, color:'rgba(255,255,255,0.50)' }}>Entradas</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#D1E7E5' }}>R$ {fmtBRL(stats?.income)}</p>
                </div>
                <div>
                  <p style={{ margin:0, fontSize:10, color:'rgba(255,255,255,0.50)' }}>Saídas</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#FFE0DB' }}>R$ {fmtBRL(stats?.expense)}</p>
                </div>
                <div>
                  <p style={{ margin:0, fontSize:10, color:'rgba(255,255,255,0.50)' }}>Metas</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#F5D8A6' }}>{stats?.goals} ativas</p>
                </div>
              </div>
            </div>

            {/* Ações rápidas */}
            <div style={{ display:'flex', gap:10 }}>
              <QuickAction icon="💰" label="Finanças"  to="/financas" bg="#EBF3F2" color="#387069"/>
              <QuickAction icon="✓"  label="Tarefas"   to="/rotina"   bg="#FFF4F2" color="#C75445"/>
              <QuickAction icon="🛒" label="Compras"   to="/compras"  bg="#FDF3E1" color="#A57D29"/>
              <QuickAction icon="✨" label="Metas"     to="/metas"    bg="#E9E7F7" color="#4B44A0"/>
            </div>

            {/* Tarefas pendentes */}
            {tasks.length > 0 && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#2E3A37' }}>Tarefas pendentes</p>
                  <Link to="/rotina" style={{ fontSize:12, color:'#6BA6A0', textDecoration:'none' }}>Ver todas →</Link>
                </div>
                <div style={{ background:'#fff', borderRadius:16, padding:'4px 16px',
                  boxShadow:'0 2px 8px rgba(46,58,55,0.05)' }}>
                  {tasks.map((t,i) => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12,
                      padding:'12px 0', borderBottom: i<tasks.length-1?'1px solid #F0F2F1':'none' }}>
                      <div style={{ width:22, height:22, borderRadius:11,
                        border:'1.5px solid #E1E4E3', background:'#F0F2F1', flexShrink:0 }}/>
                      <span style={{ fontSize:13, fontWeight:500, color:'#2E3A37', flex:1 }}>{t.title}</span>
                      {t.priority==='high' && (
                        <div style={{ width:7, height:7, borderRadius:4, background:'#FF8A7A', flexShrink:0 }}/>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <div
        onClick={() => navigate('/rotina')}
        style={{
          position:'fixed', bottom:98, right:'calc(50% - 197px)',
          width:52, height:52, borderRadius:26,
          background:'#FF8A7A', boxShadow:'0 6px 16px rgba(255,138,122,0.28)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', zIndex:90,
        }}>
        <span style={{ fontSize:26, fontWeight:700, color:'#fff', lineHeight:1 }}>+</span>
      </div>

      <BottomNav />
    </div>
  )
}
