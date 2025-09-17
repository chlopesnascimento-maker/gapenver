import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './MoverTopicoModal.css';

const categorias = ['Personagens', 'Mundo', 'Geral', 'Regras',];

function MoverTopicoModal({ isOpen, onClose, topico, onMoveSuccess }) {
  const [newCategory, setNewCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (topico) {
      setNewCategory(topico.categoria);
      setIsPrivate(topico.apenas_staff);
    }
  }, [topico]);

  const handleMoveTopic = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke('moderate-content', {
      body: {
        action: 'move_topic',
        targetId: topico.id,
        payload: { newCategory, isPrivate }
      },
    });

    setLoading(false);
    if (error) {
      alert(`Erro ao mover tópico: ${error.message || error}`);
    } else {
      alert('Tópico movido com sucesso!');
      onMoveSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Mover Tópico</h2>
        <p>Mover o tópico: <strong>"{topico.titulo}"</strong></p>

        <div className="form-group">
          <label htmlFor="category-select">Nova Categoria:</label>
          <select id="category-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="form-group-checkbox">
          <input type="checkbox" id="private-check" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <label htmlFor="private-check">Mover para a Sala da Staff (Tornar Privado)</label>
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="save-button" onClick={handleMoveTopic} disabled={loading}>
            {loading ? 'Movendo...' : 'Confirmar Movimentação'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoverTopicoModal;