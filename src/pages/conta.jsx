import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';
import { FaUser, FaEnvelope, FaLock, FaTrash } from 'react-icons/fa';
import Footer from '../components/Footer';
import SuccessModal from '../components/SuccessModal'; // Import SuccessModal
import ConfirmationModal from '../components/ConfirmationModal'; // Add this import

const Conta = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // State for SuccessModal
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // Add this state
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
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        router.push('/login');
        setLoading(false);
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
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, newPassword);
        setSuccessMessage('Senha alterada com sucesso!');
        setIsSuccessModalOpen(true);
        setNewPassword('');
        setCurrentPassword('');
        setError('');
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
        setSuccessMessage('Email de redefinição de senha enviado.');
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao enviar email de redefinição de senha:', error);
      setError('Erro ao enviar email de redefinição de senha. Tente novamente.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsConfirmationModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      try {
        await deleteDoc(doc(db, 'users', uid));
        await deleteUser(user);
        setSuccessMessage('Sua conta foi excluída com sucesso.');
        setIsSuccessModalOpen(true);
        router.push('/login');
      } catch (error) {
        console.error('Erro ao excluir a conta:', error);
        setError('Ocorreu um erro ao excluir sua conta. Tente novamente.');
      }
    } else {
      setError('Nenhum usuário logado.');
    }
    setIsConfirmationModalOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="flex-grow flex items-center justify-center p-4">
        {userData ? (
          <div className="max-w-4xl w-full bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
            <h1 className="text-4xl font-bold mb-6 text-center text-blue-300">Minha Conta</h1>
            
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 px-4 rounded-tl-lg rounded-bl-lg ${activeTab === 'profile' ? 'bg-blue-500' : 'bg-gray-700'} transition duration-300`}
              >
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-2 px-4 rounded-tr-lg rounded-br-lg ${activeTab === 'security' ? 'bg-blue-500' : 'bg-gray-700'} transition duration-300`}
              >
                Segurança
              </button>
            </div>

            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center space-x-4">
                  <FaUser className="text-blue-300 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-400">Nome de usuário</p>
                    <p className="text-lg font-semibold">{userData.username || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <FaEnvelope className="text-blue-300 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-lg font-semibold">{userData.email}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FaLock className="mr-2" /> Alterar Senha
                  </h2>
                  <input
                    type="password"
                    placeholder="Senha Atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-white rounded-lg border border-gray-600 px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-700"
                  />
                  <input
                    type="password"
                    placeholder="Nova Senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-white rounded-lg border border-gray-600 px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-700"
                  />
                  <div className="flex space-x-4">
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      Confirmar Alteração
                    </button>
                    <button
                      onClick={handleResetPassword}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                    >
                      Redefinir por Email
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-red-500">
                    <FaTrash className="mr-2" /> Excluir Conta
                  </h2>
                  <p className="mb-4 text-gray-400">Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.</p>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  >
                    Excluir Minha Conta
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </div>
        ) : (
          <p className="text-xl">Nenhum dado do usuário encontrado.</p>
        )}
      </div>
      <Footer />
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={confirmDeleteAccount}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir sua conta? Esse processo é irreversível."
        confirmText="Excluir"
      />
    </div>
  );
};

export default Conta;
