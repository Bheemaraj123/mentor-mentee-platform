import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmProps {
  open: boolean;
  title?: string;
  message?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirm({
  open,
  title = 'Delete report',
  message,
  isPending = false,
  onClose,
  onConfirm,
}: DeleteConfirmProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="preview-topbar" style={{ padding: '18px 22px 14px' }}>
          <div>
            <span className="section-kicker">Danger zone</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px' }}>{title}</h2>
          </div>
          <button
            className="icon-button modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={isPending}
          >
            <X size={18} />
          </button>
        </div>

        <div className="report-preview-layout" style={{ padding: '8px 22px 22px' }}>
          <div className="report-document" style={{ padding: 0 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                className="modal-icon"
                style={{ margin: 0 }}
              >
                <AlertTriangle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: '#64758d', fontSize: '13px', lineHeight: 1.6 }}>
                  {message ||
                    'This action cannot be undone. The report and all of its versions will be permanently deleted from the database.'}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '18px',
              }}
            >
              <button
                className="secondary-button"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                style={{ background: '#d66f61' }}
                onClick={onConfirm}
                disabled={isPending}
              >
                <Trash2 size={15} />{' '}
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}