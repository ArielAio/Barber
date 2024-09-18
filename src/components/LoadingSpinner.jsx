import dynamic from 'next/dynamic';

// Importa o componente apenas no cliente
const ClientOnlyLoadingSpinner = dynamic(() => import('./ClientOnlyLoadingSpinner'), { ssr: false });

const LoadingSpinner = () => {
  return <ClientOnlyLoadingSpinner />;
};

export default LoadingSpinner;
