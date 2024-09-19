import React, { useEffect, useState } from 'react';
import { ring } from 'ldrs';

// Registra o componente l-ring do ldrs
ring.register();

const ClientOnlyLoadingSpinner = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Não renderiza nada no servidor
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <l-ring
        size="60"
        stroke="5"
        bg-opacity="0"
        speed="2"
        color="white"
      ></l-ring>
    </div>
  );
};

export default ClientOnlyLoadingSpinner;
