// src/contexts/ModalContext.js
import React, { createContext, useState, useContext, useRef } from 'react';
import ConfirmacaoModal from '../components/Shared/ConfirmacaoModal/ConfirmacaoModal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    title: 'Confirmação',
  });

  const resolvePromise = useRef(null);

  const askConfirmation = (message, title) => {
    setModalState({
      isOpen: true,
      message,
      title: title || 'Confirmação',
    });
    return new Promise((resolve) => {
      resolvePromise.current = resolve;
    });
  };

  const handleConfirm = () => {
    if (resolvePromise.current) {
      resolvePromise.current(true);
    }
    setModalState({ isOpen: false, message: '', title: 'Confirmação' });
  };

  const handleCancel = () => {
    if (resolvePromise.current) {
      resolvePromise.current(false);
    }
    setModalState({ isOpen: false, message: '', title: 'Confirmação' });
  };

  return (
    <ModalContext.Provider value={{ askConfirmation }}>
      {children}
      <ConfirmacaoModal
        isOpen={modalState.isOpen}
        message={modalState.message}
        title={modalState.title}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  return useContext(ModalContext);
};