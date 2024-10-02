import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AdminHeader from '../components/AdminHeader';
import UserHeader from '../components/UserHeader';
import '@/styles/globals.css';
import LoadingSpinner from '@/components/LoadingSpinner';

// Importe as instâncias do Firebase
import { auth, db } from '../lib/firebase';

export default function App({ Component, pageProps }: AppProps) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            console.log('Documento do usuário não encontrado.');
            setRole(null);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Define as rotas onde o Header não deve ser exibido
  const noHeaderRoutes = ['/login', '/register', '/ResetPassword'];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      {!noHeaderRoutes.includes(router.pathname) && (
        role === 'admin' ? <AdminHeader /> : <UserHeader />
      )}
      <div className={noHeaderRoutes.includes(router.pathname) ? '' : 'pt-16'}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
