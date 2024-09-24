import React, { useState, useEffect } from 'react';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, createUserWithEmailAndPassword, updateProfile, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import SuccessModal from '../components/SuccessModal';
import { motion } from 'framer-motion';
import app from '../lib/firebase';

const AuthAction = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const router = useRouter();
  const { mode, oobCode, name, password } = router.query;
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const handleAction = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setActionType('verifyEmail');
        await verifyEmailAndCreateAccount();
      } else if (mode === 'resetPassword' && oobCode) {
        setActionType('resetPassword');
        await verifyPasswordResetCode(auth, oobCode)
          .then(() => setIsCodeValid(true))
          .catch(() => setError('Código de redefinição de senha inválido ou expirado.'));
      }
    };

    handleAction();
  }, [auth, mode, oobCode]);

  const verifyEmailAndCreateAccount = async () => {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Por favor, forneça seu email para confirmação');
    }
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), {
        username: name,
        email: user.email,
        role: 'user',
        emailVerified: true,
      });
      window.localStorage.removeItem('emailForSignIn');
      setSuccess('Conta criada com sucesso!');
      setShowModal(true);
    } catch (error) {
      console.error('Erro durante a verificação de email e criação de conta:', error);
      setError('Ocorreu um erro ao verificar seu e-mail e criar sua conta.');
    }
  };

  const handleResetPassword = async () => {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess('Senha redefinida com sucesso!');
      setShowModal(true);
    } catch (error) {
      setError('Erro ao redefinir a senha. Tente novamente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push('/login');
  };

  const renderContent = () => {
    if (actionType === 'resetPassword') {
      return (
        <>
          <h1 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h1>
          {isCodeValid ? (
            <>
              <input
                type="password"
                placeholder="Nova Senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-md mb-4 bg-gray-700 text-white placeholder-gray-400"
              />
              <button
                onClick={handleResetPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md transition duration-300 ease-in-out"
              >
                Redefinir Senha
              </button>
            </>
          ) : (
            <p className="text-red-400 text-center">Código de redefinição de senha inválido ou expirado.</p>
          )}
        </>
      );
    } else if (actionType === 'verifyEmail') {
      return (
        <>
          <h1 className="text-2xl font-bold mb-6 text-center">Verificação de E-mail</h1>
          {success ? (
            <p className="text-green-400 mb-4 text-center">{success}</p>
          ) : (
            <p className="text-blue-300 text-center">Verificando seu e-mail e criando sua conta...</p>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {error && <p className="text-red-400 mb-4 text-sm text-center">{error}</p>}
        {renderContent()}
      </motion.div>
      <SuccessModal
        isOpen={showModal}
        onClose={handleCloseModal}
        message={success}
      />
    </motion.div>
  );
};

export default AuthAction;
