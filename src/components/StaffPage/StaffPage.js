import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './StaffPage.css';

function StaffPage({ navigateTo }) {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data, error } = await supabase
        .from('public_staff')
        .select('id, nome, sobrenome, foto_url, cargo'); // sem filtro

      if (error) {
        console.error('Erro ao buscar staff:', error);
      } else {
        console.log('Perfis encontrados:', data);

        // 🔑 Definindo a prioridade dos cargos
        const prioridade = {
          admin: 1,
          oficialreal: 2,
          guardareal: 3
        };

        // 🔀 Ordenando staff pela prioridade
        const staffOrdenado = [...data].sort((a, b) => {
          const cargoA = prioridade[a.cargo.toLowerCase()] || 99;
          const cargoB = prioridade[b.cargo.toLowerCase()] || 99;
          return cargoA - cargoB;
        });

        setStaff(staffOrdenado);
      }
    };

    fetchStaff();
  }, []);

  return (
    <div className="staff-page">
      <h2>Equipe do Palácio</h2>
      <p>Abaixo eis a equipe que poderá lhe ajudar no palácio:</p>

      <div className="staff-list">
        {staff.map((member) => (
          <div
            key={member.id}
            className="staff-card clickable"
            onClick={() => navigateTo('userProfile', { userId: member.id })}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={member.foto_url || '/default-avatar.png'}
              alt={`${member.nome} ${member.sobrenome}`}
              className="staff-photo"
            />
            <div className="staff-info">
              <h3>{member.nome} {member.sobrenome}</h3>
              <span className={`staff-role staff-role-${member.cargo.toLowerCase()}`}>
                {member.cargo === 'admin' ? 'Administrador' :
                 member.cargo === 'oficialreal' ? 'Oficial Real' :
                 member.cargo === 'guardareal' ? 'Guarda Real' :
                 member.cargo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffPage;
