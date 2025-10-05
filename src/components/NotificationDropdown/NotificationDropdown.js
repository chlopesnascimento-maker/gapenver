import React from 'react';
import './NotificationDropdown.css';

// Componente para um item individual da lista
const NotificationItem = ({ notification, onNotificationClick }) => {
  // Função para formatar o tempo (ex: "5 min atrás", "2 h atrás")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min";
    return Math.floor(seconds) + " s";
  };

  // Lógica para gerar a mensagem da notificação (exemplo)
  // **IMPORTANTE**: Você precisará customizar isso com base nos seus 'types'
  const getNotificationMessage = (notif) => {
    const actorName = notif.data?.actor_name || 'Alguém';
    switch (notif.type) {
      case 'nova_resposta':
        return `<strong>${actorName}</strong> respondeu ao seu tópico: "${notif.data?.topic_title || ''}"`;
      case 'curtida_topico':
        return `<strong>${actorName}</strong> curtiu seu tópico.`;
      case 'curtida_resposta':
        return `<strong>${actorName}</strong> curtiu sua resposta.`;
      default:
        return 'Você tem uma nova notificação.';
    }
  };

  const message = getNotificationMessage(notification);

  return (
    <div 
      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
      onClick={() => onNotificationClick(notification)}
    >
      {!notification.is_read && <div className="unread-indicator"></div>}
      <div className="notification-content">
        <p className="notification-text" dangerouslySetInnerHTML={{ __html: message }}></p>
        <span className="notification-time">{formatTimeAgo(notification.created_at)}</span>
      </div>
    </div>
  );
};

// Componente principal do Dropdown
function NotificationDropdown({ notifications, isOpen, onNotificationClick }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notificações</h3>
      </div>
      <div className="notification-list">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <NotificationItem 
              key={notif.id} 
              notification={notif} 
              onNotificationClick={onNotificationClick}
            />
          ))
        ) : (
          <p className="no-notifications">Nenhuma notificação por aqui.</p>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;