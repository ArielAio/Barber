import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
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

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      // Confirmação da exclusão da conta
      const confirmDelete = window.confirm('Tem certeza que deseja excluir sua conta? Esse processo é irreversível.');

      if (confirmDelete) {
        try {
          // Deletar o documento do Firestore
          await deleteDoc(doc(db, 'users', uid));
          console.log('Usuário deletado do Firestore');

          // Deletar o usuário do Firebase Authentication
          await deleteUser(user);
          console.log('Usuário deletado do Firebase Authentication');

          // Redirecionar o usuário após a exclusão
          alert('Sua conta foi excluída com sucesso.');
          router.push('/login');
        } catch (error) {
          console.error('Erro ao excluir a conta:', error);
          setError('Ocorreu um erro ao excluir sua conta. Tente novamente.');
        }
      }
    } else {
      setError('Nenhum usuário logado.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {userData ? (
        <div className="max-w-md w-full bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-bold mb-6 text-center text-blue-300">Minha Conta</h1>
          <div className="space-y-4">
            <p className="text-lg"><span className="font-semibold text-blue-300">Nome de usuário:</span> {userData.username || 'Não informado'}</p>
            <p className="text-lg"><span className="font-semibold text-blue-300">Email:</span> {userData.email}</p>
          </div>
          
          <div className="mt-8 space-y-4">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {showChangePassword ? 'Cancelar Alterar Senha' : 'Alterar Senha'}
            </button>

            {showChangePassword && (
              <div className="space-y-4 animate-fadeIn">
                <input
                  type="password"
                  placeholder="Senha Atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white bg-opacity-80"
                />
                <input
                  type="password"
                  placeholder="Nova Senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white bg-opacity-80"
                />
                <button
                  onClick={handleChangePassword}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Confirmar Alteração de Senha
                </button>
                <button
                  onClick={handleResetPassword}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                  Enviar Email para Redefinição de Senha
                </button>
              </div>
            )}

            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Excluir Conta
            </button>

            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </div>
        </div>
      ) : (
        <p className="text-xl">Nenhum dado do usuário encontrado.</p>
      )}
    </div>
  );
};

export default Conta;
