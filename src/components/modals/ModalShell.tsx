import type { ReactNode } from 'react';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  modalClassName: string;
  children: ReactNode;
}

export default function ModalShell({ title, onClose, modalClassName, children }: ModalShellProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={modalClassName} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
