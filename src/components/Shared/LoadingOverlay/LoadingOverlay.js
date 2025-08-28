import React from "react";
import "./LoadingOverlay.css";

function LoadingOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="book-icon">
        {/* SVG de um livrinho aberto */}
        <svg xmlns="http://www.w3.org/2000/svg" 
          width="80" height="80" viewBox="0 0 24 24" 
          fill="none" stroke="rgba(0, 225, 255, 1)" strokeWidth="2" 
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h8a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-8a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h9z"></path>
        </svg>
        <p>Carregando...</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
