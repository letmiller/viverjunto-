import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-[1.5] text-forest-700">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
