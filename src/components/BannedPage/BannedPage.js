// src/components/BannedPage/BannedPage.js
import React from 'react';
import './BannedPage.css';

function BannedPage() {
  return (
    <div className="banned-page-container">
      <div className="banned-card">
        <h1 className="banned-title">Acesso Restrito</h1>
        <p className="banned-message">
          Ops, os sentinelas do reino não lhe concederam passagem.
        </p>
        <p className="banned-support">
          Entre em contato com o suporte para mais informações.
        </p>
      </div>
    </div>
  );
}

export default BannedPage;