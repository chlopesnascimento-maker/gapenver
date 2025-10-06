import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

function ContextMenu({ options, position, onClose }) {
  const menuRef = useRef(null);

  // Efeito para fechar o menu se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
    >
      <ul>
        {options.map((option, index) => (
          <li key={index} onClick={option.action} className={option.className || ''}>
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextMenu;