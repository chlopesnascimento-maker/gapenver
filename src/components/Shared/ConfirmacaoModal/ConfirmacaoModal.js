// src/components/Shared/ConfirmacaoModal/ConfirmacaoModal.js
import React from 'react';
import './ConfirmacaoModal.css';

function ConfirmacaoModal({ isOpen, message, onConfirm, onCancel, title = "Confirmação" }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-modal-title">{title}</h2>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="cancel-button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmacaoModal;