import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '../icons'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="animate-sheet-up relative z-10 w-full max-w-md rounded-t-[28px] bg-surface p-5 shadow-2xl lg:rounded-[28px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-muted transition-transform duration-150 active:scale-90"
          >
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
