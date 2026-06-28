import { useEffect, useState } from 'react'
import { Bell, Plus, ChevronRight, Home, DollarSign, Calendar, ShoppingCart, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

// ── Bottom Navigation ──────────────────────────────────
export function BottomNav() {
  const location = useLocation()
  const path = location.pathname

  const items = [
    { icon: Home, label: 'Início',   to: '/dashboard'  },
    { icon: DollarSign, label: 'Finanças', to: '/financas' },
    { icon: Calendar, label: 'Rotina',  to: '/rotina'    },
    { icon: ShoppingCart, label: 'Compras', to: '/compras'  },
    { icon: User, label: 'Perfil',  to: '/perfil'    },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const active = path === item.to
        const Icon = item.icon
        return (
          <Link key={item.to} to={item.to} className={`nav-item ${active ? 'active' : ''}`}>
            <div className="nav-icon-wrap">
              <Icon size={active ? 19 : 22} strokeWidth={active ? 2.5 : 1.8} />
              {active && <div className="nav-dot" />}
            </div>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Greeting by time ───────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ── Avatar mini ────────────────────────────────────────
function Avatar({ name, color = 'coral', size = 44 }) {
  const initial = name?.[0]?.toUpperCase() || '?'
  const colors = {
    coral: { bg: 'var(--coral-lt)', text: 'var(--coral-dk)' },
    teal:  { bg: 'var(--teal-lt)',  text: 'var(--teal-dk)'  },
  }
  const c = colors[color]
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: c.bg, color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36,
    }}>{initial}</div>
  )
}

// ── Quick stat card ────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = 'teal' }) {
  const accents = {
    teal:   { bg: 'var(--teal-pale)',  txt: 'var(--teal)'     },
    coral:  { bg: 'var(--coral-pale)', txt: 'var(--coral-dk)' },
    amber:  { bg: 'var(--amber-lt)',   txt: 'var(--amber-dk)' },
    green:  { bg: 'var(--green-lt)',   txt: 'var(--green)'    },
  }
  const a = accents[accent]
  return (
    <div className="card" style={{ padding: '16px', flex: 1, minWidth: 0 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 18,
        background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10, fontSize: 18,
      }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--dark)' }}>{value}</div>
      <div style={{ fontSize: 11, color: a.txt, fontWeight: 600, marginTop: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--dark-lt)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Task row ───────────────────────────────────────────
function TaskRow({ task, onToggle }) {
  const priColors = { low: 'var(--green)', medium: 'var(--amber-dk)', high: 'var(--coral)' }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--neutral-lt)',
    }}>
      <button
        onClick={() => onToggle(task.id, task.status)}
        style={{
          width: 24, height: 24, borderRadius: 12, border: 'none',
          background: task.status === 'done' ? 'var(--teal)' : 'transparent',
          border: task.status === 'done' ? 'none' : '1.5px solid var(--neutral)',
          cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: task.status === 'done' ? 400 : 500,
          color: task.status === 'done' ? 'var(--dark-lt)' : 'var(--dark)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{task.title}</div>
        {task.assigned_to_name && (
          <div style={{ fontSize: 10, color: 'var(--dark-lt)', marginTop: 1 }}>
            {task.assigned_to_name}
          </div>
        )}
      </div>
      <div style={{
        width: 8, height: 8, borderRadius: 4, flexShrink: 0,
        background: priColors[task.priority] || 'var(--neutral)',
      }}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════
export function DashboardPage() {
  const { profile, household } = useAuth()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ income: 0, expense: 0, pendingTasks: 0, goals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (household?.id) loadData()
  }, [household])

  async function loadData() {
    setLoading(true)
    const hid = household.id

    // Tasks de hoje
    const today = new Date().toISOString().split('T')[0]
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*, profiles!assigned_to(name)')
      .eq('household_id', hid)
      .or(`due_date.eq.${today},due_date.is.null`)
      .order('created_at', { ascending: false })
      .limit(6)

    const tasksFormatted = (taskData || []).map(t => ({
      ...t,
      assigned_to_name: t.profiles?.name || null,
    }))
    setTasks(tasksFormatted)

    // Stats financeiros do mês
    const startMonth = new Date(); startMonth.setDate(1)
    const { data: txData } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('household_id', hid)
      .gte('date', startMonth.toISOString().split('T')[0])

    const income = (txData || []).filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0)
    const expense = (txData || []).filter(t => t.type === 'expense').reduce((s, t) => s + +t.amount, 0)

    // Goals
    const { count: goalsCount } = await supabase
      .from('goals').select('*', { count: 'exact', head: true })
      .eq('household_id', hid).eq('status', 'active')

    // Pending tasks
    const { count: pending } = await supabase
      .from('tasks').select('*', { count: 'exact', head: true })
      .eq('household_id', hid).eq('status', 'pending')

    setStats({ income, expense, pendingTasks: pending || 0, goals: goalsCount || 0 })
    setLoading(false)
  }

  async function toggleTask(id, currentStatus) {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const pendingTasks = tasks.filter(t => t.status !== 'done').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div className="page" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--teal)', padding: '56px 24px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,138,122,0.09)' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', marginBottom: 4 }}>
              {getGreeting()}, {profile?.name?.split(' ')[0]} ✦
            </p>
            <h1 style={{ color: '#fff', fontSize: 22, lineHeight: 1.3, maxWidth: 260 }}>
              Como está a casa hoje?
            </h1>
          </div>
          <button style={{
            width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={18} color="#fff" />
          </button>
        </div>

        {/* Mood badge */}
        <div style={{
          marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.16)', borderRadius: 100, padding: '8px 16px',
          width: 'fit-content',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--teal-lt)', flexShrink: 0 }}/>
          <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
            {loading ? 'Carregando...' : `${pendingTasks} tarefas pendentes · R$ ${stats.expense.toLocaleString('pt-BR', {minimumFractionDigits:2})} gastos este mês`}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <StatCard icon="💰" label="Entradas" value={`R$ ${stats.income.toLocaleString('pt-BR',{minimumFractionDigits:2})}`} sub="Este mês" accent="teal"/>
          <StatCard icon="📊" label="Gastos"   value={`R$ ${stats.expense.toLocaleString('pt-BR',{minimumFractionDigits:2})}`} sub="Este mês" accent="coral"/>
          <StatCard icon="✓"  label="Tarefas"  value={stats.pendingTasks} sub="Pendentes" accent="amber"/>
          <StatCard icon="✨" label="Metas"    value={stats.goals} sub="Ativas" accent="green"/>
        </div>

        {/* Saldo card */}
        <div className="card" style={{ background: 'var(--dark)', padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Saldo disponível</p>
              <h2 style={{ color: '#fff', fontSize: 28 }}>
                R$ {(stats.income - stats.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Nossa casa</p>
              {household && (
                <p style={{ fontSize: 12, color: 'var(--teal-lt)', fontWeight: 500 }}>{household.name}</p>
              )}
            </div>
          </div>
          {/* Barra contribuição */}
          <div style={{ marginTop: 14 }}>
            <div className="progress-bar" style={{ height: 5, background: 'rgba(255,255,255,0.12)' }}>
              <div className="progress-bar-fill" style={{ width: '54%', background: 'var(--coral)' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: 'var(--coral-lt)' }}>Você 54%</span>
              <span style={{ fontSize: 10, color: 'var(--teal-lt)' }}>Parceiro 46%</span>
            </div>
          </div>
        </div>

        {/* Tarefas do dia */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ color: 'var(--dark)' }}>Tarefas de hoje</h4>
            <Link to="/rotina" style={{ color: 'var(--teal)', fontSize: 12, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              Ver todas <ChevronRight size={14}/>
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12 }}/>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✨</p>
              <p style={{ color: 'var(--dark-mid)', fontSize: 14 }}>Nenhuma tarefa para hoje.</p>
              <p style={{ color: 'var(--dark-lt)', fontSize: 12, marginTop: 4 }}>Que dia tranquilo!</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '4px 16px' }}>
              {tasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} />
              ))}
              {tasks.length > 0 && (
                <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--dark-lt)' }}>{doneTasks} de {tasks.length} concluídas</span>
                  <div className="progress-bar" style={{ width: 80 }}>
                    <div className="progress-bar-fill" style={{
                      width: `${tasks.length ? (doneTasks/tasks.length)*100 : 0}%`,
                      background: 'var(--teal)'
                    }}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h4 style={{ color: 'var(--dark)', marginBottom: 12 }}>Acesso rápido</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { icon: '💳', label: 'Finanças', to: '/financas', bg: 'var(--teal-pale)', color: 'var(--teal-dk)' },
              { icon: '✓',  label: 'Tarefas',  to: '/rotina',   bg: 'var(--coral-pale)', color: 'var(--coral-dk)' },
              { icon: '🛒', label: 'Compras',  to: '/compras',  bg: 'var(--amber-lt)',   color: 'var(--amber-dk)' },
              { icon: '✨', label: 'Metas',    to: '/metas',    bg: 'var(--lav-lt)',     color: 'var(--lavender)' },
            ].map(item => (
              <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: item.bg, borderRadius: 16, padding: '12px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: item.color }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* FAB */}
      <Link to="/rotina/nova-tarefa" style={{
        position: 'fixed', bottom: 98, right: 'calc(50% - 210px)',
        width: 52, height: 52, borderRadius: 26,
        background: 'var(--coral)', boxShadow: 'var(--shadow-coral)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', zIndex: 90,
      }}>
        <Plus size={24} color="#fff" strokeWidth={2.5}/>
      </Link>

      <BottomNav />
    </div>
  )
}
