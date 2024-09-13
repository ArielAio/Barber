// components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = () => {
  const spinnerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'black', // Cor de fundo
  };

  const spinnerCircleStyle = {
    border: '8px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    borderTop: '8px solid #00BFFF', // Cor do spinner
    width: '80px',
    height: '80px',
    animation: 'spin 1.5s linear infinite',
  };

  // Adicionar animação ao estilo em linha não é suportado diretamente,
  // então vamos usar uma tag <style> dentro do JSX
  const styleSheet = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={spinnerStyle}>
      <div style={spinnerCircleStyle}>
        <style>{styleSheet}</style>
      </div>
    </div>
  );
};

export default LoadingSpinner;
