import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';

const Conta = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async (user) => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log('Documento do usuário não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } finally {
        setLoading(false); // Garante que o loading seja desativado após a tentativa de buscar dados
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        router.push('/login'); // Redireciona se não estiver logado
        setLoading(false); // Garante que o loading seja desativado mesmo se o usuário não estiver logado
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential); // Reautentica o usuário

        await updatePassword(user, newPassword);
        alert('Senha alterada com sucesso!');
        setNewPassword('');
        setCurrentPassword('');
        setError('');
        setShowChangePassword(false); // Oculta o formulário após a alteração da senha
      }
    } catch (error) {
      console.error('Erro ao alterar a senha:', error);
      setError('Erro ao alterar a senha. Tente novamente.');
    }
  };

  const handleResetPassword = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendPasswordResetEmail(auth, user.email);
        alert('Email de redefinição de senha enviado.');
      }
    } catch (error) {
      console.error('Erro ao enviar email de redefinição de senha:', error);
      setError('Erro ao enviar email de redefinição de senha. Tente novamente.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      {userData ? (
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6">Minha Conta</h1>
          <p><strong>Nome de usuário:</strong> {userData.username || 'Não informado'}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          
          <div className="mt-6">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {showChangePassword ? 'Cancelar Alterar Senha' : 'Alterar Senha'}
            </button>

            {showChangePassword && (
              <div className="mt-4">
                <input
                  type="password"
                  placeholder="Senha Atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <input
                  type="password"
                  placeholder="Nova Senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                  onClick={handleChangePassword}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Alterar Senha
                </button>
                <button
                  onClick={handleResetPassword}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Enviar Email para Redefinição de Senha
                </button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Nenhum dado do usuário encontrado.</p>
      )}
    </div>
  );
};

export default Conta;
