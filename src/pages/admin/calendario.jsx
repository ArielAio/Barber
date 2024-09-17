import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CalendarioConfig from '../../components/CalendarioConfig';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner'; // Importe o componente de loading

const Calendario = () => {
    const [role, setRole] = useState(null);
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Pega o documento do usuário no Firestore
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setRole(userData.role);

                    if (userData.role !== 'admin') {
                        router.push('/nao-pode'); // Redireciona se o papel não for admin
                    }
                } else {
                    console.log("Documento não encontrado.");
                }
            } else {
                router.push('/login'); // Redireciona se não estiver logado
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    if (role === null) {
        return <LoadingSpinner />; // Mostre o spinner durante o carregamento da autenticação
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl text-white font-bold mb-4 text-center">Calendário de Agendamentos</h1>
            <div className="w-full max-w-screen-lg p-4 bg-gray-900 rounded-lg shadow-lg">
                <CalendarioConfig />
            </div>
            <Link href="/" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
};

export default Calendario;
