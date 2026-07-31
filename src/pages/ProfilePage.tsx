import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Switch } from '../components/ui/Switch'
import { BottomNav } from '../components/layout/BottomNav'
import { disablePushNotifications, enablePushNotifications, getPushSubscriptionState } from '../lib/pushNotifications'
import {
  auth,
  ApiError,
  account,
  accountSettings,
  goals as goalsApi,
  household as householdApi,
  dependents as dependentsApi,
  type Member,
  type Goal,
  type Dependent,
} from '../lib/api'
import { resizeImageToAvatar } from '../lib/resizeImage'
import { formatBRL } from '../lib/currency'
import { useSession } from '../store/session'
import { toast, toastError } from '../store/toast'

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const household = useSession((s) => s.household)
  const setUser = useSession((s) => s.setUser)
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?'

  const setHousehold = useSession((s) => s.setHousehold)
  const [members, setMembers] = useState<Member[]>([])
  const [dependentsList, setDependentsList] = useState<Dependent[]>([])
  const [confirmDependentId, setConfirmDependentId] = useState<string | null>(null)
  const [confirmMemberId, setConfirmMemberId] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState(false)
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null)
  const [actionsMember, setActionsMember] = useState<Member | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [resetPasswordMember, setResetPasswordMember] = useState<Member | null>(null)
  const [resetPasswordDraft, setResetPasswordDraft] = useState({ next: '', confirm: '' })
  const [resettingMemberPassword, setResettingMemberPassword] = useState(false)
  const [editingWhatsapp, setEditingWhatsapp] = useState(false)
  const [whatsappDraft, setWhatsappDraft] = useState('')
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [editMemberWhatsapp, setEditMemberWhatsapp] = useState<Member | null>(null)
  const [memberWhatsappDraft, setMemberWhatsappDraft] = useState('')
  const [savingMemberWhatsapp, setSavingMemberWhatsapp] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [goalDraft, setGoalDraft] = useState({ target: '', saved: '' })
  const [savingGoal, setSavingGoal] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [showRegenerateCode, setShowRegenerateCode] = useState(false)
  const [regeneratingCode, setRegeneratingCode] = useState(false)
  const [pushState, setPushState] = useState<'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'>(
    'loading',
  )
  const [pushBusy, setPushBusy] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const isOwner = members.find((m) => m.id === user?.id)?.role === 'owner'

  useEffect(() => {
    getPushSubscriptionState().then(setPushState).catch(() => setPushState('unsupported'))
  }, [])

  async function handleTogglePush() {
    setPushBusy(true)
    try {
      if (pushState === 'subscribed') {
        await disablePushNotifications()
        setPushState('unsubscribed')
        toast('Notificações desativadas.')
      } else {
        await enablePushNotifications()
        setPushState('subscribed')
        toast('Notificações ativadas!')
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível atualizar as notificações.')
      setPushState(await getPushSubscriptionState().catch(() => 'unsubscribed'))
    } finally {
      setPushBusy(false)
    }
  }

  useEffect(() => {
    if (household) {
      Promise.allSettled([
        householdApi.members().then((r) => setMembers(r.members)),
        goalsApi.list().then((r) => setGoals(r.goals)),
        dependentsApi.list().then((r) => setDependentsList(r.dependents)),
      ]).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [household])

  function loadGoals() {
    goalsApi.list().then((r) => setGoals(r.goals)).catch(() => {})
  }

  function openGoal(goal: Goal) {
    setEditingGoal(goal)
    setGoalDraft({
      target: goal.target_amount ? String(goal.target_amount) : '',
      saved: String(goal.saved_amount),
    })
  }

  async function saveGoalProgress() {
    if (!editingGoal) return
    setSavingGoal(true)
    try {
      await goalsApi.update(editingGoal.id, {
        targetAmount: goalDraft.target.trim() ? Number(goalDraft.target) : null,
        savedAmount: Number(goalDraft.saved) || 0,
      })
      setEditingGoal(null)
      loadGoals()
      toast('Meta atualizada!')
    } catch {
      toastError('Não foi possível atualizar a meta.')
    } finally {
      setSavingGoal(false)
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toastError('Escolha um arquivo de imagem.')
      return
    }

    setUploadingAvatar(true)
    try {
      const dataUri = await resizeImageToAvatar(file)
      await accountSettings.setAvatar(dataUri)
      setUser(user ? { ...user, avatarUrl: dataUri } : user)
      toast('Foto de perfil atualizada!')
    } catch {
      toastError('Não foi possível atualizar sua foto.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true)
    try {
      await accountSettings.setAvatar(null)
      setUser(user ? { ...user, avatarUrl: null } : user)
      toast('Foto removida.')
    } catch {
      toastError('Não foi possível remover a foto.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleResendVerification() {
    setResendingVerification(true)
    try {
      await auth.resendVerification()
      toast('Enviamos um novo link de confirmação para o seu email.')
    } catch {
      toastError('Não foi possível enviar o email agora. Tente de novo em instantes.')
    } finally {
      setResendingVerification(false)
    }
  }

  async function handleRegenerateCode() {
    if (!household) return
    setRegeneratingCode(true)
    try {
      const { inviteCode } = await householdApi.regenerateCode()
      setHousehold({ ...household, inviteCode })
      setShowRegenerateCode(false)
      toast('Novo código gerado! O código antigo parou de funcionar.')
    } catch {
      toastError('Não foi possível gerar um novo código agora.')
    } finally {
      setRegeneratingCode(false)
    }
  }

  async function confirmRemoveDependent() {
    if (!confirmDependentId) return
    const id = confirmDependentId
    setConfirmDependentId(null)
    setDependentsList((prev) => prev.filter((d) => d.id !== id))
    try {
      await dependentsApi.remove(id)
      toast('Dependente removido.')
    } catch {
      toastError('Não foi possível remover o dependente.')
      dependentsApi.list().then((r) => setDependentsList(r.dependents)).catch(() => {})
    }
  }

  async function handleChangePassword() {
    if (passwordDraft.next.length < 6) {
      toastError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (passwordDraft.next !== passwordDraft.confirm) {
      toastError('A confirmação não bate com a nova senha.')
      return
    }
    setChangingPassword(true)
    try {
      await auth.changePassword(passwordDraft.current, passwordDraft.next)
      setShowChangePassword(false)
      setPasswordDraft({ current: '', next: '', confirm: '' })
      toast('Senha alterada!')
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível alterar a senha.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleResetMemberPassword() {
    if (!resetPasswordMember) return
    if (resetPasswordDraft.next.length < 6) {
      toastError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (resetPasswordDraft.next !== resetPasswordDraft.confirm) {
      toastError('A confirmação não bate com a nova senha.')
      return
    }
    setResettingMemberPassword(true)
    try {
      await householdApi.resetMemberPassword(resetPasswordMember.id, resetPasswordDraft.next)
      toast(`Senha de ${resetPasswordMember.name.split(' ')[0]} atualizada! Avise ela por fora do app.`)
      setResetPasswordMember(null)
      setResetPasswordDraft({ next: '', confirm: '' })
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível resetar a senha.')
    } finally {
      setResettingMemberPassword(false)
    }
  }

  function startEditWhatsapp() {
    setWhatsappDraft(user?.whatsappNumber ?? '')
    setEditingWhatsapp(true)
  }

  async function handleSaveWhatsapp() {
    setSavingWhatsapp(true)
    try {
      await account.updateWhatsapp(whatsappDraft.trim() || null)
      setUser(user ? { ...user, whatsappNumber: whatsappDraft.trim() || null } : user)
      setEditingWhatsapp(false)
      toast('WhatsApp atualizado!')
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível salvar o WhatsApp.')
    } finally {
      setSavingWhatsapp(false)
    }
  }

  function openEditMemberWhatsapp(member: Member) {
    setActionsMember(null)
    setMemberWhatsappDraft(member.whatsapp_number ?? '')
    setEditMemberWhatsapp(member)
  }

  async function handleSaveMemberWhatsapp() {
    if (!editMemberWhatsapp) return
    setSavingMemberWhatsapp(true)
    try {
      await householdApi.updateMemberWhatsapp(editMemberWhatsapp.id, memberWhatsappDraft.trim() || null)
      setMembers((prev) =>
        prev.map((m) => (m.id === editMemberWhatsapp.id ? { ...m, whatsapp_number: memberWhatsappDraft.trim() || null } : m)),
      )
      toast('WhatsApp atualizado!')
      setEditMemberWhatsapp(null)
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível salvar o WhatsApp.')
    } finally {
      setSavingMemberWhatsapp(false)
    }
  }

  async function handleToggleViewer(memberId: string, currentRole: string) {
    const nextRole = currentRole === 'viewer' ? 'member' : 'viewer'
    setTogglingRoleId(memberId)
    try {
      await householdApi.setRole(memberId, nextRole)
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m)))
      toast(nextRole === 'viewer' ? 'Agora essa pessoa só pode visualizar.' : 'Acesso de edição liberado.')
    } catch {
      toastError('Não foi possível mudar o papel dessa pessoa.')
    } finally {
      setTogglingRoleId(null)
    }
  }

  async function confirmRemoveMember() {
    if (!confirmMemberId) return
    setRemovingMember(true)
    try {
      await householdApi.removeMember(confirmMemberId)
      setMembers((prev) => prev.filter((m) => m.id !== confirmMemberId))
      toast('Pessoa removida da casa.')
    } catch {
      toastError('Não foi possível remover essa pessoa.')
    } finally {
      setRemovingMember(false)
      setConfirmMemberId(null)
    }
  }

  async function handleLogout() {
    await auth.logout().catch(() => {})
    setUser(null)
    navigate('/login')
  }

  async function handleLeaveHousehold() {
    setLeaving(true)
    setLeaveError('')
    try {
      await householdApi.leave()
      setHousehold(null)
      navigate('/entrar')
    } catch {
      setLeaveError('Você é a única pessoa nessa casa — convide alguém antes ou exclua a conta.')
    } finally {
      setLeaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await account.delete()
      setUser(null)
      navigate('/bem-vindo')
    } finally {
      setDeleting(false)
    }
  }

  function startEditName() {
    setNameDraft(household?.name ?? '')
    setEditingName(true)
  }

  async function saveName() {
    if (!nameDraft.trim() || !household) return
    setSavingName(true)
    try {
      await householdApi.rename(nameDraft.trim())
      setHousehold({ ...household, name: nameDraft.trim() })
      setEditingName(false)
      toast('Nome da casa atualizado!')
    } catch {
      toastError('Não foi possível renomear a casa.')
    } finally {
      setSavingName(false)
    }
  }

  return (
    <Screen scroll className="bg-app-bg">
      <AuraBackground auras={[{ color: 'teal', size: 220, top: -60, right: -60 }]} />
      <Header title="Perfil" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-28">
        <Card className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Alterar foto de perfil"
            className="relative flex size-14 shrink-0 items-center justify-center"
          >
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-coral-300 text-xl font-bold text-coral-ink">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initial
              )}
              {uploadingAvatar && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-xs text-white">
                  ...
                </span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-ink text-xs shadow-sm">
              ✏️
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div>
            <p className="text-base font-semibold text-forest-900">{user?.name ?? 'Sua conta'}</p>
            <p className="text-xs text-forest-500">{user?.email}</p>
            {user?.avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="mt-1 text-xs font-medium text-error"
              >
                Remover foto
              </button>
            )}
          </div>
        </Card>

        {user && !user.emailVerified && (
          <Card className="flex items-center gap-3 border-amber-500 bg-amber-50">
            <span className="text-lg">✉️</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink">Confirme seu email</p>
              <p className="text-xs text-amber-700">Assim garantimos que os resumos e lembretes cheguem certinho.</p>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="flex min-h-[32px] shrink-0 items-center text-xs font-semibold text-[#387069]"
            >
              {resendingVerification ? '...' : 'Reenviar'}
            </button>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Meus dados</p>
          {editingWhatsapp ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="tel"
                placeholder="Ex: 11999998888"
                value={whatsappDraft}
                onChange={(e) => setWhatsappDraft(e.target.value)}
                className="min-h-[32px] flex-1 rounded-lg border-[1.5px] border-teal-500 px-2 text-sm outline-none"
              />
              <button
                onClick={handleSaveWhatsapp}
                disabled={savingWhatsapp}
                className="flex min-h-[32px] items-center text-xs font-semibold text-teal-700"
              >
                Salvar
              </button>
              <button
                onClick={() => setEditingWhatsapp(false)}
                className="flex min-h-[32px] items-center text-xs font-medium text-forest-500"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={startEditWhatsapp} className="flex items-center justify-between text-left text-sm">
              <span className="text-forest-500">WhatsApp</span>
              <span className="flex items-center gap-1.5 font-medium text-forest-900">
                {user?.whatsappNumber || 'Não informado'}
                <span className="text-xs text-forest-300">✏️</span>
              </span>
            </button>
          )}
          <Row label="Como usa o app" value={user?.usageType ?? '—'} />
          <button
            onClick={() => {
              setPasswordDraft({ current: '', next: '', confirm: '' })
              setShowChangePassword(true)
            }}
            className="flex min-h-[32px] items-center text-left text-sm font-semibold text-teal-700"
          >
            🔒 Alterar senha
          </button>
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Aparência</p>
          <ThemeToggle />
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Notificações</p>
          {pushState === 'unsupported' ? (
            <p className="text-sm text-forest-600">
              Notificações push não são compatíveis com este navegador/dispositivo. Se estiver no iPhone, adicione o
              app à tela de início e tente novamente por lá.
            </p>
          ) : pushState === 'denied' ? (
            <p className="text-sm text-forest-600">
              As notificações estão bloqueadas nas permissões do navegador. Ative-as nas configurações do site para
              receber avisos de contas e tarefas.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-forest-600">Avisos de contas a vencer e tarefas do dia neste dispositivo.</p>
              <Switch
                checked={pushState === 'subscribed'}
                disabled={pushBusy || pushState === 'loading'}
                onChange={handleTogglePush}
                label="Notificações push"
              />
            </div>
          )}
        </Card>

        {household && (
          <Card className="flex flex-col gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="min-h-[32px] flex-1 rounded-lg border-[1.5px] border-teal-500 px-2 text-xs font-semibold uppercase tracking-wide text-forest-700 outline-none"
                />
                <button
                  onClick={saveName}
                  disabled={savingName || !nameDraft.trim()}
                  className="flex min-h-[32px] items-center text-xs font-semibold text-teal-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="flex min-h-[32px] items-center text-xs font-medium text-forest-500"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={startEditName} className="flex min-h-[32px] items-center gap-1.5 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-forest-500">{household.name}</span>
                <span className="text-xs text-forest-300">✏️</span>
              </button>
            )}

            {loading ? (
              <p className="text-xs text-forest-500">Carregando membros...</p>
            ) : (
              (members.length > 0 || dependentsList.length > 0) && (
                <div className="flex flex-col gap-2">
                  {isOwner && members.length > 1 && (
                    <p className="text-xs text-forest-500">
                      Somente leitura: a pessoa vê tudo, mas não pode criar, editar ou excluir nada.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 py-1 pl-2.5 pr-1 text-xs font-medium text-forest-700"
                      >
                        {m.name.split(' ')[0]}
                        {m.role === 'owner' && <span className="text-xs text-forest-500">· dono(a)</span>}
                        {m.role === 'viewer' && <span className="text-xs text-forest-500">· somente leitura</span>}
                        {isOwner && m.id !== user?.id && (
                          <button
                            onClick={() => setActionsMember(m)}
                            aria-label={`Mais opções para ${m.name}`}
                            className="flex size-6 shrink-0 items-center justify-center rounded-full text-forest-400 hover:bg-forest-100 hover:text-forest-700"
                          >
                            ⋮
                          </button>
                        )}
                      </span>
                    ))}
                    {dependentsList.map((d) => (
                      <span
                        key={d.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900"
                      >
                        {d.icon} {d.name}
                        <button onClick={() => setConfirmDependentId(d.id)} aria-label={`Remover ${d.name}`} className="text-amber-700">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}

            <Row label="Código de convite" value={household.inviteCode} />
            {isOwner && (
              <button
                onClick={() => setShowRegenerateCode(true)}
                className="flex min-h-[36px] items-center justify-center rounded-full border-[1.5px] border-forest-200 px-3 text-xs font-medium text-forest-700"
              >
                🔄 Gerar novo código (invalida o atual)
              </button>
            )}
            <button
              onClick={() => navigate('/convidar')}
              className="flex min-h-[32px] items-center text-left text-sm font-semibold text-teal-700"
            >
              Convidar mais alguém →
            </button>
            <button
              onClick={() => navigate('/config-rotina?edit=1')}
              className="flex min-h-[32px] items-center text-left text-sm font-semibold text-teal-700"
            >
              Editar rotina da casa (filhos, pets, moradia) →
            </button>
            {members.length > 1 && (
              <button
                onClick={handleLeaveHousehold}
                disabled={leaving}
                className="flex min-h-[32px] items-center text-left text-sm font-semibold text-error"
              >
                Sair desta casa
              </button>
            )}
            {leaveError && <p className="text-xs text-error">{leaveError}</p>}
          </Card>
        )}

        {goals.length > 0 && (
          <Card className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Seus objetivos</p>
            <div className="flex flex-col gap-2.5">
              {goals.map((g) => {
                const pct = g.target_amount ? Math.min((g.saved_amount / g.target_amount) * 100, 100) : null
                return (
                  <button
                    key={g.id}
                    onClick={() => openGoal(g)}
                    className="flex flex-col gap-1.5 rounded-sm border-[1.5px] border-forest-100 p-2.5 text-left"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-900">
                      {g.icon} {g.title}
                    </span>
                    {pct !== null ? (
                      <>
                        <div className="h-1.5 overflow-hidden rounded-full bg-forest-100">
                          <div className="h-full rounded-full bg-amber-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-forest-500">
                          R$ {formatBRL(g.saved_amount)} de R$ {formatBRL(g.target_amount!)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-teal-700">Toque para definir uma meta de valor →</span>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        <Button variant="secondary" onClick={handleLogout}>
          Sair da conta
        </Button>

        <button
          onClick={() => setShowDelete(true)}
          className="flex min-h-[32px] items-center justify-center text-center text-sm font-medium text-error"
        >
          Excluir minha conta
        </button>
      </div>

      <Modal open={editingGoal !== null} onClose={() => setEditingGoal(null)} title={editingGoal?.title ?? 'Meta'}>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-forest-700">
            Valor da meta (R$)
            <input
              type="number"
              min="0"
              value={goalDraft.target}
              onChange={(e) => setGoalDraft((d) => ({ ...d, target: e.target.value }))}
              className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-forest-700">
            Quanto já guardaram (R$)
            <input
              type="number"
              min="0"
              value={goalDraft.saved}
              onChange={(e) => setGoalDraft((d) => ({ ...d, saved: e.target.value }))}
              className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <Button loading={savingGoal} onClick={saveGoalProgress}>
            Salvar
          </Button>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Excluir conta">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-[1.5] text-forest-700">
            Essa ação é <strong>permanente</strong>. Se você for a única pessoa na casa, todos os dados (finanças,
            tarefas, lista de compras) serão apagados também. Digite <strong>excluir</strong> para confirmar.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="excluir"
            className="rounded-xl border-[1.5px] border-forest-100 px-3 py-2 text-sm outline-none focus:border-error"
          />
          <Button
            variant="danger"
            loading={deleting}
            disabled={confirmText.trim().toLowerCase() !== 'excluir'}
            onClick={handleDelete}
          >
            Excluir minha conta definitivamente
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={showRegenerateCode}
        title="Gerar novo código"
        message="Isso cria um novo código de convite e o atual para de funcionar imediatamente, mesmo pra quem já tinha recebido. Continuar?"
        confirmLabel={regeneratingCode ? 'Gerando...' : 'Gerar novo código'}
        onCancel={() => setShowRegenerateCode(false)}
        onConfirm={handleRegenerateCode}
      />

      <ConfirmModal
        open={confirmDependentId !== null}
        title="Remover dependente"
        message="As tarefas atribuídas a essa pessoa ficam sem responsável. Continuar?"
        onCancel={() => setConfirmDependentId(null)}
        onConfirm={confirmRemoveDependent}
      />

      <Modal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Alterar senha"
      >
        <div className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Senha atual"
            value={passwordDraft.current}
            onChange={(e) => setPasswordDraft((d) => ({ ...d, current: e.target.value }))}
            autoComplete="current-password"
          />
          <Input
            type="password"
            placeholder="Nova senha (mínimo 6 caracteres)"
            value={passwordDraft.next}
            onChange={(e) => setPasswordDraft((d) => ({ ...d, next: e.target.value }))}
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Confirme a nova senha"
            value={passwordDraft.confirm}
            onChange={(e) => setPasswordDraft((d) => ({ ...d, confirm: e.target.value }))}
            autoComplete="new-password"
          />
          {passwordDraft.confirm && passwordDraft.next !== passwordDraft.confirm && (
            <p className="text-xs text-error">As senhas não coincidem.</p>
          )}
          <Button
            loading={changingPassword}
            disabled={!passwordDraft.current || passwordDraft.next.length < 6}
            onClick={handleChangePassword}
          >
            Salvar nova senha
          </Button>
        </div>
      </Modal>

      <Modal
        open={resetPasswordMember !== null}
        onClose={() => setResetPasswordMember(null)}
        title={`Resetar senha de ${resetPasswordMember?.name.split(' ')[0] ?? ''}`}
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-forest-500">
            Defina uma senha nova para {resetPasswordMember?.name.split(' ')[0]} e avise ela pessoalmente ou por
            WhatsApp — o app não envia essa senha automaticamente.
          </p>
          <Input
            type="password"
            placeholder="Nova senha (mínimo 6 caracteres)"
            value={resetPasswordDraft.next}
            onChange={(e) => setResetPasswordDraft((d) => ({ ...d, next: e.target.value }))}
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Confirme a nova senha"
            value={resetPasswordDraft.confirm}
            onChange={(e) => setResetPasswordDraft((d) => ({ ...d, confirm: e.target.value }))}
            autoComplete="new-password"
          />
          {resetPasswordDraft.confirm && resetPasswordDraft.next !== resetPasswordDraft.confirm && (
            <p className="text-xs text-error">As senhas não coincidem.</p>
          )}
          <Button
            loading={resettingMemberPassword}
            disabled={resetPasswordDraft.next.length < 6}
            onClick={handleResetMemberPassword}
          >
            Salvar nova senha
          </Button>
        </div>
      </Modal>

      <Modal open={actionsMember !== null} onClose={() => setActionsMember(null)} title={actionsMember?.name ?? 'Pessoa'}>
        {actionsMember && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                handleToggleViewer(actionsMember.id, actionsMember.role)
                setActionsMember(null)
              }}
              disabled={togglingRoleId === actionsMember.id}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              {actionsMember.role === 'viewer' ? (
                <>✏️ Dar acesso de edição</>
              ) : (
                <>👁️ Deixar somente leitura</>
              )}
            </button>
            <p className="px-2 text-xs text-forest-500">
              {actionsMember.role === 'viewer'
                ? 'Hoje essa pessoa só pode visualizar. Ao liberar, ela passa a criar, editar e excluir normalmente.'
                : 'Somente leitura: a pessoa continua vendo tudo, mas não pode criar, editar ou excluir nada.'}
            </p>
            <button
              onClick={() => {
                setResetPasswordMember(actionsMember)
                setResetPasswordDraft({ next: '', confirm: '' })
                setActionsMember(null)
              }}
              className="mt-2 flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              🔑 Resetar senha
            </button>
            <p className="px-2 text-xs text-forest-500">
              Útil se essa pessoa esqueceu a senha e o email de recuperação não chega — defina uma senha nova aqui e
              avise ela por fora do app.
            </p>
            <button
              onClick={() => openEditMemberWhatsapp(actionsMember)}
              className="mt-2 flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              📱 Editar WhatsApp
            </button>
            <p className="px-2 text-xs text-forest-500">
              {actionsMember.whatsapp_number || 'Não informado'} — usado nos links de aviso do app.
            </p>
            <button
              onClick={() => {
                setConfirmMemberId(actionsMember.id)
                setActionsMember(null)
              }}
              className="mt-2 flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-coral-50"
            >
              ✕ Remover da casa
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={editMemberWhatsapp !== null}
        onClose={() => setEditMemberWhatsapp(null)}
        title={`WhatsApp de ${editMemberWhatsapp?.name.split(' ')[0] ?? ''}`}
      >
        <div className="flex flex-col gap-3">
          <Input
            type="tel"
            placeholder="Ex: 11999998888"
            value={memberWhatsappDraft}
            onChange={(e) => setMemberWhatsappDraft(e.target.value)}
          />
          <Button loading={savingMemberWhatsapp} onClick={handleSaveMemberWhatsapp}>
            Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmMemberId !== null}
        title="Remover pessoa da casa"
        message="Essa pessoa perde acesso à casa compartilhada, mas a conta dela continua existindo. Continuar?"
        confirmLabel={removingMember ? 'Removendo...' : 'Remover'}
        onCancel={() => setConfirmMemberId(null)}
        onConfirm={confirmRemoveMember}
      />

      <BottomNav />
    </Screen>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-forest-500">{label}</span>
      <span className="font-medium text-forest-900">{value}</span>
    </div>
  )
}
