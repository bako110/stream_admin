import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  title, message, confirmLabel = 'Confirmer', onConfirm, onCancel, danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex gap-3 mb-6">
        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
