// pages/_app.js
import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import AdminHeader from '../components/AdminHeader';
import UserHeader from '../components/UserHeader';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        } else {
          console.log('Documento do usuário não encontrado.');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  // Define as rotas onde o Header não deve ser exibido
  const noHeaderRoutes = ['/login', '/register'];

  if (loading) {
    return <div>Loading...</div>; // Ou um spinner de carregamento
  }

  return (
    <div className="min-h-screen">
      {/* Renderiza o Header somente se não estiver em uma das rotas específicas */}
      {!noHeaderRoutes.includes(router.pathname) && (
        role === 'admin' ? <AdminHeader /> : <UserHeader />
      )}
      
      {/* Adiciona padding-top apenas se o Header estiver presente */}
      <div className={noHeaderRoutes.includes(router.pathname) ? '' : 'pt-16'}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
